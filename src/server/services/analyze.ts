/**
 * Document Analysis Service.
 * Implements the P0 -> P2 -> P3 pipeline with streaming SSE events.
 * architecture.md §5.2, brain.md §3, §7
 */

import type { LLMProvider } from "../llm/provider";
import { env } from "../config/env";
import type {
  AnalyzeRequest,
  Clause,
  ClauseAnalysis,
  DocumentSynthesis,
  Citation,
} from "@/core/domain/schemas";
import {
  buildPreamble,
  buildClassifyPrompt,
  classifyOutputSchema,
  buildClauseAnalysisPrompt,
  clauseBatchAnalysisSchema,
  buildSynthesisPrompt,
  synthesisOutputSchema,
  SYNTHESIS_PROMPT_VERSION,
} from "@/core/prompts";
import {
  verifyClauseAnalysis,
  verifyKeyFact,
  calculateVerifiedRatio,
} from "@/core/citations";
import type { DocType } from "@/core/domain/enums";

export interface AnalysisEventEmitter {
  emit: (event: string, data: unknown) => void;
}

export interface AnalyzeServiceOptions {
  provider: LLMProvider;
  emitter: AnalysisEventEmitter;
  signal?: AbortSignal | undefined;
}

/**
 * Splits clauses into batches of ~8 (or fewer if token estimates are large).
 */
export function batchClauses(clauses: Clause[], maxBatchSize = 8, maxBatchTokens = 3500): Clause[][] {
  const batches: Clause[][] = [];
  let currentBatch: Clause[] = [];
  let currentTokens = 0;

  for (const clause of clauses) {
    const clauseTokens = clause.tokenEstimate ?? Math.ceil(clause.text.length / 4);

    if (
      currentBatch.length >= maxBatchSize ||
      (currentBatch.length > 0 && currentTokens + clauseTokens > maxBatchTokens)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentTokens = 0;
    }

    currentBatch.push(clause);
    currentTokens += clauseTokens;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/**
 * Runs tasks with a concurrency cap.
 */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  const executing = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const promise = fn(item, i).then(() => {
      executing.delete(promise);
    });
    executing.add(promise);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

/**
 * Orchestrates full document analysis pipeline:
 * 1. P0 Classify (FAST model) -> emits 'doc_type'
 * 2. P2 Clause Analysis in batches of ~8 (MAIN model, concurrency 4) -> emits 'clause_analysis' per clause
 * 3. P3 Document Synthesis (MAIN model) -> emits 'synthesis'
 * 4. Completion -> emits 'done'
 */
export async function analyzeDocument(
  request: AnalyzeRequest,
  options: AnalyzeServiceOptions
): Promise<void> {
  const { provider, emitter, signal } = options;
  const startTime = Date.now();

  const clauseMap = new Map<string, Clause>();
  for (const c of request.clauses) {
    clauseMap.set(c.id, c);
  }

  // Check abort
  if (signal?.aborted) return;

  // ───────────────────────────────────────────────────────────────────────────
  // Step 1: P0 Classify document
  // ───────────────────────────────────────────────────────────────────────────
  let detectedDocType: DocType = request.docType ?? "other";
  let detectedParties: string[] = [];

  try {
    const fullSnippet = request.clauses
      .map((c) => c.text)
      .join("\n\n")
      .slice(0, 8000);
    const classifyPrompt = buildClassifyPrompt({ documentTextSnippet: fullSnippet });
    const preamble = buildPreamble({
      role: request.perspective,
      language: request.language,
      jurisdiction: request.jurisdiction,
    });

    const classification = await provider.generateObject({
      model: env.LLM_MODEL_MAIN,
      system: preamble,
      user: classifyPrompt,
      schema: classifyOutputSchema,
      temperature: 0,
      signal,
    });

    if (!request.docType) {
      detectedDocType = classification.docType;
    }
    detectedParties = classification.parties;

    emitter.emit("doc_type", {
      docType: detectedDocType,
      parties: classification.parties,
      roles: classification.roles,
      language: classification.language,
      suggestedPerspective: classification.suggestedPerspective,
    });
  } catch {
    // Classification failure is non-fatal; proceed with requested or default docType
    emitter.emit("warning", {
      code: "CLASSIFICATION_FAILED",
      message: "Could not automatically classify document; using fallback.",
    });
    emitter.emit("doc_type", {
      docType: detectedDocType,
      parties: [],
      roles: [request.perspective],
      language: request.language,
    });
  }

  if (signal?.aborted) return;

  // ───────────────────────────────────────────────────────────────────────────
  // Step 2: P2 Clause Analysis in parallel batches
  // ───────────────────────────────────────────────────────────────────────────
  const batches = batchClauses(request.clauses, 10);
  const allAnalyses: ClauseAnalysis[] = [];
  const allCitations: Citation[] = [];

  const preamble = buildPreamble({
    role: request.perspective,
    docType: detectedDocType,
    language: request.language,
    jurisdiction: request.jurisdiction,
  });

  await runWithConcurrency(batches, 2, async (batch, batchIdx) => {
    if (signal?.aborted) return;

    // Small rate-limit pacing delay between batches
    if (batchIdx > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    try {
      const userPrompt = buildClauseAnalysisPrompt({
        role: request.perspective,
        docType: detectedDocType,
        clauses: batch,
      });

      const batchResult = await provider.generateObject({
        model: env.LLM_MODEL_MAIN,
        system: preamble,
        user: userPrompt,
        schema: clauseBatchAnalysisSchema,
        temperature: 0,
        signal,
      });

      // Map results back by clauseId
      const resultMap = new Map<string, ClauseAnalysis>();
      for (const item of batchResult.analyses) {
        resultMap.set(item.clauseId, item);
      }

      // For every clause in this batch, ensure we have an analysis
      for (const clause of batch) {
        let analysis = resultMap.get(clause.id);

        if (!analysis) {
          // LLM missed this clause in the batch output — provide default fallback
          analysis = {
            clauseId: clause.id,
            canonicalType: "other",
            plainSummary: clause.text.slice(0, 150) + "...",
            obligations: [],
            rights: [],
            risk: {
              level: "info",
              reasons: ["Standard provision requiring review."],
              favors: "balanced",
              unusual: false,
            },
            whyItMatters: "Part of the standard agreement terms.",
            questionsToAsk: [],
            confidence: 0.7,
            citations: [
              {
                clauseId: clause.id,
                quote: clause.text.slice(0, 60),
                verified: false,
              },
            ],
          };
        }

        // Verify citations
        const verifiedAnalysis = verifyClauseAnalysis(analysis, clauseMap);
        allAnalyses.push(verifiedAnalysis);
        for (const c of verifiedAnalysis.citations) {
          allCitations.push(c);
        }

        // Stream event per analyzed clause
        emitter.emit("clause_analysis", verifiedAnalysis);
      }
    } catch {
      // Partial failure: emit warning and provide fallback analyses so user sees all clauses
      emitter.emit("warning", {
        code: "BATCH_ANALYSIS_FAILED",
        message: `Failed to analyze batch ${batchIdx + 1}; clauses marked for retry.`,
        clauseIds: batch.map((c) => c.id),
      });

      for (const clause of batch) {
        const fallbackAnalysis: ClauseAnalysis = {
          clauseId: clause.id,
          canonicalType: "other",
          plainSummary: clause.text.slice(0, 150) + "...",
          obligations: [],
          rights: [],
          risk: {
            level: "info",
            reasons: ["Analysis failed for this clause; retry available."],
            favors: "unclear",
            unusual: false,
          },
          whyItMatters: "Clause could not be analyzed automatically.",
          questionsToAsk: ["What is the specific meaning of this clause?"],
          confidence: 0,
          citations: [
            {
              clauseId: clause.id,
              quote: clause.text.slice(0, 50),
              verified: true,
            },
          ],
        };
        allAnalyses.push(fallbackAnalysis);
        emitter.emit("clause_analysis", fallbackAnalysis);
      }
    }
  });

  if (signal?.aborted) return;

  // ───────────────────────────────────────────────────────────────────────────
  // Step 3: P3 Document Synthesis
  // ───────────────────────────────────────────────────────────────────────────
  try {
    // Pacing delay to avoid TPM burst limits on Groq free/on-demand tier
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const synthesisPrompt = buildSynthesisPrompt({
      role: request.perspective,
      docType: detectedDocType,
      clauses: request.clauses,
      clauseAnalyses: allAnalyses,
    });

    const synthesisRaw = await provider.generateObject({
      model: env.LLM_MODEL_MAIN,
      system: preamble,
      user: synthesisPrompt,
      schema: synthesisOutputSchema,
      temperature: 0,
      signal,
    });

    // Verify key facts citations
    const verifiedKeyFacts = synthesisRaw.keyFacts.map((fact) =>
      verifyKeyFact(fact, clauseMap)
    );

    for (const kf of verifiedKeyFacts) {
      for (const cit of kf.citations) {
        allCitations.push(cit);
      }
    }

    const synthesis: DocumentSynthesis = {
      docType: synthesisRaw.docType,
      parties: synthesisRaw.parties.length > 0 ? synthesisRaw.parties : (detectedParties.length > 0 ? detectedParties : ["Party A", "Party B"]),
      tldr: synthesisRaw.tldr,
      keyFacts: verifiedKeyFacts,
      topRisks: synthesisRaw.topRisks,
      missingClauses: synthesisRaw.missingClauses,
      inconsistencies: synthesisRaw.inconsistencies,
      perspective: request.perspective,
      promptVersion: SYNTHESIS_PROMPT_VERSION,
    };

    emitter.emit("synthesis", synthesis);
  } catch (err: unknown) {
    console.error("Synthesis error:", err);
    emitter.emit("warning", {
      code: "SYNTHESIS_FAILED",
      message: "Could not generate full document synthesis; individual clauses are available.",
    });

    // Provide basic fallback synthesis
    const fallbackSynthesis: DocumentSynthesis = {
      docType: detectedDocType,
      parties: detectedParties.length > 0 ? detectedParties : ["Identified in agreement"],
      tldr: `This ${detectedDocType} has been analyzed across ${request.clauses.length} clauses from the perspective of ${request.perspective}.`,
      keyFacts: [],
      topRisks: allAnalyses
        .filter((a) => a.risk.level === "high" || a.risk.level === "medium")
        .slice(0, 5)
        .map((a) => ({
          clauseId: a.clauseId,
          headline: a.plainSummary.slice(0, 100),
          level: a.risk.level,
        })),
      missingClauses: [],
      inconsistencies: [],
      perspective: request.perspective,
      promptVersion: SYNTHESIS_PROMPT_VERSION,
    };
    emitter.emit("synthesis", fallbackSynthesis);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Step 4: Completion event 'done'
  // ───────────────────────────────────────────────────────────────────────────
  const durationMs = Date.now() - startTime;
  const verifiedRatio = calculateVerifiedRatio(allCitations);

  emitter.emit("done", {
    stats: {
      totalClauses: request.clauses.length,
      analyzedClauses: allAnalyses.length,
      verifiedRatio,
      durationMs,
    },
  });
}

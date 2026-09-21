/**
 * Document Comparison Service.
 * architecture.md §5.4, brain.md §3 P5b, P5c, §8
 */

import pLimit from "p-limit";
import type { LLMProvider } from "../llm/provider";
import { env } from "../config/env";
import type {
  CompareRequest,
  ComparisonPair,
  Clause,
} from "@/core/domain/schemas";
import {
  buildPreamble,
  buildCompareExplainPrompt,
  buildCompareSummaryPrompt,
  compareBatchExplanationSchema,
  compareSummarySchema,
  type ComparePairForPrompt,
  COMPARE_PROMPT_VERSION,
} from "@/core/prompts";
import { alignClauses } from "@/core/comparison";
import { verifyCitation } from "@/core/citations";

export interface CompareEventEmitter {
  emit: (event: string, data: unknown) => void;
}

export interface CompareServiceOptions {
  provider: LLMProvider;
  emitter: CompareEventEmitter;
  signal?: AbortSignal | undefined;
}

const BATCH_SIZE = 4;
const CONCURRENCY = 2;

/**
 * Orchestrates deterministic clause alignment, word-level redline diffing,
 * LLM-powered change explanation (P5b), and "3 changes that matter" synthesis (P5c).
 */
export async function compareDocuments(
  request: CompareRequest,
  options: CompareServiceOptions
): Promise<void> {
  const { provider, emitter, signal } = options;

  // Build clause maps for lookup and quote verification
  const clauseMapA = new Map<string, Clause>();
  for (const c of request.clausesA) {
    clauseMapA.set(c.id, c);
  }

  const clauseMapB = new Map<string, Clause>();
  for (const c of request.clausesB) {
    clauseMapB.set(c.id, c);
  }

  const combinedClauseMap = new Map<string, Clause>();
  for (const c of request.clausesA) combinedClauseMap.set(c.id, c);
  for (const c of request.clausesB) combinedClauseMap.set(c.id, c);

  // 1. Deterministic Alignment and Word Diffing
  const alignmentResult = alignClauses(request.clausesA, request.clausesB);

  // Emit initial alignment with all redline ops
  emitter.emit("alignment", {
    pairs: alignmentResult.pairs,
    stats: alignmentResult.stats,
    promptVersion: COMPARE_PROMPT_VERSION,
  });

  const modifiedPairs = alignmentResult.pairs.filter(
    (p) => p.status === "modified"
  );

  // If no clauses were modified (identical documents or only additions/removals)
  if (modifiedPairs.length === 0) {
    emitter.emit("summary", {
      topChanges: [],
      executiveSummary:
        alignmentResult.stats.addedCount > 0 ||
        alignmentResult.stats.removedCount > 0
          ? `No existing clauses were modified. ${alignmentResult.stats.addedCount} new clause(s) added and ${alignmentResult.stats.removedCount} clause(s) removed.`
          : "The documents are identical with no textual or structural modifications detected.",
      overallShift: "neutral",
    });

    emitter.emit("done", {
      stats: {
        totalPairs: alignmentResult.pairs.length,
        modifiedCount: 0,
        addedCount: alignmentResult.stats.addedCount,
        removedCount: alignmentResult.stats.removedCount,
      },
    });
    return;
  }

  // 2. Prepare batches of modified pairs for LLM explanation (P5b)
  const batches: ComparePairForPrompt[][] = [];
  for (let i = 0; i < modifiedPairs.length; i += BATCH_SIZE) {
    const slice = modifiedPairs.slice(i, i + BATCH_SIZE);
    const promptPairs: ComparePairForPrompt[] = slice.map((p) => {
      const clauseA = p.a ? clauseMapA.get(p.a) : undefined;
      const clauseB = p.b ? clauseMapB.get(p.b) : undefined;
      const pairId = `${p.a ?? "none"}_${p.b ?? "none"}`;

      return {
        pairId,
        clauseAId: p.a,
        headingA: clauseA?.heading,
        textA: clauseA?.text,
        clauseBId: p.b,
        headingB: clauseB?.heading,
        textB: clauseB?.text,
      };
    });
    batches.push(promptPairs);
  }

  const preamble = buildPreamble({
    role: request.perspective,
    language: request.language,
    jurisdiction: request.jurisdiction,
  });

  const limit = pLimit(CONCURRENCY);
  const explainedPairsMap = new Map<string, ComparisonPair>();

  await Promise.all(
    batches.map((batch) =>
      limit(async () => {
        if (signal?.aborted) return;

        try {
          const userPrompt = buildCompareExplainPrompt({
            role: request.perspective,
            mode: request.mode,
            pairs: batch,
          });

          const result = await provider.generateObject({
            model: env.LLM_MODEL_MAIN,
            system: preamble,
            user: userPrompt,
            schema: compareBatchExplanationSchema,
            temperature: 0,
            signal,
          });

          const updatedPairsBatch: ComparisonPair[] = [];

          for (const exp of result.explanations) {
            const [aId, bId] = exp.pairId.split("_");
            const originalPair = modifiedPairs.find(
              (p) => (p.a ?? "none") === aId && (p.b ?? "none") === bId
            );

            if (originalPair) {
              const verifiedCitations = exp.citations.map((c) =>
                verifyCitation(c, combinedClauseMap)
              );

              const updatedPair: ComparisonPair = {
                ...originalPair,
                whatChanged: exp.whatChanged,
                favorsNow: exp.favorsNow,
                impactOnYou: exp.impactOnYou,
                severity: exp.severity,
                citations: verifiedCitations,
              };

              explainedPairsMap.set(exp.pairId, updatedPair);
              updatedPairsBatch.push(updatedPair);
            }
          }

          if (updatedPairsBatch.length > 0) {
            emitter.emit("pair_explanation", {
              pairs: updatedPairsBatch,
            });
          }
        } catch {
          // Fallback on batch failure: preserve diff without AI explanation
          const fallbackBatch = batch.map((bp) => {
            const [aId, bId] = bp.pairId.split("_");
            const originalPair = modifiedPairs.find(
              (p) => (p.a ?? "none") === aId && (p.b ?? "none") === bId
            );
            return (
              originalPair ?? {
                a: bp.clauseAId,
                b: bp.clauseBId,
                type: "other",
                status: "modified",
                wordDiff: [],
                citations: [],
                whatChanged: "Text was modified between versions.",
                severity: "medium",
                favorsNow: "unclear",
              }
            );
          });

          emitter.emit("pair_explanation", { pairs: fallbackBatch });
        }
      })
    )
  );

  // 3. Overall Compare Synthesis (P5c)
  const allExplained = Array.from(explainedPairsMap.values());
  try {
    const summaryPrompt = buildCompareSummaryPrompt({
      role: request.perspective,
      mode: request.mode,
      explainedChanges: allExplained.map((p) => ({
        clauseA: p.a,
        clauseB: p.b,
        whatChanged: p.whatChanged ?? "Text modified",
        favorsNow: p.favorsNow ?? "unclear",
        impactOnYou: p.impactOnYou ?? "Review differences carefully.",
        severity: p.severity ?? "medium",
      })),
    });

    const summaryResult = await provider.generateObject({
      model: env.LLM_MODEL_MAIN,
      system: preamble,
      user: summaryPrompt,
      schema: compareSummarySchema,
      temperature: 0,
      signal,
    });

    emitter.emit("summary", summaryResult);
  } catch {
    // Deterministic fallback summary based on highest severity changes
    const sorted = [...allExplained].sort((x, y) => {
      const rank = { high: 3, medium: 2, low: 1, info: 0 };
      return (rank[y.severity ?? "low"] ?? 0) - (rank[x.severity ?? "low"] ?? 0);
    });

    const topChanges = sorted.slice(0, 3).map((p) => ({
      headline: p.whatChanged ?? "Clause modified",
      clauseA: p.a,
      clauseB: p.b,
      severity: p.severity ?? "medium",
      summary: p.impactOnYou ?? "Review redline diff.",
    }));

    emitter.emit("summary", {
      topChanges,
      executiveSummary: `Identified ${modifiedPairs.length} modified clauses between drafts. ${alignmentResult.stats.addedCount} clause(s) added and ${alignmentResult.stats.removedCount} clause(s) removed.`,
      overallShift: "mixed",
    });
  }

  emitter.emit("done", {
    stats: {
      totalPairs: alignmentResult.pairs.length,
      modifiedCount: modifiedPairs.length,
      addedCount: alignmentResult.stats.addedCount,
      removedCount: alignmentResult.stats.removedCount,
    },
  });
}

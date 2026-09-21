/**
 * Grounded Q&A Service.
 * architecture.md §5.3, brain.md §7 P4, §8, §9
 */

import type { LLMProvider } from "../llm/provider";
import { env } from "../config/env";
import type { AskRequest, Answer, Clause } from "@/core/domain/schemas";
import {
  buildPreamble,
  buildAskPrompt,
  askOutputSchema,
  ASK_PROMPT_VERSION,
} from "@/core/prompts";
import { buildRetrievalContext, searchClauses } from "@/core/retrieval";
import { detectEscalation } from "@/core/safety/escalation-rules";
import { verifyCitation, calculateVerifiedRatio } from "@/core/citations";

export interface AskEventEmitter {
  emit: (event: string, data: unknown) => void;
}

export interface AskServiceOptions {
  provider: LLMProvider;
  emitter: AskEventEmitter;
  signal?: AbortSignal | undefined;
}

/**
 * Handles grounded document Q&A with retrieval, escalation detection, and citation verification.
 */
export async function answerQuestion(
  request: AskRequest,
  options: AskServiceOptions
): Promise<void> {
  const { provider, emitter, signal } = options;

  const clauseMap = new Map<string, Clause>();
  for (const c of request.clauses) {
    clauseMap.set(c.id, c);
  }

  // 1. Pre-flight Escalation Detection (brain.md §9)
  const escalation = detectEscalation(request.question);

  if (escalation.triggered && escalation.isSelfHarm) {
    // Immediate care response without invoking LLM
    const selfHarmAnswer: Answer = {
      text:
        escalation.guidance ??
        "If you are in distress, please call or text 988 for free, confidential support available 24/7.",
      basis: "general_information",
      citations: [],
      followUpQuestions: [],
      escalationTrigger: "self_harm",
      promptVersion: ASK_PROMPT_VERSION,
    };

    emitter.emit("answer", selfHarmAnswer);
    emitter.emit("done", { stats: { verifiedRatio: 1, basis: "general_information" } });
    return;
  }

  // 2. Build retrieval context (full doc <= ~60k tokens, or BM25 top-k + neighbours + definitions)
  const context = buildRetrievalContext(request.clauses, request.question);

  // 3. Construct system preamble and user task prompt
  const preamble = buildPreamble({
    role: request.perspective,
    docType: request.docType,
    language: request.language,
    jurisdiction: request.jurisdiction,
  });

  const userPrompt = buildAskPrompt({
    question: request.question,
    role: request.perspective,
    docType: request.docType,
    clauses: context.clauses,
    jurisdiction: request.jurisdiction,
  });

  // 4. Generate structured answer
  const rawAnswer = await provider.generateObject({
    model: env.LLM_MODEL_MAIN,
    system: preamble,
    user: userPrompt,
    schema: askOutputSchema,
    temperature: 0,
    signal,
  });

  // 5. Deterministic Quote Verification
  const verifiedCitations = rawAnswer.citations.map((c) =>
    verifyCitation(c, clauseMap)
  );

  const hasAnyVerifiedCitation = verifiedCitations.some((c) => c.verified);
  let finalBasis = rawAnswer.basis;
  let finalText = rawAnswer.text;
  let finalNearest = rawAnswer.nearestClauses ?? [];

  // Grounding Policy: if basis was claimed as "document" but no citations verified, downgrade to "not_found"
  if (finalBasis === "document" && !hasAnyVerifiedCitation) {
    finalBasis = "not_found";
    finalText =
      "This document does not contain verifiable terms explicitly answering this question. Closest relevant clauses are shown below.";

    if (finalNearest.length === 0) {
      finalNearest = searchClauses(request.clauses, request.question, 3).map(
        (c) => c.id
      );
    }
  }

  // If not_found, populate nearest clauses if missing
  if (finalBasis === "not_found" && finalNearest.length === 0) {
    finalNearest = searchClauses(request.clauses, request.question, 3).map(
      (c) => c.id
    );
  }

  const finalAnswer: Answer = {
    text: finalText,
    basis: finalBasis,
    citations: verifiedCitations,
    followUpQuestions: rawAnswer.followUpQuestions.slice(0, 3),
    ...(escalation.triggered ? { escalationTrigger: escalation.trigger } : {}),
    ...(finalNearest.length > 0 ? { nearestClauses: finalNearest } : {}),
    promptVersion: ASK_PROMPT_VERSION,
  };

  emitter.emit("answer", finalAnswer);

  const verifiedRatio = calculateVerifiedRatio(verifiedCitations);
  emitter.emit("done", {
    stats: {
      verifiedRatio,
      basis: finalBasis,
      isEscalated: Boolean(escalation.triggered),
    },
  });
}

/**
 * P4 · Grounded Q&A Prompt.
 * brain.md §7 P4
 */

import { z } from "zod";
import { ANSWER_BASES } from "../domain/enums";
import { clauseIdSchema, citationSchema } from "../domain/schemas";
import type { Clause } from "../domain/schemas";

export const ASK_PROMPT_VERSION = "2026-09-20.1";

export const askOutputSchema = z.object({
  text: z.string().min(1),
  basis: z.enum(ANSWER_BASES),
  citations: z.array(citationSchema).default([]),
  followUpQuestions: z.array(z.string()).max(3).default([]),
  escalationTrigger: z.string().optional(),
  nearestClauses: z.array(clauseIdSchema).optional(),
});

export type AskOutput = z.infer<typeof askOutputSchema>;

export interface AskPromptParams {
  question: string;
  role: string;
  docType?: string | undefined;
  clauses: Clause[];
  jurisdiction?: string | undefined;
}

/**
 * Builds the user prompt for Grounded Q&A (P4).
 */
export function buildAskPrompt(params: AskPromptParams): string {
  const formattedClauses = params.clauses
    .map((c) => {
      const headingPart = c.heading ? ` <${c.heading}>` : "";
      return `[${c.id}]${headingPart}\n${c.text.trim()}`;
    })
    .join("\n\n");

  return `Answer the user's question about the legal document below from the perspective of ${params.role}.

GROUNDING AND BASIS RULES:
1. "document": Set basis = "document" ONLY if the document explicitly answers the question. You MUST include >= 1 citation with the exact clauseId and a VERBATIM quote (<= 25 words) copied directly from the clause text. If you cannot cite a verbatim quote, do NOT set basis = "document".
2. "general_information": Set basis = "general_information" if the answer relies on general legal principles not stated in the document. Keep the answer neutral, high-level, and generic.
3. "not_found": If the document does not contain terms addressing the question, state so plainly ("This document does not specify...") and list the closest relevant clause IDs in 'nearestClauses'.

FORMAT INSTRUCTIONS:
- Answer length: <= 120 words unless complexity strictly demands more.
- Define legal jargon on first use in plain everyday English.
- Do not say what the user "should" do legally; frame as options to consider or questions to clarify.
- Output exactly 3 relevant follow-up questions the user might want to ask next.

<document>
${formattedClauses}
</document>

<question>
${params.question}
</question>`;
}

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
  text: z.string().optional().describe("The answer text"),
  answer: z.string().optional().describe("Fallback for text"),
  basis: z.union([z.enum(ANSWER_BASES), z.string()]).transform((val): "document" | "general_information" | "not_found" => {
    const v = val.toLowerCase().trim();
    if (v.includes("doc")) return "document";
    if (v.includes("not") || v.includes("none")) return "not_found";
    return "general_information";
  }),
  citations: z.union([
    z.array(citationSchema),
    z.array(z.object({
      clauseId: z.string().transform((c) => (c.startsWith("C") ? c : `C${c}`)),
      quote: z.string().transform((q) => q.slice(0, 200)),
      verified: z.boolean().optional().default(false),
    })),
    z.array(z.string()).transform((arr) => arr.map((s) => ({ clauseId: "C1", quote: s.slice(0, 200), verified: false }))),
  ]).optional().default([]),
  followUpQuestions: z.array(z.string()).optional().default([]).transform((arr) => arr.slice(0, 3)),
  escalationTrigger: z.string().optional(),
  nearestClauses: z.array(z.string().transform((c) => (c.startsWith("C") ? c : `C${c}`))).optional(),
}).transform((val) => ({
  ...val,
  text: val.text || val.answer || "No text provided.",
  citations: (val.citations || []) as Array<{ clauseId: string; quote: string; verified: boolean }>,
}));

export type AskOutput = {
  text: string;
  basis: "document" | "general_information" | "not_found";
  citations: Array<{ clauseId: string; quote: string; verified: boolean }>;
  followUpQuestions: string[];
  escalationTrigger?: string | undefined;
  nearestClauses?: string[] | undefined;
};

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

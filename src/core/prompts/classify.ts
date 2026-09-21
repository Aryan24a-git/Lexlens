/**
 * P0 · Classify document prompt and output schema.
 * brain.md §3, §7 P0
 */

import { z } from "zod";
import { DOC_TYPES } from "../domain/enums";

export const CLASSIFY_PROMPT_VERSION = "2026-09-20.1";

export const classifyOutputSchema = z.object({
  docType: z.enum(DOC_TYPES),
  parties: z.array(z.string().min(1)).default([]),
  roles: z.array(z.string().min(1)).min(1),
  language: z.string().default("en"),
  suggestedPerspective: z.string().optional(),
});

export type ClassifyOutput = z.infer<typeof classifyOutputSchema>;

export interface ClassifyPromptParams {
  documentTextSnippet: string;
}

/**
 * Builds the user prompt for document classification (P0).
 * Uses only the first ~1,500 words of the document.
 */
export function buildClassifyPrompt(params: ClassifyPromptParams): string {
  // Take up to ~1,500 words
  const words = params.documentTextSnippet.split(/\s+/).slice(0, 1500).join(" ");

  return `Classify the document below.
Return a valid JSON object matching the schema:
- docType: one of ${DOC_TYPES.join(" | ")}
- parties: array of party names as written in the agreement
- roles: plausible user perspectives/roles for this agreement (e.g. ["tenant", "landlord"] or ["freelancer", "client"])
- language: detected primary language code (e.g. "en")
- suggestedPerspective: the most common consumer or weaker party role if evident

<document>
${words}
</document>`;
}

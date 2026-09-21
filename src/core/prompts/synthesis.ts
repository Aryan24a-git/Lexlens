/**
 * P3 · Document Synthesis prompt.
 * brain.md §7 P3
 */

import { z } from "zod";
import { DOC_TYPES, RISK_LEVELS } from "../domain/enums";
import { clauseIdSchema, keyFactSchema } from "../domain/schemas";
import type { Clause, ClauseAnalysis } from "../domain/schemas";

export const SYNTHESIS_PROMPT_VERSION = "2026-09-20.1";

export const synthesisOutputSchema = z.object({
  docType: z.enum(DOC_TYPES),
  parties: z.array(z.string().min(1)).min(1).max(10),
  tldr: z.string().min(1).max(600),
  keyFacts: z.array(keyFactSchema).max(10),
  topRisks: z
    .array(
      z.object({
        clauseId: clauseIdSchema,
        headline: z.string().min(1).max(120),
        level: z.enum(RISK_LEVELS),
      })
    )
    .max(5),
  missingClauses: z.array(z.string()).default([]),
  inconsistencies: z.array(z.string()).default([]),
});

export type SynthesisOutput = z.infer<typeof synthesisOutputSchema>;

export interface SynthesisPromptParams {
  role: string;
  docType?: string | undefined;
  clauses: Clause[];
  clauseAnalyses?: ClauseAnalysis[] | undefined;
}

/**
 * Builds the user prompt for document synthesis (P3).
 */
export function buildSynthesisPrompt(params: SynthesisPromptParams): string {
  const docType = params.docType || "agreement";

  // Provide a compact clause index with summaries if available
  let clausesSummary = "";
  if (params.clauseAnalyses && params.clauseAnalyses.length > 0) {
    clausesSummary = params.clauseAnalyses
      .map(
        (a) =>
          `[${a.clauseId}] (${a.canonicalType}, Risk: ${a.risk.level}, Favors: ${a.risk.favors}): ${a.plainSummary}`
      )
      .join("\n");
  } else {
    clausesSummary = params.clauses
      .map((c) => `[${c.id}] ${c.heading ? `<${c.heading}> ` : ""}${c.text.slice(0, 150)}...`)
      .join("\n");
  }

  return `You are synthesizing an entire legal document of type "${docType}" from the perspective of "${params.role}".

Review the clause analyses below:
${clausesSummary}

Provide a comprehensive DocumentSynthesis JSON object:
1. docType: Best matching canonical document type.
2. parties: Names of parties identified in the document.
3. tldr: Plain language summary (<= 90 words, grade-8 reading level) explaining what this contract is, the primary exchange/agreement, and the bottom line for ${params.role}.
4. keyFacts: Key details extracted from the document (parties, term/duration, financial numbers/rent/fees, key dates/deadlines, exit/cancellation rules). Each fact MUST include at least one citation with clauseId and verbatim quote.
5. topRisks: Up to 5 most significant risks to ${params.role} in priority order. Include clauseId, level (high/medium/low), and a concise 1-line headline explaining why it poses a risk.
6. missingClauses: Protections or terms commonly included in a standard ${docType} that are notably absent here (phrase as "commonly included", never as "legally required").
7. inconsistencies: Any contradictions, vague undefined key terms, or broken internal references.`;
}

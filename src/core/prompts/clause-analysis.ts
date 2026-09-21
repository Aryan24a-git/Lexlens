/**
 * P2 · Clause Analysis prompt and batch schema.
 * brain.md §4, §5, §7 P2
 */

import { z } from "zod";
import { clauseAnalysisSchema } from "../domain/schemas";
import type { Clause } from "../domain/schemas";
import { CLAUSE_TYPES } from "../domain/enums";

export const CLAUSE_ANALYSIS_PROMPT_VERSION = "2026-09-20.1";

export const clauseBatchAnalysisSchema = z.object({
  analyses: z.array(clauseAnalysisSchema),
});

export type ClauseBatchAnalysis = z.infer<typeof clauseBatchAnalysisSchema>;

export interface ClauseAnalysisPromptParams {
  role: string;
  docType?: string | undefined;
  clauses: Clause[];
}

export const RISK_RUBRIC_TEXT = `RISK RUBRIC (Evaluate strictly from the perspective of {{role}}):
- High: Could cause serious, hard-to-reverse harm, unexpected cost, or removes a basic legal/practical protection.
  Typical signals: Uncapped liability or indemnity on you; one-sided termination; broad waiver of rights or class action ban; broad IP assignment (including personal or prior work); long or geographically broad non-compete; out-of-proportion penalties; unilateral contract modification without notice; auto-renewal with hidden or unusually long notice period; deposit deductions without itemisation or dispute mechanism.
- Medium: Meaningful but manageable; negotiable or worth clarifying with the other party.
  Typical signals: Vague terms ("reasonable efforts", "sole discretion"); short cure periods (< 7 days); one-sided but capped exposure; limited remedies; unclear payment timing or conditions.
- Low: Standard, balanced, or favourable to {{role}}.
  Typical signals: Mutual obligations; market-standard boilerplate; clear timelines and symmetric rights.
- Info: Purely descriptive (no risk judgement).
  Typical signals: Definitions, addresses for notices, party descriptions.

Scoring dimensions:
Severity (0-3) x Reversibility (0-2) x One-sidedness (0-2) x Vagueness (0-1).
>= 8: High | 4-7: Medium | 1-3: Low | 0: Info.
ALWAYS provide 1 to 3 concrete reasons explaining the rating. Never output a bare rating.
Indicate 'favors': 'you' | 'other_party' | 'balanced' | 'unclear'.
Set 'unusual': true if the clause is atypical or surprisingly aggressive for this document type.`;

/**
 * Builds the user prompt for batch clause analysis (P2).
 */
export function buildClauseAnalysisPrompt(params: ClauseAnalysisPromptParams): string {
  const formattedClauses = params.clauses
    .map((c) => {
      const headingPart = c.heading ? ` <${c.heading}>` : "";
      return `[${c.id}]${headingPart}\n${c.text.trim()}`;
    })
    .join("\n\n");

  const rubric = RISK_RUBRIC_TEXT.replace(/\{\{role\}\}/g, params.role);

  return `For EACH clause provided below in <document>, return a structured ClauseAnalysis object matching the schema.

Taxonomy of canonicalType options:
${CLAUSE_TYPES.join(", ")}

Instructions:
1. canonicalType: Choose the single best fit from the taxonomy above.
2. plainSummary: 1-2 sentences in everyday plain language explaining what this clause means for ${params.role}.
3. obligations: Specific actions ${params.role} is required to perform or pay (if any).
4. rights: What ${params.role} is permitted to do, withhold, or demand (if any).
5. risk: Evaluate using the rubric below. Always include 1-3 concrete reasons.
6. whyItMatters: 1 concise sentence highlighting the practical real-world impact.
7. questionsToAsk: 0-3 specific, polite questions ${params.role} could ask to clarify or negotiate.
8. confidence: Value between 0.0 and 1.0 (lower if wording is ambiguous or heavily cross-referenced).
9. citations: MUST include at least one citation with the exact clauseId and a VERBATIM quote (<= 25 words) copied directly from that clause text. Do NOT fabricate or paraphrase the quote.

${rubric}

<document>
${formattedClauses}
</document>`;
}

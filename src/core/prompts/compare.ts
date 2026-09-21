/**
 * P5b & P5c · Compare Prompts & Output Schemas.
 * brain.md §3 P5b, P5c, §7
 */

import { z } from "zod";
import { citationSchema } from "../domain/schemas";
import { RISK_LEVELS } from "../domain/enums";

export const COMPARE_PROMPT_VERSION = "2026-09-20.1";

export const pairExplanationOutputSchema = z.object({
  pairId: z.string(),
  whatChanged: z.string().min(1).max(300),
  favorsNow: z.enum(["you", "other_party", "balanced", "unclear"]),
  impactOnYou: z.string().min(1).max(500),
  severity: z.enum(RISK_LEVELS),
  citations: z.array(citationSchema).default([]),
});
export type PairExplanationOutput = z.infer<typeof pairExplanationOutputSchema>;

export const compareBatchExplanationSchema = z.object({
  explanations: z.array(pairExplanationOutputSchema),
});
export type CompareBatchExplanation = z.infer<
  typeof compareBatchExplanationSchema
>;

export const compareTopChangeSchema = z.object({
  headline: z.string().min(1).max(120),
  clauseA: z.string().optional(),
  clauseB: z.string().optional(),
  severity: z.enum(RISK_LEVELS),
  summary: z.string().min(1).max(300),
});

export const compareSummarySchema = z.object({
  topChanges: z.array(compareTopChangeSchema).max(3),
  executiveSummary: z.string().min(1).max(600),
  overallShift: z.enum([
    "favors_you",
    "favors_other_party",
    "neutral",
    "mixed",
  ]),
});
export type CompareSummary = z.infer<typeof compareSummarySchema>;

export interface ComparePairForPrompt {
  pairId: string;
  clauseAId?: string | undefined;
  headingA?: string | undefined;
  textA?: string | undefined;
  clauseBId?: string | undefined;
  headingB?: string | undefined;
  textB?: string | undefined;
}

export interface BuildCompareExplainPromptParams {
  role: string;
  mode: "versions" | "offers" | "policy_vs_template";
  pairs: ComparePairForPrompt[];
}

/**
 * Builds prompt for batch explaining modified clause pairs (P5b).
 */
export function buildCompareExplainPrompt(
  params: BuildCompareExplainPromptParams
): string {
  const modeContext =
    params.mode === "versions"
      ? "Document A is the baseline/prior draft, and Document B is the newer draft or revision."
      : params.mode === "offers"
        ? "Comparing two alternative competing offers/proposals."
        : "Comparing a company policy against a standard template.";

  const formattedPairs = params.pairs
    .map((p) => {
      return `[PAIR: ${p.pairId}]
DOCUMENT A (${p.clauseAId ?? "N/A"}${p.headingA ? ` - ${p.headingA}` : ""}):
${p.textA?.trim() ?? "(Clause not present in Document A)"}

DOCUMENT B (${p.clauseBId ?? "N/A"}${p.headingB ? ` - ${p.headingB}` : ""}):
${p.textB?.trim() ?? "(Clause not present in Document B)"}`;
    })
    .join("\n\n---\n\n");

  return `You are evaluating differences between legal documents from the perspective of: ${params.role}.
${modeContext}

For EACH pair below, provide a structured explanation:
1. 'pairId': Must match the pair identifier exactly.
2. 'whatChanged': Exactly one clear, concise sentence describing the substantive change.
3. 'favorsNow': Does this change shift the legal or commercial balance toward 'you' (${params.role}), 'other_party', 'balanced', or 'unclear'?
4. 'impactOnYou': 1-2 concrete sentences on the practical consequences for ${params.role}.
5. 'severity': 'high' (major financial or legal risk shift), 'medium' (notable negotiable difference), 'low' (minor timing or clarifying edit), or 'info'.
6. 'citations': Include 1-2 citations with verbatim quotes from Document A and/or Document B proving the change.

<clause_pairs>
${formattedPairs}
</clause_pairs>`;
}

export interface BuildCompareSummaryPromptParams {
  role: string;
  mode: string;
  explainedChanges: Array<{
    clauseA?: string | undefined;
    clauseB?: string | undefined;
    whatChanged: string;
    favorsNow: string;
    impactOnYou: string;
    severity: string;
  }>;
}

/**
 * Builds prompt for synthesizing the "3 changes that matter most" and executive summary (P5c).
 */
export function buildCompareSummaryPrompt(
  params: BuildCompareSummaryPromptParams
): string {
  const changesText = params.explainedChanges
    .map((c, i) => {
      const ref = `A: ${c.clauseA ?? "None"} -> B: ${c.clauseB ?? "None"}`;
      return `${i + 1}. [${ref}] [Severity: ${c.severity}] [Favors: ${c.favorsNow}]
Change: ${c.whatChanged}
Impact on ${params.role}: ${c.impactOnYou}`;
    })
    .join("\n\n");

  return `Synthesize the overall document comparison from the perspective of: ${params.role}.

All modified pairs:
${changesText}

Instructions:
1. 'topChanges': Pick UP TO 3 changes that matter the most to ${params.role} (ranked by urgency/severity).
   - 'headline': Short active title (e.g. "Deposit return delayed to 45 days").
   - 'summary': 1 crisp sentence explaining why this change matters.
   - 'severity': 'high' | 'medium' | 'low'.
   - 'clauseA' and 'clauseB': referencing clause IDs.
2. 'executiveSummary': 2-3 sentences explaining the overarching shift between the documents.
3. 'overallShift': 'favors_you' | 'favors_other_party' | 'neutral' | 'mixed'.`;
}

/**
 * P6 · Action Prompts & Schemas (Checklist, Lawyer Brief, Options, Negotiate).
 * brain.md §7 P6
 */

import { z } from "zod";
import {
  checklistItemSchema,
  lawyerBriefSchema,
  optionsResultSchema,
  negotiateResultSchema,
  type Clause,
  type ClauseAnalysis,
  type DocumentSynthesis,
} from "../domain/schemas";

export const ACTIONS_PROMPT_VERSION = "2026-09-20.1";

export const checklistActionOutputSchema = z.object({
  items: z.array(checklistItemSchema).optional(),
  checklist: z.array(checklistItemSchema).optional(),
}).transform((val) => ({
  items: val.items || val.checklist || [],
}));
export type ChecklistActionOutput = {
  items: z.infer<typeof checklistItemSchema>[];
};

export const lawyerBriefActionOutputSchema = lawyerBriefSchema;

export const optionsActionOutputSchema = optionsResultSchema;

export const negotiateActionOutputSchema = negotiateResultSchema;

export interface BaseActionPromptParams {
  role: string;
  docType?: string | undefined;
  clauses: Clause[];
  analyses?: ClauseAnalysis[] | undefined;
  synthesis?: DocumentSynthesis | undefined;
}

export interface OptionsPromptParams extends BaseActionPromptParams {
  scenario: string;
}

/**
 * P6 Checklist prompt: obligations, deliverables, and calendar deadlines.
 */
export function buildChecklistPrompt(params: BaseActionPromptParams): string {
  const formattedClauses = params.clauses
    .slice(0, 50)
    .map((c) => `[${c.id}] ${c.heading ? `<${c.heading}> ` : ""}${c.text.trim()}`)
    .join("\n\n");

  return `Extract a clear, practical checklist of obligations, deadlines, and action items for ${params.role}.

For EACH checklist item:
- 'item': Clear action statement (e.g. "Pay security deposit of $2,200", "Provide 30 days written notice before vacating").
- 'owner': 'you' (applies to ${params.role}), 'other_party', or 'both'.
- 'due': Stated deadline or timeline (e.g. "Within 14 days of moving in", "By the 1st of each month", "Before October 1, 2026"). Leave blank if continuous.
- 'priority': 'high' (strict deadline, potential breach/penalty), 'medium' (standard business/administrative step), or 'low' (courtesy/recordkeeping).
- 'citation': Exact clause ID and verbatim quote (<= 20 words) where this obligation is stated.

<document>
${formattedClauses}
</document>`;
}

/**
 * P6 Lawyer Brief prompt: 2-page executive summary preparing user for a legal consultation.
 */
export function buildLawyerBriefPrompt(
  params: BaseActionPromptParams & { fileName: string }
): string {
  const clausesSummary = params.clauses
    .slice(0, 40)
    .map((c) => `[${c.id}] ${c.heading ? `<${c.heading}> ` : ""}${c.text.slice(0, 200)}...`)
    .join("\n");

  const topRisksText = params.analyses
    ? params.analyses
        .filter((a) => a.risk.level === "high" || a.risk.level === "medium")
        .slice(0, 5)
        .map((a) => `- [${a.clauseId}] (${a.risk.level.toUpperCase()}): ${a.plainSummary}`)
        .join("\n")
    : "(See clauses)";

  return `Generate an objective, highly structured Lawyer Brief preparing ${params.role} to consult a qualified attorney about this document.
This brief is factual and non-adversarial. It saves the client billable consultation time.

Input:
Document: ${params.fileName}
Detected Type: ${params.docType ?? "contract"}
Role: ${params.role}

Key Risks Flagged:
${topRisksText}

Clauses context:
${clausesSummary}

Output Requirements:
- documentMeta: { fileName: "${params.fileName}", docType: "${params.docType ?? "other"}", parties: ["Party A", "Party B"], perspective: "${params.role}", generatedAt: "${new Date().toISOString()}" }
- situationSummary: 2-3 objective sentences describing the relationship and purpose of the agreement (max 500 chars).
- topRisks: Up to 5 key risks for ${params.role}, each with headline, clauseId, and level ('high' | 'medium').
- keyTerms: 3-5 crucial financial, operational, or legal terms with plain meaning and clauseId.
- openQuestions: 3-5 specific questions the client should ask the lawyer to evaluate or negotiate.
- missingInfo: 2-3 items or attachments not found in the text that the lawyer will need (e.g. Statement of Work, inspection report, addenda).
- suggestedAgenda: 3-4 bullet points for a productive 30-minute consultation.`;
}

/**
 * P6 Options prompt: explores scenario options, consequences, and next steps grounded in the contract.
 */
export function buildOptionsPrompt(params: OptionsPromptParams): string {
  const formattedClauses = params.clauses
    .slice(0, 45)
    .map((c) => `[${c.id}] ${c.heading ? `<${c.heading}> ` : ""}${c.text.trim()}`)
    .join("\n\n");

  return `The user is in the role of ${params.role} and asks about a specific practical scenario:
<scenario>
${params.scenario}
</scenario>

Based strictly on the clauses of this document, generate:
1. 'options': 2 to 4 realistic options that the document itself explicitly provides, permits, or logically implies.
   - 'title': Short active title (e.g. "Option 1: Early Termination with 60 Days Notice", "Option 2: Negotiate Mutual Release").
   - 'description': Plain-language explanation of how this option works.
   - 'pros': 1-3 advantages for ${params.role}.
   - 'cons': 1-3 risks, costs, or disadvantages.
   - 'citations': Verbatim quote and clause ID grounding this option.
2. 'nextSteps': 3-4 immediate practical steps (e.g. "Review your payment receipts", "Draft written notice in accordance with Clause 11").
3. 'deadlinesToWatch': Any statutory or contractual timeframes to watch.
4. 'questionsForProfessional': 2-3 targeted questions to ask a legal aid advisor or lawyer if pursuing this scenario.
5. 'escalationAdvice': If the scenario touches urgent rights (lockout, violence, 72h deadline), provide safety guidance.

<document>
${formattedClauses}
</document>`;
}

/**
 * P6 Negotiate prompt: provides alternative clause wording and fallback positions for High/Medium clauses.
 */
export function buildNegotiatePrompt(params: BaseActionPromptParams): string {
  const highMediumAnalyses = (params.analyses ?? [])
    .filter((a) => a.risk.level === "high" || a.risk.level === "medium")
    .slice(0, 6);

  const targets = highMediumAnalyses.map((a) => {
    const clause = params.clauses.find((c) => c.id === a.clauseId);
    return `[CLAUSE ${a.clauseId}] (${a.risk.level.toUpperCase()})
Original text: ${clause?.text ?? "N/A"}
Identified risk: ${a.risk.reasons.join("; ")}`;
  }).join("\n\n");

  return `Generate constructive, professional negotiation proposals for ${params.role} for the flagged clauses below.

For EACH clause:
- 'clauseId': Clause ID.
- 'problem': 1 clear sentence explaining why the current clause creates asymmetric risk for ${params.role}.
- 'whyItMatters': 1 sentence on real-world impact.
- 'alternativeWording': A proposed compromise wording labeled "Suggestion to discuss" that is balanced and realistic.
- 'fallbackPosition': A secondary compromise if the counterparty rejects the first proposal.
- 'citations': Verbatim quote from the original clause.

Target Clauses:
${targets}`;
}

import { z } from "zod";
import {
  CLAUSE_TYPES,
  DOC_TYPES,
  RISK_LEVELS,
  PERSPECTIVES,
  ANSWER_BASES,
  COMPARE_MODES,
  ACTION_TYPES,
} from "./enums";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive schemas
// ─────────────────────────────────────────────────────────────────────────────

/** Stable clause identifier: C1, C2, … (1-indexed, C0 is invalid) */
export const clauseIdSchema = z
  .string()
  .regex(/^C[1-9]\d*$/, "Clause ID must be C followed by a positive integer ≥ 1 (e.g. C1)");

/** A verbatim quote extracted from a clause — max 200 chars for display safety */
export const quoteSchema = z.string().min(1).max(500);

// ─────────────────────────────────────────────────────────────────────────────
// Citation — the grounding contract (brain.md §8)
// ─────────────────────────────────────────────────────────────────────────────

export const citationSchema = z.object({
  /** Stable clause ID this citation refers to */
  clauseId: clauseIdSchema,
  /** Verbatim quote from that clause (≤ 25 words ideal, verified by verifier) */
  quote: quoteSchema,
  /** Set by the deterministic verifier — never trust the model's own claim */
  verified: z.boolean().default(false),
});
export type Citation = z.infer<typeof citationSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Clause — a single addressable unit of a document
// ─────────────────────────────────────────────────────────────────────────────

export const clauseSchema = z.object({
  /** Stable ID: C1..Cn */
  id: clauseIdSchema,
  /** Ordinal position (1-indexed) */
  index: z.number().int().positive(),
  /** Section heading (if any) */
  heading: z.string().optional(),
  /** Raw clause text — this is the source of truth for verification */
  text: z.string().min(1),
  /** Character offset into the normalized document text */
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().positive(),
  /** Page number(s) from the source document (1-indexed) */
  pages: z.array(z.number().int().positive()).min(1),
  /** Token count estimate (used for batching) */
  tokenEstimate: z.number().int().nonnegative().optional(),
});
export type Clause = z.infer<typeof clauseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// LegalDocument — parsed + segmented document (lives in browser / IndexedDB)
// ─────────────────────────────────────────────────────────────────────────────

export const legalDocumentSchema = z.object({
  /** Random ID for IndexedDB keying */
  id: z.string().min(1),
  /** Original file name */
  fileName: z.string(),
  /** Normalized full text (after whitespace/header cleaning) */
  normalizedText: z.string(),
  /** Ordered clause array */
  clauses: z.array(clauseSchema).min(1),
  /** Page count from parsing */
  pageCount: z.number().int().positive().optional(),
  /** Detected or user-supplied language (BCP 47) */
  language: z.string().default("en"),
  /** Rough total token estimate */
  totalTokens: z.number().int().nonnegative().optional(),
  /** When was this parsed (client-side timestamp) */
  parsedAt: z.string().datetime(),
});
export type LegalDocument = z.infer<typeof legalDocumentSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Risk — per-clause risk assessment
// ─────────────────────────────────────────────────────────────────────────────

export const riskSchema = z.object({
  level: z.union([z.enum(RISK_LEVELS), z.string()]).transform((val) => {
    const v = val.toLowerCase();
    if (v === "high" || v === "medium" || v === "low" || v === "info") return v as any;
    return "info";
  }),
  /** 1–3 concrete reasons explaining the level (never a bare label) */
  reasons: z.union([
    z.array(z.string()),
    z.string().transform((s) => [s]),
  ]).default(["Standard provision requiring review."]),
  /** Which party this clause favours from the user's perspective */
  favors: z.union([z.enum(["you", "other_party", "balanced", "unclear"]), z.string()]).transform((val) => {
    const v = val.toLowerCase();
    if (v === "you" || v === "other_party" || v === "balanced" || v === "unclear") return v as any;
    return "balanced";
  }),
  /** True if the clause is unusual for this document type */
  unusual: z.boolean().default(false),
});
export type Risk = z.infer<typeof riskSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ClauseAnalysis — result of P2 (brain.md §7 P2)
// ─────────────────────────────────────────────────────────────────────────────

export const clauseAnalysisSchema = z.object({
  clauseId: clauseIdSchema,
  canonicalType: z.enum(CLAUSE_TYPES),
  /** 1–2 sentence plain-language summary from the user's role perspective */
  plainSummary: z.string().min(1).max(400),
  /** What the user must do/pay/provide */
  obligations: z.array(z.string()).optional().default([]),
  /** What the user may do or expect */
  rights: z.array(z.string()).optional().default([]),
  risk: riskSchema,
  /** 1 sentence on real-world effect */
  whyItMatters: z.string().min(1).max(200),
  /** 0–3 specific questions to ask/negotiate */
  questionsToAsk: z.array(z.string()).max(3).default([]),
  /** 0–1; conservative for vague/cross-referenced clauses */
  confidence: z.number().min(0).max(1),
  /** ≥1 verified citations — verified flag set by server-side verifier, not LLM */
  citations: z.array(citationSchema).min(1),
});
export type ClauseAnalysis = z.infer<typeof clauseAnalysisSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// KeyFact — a named datum from the document (TL;DR strip)
// ─────────────────────────────────────────────────────────────────────────────

export const keyFactSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  citations: z.array(citationSchema).min(1),
});
export type KeyFact = z.infer<typeof keyFactSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// DocumentSynthesis — result of P3 (brain.md §7 P3)
// ─────────────────────────────────────────────────────────────────────────────

export const documentSynthesisSchema = z.object({
  docType: z.enum(DOC_TYPES),
  /** Detected parties (names as written in document) */
  parties: z.array(z.string()).min(1).max(10),
  /** TL;DR ≤ 90 words, grade-8 */
  tldr: z.string().min(1).max(600),
  /** Parties, term, money, key dates, exit options — each with citations */
  keyFacts: z.array(keyFactSchema).max(10),
  /** Up to 5 top risks ordered by importance to the user's role */
  topRisks: z
    .array(
      z.object({
        clauseId: clauseIdSchema,
        headline: z.string().min(1).max(120),
        level: z.enum(RISK_LEVELS),
      })
    )
    .max(5),
  /** Clauses that are commonly included in this doc type but are absent */
  missingClauses: z.array(z.string()).default([]),
  /** Contradictions, undefined terms, broken cross-references */
  inconsistencies: z.array(z.string()).default([]),
  /** User's perspective used during analysis */
  perspective: z.enum(PERSPECTIVES),
  /** Prompt version used — for eval tracking */
  promptVersion: z.string(),
});
export type DocumentSynthesis = z.infer<typeof documentSynthesisSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Answer — result of P4 grounded Q&A (brain.md §7 P4)
// ─────────────────────────────────────────────────────────────────────────────

export const answerSchema = z.object({
  /** Short answer (≤ 120 words for document/general_information, brief for not_found) */
  text: z.string().min(1),
  basis: z.enum(ANSWER_BASES),
  /** Citations into the document — required when basis === "document" */
  citations: z.array(citationSchema).default([]),
  /** 3 suggested follow-up questions */
  followUpQuestions: z.array(z.string()).max(3).default([]),
  /** Set if this answer triggered an escalation rule */
  escalationTrigger: z.string().optional(),
  /** Nearest clauses when basis === "not_found" */
  nearestClauses: z.array(clauseIdSchema).optional(),
  promptVersion: z.string(),
});
export type Answer = z.infer<typeof answerSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ComparisonPair — an aligned clause pair from two documents (brain.md §7 P5b)
// ─────────────────────────────────────────────────────────────────────────────

export const diffOpSchema = z.object({
  value: z.string(),
  added: z.boolean().optional(),
  removed: z.boolean().optional(),
});
export type DiffOp = z.infer<typeof diffOpSchema>;

export const comparisonPairSchema = z.object({
  /** Clause ID in document A (if present) */
  a: clauseIdSchema.optional(),
  /** Clause ID in document B (if present) */
  b: clauseIdSchema.optional(),
  /** Canonical clause type from taxonomy */
  type: z.enum(CLAUSE_TYPES).optional(),
  /** "unchanged", "modified", "added" (only in B), "removed" (only in A) */
  status: z.enum(["unchanged", "modified", "added", "removed", "matched"]),
  clauseA: clauseSchema.optional(),
  clauseB: clauseSchema.optional(),
  /** Word-level diff spans (from jsdiff) */
  wordDiff: z.array(diffOpSchema).optional(),
  diff: z.array(diffOpSchema).optional(),
  /** Analysis from P5b */
  whatChanged: z.string().optional(),
  favorsNow: z.enum(["you", "other_party", "balanced", "unclear"]).optional(),
  impactOnYou: z.string().optional(),
  severity: z.enum(RISK_LEVELS).optional(),
  citations: z.array(citationSchema).default([]),
});
export type ComparisonPair = z.infer<typeof comparisonPairSchema>;


// ─────────────────────────────────────────────────────────────────────────────
// Action results — P6
// ─────────────────────────────────────────────────────────────────────────────

export const checklistItemSchema = z.object({
  item: z.string().min(1),
  owner: z.union([z.enum(["you", "other_party", "both"]), z.string()]).transform((val) => {
    if (val === "you" || val === "other_party" || val === "both") return val;
    return "you";
  }),
  due: z.string().optional().default(""),
  citation: z.union([
    citationSchema,
    z.string().transform((str) => {
      const match = str.match(/^(C\d+)(?::\s*|\s+)?(?:"(.*)"|(.*))?$/);
      if (match) {
        return {
          clauseId: match[1] ?? "C1",
          quote: (match[2] ?? match[3] ?? str).slice(0, 100),
          verified: false,
        };
      }
      return { clauseId: "C1", quote: str.slice(0, 100), verified: false };
    }),
  ]).optional(),
  priority: z.union([z.enum(["high", "medium", "low"]), z.string()]).transform((val) => {
    if (val === "high" || val === "medium" || val === "low") return val;
    return "medium";
  }),
});
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const lawyerBriefSchema = z.object({
  documentMeta: z.object({
    fileName: z.string(),
    docType: z.enum(DOC_TYPES),
    parties: z.array(z.string()),
    perspective: z.enum(PERSPECTIVES),
    generatedAt: z.string().datetime(),
  }),
  situationSummary: z.string().min(1).max(500),
  topRisks: z.array(
    z.object({ headline: z.string(), clauseId: clauseIdSchema, level: z.enum(RISK_LEVELS) })
  ),
  keyTerms: z.array(z.object({ term: z.string(), meaning: z.string(), clauseId: clauseIdSchema })),
  openQuestions: z.array(z.string()),
  missingInfo: z.array(z.string()),
  suggestedAgenda: z.array(z.string()),
  disclaimer: z
    .string()
    .default(
      "LexLens gives legal information, not legal advice. For decisions that matter, talk to a qualified lawyer."
    ),
});
export type LawyerBrief = z.infer<typeof lawyerBriefSchema>;

export const optionItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  citations: z.array(citationSchema).default([]),
});
export type OptionItem = z.infer<typeof optionItemSchema>;

export const optionsResultSchema = z.object({
  scenario: z.string().min(1),
  options: z.array(optionItemSchema),
  nextSteps: z.array(z.string()),
  deadlinesToWatch: z.array(z.string()),
  questionsForProfessional: z.array(z.string()),
  escalationAdvice: z.string().optional(),
});
export type OptionsResult = z.infer<typeof optionsResultSchema>;

export const negotiateSuggestionSchema = z.object({
  clauseId: clauseIdSchema,
  clauseHeading: z.string().optional(),
  problem: z.string().min(1),
  whyItMatters: z.string().min(1),
  alternativeWording: z.string().min(1),
  fallbackPosition: z.string().min(1),
  citations: z.array(citationSchema).default([]),
});
export type NegotiateSuggestion = z.infer<typeof negotiateSuggestionSchema>;

export const negotiateResultSchema = z.object({
  suggestions: z.array(negotiateSuggestionSchema),
});
export type NegotiateResult = z.infer<typeof negotiateResultSchema>;

export const actionResultSchema = z.discriminatedUnion("actionType", [
  z.object({
    actionType: z.literal("checklist"),
    items: z.array(checklistItemSchema),
  }),
  z.object({
    actionType: z.literal("lawyer_brief"),
    brief: lawyerBriefSchema,
  }),
  z.object({
    actionType: z.literal("options"),
    result: optionsResultSchema,
  }),
  z.object({
    actionType: z.literal("negotiate"),
    result: negotiateResultSchema,
  }),
]);
export type ActionResult = z.infer<typeof actionResultSchema>;


// ─────────────────────────────────────────────────────────────────────────────
// API request / response schemas (used at route boundaries with Zod validation)
// ─────────────────────────────────────────────────────────────────────────────

export const analyzeRequestSchema = z.object({
  clauses: z.array(clauseSchema).min(1).max(600),
  docType: z.enum(DOC_TYPES).optional(),
  perspective: z.enum(PERSPECTIVES),
  jurisdiction: z.string().max(100).optional(),
  language: z.string().max(10).default("en"),
  sessionId: z.string().optional(),
});
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const askRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  clauses: z.array(clauseSchema).min(1).max(600),
  docType: z.enum(DOC_TYPES).optional(),
  perspective: z.enum(PERSPECTIVES),
  jurisdiction: z.string().max(100).optional(),
  language: z.string().max(10).default("en"),
  sessionId: z.string().optional(),
});
export type AskRequest = z.infer<typeof askRequestSchema>;

export const compareRequestSchema = z.object({
  clausesA: z.array(clauseSchema).min(1).max(600),
  clausesB: z.array(clauseSchema).min(1).max(600),
  fileNameA: z.string(),
  fileNameB: z.string(),
  mode: z.enum(COMPARE_MODES).default("versions"),
  perspective: z.enum(PERSPECTIVES),
  jurisdiction: z.string().max(100).optional(),
  language: z.string().max(10).default("en"),
  sessionId: z.string().optional(),
});
export type CompareRequest = z.infer<typeof compareRequestSchema>;

export const actionsRequestSchema = z.object({
  actionType: z.enum(ACTION_TYPES),
  clauses: z.array(clauseSchema).min(1).max(600),
  analyses: z.array(clauseAnalysisSchema).optional(),
  synthesis: documentSynthesisSchema.optional(),
  perspective: z.enum(PERSPECTIVES),
  scenario: z.string().max(500).optional(),
  fileName: z.string().optional(),
  language: z.string().max(10).default("en"),
  sessionId: z.string().optional(),
});
export type ActionsRequest = z.infer<typeof actionsRequestSchema>;

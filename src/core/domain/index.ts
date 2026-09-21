/**
 * core/domain/index.ts — public API of the domain layer.
 * Import everything from here; do not deep-import individual files. (code-structure §3)
 */

// Enums and constants
export {
  CLAUSE_TYPES,
  DOC_TYPES,
  RISK_LEVELS,
  PERSPECTIVES,
  ANSWER_BASES,
  COMPARE_MODES,
  ACTION_TYPES,
} from "./enums";

export type {
  ClauseType,
  DocType,
  RiskLevel,
  Perspective,
  AnswerBasis,
  CompareMode,
  ActionType,
} from "./enums";

// Schemas (Zod objects — import these for validation at boundaries)
export {
  clauseIdSchema,
  quoteSchema,
  citationSchema,
  clauseSchema,
  legalDocumentSchema,
  riskSchema,
  clauseAnalysisSchema,
  keyFactSchema,
  documentSynthesisSchema,
  answerSchema,
  comparisonPairSchema,
  diffOpSchema,
  checklistItemSchema,
  lawyerBriefSchema,
  optionItemSchema,
  optionsResultSchema,
  negotiateSuggestionSchema,
  negotiateResultSchema,
  analyzeRequestSchema,
  askRequestSchema,
  compareRequestSchema,
  actionsRequestSchema,
  actionResultSchema,
} from "./schemas";

// Inferred TypeScript types
export type {
  Citation,
  Clause,
  LegalDocument,
  Risk,
  ClauseAnalysis,
  KeyFact,
  DocumentSynthesis,
  Answer,
  ComparisonPair,
  DiffOp,
  ChecklistItem,
  LawyerBrief,
  OptionItem,
  OptionsResult,
  NegotiateSuggestion,
  NegotiateResult,
  AnalyzeRequest,
  AskRequest,
  CompareRequest,
  ActionsRequest,
  ActionResult,
} from "./schemas";



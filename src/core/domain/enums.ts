/**
 * ClauseType — canonical taxonomy for legal clause classification.
 * Source: brain.md §4. Used by P0 (classify) and P2 (clause analysis).
 */
export const CLAUSE_TYPES = [
  "parties",
  "definitions",
  "term_duration",
  "renewal_auto_renewal",
  "payment_fees",
  "late_payment_penalty",
  "security_deposit",
  "taxes_expenses",
  "scope_services",
  "deliverables_acceptance",
  "revisions_changes",
  "intellectual_property",
  "licence_grant",
  "confidentiality",
  "data_protection_privacy",
  "non_compete",
  "non_solicitation",
  "exclusivity",
  "warranties",
  "representations",
  "indemnification",
  "limitation_of_liability",
  "insurance",
  "termination_convenience",
  "termination_cause",
  "notice_period",
  "post_termination",
  "dispute_resolution_arbitration",
  "governing_law_jurisdiction",
  "force_majeure",
  "assignment_subcontracting",
  "amendment_unilateral_change",
  "entry_access_inspection",
  "maintenance_repairs",
  "use_restrictions",
  "probation_performance",
  "compensation_bonus_benefits",
  "working_hours_leave",
  "notices",
  "entire_agreement",
  "severability_waiver",
  "other",
] as const;

export type ClauseType = (typeof CLAUSE_TYPES)[number];

/**
 * DocType — document classification output of P0.
 */
export const DOC_TYPES = [
  "lease_residential",
  "lease_commercial",
  "employment",
  "freelance_services",
  "nda",
  "saas_terms",
  "privacy_policy",
  "loan",
  "sale_purchase",
  "partnership",
  "consumer_terms",
  "other",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

/**
 * Risk level — always shown with icon + label + colour (never colour alone).
 * Source: brain.md §5, design.md §3.1
 */
export const RISK_LEVELS = ["high", "medium", "low", "info"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/**
 * User perspective (party role).
 */
export const PERSPECTIVES = [
  "tenant",
  "landlord",
  "employee",
  "employer",
  "freelancer",
  "client",
  "customer",
  "buyer",
  "seller",
  "other",
] as const;

export type Perspective = (typeof PERSPECTIVES)[number];

/**
 * Answer basis — distinguishes document-grounded vs. general info vs. not found.
 * Source: brain.md §7 P4
 */
export const ANSWER_BASES = ["document", "general_information", "not_found"] as const;
export type AnswerBasis = (typeof ANSWER_BASES)[number];

/**
 * Compare modes (design.md §7.5)
 */
export const COMPARE_MODES = ["versions", "offers", "policy_vs_template"] as const;
export type CompareMode = (typeof COMPARE_MODES)[number];

/**
 * Action types (brain.md §7 P6)
 */
export const ACTION_TYPES = [
  "checklist",
  "lawyer_brief",
  "options",
  "negotiate",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

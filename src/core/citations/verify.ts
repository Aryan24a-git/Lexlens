/**
 * Deterministic Citation Verifier.
 * brain.md §8: Citation & grounding contract.
 *
 * Normalizes text (NFKC, collapses whitespace, unifies smart quotes and dashes, casefolds)
 * and verifies that the quote is a verbatim substring of the cited clause,
 * allowing at most 1 ellipsis (...) splitting the quote into two ordered parts.
 */

import type { Citation, Clause, ClauseAnalysis, KeyFact } from "../domain/schemas";

/**
 * Normalizes text for robust citation verification:
 * 1. Unicode NFKC normalization.
 * 2. Unify smart double and single quotes to plain ascii.
 * 3. Unify em-dashes, en-dashes, and hyphens.
 * 4. Collapse all whitespace sequences (tabs, newlines, spaces) into a single space.
 * 5. Casefold (lowercase) and trim.
 */
export function normalizeQuote(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u2014\u2013\u2212\u2010\u2011]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/**
 * Checks if a given quote exists within a clause text.
 * Handles exact substrings and quotes with at most 1 ellipsis ("..." or "…").
 */
export function isQuoteInText(rawQuote: string, rawText: string): boolean {
  if (!rawQuote || !rawText) return false;

  const normText = normalizeQuote(rawText);
  // Standardize ellipsis to a single sentinel delimiter
  const normalizedWithEllipsis = rawQuote
    .replace(/…/g, "...")
    .replace(/\.{3,}/g, "...");

  const parts = normalizedWithEllipsis.split("...");

  if (parts.length === 1) {
    // Single contiguous quote
    const part = normalizeQuote(parts[0] ?? "");
    if (!part) return false;
    return normText.includes(part);
  } else if (parts.length === 2) {
    // Quote with 1 ellipsis: part0 must appear, and part1 must appear after part0
    const part0 = normalizeQuote(parts[0] ?? "");
    const part1 = normalizeQuote(parts[1] ?? "");

    // If one part is empty (e.g. leading or trailing ellipsis), just check the other
    if (!part0 && !part1) return false;
    if (!part0) return normText.includes(part1);
    if (!part1) return normText.includes(part0);

    const idx0 = normText.indexOf(part0);
    if (idx0 === -1) return false;

    const idx1 = normText.indexOf(part1, idx0 + part0.length);
    return idx1 !== -1;
  } else {
    // More than 1 ellipsis: not permitted by policy (could allow arbitrary matching)
    return false;
  }
}

/**
 * Verifies an individual citation against a clause lookup map.
 * Returns a new Citation object with `verified` set to true or false.
 */
export function verifyCitation(
  citation: Citation,
  clauseMap: Map<string, Clause>
): Citation {
  const clause = clauseMap.get(citation.clauseId);
  if (!clause) {
    return { ...citation, verified: false };
  }

  const matches = isQuoteInText(citation.quote, clause.text);
  return {
    ...citation,
    verified: matches,
  };
}

/**
 * Verifies all citations in a ClauseAnalysis.
 * Returns the ClauseAnalysis with updated verified statuses.
 */
export function verifyClauseAnalysis(
  analysis: ClauseAnalysis,
  clauseMap: Map<string, Clause>
): ClauseAnalysis {
  const verifiedCitations = analysis.citations.map((c) =>
    verifyCitation(c, clauseMap)
  );

  return {
    ...analysis,
    citations: verifiedCitations,
  };
}

/**
 * Verifies citations in KeyFacts from DocumentSynthesis.
 */
export function verifyKeyFact(
  fact: KeyFact,
  clauseMap: Map<string, Clause>
): KeyFact {
  return {
    ...fact,
    citations: fact.citations.map((c) => verifyCitation(c, clauseMap)),
  };
}

/**
 * Calculates the verified ratio (verified citations / total citations).
 * Returns 1.0 if no citations exist.
 */
export function calculateVerifiedRatio(citations: Citation[]): number {
  if (citations.length === 0) return 1.0;
  const verifiedCount = citations.filter((c) => c.verified).length;
  return verifiedCount / citations.length;
}

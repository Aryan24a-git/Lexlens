/**
 * Context Builder for Grounded Q&A.
 * brain.md §12, architecture.md §5.3
 *
 * Full document if <= ~60k tokens (~240,000 characters),
 * otherwise BM25 top-k + neighbours + definitions.
 */

import type { Clause } from "../domain/schemas";
import { searchClauses } from "./bm25";

export const FULL_DOC_TOKEN_THRESHOLD = 60_000;

export interface RetrievalContext {
  clauses: Clause[];
  isTruncated: boolean;
}

/**
 * Builds the optimal context of clauses to supply to the LLM for Q&A.
 */
export function buildRetrievalContext(
  allClauses: Clause[],
  question: string,
  tokenThreshold = FULL_DOC_TOKEN_THRESHOLD
): RetrievalContext {
  if (allClauses.length === 0) {
    return { clauses: [], isTruncated: false };
  }

  // Estimate total tokens (rough heuristic: 4 chars per token)
  const totalTokens = allClauses.reduce((acc, c) => {
    return acc + (c.tokenEstimate ?? Math.ceil(c.text.length / 4));
  }, 0);

  // If document fits comfortably within cacheable token budget, pass the full document
  if (totalTokens <= tokenThreshold) {
    return {
      clauses: allClauses,
      isTruncated: false,
    };
  }

  // Otherwise, use BM25 to find top matching clauses
  const topHits = searchClauses(allClauses, question, 6);

  // If BM25 returned no matches, fall back to first 8 clauses
  if (topHits.length === 0) {
    return {
      clauses: allClauses.slice(0, 8),
      isTruncated: true,
    };
  }

  const selectedIds = new Set<string>();
  const indexMap = new Map<number, Clause>();
  for (const c of allClauses) {
    indexMap.set(c.index, c);
  }

  // 1. Add top-k hits and their immediate neighbours (+/- 1)
  for (const hit of topHits) {
    selectedIds.add(hit.id);

    const prev = indexMap.get(hit.index - 1);
    if (prev) selectedIds.add(prev.id);

    const next = indexMap.get(hit.index + 1);
    if (next) selectedIds.add(next.id);
  }

  // 2. Add definitions clauses if present
  for (const c of allClauses) {
    const headingLower = (c.heading ?? "").toLowerCase();
    if (
      headingLower.includes("definition") ||
      headingLower.includes("interpretation")
    ) {
      selectedIds.add(c.id);
    }
  }

  // 3. Assemble and sort selected clauses in document order
  const selectedClauses = allClauses
    .filter((c) => selectedIds.has(c.id))
    .sort((a, b) => a.index - b.index);

  return {
    clauses: selectedClauses,
    isTruncated: true,
  };
}

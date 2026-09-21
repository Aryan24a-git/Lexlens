/**
 * BM25 / Full-Text Clause Retrieval using MiniSearch.
 * architecture.md §5.3, brain.md §12
 */

import MiniSearch from "minisearch";
import type { Clause } from "../domain/schemas";

export interface SearchResult {
  clause: Clause;
  score: number;
}

/**
 * Creates and populates an in-memory MiniSearch index for the provided clauses.
 */
export function createClauseSearchIndex(clauses: Clause[]): MiniSearch<{
  id: string;
  heading: string;
  text: string;
  index: number;
}> {
  const miniSearch = new MiniSearch<{
    id: string;
    heading: string;
    text: string;
    index: number;
  }>({
    fields: ["heading", "text"],
    storeFields: ["id", "index"],
    searchOptions: {
      boost: { heading: 2.0 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  const docs = clauses.map((c) => ({
    id: c.id,
    heading: c.heading ?? "",
    text: c.text,
    index: c.index,
  }));

  miniSearch.addAll(docs);
  return miniSearch;
}

/**
 * Searches clauses using BM25-style lexical matching.
 * Returns the top-k best matching clauses.
 */
export function searchClauses(
  clauses: Clause[],
  query: string,
  topK = 5
): Clause[] {
  if (!query || !query.trim() || clauses.length === 0) {
    return [];
  }

  const index = createClauseSearchIndex(clauses);
  const results = index.search(query.trim());

  const clauseMap = new Map<string, Clause>();
  for (const c of clauses) {
    clauseMap.set(c.id, c);
  }

  const hits: Clause[] = [];
  for (const r of results.slice(0, topK)) {
    const matched = clauseMap.get(r.id);
    if (matched) {
      hits.push(matched);
    }
  }

  return hits;
}

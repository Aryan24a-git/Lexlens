/**
 * Clause Alignment Algorithm.
 * architecture.md §5.4, brain.md §3 P5
 */

import type { Clause, ComparisonPair } from "../domain/schemas";
import type { ClauseType } from "../domain/enums";
import { computeClauseSimilarity } from "./similarity";
import { computeWordDiff } from "./diff";

export interface AlignedComparisonResult {
  pairs: ComparisonPair[];
  stats: {
    totalA: number;
    totalB: number;
    unchangedCount: number;
    modifiedCount: number;
    addedCount: number;
    removedCount: number;
  };
}

/**
 * Aligns clauses between two documents and computes deterministic word-level redlines.
 */
export function alignClauses(
  clausesA: Clause[],
  clausesB: Clause[]
): AlignedComparisonResult {
  const matchedA = new Set<string>();
  const matchedB = new Set<string>();
  const pairs: ComparisonPair[] = [];

  const totalA = clausesA.length;
  const totalB = clausesB.length;

  // 1. Pass 1: Exact heading matches or identical text matches
  for (const a of clausesA) {
    for (const b of clausesB) {
      if (matchedB.has(b.id)) continue;

      const normHeadingA = (a.heading ?? "").trim().toLowerCase();
      const normHeadingB = (b.heading ?? "").trim().toLowerCase();

      const isHeadingMatch =
        normHeadingA.length > 2 && normHeadingA === normHeadingB;
      const isTextExactMatch = a.text.trim() === b.text.trim();

      if (isHeadingMatch || isTextExactMatch) {
        matchedA.add(a.id);
        matchedB.add(b.id);

        const diff = computeWordDiff(a.text, b.text);
        const status = diff.stats.isIdentical ? "unchanged" : "modified";

        pairs.push({
          a: a.id,
          b: b.id,
          type: "other" as ClauseType,
          status,
          wordDiff: diff.ops,
          citations: [],
        });
        break;
      }
    }
  }

  // 2. Pass 2: Greedy similarity alignment for remaining clauses (score >= 0.35)
  const candidateScores: Array<{
    a: Clause;
    b: Clause;
    score: number;
  }> = [];

  for (const a of clausesA) {
    if (matchedA.has(a.id)) continue;
    for (const b of clausesB) {
      if (matchedB.has(b.id)) continue;

      const score = computeClauseSimilarity(a, b, totalA, totalB);
      if (score >= 0.35) {
        candidateScores.push({ a, b, score });
      }
    }
  }

  // Sort candidates by highest score descending
  candidateScores.sort((x, y) => y.score - x.score);

  for (const candidate of candidateScores) {
    if (matchedA.has(candidate.a.id) || matchedB.has(candidate.b.id)) {
      continue;
    }

    matchedA.add(candidate.a.id);
    matchedB.add(candidate.b.id);

    const diff = computeWordDiff(candidate.a.text, candidate.b.text);
    const status = diff.stats.isIdentical ? "unchanged" : "modified";

    pairs.push({
      a: candidate.a.id,
      b: candidate.b.id,
      type: "other" as ClauseType,
      status,
      wordDiff: diff.ops,
      citations: [],
    });
  }

  // 3. Pass 3: Unmatched clauses in A -> "removed"
  for (const a of clausesA) {
    if (!matchedA.has(a.id)) {
      pairs.push({
        a: a.id,
        type: "other" as ClauseType,
        status: "removed",
        wordDiff: [{ value: a.text, removed: true }],
        citations: [
          {
            clauseId: a.id,
            quote: a.text.slice(0, 80),
            verified: true,
          },
        ],
      });
    }
  }

  // 4. Pass 4: Unmatched clauses in B -> "added"
  for (const b of clausesB) {
    if (!matchedB.has(b.id)) {
      pairs.push({
        b: b.id,
        type: "other" as ClauseType,
        status: "added",
        wordDiff: [{ value: b.text, added: true }],
        citations: [
          {
            clauseId: b.id,
            quote: b.text.slice(0, 80),
            verified: true,
          },
        ],
      });
    }
  }

  // Sort pairs according to document sequence
  const getPairSortIndex = (p: ComparisonPair): number => {
    if (p.b) {
      const clauseB = clausesB.find((c) => c.id === p.b);
      if (clauseB) return clauseB.index * 10;
    }
    if (p.a) {
      const clauseA = clausesA.find((c) => c.id === p.a);
      if (clauseA) return clauseA.index * 10 + 1;
    }
    return 9999;
  };

  pairs.sort((p1, p2) => getPairSortIndex(p1) - getPairSortIndex(p2));

  let unchangedCount = 0;
  let modifiedCount = 0;
  let addedCount = 0;
  let removedCount = 0;

  for (const p of pairs) {
    if (p.status === "unchanged") unchangedCount++;
    else if (p.status === "modified") modifiedCount++;
    else if (p.status === "added") addedCount++;
    else if (p.status === "removed") removedCount++;
  }

  return {
    pairs,
    stats: {
      totalA,
      totalB,
      unchangedCount,
      modifiedCount,
      addedCount,
      removedCount,
    },
  };
}

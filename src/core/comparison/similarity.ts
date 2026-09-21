/**
 * Clause Similarity Algorithms.
 * architecture.md §5.4, brain.md §3 P5
 */

/**
 * Tokenizes text into lowercase alphanumeric word tokens.
 */
export function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  return new Set(words);
}

/**
 * Calculates Jaccard token similarity between two strings: |A ∩ B| / |A ∪ B|
 * Returns a score between 0.0 and 1.0.
 */
export function jaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * Calculates heading similarity giving heavy weight to identical or near-identical headings.
 */
export function headingSimilarity(headingA?: string, headingB?: string): number {
  if (!headingA && !headingB) return 0.5; // both unheaded
  if (!headingA || !headingB) return 0.0;

  const normA = headingA.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normB = headingB.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normA === normB) return 1.0;
  if (normA.includes(normB) || normB.includes(normA)) return 0.85;

  return jaccardSimilarity(headingA, headingB);
}

/**
 * Composite clause similarity score taking into account heading, body text, and relative index.
 */
export function computeClauseSimilarity(
  clauseA: { heading?: string | undefined; text: string; index: number },
  clauseB: { heading?: string | undefined; text: string; index: number },
  totalA = 1,
  totalB = 1
): number {
  const textSim = jaccardSimilarity(clauseA.text, clauseB.text);
  const headSim = headingSimilarity(clauseA.heading, clauseB.heading);

  // Positional proximity (clauses typically appear in similar sequence)
  const relPosA = totalA > 0 ? clauseA.index / totalA : 0;
  const relPosB = totalB > 0 ? clauseB.index / totalB : 0;
  const posSim = Math.max(0, 1 - Math.abs(relPosA - relPosB));

  // If headings are strongly matching, give heading high weight
  if (headSim >= 0.8) {
    return 0.5 * headSim + 0.4 * textSim + 0.1 * posSim;
  }

  return 0.2 * headSim + 0.7 * textSim + 0.1 * posSim;
}

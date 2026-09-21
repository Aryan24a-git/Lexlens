/**
 * Deterministic Word-Level Redline Diffing using `diff` (jsdiff).
 * architecture.md §5.4, brain.md §8
 */

import { diffWordsWithSpace, type Change } from "diff";
import type { DiffOp } from "../domain/schemas";

export interface DiffStats {
  wordsAdded: number;
  wordsRemoved: number;
  wordsUnchanged: number;
  isIdentical: boolean;
}

export interface DiffResult {
  ops: DiffOp[];
  stats: DiffStats;
}

/**
 * Computes deterministic word-level diff between original text and modified text.
 */
export function computeWordDiff(textA: string, textB: string): DiffResult {
  if (textA === textB) {
    return {
      ops: [{ value: textA }],
      stats: {
        wordsAdded: 0,
        wordsRemoved: 0,
        wordsUnchanged: countWords(textA),
        isIdentical: true,
      },
    };
  }

  const rawChanges: Change[] = diffWordsWithSpace(textA, textB);

  let wordsAdded = 0;
  let wordsRemoved = 0;
  let wordsUnchanged = 0;

  const ops: DiffOp[] = rawChanges.map((change) => {
    const wordCount = countWords(change.value);

    if (change.added) {
      wordsAdded += wordCount;
      return { value: change.value, added: true };
    }
    if (change.removed) {
      wordsRemoved += wordCount;
      return { value: change.value, removed: true };
    }

    wordsUnchanged += wordCount;
    return { value: change.value };
  });

  const isIdentical = wordsAdded === 0 && wordsRemoved === 0;

  return {
    ops,
    stats: {
      wordsAdded,
      wordsRemoved,
      wordsUnchanged,
      isIdentical,
    },
  };
}

function countWords(str: string): number {
  const words = str.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

import { RawSegment } from "./heuristics";

const MIN_FRAGMENT_LENGTH = 50;

/**
 * Merge tiny fragments (< 50 chars) into adjacent segments to avoid dangling headings
 * or broken fragments. (brain.md §3, code-structure.md §1)
 */
export function mergeTinyFragments(
  segments: RawSegment[],
  fullText: string
): RawSegment[] {
  if (segments.length <= 1) {
    return segments;
  }

  const result: RawSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const current = segments[i]!;

    // If current segment is too small (< 50 chars)
    if (current.text.length < MIN_FRAGMENT_LENGTH) {
      // If there is an existing previous segment in result, and no next segment, merge with previous
      if (i === segments.length - 1 && result.length > 0) {
        const prev = result[result.length - 1]!;
        prev.endOffset = current.endOffset;
        prev.text = fullText.slice(prev.startOffset, prev.endOffset).trim();
        continue;
      }

      // If there is an upcoming segment (i + 1), merge forward into it
      if (i + 1 < segments.length) {
        const next = segments[i + 1]!;
        next.startOffset = current.startOffset;
        if (!next.heading && current.heading) {
          next.heading = current.heading;
        }
        next.text = fullText.slice(next.startOffset, next.endOffset).trim();
        continue;
      }
    }

    result.push({ ...current });
  }

  return result;
}

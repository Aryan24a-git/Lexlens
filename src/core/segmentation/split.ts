import { RawSegment } from "./heuristics";

const MAX_TOKENS_PER_CLAUSE = 1200;
const CHARS_PER_TOKEN = 4;
const MAX_CHARS_PER_CLAUSE = MAX_TOKENS_PER_CLAUSE * CHARS_PER_TOKEN; // 4800 chars

/**
 * Estimate token count from character length.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Split large segments (> 1,200 tokens / ~4,800 chars) at natural sentence or paragraph boundaries.
 * Preserves exact offsets into fullText. (brain.md §3)
 */
export function splitLargeSegments(
  segments: RawSegment[],
  fullText: string
): RawSegment[] {
  const result: RawSegment[] = [];

  for (const segment of segments) {
    if (estimateTokens(segment.text) <= MAX_TOKENS_PER_CLAUSE) {
      result.push(segment);
      continue;
    }

    // Large segment needing splitting
    const start = segment.startOffset;
    const end = segment.endOffset;
    const segmentRaw = fullText.slice(start, end);

    // Sentence splitting regex: matches period/question/exclamation followed by whitespace and capital letter
    const sentenceBoundaryRegex = /([.!?])\s+(?=[A-Z0-9"'])/g;
    const boundaryIndices: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = sentenceBoundaryRegex.exec(segmentRaw)) !== null) {
      // Offset within segmentRaw right after the punctuation and whitespace
      const splitPoint = match.index + match[1]!.length;
      boundaryIndices.push(splitPoint);
    }

    if (boundaryIndices.length === 0) {
      // Fallback: split at newline or comma if no sentence boundaries found
      const fallbackRegex = /\n+/g;
      while ((match = fallbackRegex.exec(segmentRaw)) !== null) {
        boundaryIndices.push(match.index + match[0].length);
      }
    }

    if (boundaryIndices.length === 0) {
      // Cannot split cleanly without breaking words, retain original
      result.push(segment);
      continue;
    }

    let chunkStart = 0;
    let partNumber = 1;

    for (let i = 0; i < boundaryIndices.length; i++) {
      const boundary = boundaryIndices[i]!;
      const chunkLength = boundary - chunkStart;

      // When accumulated chunk exceeds target or it's the last boundary with enough content
      if (chunkLength >= MAX_CHARS_PER_CLAUSE * 0.7 || (i === boundaryIndices.length - 1 && chunkLength > 0)) {
        const subStart = start + chunkStart;
        const subEnd = start + boundary;
        const subText = fullText.slice(subStart, subEnd).trim();

        if (subText.length > 0) {
          result.push({
            heading: segment.heading ? `${segment.heading} (Part ${partNumber})` : undefined,
            startOffset: subStart,
            endOffset: subEnd,
            text: subText,
          });
          partNumber++;
          chunkStart = boundary;
        }
      }
    }

    // Trailing chunk if any
    if (chunkStart < segmentRaw.length) {
      const subStart = start + chunkStart;
      const subEnd = end;
      const subText = fullText.slice(subStart, subEnd).trim();

      if (subText.length > 0) {
        result.push({
          heading: segment.heading ? `${segment.heading} (Part ${partNumber})` : undefined,
          startOffset: subStart,
          endOffset: subEnd,
          text: subText,
        });
      }
    }
  }

  return result;
}

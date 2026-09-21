/**
 * Heading and boundary heuristics for legal document segmentation. (brain.md §3, code-structure.md §1)
 */

export interface RawSegment {
  heading?: string | undefined;
  startOffset: number;
  endOffset: number;
  text: string;
}

/** Heading regexes matching standard legal structures */
const HEADING_PATTERNS = [
  // 1. Article / Section / Clause prefixes: "ARTICLE 1", "Section 2.1", "Clause 4:"
  /^\s*(ARTICLE|Article|SECTION|Section|CLAUSE|Clause|SCHEDULE|Schedule|EXHIBIT|Exhibit)\s+([0-9IVXLCDM]+|[A-Z])([:.\s\-]+(.*))?$/i,

  // 2. Numbered headings: "1. PREMISES", "1.1 Rent", "1) Deposit", "2 - TERM"
  /^\s*(\d+(\.\d+)*)[.\s\-\)]+\s*([A-Za-z0-9&/'" \-–—]{2,80})$/,

  // 3. Parenthesized numbers/letters: "(1) Term", "(a) Subletting", "(i) Payments"
  /^\s*\(([0-9]+|[a-zA-Z]|[ivxlcdmIVXLCDM]+)\)\s+([A-Za-z0-9&/'" \-–—]{2,80})$/,

  // 4. Roman numeral headings: "I. PREMISES", "IV. GOVERNING LAW"
  /^\s*([IVXLCDM]+)[.\s\-\)]+\s+([A-Za-z0-9&/'" \-–—]{2,80})$/,

  // 5. Lettered headings: "A. PREMISES", "B. TERM"
  /^\s*([A-Z])[.\s\-\)]+\s+([A-Za-z0-9&/'" \-–—]{2,80})$/,

  // 6. Recitals / Preamble keywords
  /^\s*(RECITALS|Recitals|WITNESSETH|Witnesseth|WHEREAS|Whereas|NOW, THEREFORE|Now, Therefore)[:.\s\-]*$/i,
];

/**
 * Check if a line appears to be an ALL-CAPS heading.
 * e.g., "RESIDENTIAL LEASE AGREEMENT", "LIMITATION OF LIABILITY"
 */
function isAllCapsHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 70) return false;
  // Must not end in a period, comma, or semicolon (which indicates a sentence)
  if (/[.,;:]$/.test(trimmed)) return false;

  // Words count: headings are usually 1 to 8 words
  const words = trimmed.split(/\s+/);
  if (words.length > 8) return false;

  // Check if uppercase letters dominate and contains letters
  const hasLetters = /[A-Z]/.test(trimmed);
  const isUpper = trimmed === trimmed.toUpperCase();
  return hasLetters && isUpper;
}

/**
 * Check if a line matches any heading pattern.
 */
export function matchHeading(line: string): { isHeading: boolean; headingText?: string } {
  const trimmed = line.trim();
  if (!trimmed) return { isHeading: false };

  for (const pattern of HEADING_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isHeading: true, headingText: trimmed };
    }
  }

  if (isAllCapsHeading(trimmed)) {
    return { isHeading: true, headingText: trimmed };
  }

  return { isHeading: false };
}

/**
 * Scan normalized text and find raw candidate segments based on headings.
 * If no formal headings are detected, falls back to paragraph boundaries (\n\n).
 */
export function identifyCandidateSegments(normalizedText: string): RawSegment[] {
  if (!normalizedText.trim()) {
    return [];
  }

  const lines = normalizedText.split("\n");
  const headingIndices: Array<{
    lineIndex: number;
    charOffset: number;
    headingText?: string | undefined;
  }> = [];

  let currentOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineTrimmed = line.trim();

    if (lineTrimmed.length > 0) {
      const { isHeading, headingText } = matchHeading(lineTrimmed);
      if (isHeading) {
        headingIndices.push({
          lineIndex: i,
          charOffset: currentOffset,
          headingText,
        });
      }
    }

    // Account for line length + newline character
    currentOffset += line.length + 1;
  }

  // If at least 2 headings found, segment by headings
  if (headingIndices.length >= 2) {
    const segments: RawSegment[] = [];

    // Check if there is text before the first heading (preamble / title)
    const firstHeading = headingIndices[0]!;
    if (firstHeading.charOffset > 0) {
      const preambleText = normalizedText.slice(0, firstHeading.charOffset).trim();
      if (preambleText.length > 0) {
        segments.push({
          heading: "Preamble",
          startOffset: 0,
          endOffset: firstHeading.charOffset,
          text: preambleText,
        });
      }
    }

    for (let i = 0; i < headingIndices.length; i++) {
      const current = headingIndices[i]!;
      const next = headingIndices[i + 1];
      const start = current.charOffset;
      const end = next ? next.charOffset : normalizedText.length;
      const segmentText = normalizedText.slice(start, end).trim();

      if (segmentText.length > 0) {
        segments.push({
          heading: current.headingText,
          startOffset: start,
          endOffset: end,
          text: segmentText,
        });
      }
    }

    return segments;
  }

  // Fallback: Segment by double-newline paragraph blocks (\n\n)
  const paragraphRegex = /\n\s*\n+/g;
  const segments: RawSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = paragraphRegex.exec(normalizedText)) !== null) {
    const textChunk = normalizedText.slice(lastIndex, match.index).trim();
    if (textChunk.length > 0) {
      segments.push({
        startOffset: lastIndex,
        endOffset: match.index,
        text: textChunk,
      });
    }
    lastIndex = paragraphRegex.lastIndex;
  }

  const trailingChunk = normalizedText.slice(lastIndex).trim();
  if (trailingChunk.length > 0) {
    segments.push({
      startOffset: lastIndex,
      endOffset: normalizedText.length,
      text: trailingChunk,
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          startOffset: 0,
          endOffset: normalizedText.length,
          text: normalizedText.trim(),
        },
      ];
}

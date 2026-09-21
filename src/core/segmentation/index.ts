import { Clause, clauseSchema } from "@/core/domain";
import { ParsedDocument, RawPage } from "@/core/parsing";
import { identifyCandidateSegments } from "./heuristics";
import { mergeTinyFragments } from "./merge";
import { splitLargeSegments, estimateTokens } from "./split";

export * from "./heuristics";
export * from "./merge";
export * from "./split";

/**
 * Determine page numbers overlapping with a [startOffset, endOffset] range.
 */
function findPagesForRange(pages: RawPage[], start: number, end: number): number[] {
  if (pages.length === 0) return [1];

  const matchingPages: number[] = [];
  for (const page of pages) {
    // Check if range overlaps with page [page.startOffset, page.endOffset]
    const overlaps = Math.max(start, page.startOffset) < Math.min(end, page.endOffset);
    if (overlaps) {
      matchingPages.push(page.pageNumber);
    }
  }

  return matchingPages.length > 0 ? matchingPages : [1];
}

/**
 * Segment normalized document text into an ordered array of Clauses.
 * Pure deterministic pipeline — no LLM calls. (brain.md §3)
 */
export function segmentText(
  normalizedText: string,
  rawPages: RawPage[] = []
): Clause[] {
  if (!normalizedText.trim()) {
    return [];
  }

  // 1. Identify raw candidate segments via legal heading heuristics
  const candidates = identifyCandidateSegments(normalizedText);

  // 2. Merge tiny fragments (< 50 chars)
  const merged = mergeTinyFragments(candidates, normalizedText);

  // 3. Split oversized clauses (> 1,200 tokens) at sentence boundaries
  const finalizedSegments = splitLargeSegments(merged, normalizedText);

  // 4. Construct validated Clause objects with stable C1..Cn IDs
  const clauses: Clause[] = [];

  for (let i = 0; i < finalizedSegments.length; i++) {
    const seg = finalizedSegments[i]!;
    const rawSlice = normalizedText.slice(seg.startOffset, seg.endOffset);

    // Tighten offsets to non-whitespace bounds so slice exactly matches text
    const leadingWs = rawSlice.length - rawSlice.trimStart().length;
    const trailingWs = rawSlice.length - rawSlice.trimEnd().length;

    const startOffset = seg.startOffset + leadingWs;
    const endOffset = Math.max(startOffset + 1, seg.endOffset - trailingWs);
    const text = normalizedText.slice(startOffset, endOffset);

    if (!text.trim()) continue;

    const clauseIndex = clauses.length + 1;
    const clauseId = `C${clauseIndex}` as const;
    const pages = findPagesForRange(rawPages, startOffset, endOffset);
    const tokenEstimate = estimateTokens(text);

    const clauseData: Clause = {
      id: clauseId,
      index: clauseIndex,
      ...(seg.heading ? { heading: seg.heading } : {}),
      text,
      startOffset,
      endOffset,
      pages,
      tokenEstimate,
    };

    // Validate with domain schema
    const parseResult = clauseSchema.safeParse(clauseData);
    if (parseResult.success) {
      clauses.push(parseResult.data);
    } else {
      // Invariant: should never happen given our type construction
      throw new Error(
        `Internal segmenter error: Clause ${clauseId} failed schema validation: ${parseResult.error.message}`
      );
    }
  }

  return clauses;
}

/**
 * Segment a ParsedDocument into an ordered array of validated Clauses.
 */
export function segmentDocument(doc: ParsedDocument): Clause[] {
  return segmentText(doc.normalizedText, doc.pages);
}

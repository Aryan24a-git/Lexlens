import { RawPage } from "./types";

/**
 * Remove zero-width characters, normalize special unicode spaces,
 * and standardize line breaks to \n.
 */
export function sanitizeUnicode(text: string): string {
  return (
    text
      // Strip BOM and zero-width characters
      .replace(/[\uFEFF\u200B\u200C\u200D\u200E\u200F\u00AD]/g, "")
      // Convert non-breaking and special unicode spaces to normal space
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
      // Standardize Windows / Mac linebreaks
      .replace(/\r\n|\r/g, "\n")
  );
}

/**
 * Fix line-break hyphenation where words were broken across lines (e.g. "obli-\ngation" -> "obligation").
 */
export function fixHyphenation(text: string): string {
  // Matches a word part ending with hyphen, followed by line break, optional indent, and lower-case word continuation
  return text.replace(/([a-zA-Z]{2,})-\n[ \t]*([a-z]{2,})/g, "$1$2");
}

/**
 * Standardize whitespace:
 * - Strip trailing spaces from each line
 * - Collapse 3 or more consecutive newlines to 2 newlines
 * - Strip leading/trailing document whitespace
 */
export function cleanWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Regex patterns that identify common page numbers / footer lines */
const PAGE_NUMBER_REGEXES = [
  /^(page\s+)?\d+(\s*(of|\/)\s*\d+)?$/i,
  /^[-—–]\s*\d+\s*[-—–]$/,
  /^\d+$/
];

function isLikelyPageNumberLine(line: string): boolean {
  const trimmed = line.trim();
  return PAGE_NUMBER_REGEXES.some((rx) => rx.test(trimmed));
}

/**
 * Detect repeated header and footer lines across multiple pages and strip them.
 */
export function stripRepeatedHeadersFooters(
  pageTexts: string[]
): string[] {
  if (pageTexts.length < 2) {
    return pageTexts;
  }

  // Extract candidate headers (first 2 non-empty lines) and footers (last 2 non-empty lines)
  const headerCounts = new Map<string, number>();
  const footerCounts = new Map<string, number>();

  const parsedPagesLines = pageTexts.map((text) =>
    text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
  );

  for (const lines of parsedPagesLines) {
    if (lines.length === 0) continue;
    
    // First line candidate
    const firstLine = lines[0];
    if (firstLine && !isLikelyPageNumberLine(firstLine)) {
      headerCounts.set(firstLine, (headerCounts.get(firstLine) || 0) + 1);
    }
    // Last line candidate
    const lastLine = lines[lines.length - 1];
    if (lastLine && !isLikelyPageNumberLine(lastLine)) {
      footerCounts.set(lastLine, (footerCounts.get(lastLine) || 0) + 1);
    }
  }

  const threshold = Math.max(2, Math.floor(pageTexts.length * 0.45));
  const repeatedHeaders = new Set<string>();
  const repeatedFooters = new Set<string>();

  headerCounts.forEach((count, line) => {
    if (count >= threshold && line.length > 3) {
      repeatedHeaders.add(line);
    }
  });

  footerCounts.forEach((count, line) => {
    if (count >= threshold && line.length > 3) {
      repeatedFooters.add(line);
    }
  });

  return pageTexts.map((text) => {
    const rawLines = text.split("\n");
    const filtered = rawLines.filter((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) return true;

      // Filter out standalone page numbers
      if (isLikelyPageNumberLine(line)) {
        return false;
      }

      // Check header matches near top of page (first 3 lines)
      if (idx < 3 && repeatedHeaders.has(line)) {
        return false;
      }

      // Check footer matches near bottom of page (last 3 lines)
      if (idx >= rawLines.length - 3 && repeatedFooters.has(line)) {
        return false;
      }

      return true;
    });

    return filtered.join("\n");
  });
}

/**
 * Normalizes multi-page document text while preserving an exact character offset map to pages.
 */
export function normalizePages(
  rawPages: Array<{ pageNumber: number; text: string }>
): { normalizedText: string; pages: RawPage[] } {
  if (rawPages.length === 0) {
    return { normalizedText: "", pages: [] };
  }

  // 1. Initial sanitization per page
  const sanitized = rawPages.map((p) => sanitizeUnicode(p.text));

  // 2. Strip repeated headers and footers across pages
  const headerCleaned = stripRepeatedHeadersFooters(sanitized);

  // 3. Fix hyphenation and clean whitespace per page
  const cleanedPages: string[] = headerCleaned.map((text) => {
    const unhyphenated = fixHyphenation(text);
    return cleanWhitespace(unhyphenated);
  });

  // 4. Stitch pages together, tracking accurate character offsets
  const pages: RawPage[] = [];
  let fullText = "";

  cleanedPages.forEach((pageContent, idx) => {
    const pageNumber = rawPages[idx]?.pageNumber ?? idx + 1;
    if (fullText.length > 0 && pageContent.length > 0) {
      fullText += "\n\n";
    }

    const startOffset = fullText.length;
    fullText += pageContent;
    const endOffset = fullText.length;

    pages.push({
      pageNumber,
      text: pageContent,
      startOffset,
      endOffset,
    });
  });

  return {
    normalizedText: fullText,
    pages,
  };
}

/**
 * Convenience single-text normalizer.
 */
export function normalizeText(text: string): string {
  const sanitized = sanitizeUnicode(text);
  const unhyphenated = fixHyphenation(sanitized);
  return cleanWhitespace(unhyphenated);
}

/**
 * Find page number for a given character offset in normalized text.
 */
export function getPageForOffset(pages: RawPage[], offset: number): number {
  if (pages.length === 0) return 1;
  for (const page of pages) {
    if (offset >= page.startOffset && offset <= page.endOffset) {
      return page.pageNumber;
    }
  }
  const lastPage = pages[pages.length - 1];
  return lastPage ? lastPage.pageNumber : 1;
}

/**
 * Calculate approximate word count.
 */
export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

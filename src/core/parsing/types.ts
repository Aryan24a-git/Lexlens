/**
 * Parsing types and limit constants. (code-structure.md §1, security.md §5)
 */

export type FileType = "pdf" | "docx" | "txt";

export interface RawPage {
  /** 1-indexed page number */
  pageNumber: number;
  /** Raw text extracted from this page */
  text: string;
  /** Start character offset in normalized full text */
  startOffset: number;
  /** End character offset in normalized full text */
  endOffset: number;
}

export interface ParsedDocument {
  /** Name of the input file or synthetic label */
  fileName: string;
  /** Detected file type */
  fileType: FileType;
  /** Byte size of original input */
  fileSize: number;
  /** Raw text before normalization */
  rawText: string;
  /** Normalized text ready for segmentation */
  normalizedText: string;
  /** Number of pages (at least 1 for TXT/DOCX) */
  pageCount: number;
  /** Per-page boundaries and offsets */
  pages: RawPage[];
  /** Approximate word count */
  wordCount: number;
}

export interface ParseOptions {
  maxSizeBytes?: number;
  maxPages?: number;
  maxWords?: number;
}

/** Security & parsing guardrails (security.md §5) */
export const PARSING_LIMITS = {
  /** 10 MB file size ceiling */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Maximum supported pages */
  MAX_PAGES: 150,
  /** Maximum word count (~150k words) */
  MAX_WORDS: 150_000,
} as const;

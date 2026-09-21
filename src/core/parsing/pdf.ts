import { Result, ok, err, makeError } from "@/lib/result";
import { ParsedDocument, ParseOptions, PARSING_LIMITS } from "./types";
import { normalizePages, countWords } from "./normalize";

export interface PdfParseOptions extends ParseOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Configure worker for pdfjs in browser vs test/server environments.
 */
async function getPdfJs() {
  let pdfjs;
  // If Uint8Array.prototype.toHex is missing (Node, JSDOM, or browsers without ES2024 toHex), use legacy build
  const hasToHex = typeof (Uint8Array.prototype as unknown as { toHex?: unknown }).toHex === "function";
  if (!hasToHex) {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } else {
    try {
      pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    } catch {
      pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    }
  }

  // In browser context, configure the web worker
  if (
    typeof window !== "undefined" &&
    !pdfjs.GlobalWorkerOptions.workerSrc
  ) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    } catch {
      // Fallback: worker stays default or disabled
    }
  }

  return pdfjs;
}

/**
 * Parse a PDF document using pdfjs-dist.
 * Runs client-side in a Web Worker (or Node in tests). (security.md §5)
 */
export async function parsePdf(
  input: ArrayBuffer | Uint8Array,
  fileName = "document.pdf",
  options: PdfParseOptions = {}
): Promise<Result<ParsedDocument>> {
  const maxBytes = options.maxSizeBytes ?? PARSING_LIMITS.MAX_FILE_SIZE_BYTES;
  const maxPages = options.maxPages ?? PARSING_LIMITS.MAX_PAGES;
  const maxWords = options.maxWords ?? PARSING_LIMITS.MAX_WORDS;

  const byteLength = input.byteLength;
  if (byteLength > maxBytes) {
    return err(
      makeError(
        "FILE_TOO_LARGE",
        "This file is over 10 MB. Split it or paste the sections you need."
      )
    );
  }

  const data = input instanceof Uint8Array ? input : new Uint8Array(input);

  try {
    const pdfjs = await getPdfJs();

    // Load PDF document with security hardening
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    if (numPages > maxPages) {
      return err(
        makeError(
          "FILE_TOO_LARGE",
          `This document has ${numPages} pages, which exceeds the limit of ${maxPages} pages.`
        )
      );
    }

    if (numPages === 0) {
      return err(
        makeError(
          "PARSE_FAILED",
          "The PDF document contains 0 pages."
        )
      );
    }

    const rawPages: Array<{ pageNumber: number; text: string }> = [];
    let totalExtractedChars = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Collect strings from textContent items
      const strings: string[] = [];
      for (const item of textContent.items) {
        if ("str" in item && typeof item.str === "string") {
          strings.push(item.str);
        }
      }

      const pageText = strings.join(" ");
      totalExtractedChars += pageText.replace(/\s+/g, "").length;

      rawPages.push({
        pageNumber: pageNum,
        text: pageText,
      });

      if (options.onProgress) {
        options.onProgress(pageNum / numPages);
      }
    }

    // Scanned PDF detection: if total non-whitespace chars < 20 or average words < 3 per page
    const totalWords = rawPages.reduce(
      (acc, p) => acc + countWords(p.text),
      0
    );
    const avgWordsPerPage = totalWords / numPages;

    if (totalExtractedChars < 20 || (numPages > 1 && avgWordsPerPage < 3)) {
      return err(
        makeError(
          "FILE_SCANNED",
          "This PDF has no selectable text, so it may be a scan. Run text recognition to read it. It stays on your device."
        )
      );
    }

    if (totalWords > maxWords) {
      return err(
        makeError(
          "FILE_TOO_LARGE",
          `Document contains ~${totalWords.toLocaleString()} words, exceeding the limit of ${maxWords.toLocaleString()} words.`
        )
      );
    }

    const { normalizedText, pages } = normalizePages(rawPages);
    const rawText = rawPages.map((p) => p.text).join("\n\n");

    return ok({
      fileName,
      fileType: "pdf",
      fileSize: byteLength,
      rawText,
      normalizedText,
      pageCount: pages.length,
      pages,
      wordCount: countWords(normalizedText),
    });
  } catch (error: unknown) {
    // Check if error is password protected / encrypted
    const errObj = error as { name?: string; message?: string };
    const errName = errObj?.name ?? "";
    const errMsg = errObj?.message?.toLowerCase() ?? "";

    if (
      errName === "PasswordException" ||
      errMsg.includes("password") ||
      errMsg.includes("encrypted")
    ) {
      return err(
        makeError(
          "FILE_ENCRYPTED",
          "This PDF is password-protected. Remove the password to analyze it."
        )
      );
    }

    return err(
      makeError(
        "PARSE_FAILED",
        "Failed to read the PDF file. Please ensure it is not damaged or corrupted.",
        false,
        error
      )
    );
  }
}

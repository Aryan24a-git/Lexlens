import * as mammoth from "mammoth";
import { Result, ok, err, makeError } from "@/lib/result";
import { ParsedDocument, ParseOptions, PARSING_LIMITS } from "./types";
import { normalizePages, countWords } from "./normalize";

/**
 * Parse a Word .docx file into a ParsedDocument using mammoth.
 * Runs in browser or node environment.
 */
export async function parseDocx(
  input: ArrayBuffer | Uint8Array,
  fileName = "document.docx",
  options: ParseOptions = {}
): Promise<Result<ParsedDocument>> {
  const maxBytes = options.maxSizeBytes ?? PARSING_LIMITS.MAX_FILE_SIZE_BYTES;
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

  // Ensure ArrayBuffer format for mammoth
  let arrayBuffer: ArrayBuffer;
  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(input);
    arrayBuffer = copy.buffer;
  } else {
    arrayBuffer = input;
  }

  try {
    const isNode = typeof Buffer !== "undefined";
    const inputUint8 = input instanceof Uint8Array ? input : new Uint8Array(input);
    const mammothOptions = isNode
      ? { buffer: Buffer.from(inputUint8) }
      : { arrayBuffer };

    const { value: rawText } = await mammoth.extractRawText(mammothOptions);

    if (!rawText || !rawText.trim()) {
      return err(
        makeError(
          "PARSE_FAILED",
          "Could not extract any readable text from this Word document."
        )
      );
    }

    // Zip-bomb guard: check expansion ratio (security.md §5)
    const textBytes = new TextEncoder().encode(rawText).length;
    if (byteLength > 0 && textBytes / byteLength > 100 && textBytes > 5 * 1024 * 1024) {
      return err(
        makeError(
          "PARSE_FAILED",
          "This document has an unusually large expansion ratio and was rejected for safety."
        )
      );
    }

    const totalWords = countWords(rawText);
    if (totalWords > maxWords) {
      return err(
        makeError(
          "FILE_TOO_LARGE",
          `Document contains ~${totalWords.toLocaleString()} words, exceeding the limit of ${maxWords.toLocaleString()} words.`
        )
      );
    }

    // Page separation: mammoth doesn't retain printed pages, but may emit \f or form breaks
    const rawPageTexts = rawText.includes("\f")
      ? rawText.split("\f").filter((p) => p.trim().length > 0)
      : [rawText];

    const rawPages = rawPageTexts.map((text, idx) => ({
      pageNumber: idx + 1,
      text,
    }));

    const { normalizedText, pages } = normalizePages(rawPages);

    return ok({
      fileName,
      fileType: "docx",
      fileSize: byteLength,
      rawText,
      normalizedText,
      pageCount: pages.length,
      pages,
      wordCount: countWords(normalizedText),
    });
  } catch (error) {
    return err(
      makeError(
        "PARSE_FAILED",
        "Failed to read the Word document. Please ensure it is a valid .docx file.",
        false,
        error
      )
    );
  }
}

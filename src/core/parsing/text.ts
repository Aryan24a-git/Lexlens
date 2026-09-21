import { Result, ok, err, makeError } from "@/lib/result";
import { ParsedDocument, ParseOptions, PARSING_LIMITS } from "./types";
import { normalizePages, countWords } from "./normalize";

/**
 * Parse plain text or clipboard paste into a ParsedDocument.
 */
export function parseText(
  input: string | Uint8Array,
  fileName = "document.txt",
  options: ParseOptions = {}
): Result<ParsedDocument> {
  const maxBytes = options.maxSizeBytes ?? PARSING_LIMITS.MAX_FILE_SIZE_BYTES;
  const maxWords = options.maxWords ?? PARSING_LIMITS.MAX_WORDS;

  let rawString: string;
  let byteSize: number;

  if (typeof input === "string") {
    rawString = input;
    byteSize = new TextEncoder().encode(input).length;
  } else {
    byteSize = input.length;
    try {
      rawString = new TextDecoder("utf-8").decode(input);
    } catch (e) {
      return err(
        makeError("PARSE_FAILED", "Failed to decode text file as valid UTF-8.", false, e)
      );
    }
  }

  // Size limit check
  if (byteSize > maxBytes) {
    return err(
      makeError(
        "FILE_TOO_LARGE",
        "This file is over 10 MB. Split it or paste the sections you need."
      )
    );
  }

  if (!rawString.trim()) {
    return err(
      makeError(
        "PARSE_FAILED",
        "The document contains no readable text. Please provide text to analyze."
      )
    );
  }

  // Word count check
  const totalWords = countWords(rawString);
  if (totalWords > maxWords) {
    return err(
      makeError(
        "FILE_TOO_LARGE",
        `Document contains ~${totalWords.toLocaleString()} words, exceeding the limit of ${maxWords.toLocaleString()} words.`
      )
    );
  }

  // Form-feed page separation if present, otherwise single page
  const rawPageTexts = rawString.includes("\f")
    ? rawString.split("\f").filter((p) => p.trim().length > 0)
    : [rawString];

  const rawPages = rawPageTexts.map((text, idx) => ({
    pageNumber: idx + 1,
    text,
  }));

  const { normalizedText, pages } = normalizePages(rawPages);

  return ok({
    fileName,
    fileType: "txt",
    fileSize: byteSize,
    rawText: rawString,
    normalizedText,
    pageCount: pages.length,
    pages,
    wordCount: countWords(normalizedText),
  });
}

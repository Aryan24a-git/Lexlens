import { Result, err, makeError, AppError } from "@/lib/result";
import {
  ParsedDocument,
  parseDocument,
  PARSING_LIMITS,
} from "@/core/parsing";

export interface IngestOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Service to process uploaded Files or pasted text into a ParsedDocument.
 * Performs client-side reading and security checks.
 */
export async function ingestFile(
  file: File,
  options: IngestOptions = {}
): Promise<Result<ParsedDocument, AppError>> {
  if (file.size > PARSING_LIMITS.MAX_FILE_SIZE_BYTES) {
    return err(
      makeError(
        "FILE_TOO_LARGE",
        "This file is over 10 MB. Split it or paste the sections you need."
      )
    );
  }

  if (options.onProgress) {
    options.onProgress(0.1);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (options.onProgress) {
      options.onProgress(0.3);
    }

    const result = await parseDocument(arrayBuffer, file.name, {
      onProgress: (p) => {
        if (options.onProgress) {
          // Scale parse progress from 30% to 95%
          options.onProgress(0.3 + p * 0.65);
        }
      },
    });

    if (result.ok && options.onProgress) {
      options.onProgress(1.0);
    }

    return result;
  } catch (error) {
    return err(
      makeError(
        "PARSE_FAILED",
        "Unable to read this file from your device. Please try again or paste the text directly.",
        false,
        error
      )
    );
  }
}

/**
 * Service to process pasted text into a ParsedDocument.
 */
export async function ingestText(
  rawText: string,
  fileName = "Pasted Contract",
  options: IngestOptions = {}
): Promise<Result<ParsedDocument, AppError>> {
  if (options.onProgress) {
    options.onProgress(0.5);
  }

  const result = await parseDocument(rawText, fileName);

  if (result.ok && options.onProgress) {
    options.onProgress(1.0);
  }

  return result;
}

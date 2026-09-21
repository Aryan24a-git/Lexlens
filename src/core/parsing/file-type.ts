import { Result, ok, err, makeError } from "@/lib/result";
import { FileType } from "./types";

/**
 * Sniff file type from raw buffer magic bytes. (security.md §5)
 * PDF: starts with '%PDF' (0x25, 0x50, 0x44, 0x46)
 * DOCX: ZIP archive starting with PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
 * TXT: UTF-8 text without binary null bytes / control sequences
 */
export function detectFileType(
  buffer: Uint8Array,
  fileNameHint?: string
): Result<FileType> {
  if (buffer.length === 0) {
    // If empty, check filename hint or treat as text if named .txt
    if (fileNameHint && /\.txt$/i.test(fileNameHint)) {
      return ok("txt");
    }
    return err(
      makeError(
        "PARSE_FAILED",
        "The uploaded file is empty. Please select a valid document."
      )
    );
  }

  // 1. PDF Magic Bytes: %PDF
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 // F
  ) {
    return ok("pdf");
  }

  // Check if %PDF occurs in the first 1024 bytes (some PDFs have leading bytes/BOM)
  const headerSearchLimit = Math.min(buffer.length, 1024);
  for (let i = 0; i < headerSearchLimit - 4; i++) {
    if (
      buffer[i] === 0x25 &&
      buffer[i + 1] === 0x50 &&
      buffer[i + 2] === 0x44 &&
      buffer[i + 3] === 0x46
    ) {
      return ok("pdf");
    }
  }

  // 2. DOCX Magic Bytes: PK\x03\x04 (standard zip archive)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 && // P
    buffer[1] === 0x4b && // K
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return ok("docx");
  }

  // 3. Plain text check: verify no null bytes and valid UTF-8 encoding
  let isBinary = false;
  const inspectLimit = Math.min(buffer.length, 4096);

  for (let i = 0; i < inspectLimit; i++) {
    const byte = buffer[i];
    if (byte === 0x00) {
      isBinary = true;
      break;
    }
    // Check for non-printable control characters excluding \t (9), \n (10), \r (13)
    if (byte !== undefined && byte < 0x09 && byte !== 0x00) {
      isBinary = true;
      break;
    }
    if (byte !== undefined && byte > 0x0a && byte < 0x0d) {
      isBinary = true;
      break;
    }
    if (byte !== undefined && byte > 0x0e && byte < 0x1f && byte !== 0x1b) {
      isBinary = true;
      break;
    }
  }

  if (!isBinary) {
    try {
      // Test UTF-8 decoding
      const decoder = new TextDecoder("utf-8", { fatal: true });
      decoder.decode(buffer.subarray(0, inspectLimit));
      return ok("txt");
    } catch {
      // Fallback: If filename clearly ends with .txt, treat as txt
      if (fileNameHint && /\.txt$/i.test(fileNameHint)) {
        return ok("txt");
      }
    }
  }

  return err(
    makeError(
      "FILE_UNSUPPORTED",
      "Only PDF, Word (.docx), or plain text files are supported.",
      false
    )
  );
}

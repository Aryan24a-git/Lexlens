import { Result, err } from "@/lib/result";
import { ParsedDocument, FileType } from "./types";
import { detectFileType } from "./file-type";
import { parseText } from "./text";
import { parseDocx } from "./docx";
import { parsePdf, PdfParseOptions } from "./pdf";

export * from "./types";
export * from "./file-type";
export * from "./normalize";
export * from "./text";
export * from "./docx";
export * from "./pdf";

/**
 * Unified parser: sniffs input type and parses into a ParsedDocument.
 */
export async function parseDocument(
  input: Uint8Array | ArrayBuffer | string,
  fileName = "document",
  options: PdfParseOptions = {}
): Promise<Result<ParsedDocument>> {
  if (typeof input === "string") {
    return parseText(input, fileName, options);
  }

  const uint8 = input instanceof Uint8Array ? input : new Uint8Array(input);
  const typeResult = detectFileType(uint8, fileName);

  if (!typeResult.ok) {
    return err(typeResult.error);
  }

  const fileType: FileType = typeResult.value;

  switch (fileType) {
    case "pdf":
      return parsePdf(uint8, fileName, options);
    case "docx":
      return parseDocx(uint8, fileName, options);
    case "txt":
      return parseText(uint8, fileName, options);
  }
}

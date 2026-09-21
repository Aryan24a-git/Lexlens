"use client";

import { useState, useCallback } from "react";
import { AppError } from "@/lib/result";
import { ParsedDocument } from "@/core/parsing";
import { ingestFile, ingestText } from "../services/ingest-service";

export type IngestStatus = "idle" | "parsing" | "success" | "error";

export interface UseParseFileReturn {
  status: IngestStatus;
  progress: number;
  document: ParsedDocument | null;
  error: AppError | null;
  parse: (input: File | string, fileName?: string) => Promise<ParsedDocument | null>;
  reset: () => void;
}

/**
 * Hook to ingest a File or pasted text string with real-time progress and error handling. (design.md §11)
 */
export function useParseFile(): UseParseFileReturn {
  const [status, setStatus] = useState<IngestStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setDocument(null);
    setError(null);
  }, []);

  const parse = useCallback(
    async (input: File | string, fileName?: string): Promise<ParsedDocument | null> => {
      setStatus("parsing");
      setProgress(0.05);
      setError(null);

      const onProgress = (p: number) => {
        setProgress(Math.min(1.0, Math.max(0, p)));
      };

      try {
        const result =
          typeof input === "string"
            ? await ingestText(input, fileName ?? "Pasted Text", { onProgress })
            : await ingestFile(input, { onProgress });

        if (result.ok) {
          setDocument(result.value);
          setStatus("success");
          setProgress(1.0);
          return result.value;
        } else {
          setError(result.error);
          setStatus("error");
          setProgress(0);
          return null;
        }
      } catch (err: unknown) {
        const appErr: AppError = {
          code: "PARSE_FAILED",
          message:
            "An unexpected error occurred while parsing the document. Please try again.",
          retryable: true,
          cause: err,
        };
        setError(appErr);
        setStatus("error");
        setProgress(0);
        return null;
      }
    },
    []
  );

  return {
    status,
    progress,
    document,
    error,
    parse,
    reset,
  };
}

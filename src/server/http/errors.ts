import { NextResponse } from "next/server";
import type { AppError, ErrorCode } from "@/lib/result";

export const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  BODY_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  LLM_RATE_LIMITED: 429,
  LLM_TIMEOUT: 504,
  LLM_UNAVAILABLE: 503,
  LLM_SCHEMA_INVALID: 502,
  FILE_UNSUPPORTED: 415,
  FILE_TOO_LARGE: 413,
  FILE_ENCRYPTED: 422,
  FILE_SCANNED: 422,
  PARSE_FAILED: 422,
  SEGMENT_FAILED: 422,
  CITATION_UNVERIFIED: 422,
  INTERNAL_ERROR: 500,
};

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
  };
}

export function createErrorResponse(
  error: AppError,
  headers?: Record<string, string>
): NextResponse<ApiErrorResponse> {
  const status = HTTP_STATUS_MAP[error.code] ?? 500;
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
    },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
}

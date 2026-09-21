/**
 * Result type — used by all services and core functions. (D-002, code-structure §5)
 * Services return Result; throw only for programmer errors.
 */
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function isOk<T, E>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok;
}

export function isErr<T, E>(r: Result<T, E>): r is { ok: false; error: E } {
  return !r.ok;
}

/** Stable error codes used across the application */
export type ErrorCode =
  | "LLM_TIMEOUT"
  | "LLM_RATE_LIMITED"
  | "LLM_SCHEMA_INVALID"
  | "LLM_UNAVAILABLE"
  | "FILE_UNSUPPORTED"
  | "FILE_TOO_LARGE"
  | "FILE_ENCRYPTED"
  | "FILE_SCANNED"
  | "PARSE_FAILED"
  | "SEGMENT_FAILED"
  | "CITATION_UNVERIFIED"
  | "RATE_LIMITED"
  | "BODY_TOO_LARGE"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string; // user-facing, plain language
  retryable: boolean;
  cause?: unknown;
}

export function makeError(
  code: ErrorCode,
  message: string,
  retryable = false,
  cause?: unknown
): AppError {
  return { code, message, retryable, cause };
}

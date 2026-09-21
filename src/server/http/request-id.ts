/**
 * Request ID utility for HTTP requests.
 * Extracts x-request-id or generates a unique crypto UUID.
 */

export function getOrGenerateRequestId(headers?: Headers | null): string {
  if (headers) {
    const existing = headers.get("x-request-id");
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }
  }

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `req_${crypto.randomUUID()}`;
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

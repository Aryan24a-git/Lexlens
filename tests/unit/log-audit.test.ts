import { describe, it, expect, vi } from "vitest";
import { logApiMetrics, PrivacyLogMetadata } from "@/server/http/with-api";

describe("Server Log Redaction Audit (security.md §8)", () => {
  it("logs structured metadata without document, clause, or question text", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const metadata: PrivacyLogMetadata = {
      requestId: "req_test_12345",
      route: "/api/analyze",
      latencyMs: 342,
      status: 200,
      clauseCount: 14,
      model: "llama-3.3-70b-versatile",
      verifiedRatio: 1.0,
    };

    logApiMetrics(metadata);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedString = consoleSpy.mock.calls[0]?.[0] as string;

    // Must be prefixed with [API_METRIC]
    expect(loggedString).toContain("[API_METRIC]");

    const jsonStr = loggedString.replace("[API_METRIC] ", "");
    const parsed = JSON.parse(jsonStr);

    // Allowed metadata fields
    expect(parsed.requestId).toBe("req_test_12345");
    expect(parsed.route).toBe("/api/analyze");
    expect(parsed.latencyMs).toBe(342);
    expect(parsed.status).toBe(200);
    expect(parsed.clauseCount).toBe(14);
    expect(parsed.model).toBe("llama-3.3-70b-versatile");
    expect(parsed.verifiedRatio).toBe(1.0);
    expect(parsed.timestamp).toBeDefined();

    // STRICT PROHIBITIONS: No document text, clause text, question text, or raw user bodies
    expect(parsed).not.toHaveProperty("text");
    expect(parsed).not.toHaveProperty("clause");
    expect(parsed).not.toHaveProperty("clauses");
    expect(parsed).not.toHaveProperty("document");
    expect(parsed).not.toHaveProperty("question");
    expect(parsed).not.toHaveProperty("prompt");
    expect(parsed).not.toHaveProperty("body");
    expect(parsed).not.toHaveProperty("rawBody");

    consoleSpy.mockRestore();
  });
});

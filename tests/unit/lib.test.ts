import { describe, it, expect } from "vitest";
import { ok, err, isOk, isErr, makeError } from "@/lib/result";

describe("Result helpers", () => {
  it("ok() creates a success result", () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    expect(isOk(r)).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it("err() creates an error result", () => {
    const e = makeError("INTERNAL_ERROR", "Something went wrong", false);
    const r = err(e);
    expect(r.ok).toBe(false);
    expect(isErr(r)).toBe(true);
    if (!r.ok) {
      expect(r.error.code).toBe("INTERNAL_ERROR");
      expect(r.error.retryable).toBe(false);
    }
  });

  it("isOk / isErr are mutually exclusive", () => {
    const success = ok("hello");
    const failure = err(makeError("RATE_LIMITED", "Too many requests", true));
    expect(isOk(success) && !isErr(success)).toBe(true);
    expect(isErr(failure) && !isOk(failure)).toBe(true);
  });

  it("makeError preserves all fields", () => {
    const cause = new Error("underlying");
    const e = makeError("LLM_TIMEOUT", "Timed out", true, cause);
    expect(e.code).toBe("LLM_TIMEOUT");
    expect(e.message).toBe("Timed out");
    expect(e.retryable).toBe(true);
    expect(e.cause).toBe(cause);
  });
});

describe("cn utility", () => {
  it("merges classes and resolves Tailwind conflicts", async () => {
    const { cn } = await import("@/lib/utils");
    expect(cn("px-4", "px-6")).toBe("px-6"); // tailwind-merge resolves conflict
    expect(cn("text-sm", undefined, "font-medium")).toBe("text-sm font-medium");
  });
});

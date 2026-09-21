import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useParseFile } from "@/features/ingest/hooks/use-parse-file";

describe("features/ingest/useParseFile", () => {
  it("initializes with idle status and empty state", () => {
    const { result } = renderHook(() => useParseFile());

    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.document).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("parses valid text and transitions through status and progress to success", async () => {
    const { result } = renderHook(() => useParseFile());

    let parsedDoc;
    await act(async () => {
      parsedDoc = await result.current.parse(
        "1. DEFINITION\nThis is a sample agreement text.",
        "test-doc.txt"
      );
    });

    expect(result.current.status).toBe("success");
    expect(result.current.progress).toBe(1.0);
    expect(result.current.document).not.toBeNull();
    expect(result.current.document?.fileName).toBe("test-doc.txt");
    expect(result.current.document?.fileType).toBe("txt");
    expect(parsedDoc).toBe(result.current.document);
    expect(result.current.error).toBeNull();
  });

  it("sets error state when parsing invalid / empty input", async () => {
    const { result } = renderHook(() => useParseFile());

    await act(async () => {
      await result.current.parse("   ", "empty.txt");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.progress).toBe(0);
    expect(result.current.document).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.code).toBe("PARSE_FAILED");
  });

  it("resets state when reset() is called", async () => {
    const { result } = renderHook(() => useParseFile());

    await act(async () => {
      await result.current.parse("1. Test clause", "doc.txt");
    });
    expect(result.current.status).toBe("success");

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.progress).toBe(0);
    expect(result.current.document).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

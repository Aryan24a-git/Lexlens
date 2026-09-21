import { describe, it, expect } from "vitest";
import {
  clauseIdSchema,
  clauseSchema,
  citationSchema,
  clauseAnalysisSchema,
  legalDocumentSchema,
  answerSchema,
  analyzeRequestSchema,
} from "@/core/domain";
import { CLAUSE_TYPES, RISK_LEVELS, PERSPECTIVES } from "@/core/domain";

// ─── clauseId ───────────────────────────────────────────────────────────────
describe("clauseIdSchema", () => {
  it("accepts valid clause IDs", () => {
    expect(clauseIdSchema.parse("C1")).toBe("C1");
    expect(clauseIdSchema.parse("C99")).toBe("C99");
    expect(clauseIdSchema.parse("C123")).toBe("C123");
  });

  it("rejects invalid formats", () => {
    expect(() => clauseIdSchema.parse("c1")).toThrow();
    expect(() => clauseIdSchema.parse("1")).toThrow();
    expect(() => clauseIdSchema.parse("Clause1")).toThrow();
    expect(() => clauseIdSchema.parse("")).toThrow();
    expect(() => clauseIdSchema.parse("C0")).toThrow(); // 0 is not positive
  });
});

// ─── citation ────────────────────────────────────────────────────────────────
describe("citationSchema", () => {
  it("parses a valid citation", () => {
    const c = citationSchema.parse({
      clauseId: "C3",
      quote: "The tenant shall pay rent on the first day of each month.",
      verified: true,
    });
    expect(c.clauseId).toBe("C3");
    expect(c.verified).toBe(true);
  });

  it("defaults verified to false", () => {
    const c = citationSchema.parse({
      clauseId: "C1",
      quote: "some quote",
    });
    expect(c.verified).toBe(false);
  });

  it("rejects empty quote", () => {
    expect(() =>
      citationSchema.parse({ clauseId: "C1", quote: "" })
    ).toThrow();
  });
});

// ─── clause ─────────────────────────────────────────────────────────────────
describe("clauseSchema", () => {
  const validClause = {
    id: "C1",
    index: 1,
    text: "The tenant shall pay a monthly rent of $1,500 on the first of each month.",
    startOffset: 0,
    endOffset: 72,
    pages: [1],
  };

  it("parses a minimal valid clause", () => {
    const c = clauseSchema.parse(validClause);
    expect(c.id).toBe("C1");
    expect(c.pages).toEqual([1]);
  });

  it("accepts optional heading and tokenEstimate", () => {
    const c = clauseSchema.parse({
      ...validClause,
      heading: "Rent Payment",
      tokenEstimate: 42,
    });
    expect(c.heading).toBe("Rent Payment");
    expect(c.tokenEstimate).toBe(42);
  });

  it("rejects empty text", () => {
    expect(() => clauseSchema.parse({ ...validClause, text: "" })).toThrow();
  });

  it("rejects pages array with no entries", () => {
    expect(() => clauseSchema.parse({ ...validClause, pages: [] })).toThrow();
  });

  it("rejects negative startOffset", () => {
    expect(() =>
      clauseSchema.parse({ ...validClause, startOffset: -1 })
    ).toThrow();
  });
});

// ─── clauseAnalysis ──────────────────────────────────────────────────────────
describe("clauseAnalysisSchema", () => {
  const validAnalysis = {
    clauseId: "C5",
    canonicalType: "payment_fees" as const,
    plainSummary: "You must pay $1,500 on the first of every month.",
    risk: {
      level: "medium" as const,
      reasons: ["Late fees apply immediately with no grace period"],
      favors: "other_party" as const,
      unusual: false,
    },
    whyItMatters: "Missing one payment triggers penalty clauses.",
    questionsToAsk: ["Is there a grace period for late payments?"],
    confidence: 0.9,
    citations: [
      {
        clauseId: "C5",
        quote: "Tenant shall pay $1,500 on the first of each month.",
        verified: true,
      },
    ],
  };

  it("parses a valid clause analysis", () => {
    const a = clauseAnalysisSchema.parse(validAnalysis);
    expect(a.clauseId).toBe("C5");
    expect(a.risk.level).toBe("medium");
    expect(a.citations).toHaveLength(1);
  });

  it("rejects more than 3 questionsToAsk", () => {
    expect(() =>
      clauseAnalysisSchema.parse({
        ...validAnalysis,
        questionsToAsk: ["Q1", "Q2", "Q3", "Q4"],
      })
    ).toThrow();
  });

  it("rejects invalid canonicalType", () => {
    expect(() =>
      clauseAnalysisSchema.parse({
        ...validAnalysis,
        canonicalType: "not_a_real_type",
      })
    ).toThrow();
  });

  it("rejects confidence > 1", () => {
    expect(() =>
      clauseAnalysisSchema.parse({ ...validAnalysis, confidence: 1.5 })
    ).toThrow();
  });

  it("rejects empty citations array", () => {
    expect(() =>
      clauseAnalysisSchema.parse({ ...validAnalysis, citations: [] })
    ).toThrow();
  });
});

// ─── analyzeRequest ──────────────────────────────────────────────────────────
describe("analyzeRequestSchema", () => {
  const minimalClause = {
    id: "C1",
    index: 1,
    text: "This agreement governs the rental of the premises.",
    startOffset: 0,
    endOffset: 50,
    pages: [1],
  };

  it("parses a minimal valid request", () => {
    const req = analyzeRequestSchema.parse({
      clauses: [minimalClause],
      perspective: "tenant",
    });
    expect(req.perspective).toBe("tenant");
    expect(req.language).toBe("en");
  });

  it("rejects empty clauses array", () => {
    expect(() =>
      analyzeRequestSchema.parse({ clauses: [], perspective: "tenant" })
    ).toThrow();
  });

  it("rejects invalid perspective", () => {
    expect(() =>
      analyzeRequestSchema.parse({
        clauses: [minimalClause],
        perspective: "wizard",
      })
    ).toThrow();
  });
});

// ─── enum coverage ───────────────────────────────────────────────────────────
describe("enums completeness", () => {
  it("CLAUSE_TYPES contains expected key types", () => {
    expect(CLAUSE_TYPES).toContain("intellectual_property");
    expect(CLAUSE_TYPES).toContain("payment_fees");
    expect(CLAUSE_TYPES).toContain("other");
    expect(CLAUSE_TYPES.length).toBeGreaterThan(30);
  });

  it("RISK_LEVELS has 4 levels", () => {
    expect(RISK_LEVELS).toHaveLength(4);
    expect(RISK_LEVELS).toContain("high");
    expect(RISK_LEVELS).toContain("info");
  });

  it("PERSPECTIVES contains standard roles", () => {
    expect(PERSPECTIVES).toContain("tenant");
    expect(PERSPECTIVES).toContain("freelancer");
    expect(PERSPECTIVES).toContain("other");
  });
});

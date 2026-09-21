import { describe, it, expect } from "vitest";
import {
  createClauseSearchIndex,
  searchClauses,
  buildRetrievalContext,
  FULL_DOC_TOKEN_THRESHOLD,
} from "@/core/retrieval";
import type { Clause } from "@/core/domain/schemas";

describe("BM25 Retrieval & Context Builder", () => {
  const sampleClauses: Clause[] = [
    {
      id: "C1",
      index: 1,
      heading: "Definitions",
      text: "In this Agreement, 'Tenant' refers to John Doe and 'Landlord' refers to Real Property LLC.",
      startOffset: 0,
      endOffset: 95,
      pages: [1],
    },
    {
      id: "C2",
      index: 2,
      heading: "Rent and Payment",
      text: "Tenant shall pay monthly rent of $2,500 due on the first calendar day of each month.",
      startOffset: 96,
      endOffset: 180,
      pages: [1],
    },
    {
      id: "C3",
      index: 3,
      heading: "Security Deposit",
      text: "A refundable deposit of $2,500 is held in an escrow account at Chase Bank.",
      startOffset: 181,
      endOffset: 260,
      pages: [1],
    },
    {
      id: "C4",
      index: 4,
      heading: "Termination and Notice",
      text: "Either party may terminate this lease early by providing sixty (60) days advance written notice.",
      startOffset: 261,
      endOffset: 360,
      pages: [1],
    },
    {
      id: "C5",
      index: 5,
      heading: "Pet Policy",
      text: "No pets, dogs, or cats are allowed on the premises without prior written approval and a $500 pet fee.",
      startOffset: 361,
      endOffset: 465,
      pages: [1],
    },
  ];

  it("creates MiniSearch index and searches clauses", () => {
    const index = createClauseSearchIndex(sampleClauses);
    expect(index.documentCount).toBe(5);

    const hits = index.search("pet fee");
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0]?.id).toBe("C5");
  });

  it("indexes and retrieves clauses matching search terms with searchClauses", () => {
    const results = searchClauses(sampleClauses, "pet dog approval", 2);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.id).toBe("C5");
  });

  it("finds rent and payment clauses accurately", () => {
    const results = searchClauses(sampleClauses, "how much is monthly rent?", 2);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.id).toBe("C2");
  });

  it("returns full document when total tokens are below threshold", () => {
    const context = buildRetrievalContext(sampleClauses, "Can I have a cat?");
    expect(context.isTruncated).toBe(false);
    expect(context.clauses.length).toBe(sampleClauses.length);
  });

  it("performs Top-K retrieval with neighbours and definitions when exceeding token threshold", () => {
    // Force threshold = 50 tokens to test truncation & neighbour inclusion
    const context = buildRetrievalContext(sampleClauses, "early termination notice", 50);

    expect(context.isTruncated).toBe(true);
    const clauseIds = context.clauses.map((c) => c.id);
    // Should include hit C4
    expect(clauseIds).toContain("C4");
    // Should include definitions (C1) and/or neighbours (C3, C5)
    expect(clauseIds).toContain("C1");
    expect(clauseIds).toContain("C3");
  });
});

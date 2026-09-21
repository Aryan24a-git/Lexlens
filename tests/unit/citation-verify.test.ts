import { describe, it, expect } from "vitest";
import {
  normalizeQuote,
  isQuoteInText,
  verifyCitation,
  verifyClauseAnalysis,
  calculateVerifiedRatio,
} from "@/core/citations";
import type { Clause, ClauseAnalysis, Citation } from "@/core/domain/schemas";

describe("Citation Verifier (brain.md §8)", () => {
  const clause1Text = `The Tenant shall pay a monthly rent of $2,500.00 in advance on or before the first day of each calendar month. Late payments shall incur a fee of $100.00 after a 5-day grace period.`;

  const clause1: Clause = {
    id: "C1",
    index: 1,
    heading: "Rent & Fees",
    text: clause1Text,
    startOffset: 0,
    endOffset: clause1Text.length,
    pages: [1],
  };

  const clauseMap = new Map<string, Clause>([["C1", clause1]]);

  describe("Normalization & Matching", () => {
    it("verifies exact verbatim quote", () => {
      const cit: Citation = {
        clauseId: "C1",
        quote: "monthly rent of $2,500.00",
        verified: false,
      };
      const result = verifyCitation(cit, clauseMap);
      expect(result.verified).toBe(true);
    });

    it("handles fuzzy whitespace (tabs, newlines, multiple spaces)", () => {
      const cit: Citation = {
        clauseId: "C1",
        quote: "monthly   rent\n  of \t $2,500.00",
        verified: false,
      };
      const result = verifyCitation(cit, clauseMap);
      expect(result.verified).toBe(true);
    });

    it("normalizes smart quotes and standard quotes", () => {
      const textWithQuotes = `The Tenant agrees to "keep quiet hours" between 10:00 PM and 7:00 AM.`;
      const map = new Map<string, Clause>([
        [
          "C2",
          {
            id: "C2",
            index: 2,
            text: textWithQuotes,
            startOffset: 0,
            endOffset: textWithQuotes.length,
            pages: [1],
          },
        ],
      ]);

      // Smart quotes in the citation
      const cit: Citation = {
        clauseId: "C2",
        quote: `“keep quiet hours”`,
        verified: false,
      };
      expect(verifyCitation(cit, map).verified).toBe(true);
    });

    it("normalizes em-dashes and en-dashes", () => {
      const textWithDash = `Notice must be sent via email—certified mail is optional.`;
      const map = new Map<string, Clause>([
        [
          "C3",
          {
            id: "C3",
            index: 3,
            text: textWithDash,
            startOffset: 0,
            endOffset: textWithDash.length,
            pages: [1],
          },
        ],
      ]);

      // Regular hyphen in quote
      const cit: Citation = {
        clauseId: "C3",
        quote: `email-certified mail`,
        verified: false,
      };
      expect(verifyCitation(cit, map).verified).toBe(true);
    });

    it("matches quotes with a single ellipsis (...) in order", () => {
      const cit: Citation = {
        clauseId: "C1",
        quote: "monthly rent...first day of each calendar month",
        verified: false,
      };
      expect(verifyCitation(cit, clauseMap).verified).toBe(true);

      // Unicode ellipsis …
      const citUnicode: Citation = {
        clauseId: "C1",
        quote: "Late payments…5-day grace period",
        verified: false,
      };
      expect(verifyCitation(citUnicode, clauseMap).verified).toBe(true);
    });

    it("rejects ellipsis where second part comes before first part", () => {
      const citOutOfOrder: Citation = {
        clauseId: "C1",
        quote: "first day...monthly rent",
        verified: false,
      };
      expect(verifyCitation(citOutOfOrder, clauseMap).verified).toBe(false);
    });
  });

  describe("Rejection of Hallucinations / Fabrications (100% rejection requirement)", () => {
    it("rejects completely fabricated quote", () => {
      const cit: Citation = {
        clauseId: "C1",
        quote: "Landlord will pay for all utility expenses including heat",
        verified: false,
      };
      expect(verifyCitation(cit, clauseMap).verified).toBe(false);
    });

    it("rejects quote when clause ID does not exist in document", () => {
      const cit: Citation = {
        clauseId: "C999",
        quote: "monthly rent of $2,500.00",
        verified: false,
      };
      expect(verifyCitation(cit, clauseMap).verified).toBe(false);
    });

    it("rejects quote present in another clause but cited with wrong clause ID", () => {
      const map = new Map<string, Clause>([
        [
          "C1",
          {
            id: "C1",
            index: 1,
            text: "Clause one text about cats.",
            startOffset: 0,
            endOffset: 27,
            pages: [1],
          },
        ],
        [
          "C2",
          {
            id: "C2",
            index: 2,
            text: "Clause two text about dogs.",
            startOffset: 28,
            endOffset: 55,
            pages: [1],
          },
        ],
      ]);

      const citWrongId: Citation = {
        clauseId: "C1",
        quote: "text about dogs",
        verified: false,
      };
      expect(verifyCitation(citWrongId, map).verified).toBe(false);
    });

    it("rejects quote with multiple ellipses (anti-tamper policy)", () => {
      const citMultiEllipsis: Citation = {
        clauseId: "C1",
        quote: "monthly...rent...first day",
        verified: false,
      };
      expect(verifyCitation(citMultiEllipsis, clauseMap).verified).toBe(false);
    });
  });

  describe("ClauseAnalysis Verification & Ratio Metric", () => {
    it("updates citations inside ClauseAnalysis", () => {
      const analysis: ClauseAnalysis = {
        clauseId: "C1",
        canonicalType: "payment_fees",
        plainSummary: "Rent is $2500 due on the first.",
        risk: {
          level: "low",
          reasons: ["Clear terms."],
          favors: "balanced",
          unusual: false,
        },
        whyItMatters: "Payment obligation.",
        questionsToAsk: [],
        confidence: 1,
        citations: [
          { clauseId: "C1", quote: "monthly rent of $2,500.00", verified: false },
          { clauseId: "C1", quote: "fabricated nonexistent clause text", verified: false },
        ],
      };

      const verified = verifyClauseAnalysis(analysis, clauseMap);
      expect(verified.citations[0]?.verified).toBe(true);
      expect(verified.citations[1]?.verified).toBe(false);
    });

    it("computes verified ratio correctly", () => {
      const citations: Citation[] = [
        { clauseId: "C1", quote: "a", verified: true },
        { clauseId: "C1", quote: "b", verified: true },
        { clauseId: "C1", quote: "c", verified: false },
      ];
      expect(calculateVerifiedRatio(citations)).toBeCloseTo(2 / 3);

      expect(calculateVerifiedRatio([])).toBe(1.0);
    });
  });
});

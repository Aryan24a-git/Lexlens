import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { parseText } from "@/core/parsing";
import {
  segmentText,
  segmentDocument,
  matchHeading,
  estimateTokens,
} from "@/core/segmentation";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");

describe("core/segmentation", () => {
  describe("matchHeading heuristics", () => {
    it("matches standard numbered legal headings", () => {
      expect(matchHeading("1. PREMISES").isHeading).toBe(true);
      expect(matchHeading("2. TERM AND DURATION").isHeading).toBe(true);
      expect(matchHeading("14. ENTIRE AGREEMENT").isHeading).toBe(true);
      expect(matchHeading("1.1 Payment Schedule").isHeading).toBe(true);
    });

    it("matches Article and Section headings", () => {
      expect(matchHeading("ARTICLE I - DEFINITIONS").isHeading).toBe(true);
      expect(matchHeading("Section 4. Security Deposit").isHeading).toBe(true);
      expect(matchHeading("Clause 12. Indemnification").isHeading).toBe(true);
    });

    it("matches ALL-CAPS titles without terminal periods", () => {
      expect(matchHeading("RESIDENTIAL LEASE AGREEMENT").isHeading).toBe(true);
      expect(matchHeading("LIMITATION OF LIABILITY").isHeading).toBe(true);
      expect(matchHeading("MUTUAL NON-DISCLOSURE AGREEMENT").isHeading).toBe(true);
    });

    it("does not match ordinary prose ending in period", () => {
      expect(matchHeading("This is an ordinary sentence.").isHeading).toBe(false);
      expect(matchHeading("1. We will not treat full sentences with periods as bare headings.").isHeading).toBe(false);
    });
  });

  describe("Invariants on synthetic fixtures", () => {
    const fixtureExpectedClauses: Record<string, number> = {
      "lease-v1.txt": 14,
      "lease-v2.txt": 14,
      "freelance-agreement.txt": 10,
      "employment-offer.txt": 7,
      "nda.txt": 7,
      "terms-of-service.txt": 7,
    };

    for (const [fileName, expectedCount] of Object.entries(fixtureExpectedClauses)) {
      it(`segments ${fileName} into exactly ${expectedCount} clauses with valid invariants`, () => {
        const filePath = path.join(FIXTURES_DIR, fileName);
        const rawContent = fs.readFileSync(filePath, "utf-8");
        const parsed = parseText(rawContent, fileName);
        expect(parsed.ok).toBe(true);

        if (parsed.ok) {
          const clauses = segmentDocument(parsed.value);

          // 1. Expected clause count
          expect(clauses.length).toBe(expectedCount);

          // 2. Sequential stable IDs (C1, C2, ... Cn)
          for (let i = 0; i < clauses.length; i++) {
            const expectedId = `C${i + 1}`;
            expect(clauses[i]!.id).toBe(expectedId);
            expect(clauses[i]!.index).toBe(i + 1);
          }

          // 3. Slicing invariant: normalizedText.slice(startOffset, endOffset) === clause.text
          for (const clause of clauses) {
            const slice = parsed.value.normalizedText.slice(
              clause.startOffset,
              clause.endOffset
            );
            expect(slice).toBe(clause.text);
            expect(clause.text.length).toBeGreaterThan(0);
          }

          // 4. Idempotence: running segmentDocument twice produces identical result
          const secondRun = segmentDocument(parsed.value);
          expect(secondRun).toEqual(clauses);
        }
      });
    }
  });

  describe("mergeTinyFragments", () => {
    it("merges tiny fragments (< 50 chars) into adjacent segments", () => {
      const text = "SHORT\n\n1. FIRST CLAUSE\nThis is a sufficiently long clause text containing more than fifty characters to avoid merge.";
      const clauses = segmentText(text);

      expect(clauses.length).toBe(1);
      expect(clauses[0]!.text).toContain("SHORT");
      expect(clauses[0]!.text).toContain("FIRST CLAUSE");
    });
  });

  describe("splitLargeSegments", () => {
    it("estimates tokens correctly", () => {
      expect(estimateTokens("")).toBe(0);
      expect(estimateTokens("abcd")).toBe(1);
      expect(estimateTokens("abcdefgh")).toBe(2);
    });

    it("splits clauses exceeding 1,200 tokens at sentence boundaries", () => {
      // Build a long paragraph of ~6,000 characters (> 1,200 tokens)
      const sentence = "The tenant shall pay the landlord the required maintenance fee on the first day of each month. ";
      const longBody = sentence.repeat(65); // ~6,200 characters

      const input = `1. MAINTENANCE OBLIGATIONS\n${longBody}`;
      const clauses = segmentText(input);

      expect(clauses.length).toBeGreaterThan(1);
      for (const clause of clauses) {
        expect(estimateTokens(clause.text)).toBeLessThanOrEqual(1200);
      }
    });
  });

  describe("fallback paragraph segmentation", () => {
    it("segments unnumbered paragraphs by double newlines", () => {
      const unnumbered = `First natural paragraph discussing initial terms and scope of the contract.\n\nSecond paragraph outlining payment and compensation terms.\n\nThird paragraph providing governing law and jurisdiction details.`;
      const clauses = segmentText(unnumbered);

      expect(clauses.length).toBe(3);
      expect(clauses[0]!.id).toBe("C1");
      expect(clauses[1]!.id).toBe("C2");
      expect(clauses[2]!.id).toBe("C3");
    });
  });
});

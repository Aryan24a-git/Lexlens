import { describe, it, expect } from "vitest";
import {
  computeWordDiff,
  jaccardSimilarity,
  headingSimilarity,
  alignClauses,
} from "@/core/comparison";
import type { Clause } from "@/core/domain/schemas";
import { SAMPLE_DOCUMENTS } from "@/features/ingest";
import { parseText } from "@/core/parsing";
import { segmentDocument } from "@/core/segmentation";

describe("Comparison Engine — Alignment & Word Diffing", () => {
  describe("computeWordDiff", () => {
    it("detects identical text with 0 additions and 0 deletions", () => {
      const text = "Tenant shall pay rent of $2,000 per month.";
      const diff = computeWordDiff(text, text);

      expect(diff.stats.isIdentical).toBe(true);
      expect(diff.stats.wordsAdded).toBe(0);
      expect(diff.stats.wordsRemoved).toBe(0);
      expect(diff.ops.length).toBe(1);
      expect(diff.ops[0]?.value).toBe(text);
    });

    it("identifies word additions and deletions cleanly", () => {
      const textA = "Within fourteen (14) days after vacating.";
      const textB = "Within forty-five (45) days after vacating.";
      const diff = computeWordDiff(textA, textB);

      expect(diff.stats.isIdentical).toBe(false);
      expect(diff.stats.wordsAdded).toBeGreaterThan(0);
      expect(diff.stats.wordsRemoved).toBeGreaterThan(0);

      const addedText = diff.ops
        .filter((op) => op.added)
        .map((op) => op.value)
        .join("");
      const removedText = diff.ops
        .filter((op) => op.removed)
        .map((op) => op.value)
        .join("");

      expect(addedText).toContain("forty-five");
      expect(addedText).toContain("45");
      expect(removedText).toContain("fourteen");
      expect(removedText).toContain("14");
    });
  });

  describe("Similarity Scoring", () => {
    it("computes Jaccard similarity between word sets", () => {
      const score = jaccardSimilarity(
        "Tenant pays monthly rent of $2,000",
        "Tenant pays monthly rent of $2,500"
      );
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThan(1.0);
    });

    it("matches identical headings with high confidence", () => {
      expect(headingSimilarity("3. RENT & PAYMENTS", "3. RENT & PAYMENTS")).toBe(1.0);
      expect(headingSimilarity("RENT", "Rent & Payment")).toBeGreaterThan(0.5);
    });
  });

  describe("alignClauses", () => {
    it("aligns synthetic clauses detecting modified, added, and removed", () => {
      const clausesA: Clause[] = [
        {
          id: "A1",
          index: 1,
          heading: "Term",
          text: "Term is 12 months.",
          startOffset: 0,
          endOffset: 18,
          pages: [1],
        },
        {
          id: "A2",
          index: 2,
          heading: "Old Policy",
          text: "Tenant may smoke outdoors.",
          startOffset: 19,
          endOffset: 45,
          pages: [1],
        },
      ];

      const clausesB: Clause[] = [
        {
          id: "B1",
          index: 1,
          heading: "Term",
          text: "Term is 24 months.",
          startOffset: 0,
          endOffset: 18,
          pages: [1],
        },
        {
          id: "B2",
          index: 2,
          heading: "New Pet Policy",
          text: "No pets allowed without approval.",
          startOffset: 19,
          endOffset: 52,
          pages: [1],
        },
      ];

      const result = alignClauses(clausesA, clausesB);

      expect(result.stats.totalA).toBe(2);
      expect(result.stats.totalB).toBe(2);

      const modified = result.pairs.find((p) => p.a === "A1" && p.b === "B1");
      expect(modified).toBeDefined();
      expect(modified?.status).toBe("modified");

      const removed = result.pairs.find((p) => p.a === "A2");
      expect(removed).toBeDefined();
      expect(removed?.status).toBe("removed");

      const added = result.pairs.find((p) => p.b === "B2");
      expect(added).toBeDefined();
      expect(added?.status).toBe("added");
    });

    it("aligns golden Lease V1 vs Lease V2 and detects the planted changes", () => {
      const doc1 = SAMPLE_DOCUMENTS.find((d) => d.id === "lease-v1")!;
      const doc2 = SAMPLE_DOCUMENTS.find((d) => d.id === "lease-v2")!;

      const parsedA = parseText(doc1.content, "lease-v1.txt");
      const parsedB = parseText(doc2.content, "lease-v2.txt");

      expect(parsedA.ok).toBe(true);
      expect(parsedB.ok).toBe(true);
      if (!parsedA.ok || !parsedB.ok) return;

      const clausesA = segmentDocument(parsedA.value);
      const clausesB = segmentDocument(parsedB.value);

      expect(clausesA.length).toBe(14);
      expect(clausesB.length).toBe(14);

      const result = alignClauses(clausesA, clausesB);

      // 14 aligned pairs, 0 added, 0 removed
      expect(result.stats.addedCount).toBe(0);
      expect(result.stats.removedCount).toBe(0);
      expect(result.pairs.length).toBe(14);

      // The 5 key planted changes must all be identified as modified:
      const modifiedPairs = result.pairs.filter((p) => p.status === "modified");
      const modifiedBIds = modifiedPairs.map((p) => p.b);

      // C3 (Rent $2,200 -> $2,450, late fee $50 -> $125)
      expect(modifiedBIds).toContain("C3");
      // C4 (Deposit return 14 days -> 45 days, $350 deep clean fee)
      expect(modifiedBIds).toContain("C4");
      // C7 (Landlord entry 48h -> 12h, urgent entry without notice)
      expect(modifiedBIds).toContain("C7");
      // C8 (Subletting permitted with consent -> strictly prohibited non-curable default)
      expect(modifiedBIds).toContain("C8");
      // C11 (Month-to-month 30d -> 12 month auto-renewal 90d certified mail)
      expect(modifiedBIds).toContain("C11");

      // C2 (Term), C5 (Use), C6 (Repairs), C9 (Utilities), C10 (Default), C12 (Indemnity), C13 (Law), C14 (Entire agreement) must be unchanged
      const unchangedPairs = result.pairs.filter((p) => p.status === "unchanged");
      const unchangedBIds = unchangedPairs.map((p) => p.b);

      expect(unchangedBIds).toContain("C2");
      expect(unchangedBIds).toContain("C5");
      expect(unchangedBIds).toContain("C6");
      expect(unchangedBIds).toContain("C9");
      expect(unchangedBIds).toContain("C10");
      expect(unchangedBIds).toContain("C12");
      expect(unchangedBIds).toContain("C13");
      expect(unchangedBIds).toContain("C14");
    });
  });
});

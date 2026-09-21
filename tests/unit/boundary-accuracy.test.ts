import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { parseText } from "@/core/parsing";
import { segmentDocument } from "@/core/segmentation";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");

interface GoldenClause {
  id: string;
  index: number;
  heading?: string;
  startOffset: number;
  endOffset: number;
  text: string;
}

interface GoldenDocument {
  fileName: string;
  clauseCount: number;
  clauses: GoldenClause[];
}

/**
 * Calculate Jaccard similarity between two character ranges [startA, endA] and [startB, endB].
 */
function calculateRangeOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): number {
  const intersectionStart = Math.max(startA, startB);
  const intersectionEnd = Math.min(endA, endB);
  const intersection = Math.max(0, intersectionEnd - intersectionStart);

  const unionStart = Math.min(startA, startB);
  const unionEnd = Math.max(endA, endB);
  const union = Math.max(1, unionEnd - unionStart);

  return intersection / union;
}

describe("Clause boundary accuracy evaluation (target ≥ 90%)", () => {
  const goldenFiles = [
    "lease-v1.golden.json",
    "lease-v2.golden.json",
    "freelance-agreement.golden.json",
    "employment-offer.golden.json",
    "nda.golden.json",
    "terms-of-service.golden.json",
  ];

  let totalGoldenClauses = 0;
  let totalAccurateClauses = 0;

  for (const goldenFileName of goldenFiles) {
    it(`achieves ≥ 90% boundary accuracy on ${goldenFileName}`, () => {
      const goldenPath = path.join(FIXTURES_DIR, goldenFileName);
      const golden: GoldenDocument = JSON.parse(fs.readFileSync(goldenPath, "utf-8"));

      const txtPath = path.join(FIXTURES_DIR, golden.fileName);
      const rawText = fs.readFileSync(txtPath, "utf-8");
      const parsed = parseText(rawText, golden.fileName);
      expect(parsed.ok).toBe(true);

      if (!parsed.ok) return;

      const predictedClauses = segmentDocument(parsed.value);

      expect(predictedClauses.length).toBe(golden.clauseCount);

      let matchedInDoc = 0;
      for (const goldenClause of golden.clauses) {
        // Find best matching predicted clause by Jaccard overlap
        let bestOverlap = 0;
        for (const pred of predictedClauses) {
          const overlap = calculateRangeOverlap(
            goldenClause.startOffset,
            goldenClause.endOffset,
            pred.startOffset,
            pred.endOffset
          );
          if (overlap > bestOverlap) {
            bestOverlap = overlap;
          }
        }

        // Target: ≥ 90% overlap counts as accurate boundary match
        if (bestOverlap >= 0.90) {
          matchedInDoc++;
        }
      }

      const docAccuracy = (matchedInDoc / golden.clauses.length) * 100;
      totalGoldenClauses += golden.clauses.length;
      totalAccurateClauses += matchedInDoc;

      expect(docAccuracy).toBeGreaterThanOrEqual(90);
    });
  }

  it("achieves overall aggregate boundary accuracy ≥ 90% across all fixtures", () => {
    const aggregateAccuracy = (totalAccurateClauses / totalGoldenClauses) * 100;
    expect(aggregateAccuracy).toBeGreaterThanOrEqual(90);
    // Even higher: verify near perfect alignment
    expect(aggregateAccuracy).toBeGreaterThanOrEqual(98);
  });
});

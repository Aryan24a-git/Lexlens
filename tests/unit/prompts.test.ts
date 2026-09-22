import { describe, it, expect } from "vitest";
import {
  PREAMBLE_VERSION,
  buildPreamble,
  CLASSIFY_PROMPT_VERSION,
  classifyOutputSchema,
  buildClassifyPrompt,
  CLAUSE_ANALYSIS_PROMPT_VERSION,
  clauseBatchAnalysisSchema,
  buildClauseAnalysisPrompt,
  SYNTHESIS_PROMPT_VERSION,
  synthesisOutputSchema,
  buildSynthesisPrompt,
} from "@/core/prompts";
import type { Clause } from "@/core/domain/schemas";

describe("Prompts & Versions", () => {
  it("exports stable prompt version constants", () => {
    expect(PREAMBLE_VERSION).toBe("2026-09-20.1");
    expect(CLASSIFY_PROMPT_VERSION).toBe("2026-09-20.1");
    expect(CLAUSE_ANALYSIS_PROMPT_VERSION).toBe("2026-09-20.1");
    expect(SYNTHESIS_PROMPT_VERSION).toBe("2026-09-20.1");
  });

  describe("Preamble", () => {
    it("includes required hard rules and context parameters", () => {
      const preamble = buildPreamble({
        role: "tenant",
        roleDescription: "residential tenant",
        language: "en",
        docType: "lease_residential",
        jurisdiction: "California",
      });

      expect(preamble).toContain("You are LexLens Guide");
      expect(preamble).toContain("HARD RULES");
      expect(preamble).toContain("untrusted DATA");
      expect(preamble).toContain("VERBATIM quote");
      expect(preamble).toContain("tenant (residential tenant)");
      expect(preamble).toContain("California");
      expect(preamble).toContain(PREAMBLE_VERSION);
    });
  });

  describe("P0 Classify", () => {
    it("formats prompt with document snippet", () => {
      const prompt = buildClassifyPrompt({
        documentTextSnippet: "RESIDENTIAL LEASE AGREEMENT between Landlord and Tenant...",
      });
      expect(prompt).toContain("Classify the document below");
      expect(prompt).toContain("RESIDENTIAL LEASE AGREEMENT");
    });

    it("validates valid classification output", () => {
      const output = {
        docType: "lease_residential",
        parties: ["Alice Landlord", "Bob Tenant"],
        roles: ["tenant", "landlord"],
        language: "en",
        suggestedPerspective: "tenant",
      };
      expect(classifyOutputSchema.safeParse(output).success).toBe(true);
    });
  });

  describe("P2 Clause Analysis", () => {
    const sampleClauses: Clause[] = [
      {
        id: "C1",
        index: 1,
        heading: "Term",
        text: "The lease term shall commence on October 1, 2026.",
        startOffset: 0,
        endOffset: 50,
        pages: [1],
      },
    ];

    it("formats batch clause prompt with rubric", () => {
      const prompt = buildClauseAnalysisPrompt({
        role: "tenant",
        docType: "lease_residential",
        clauses: sampleClauses,
      });

      expect(prompt).toContain("[C1] <Term>");
      expect(prompt).toContain("The lease term shall commence on October 1, 2026.");
      expect(prompt).toContain("RISK RUBRIC");
      expect(prompt).toContain("tenant");
    });

    it("validates batch clause analysis schema", () => {
      const batchResult = {
        analyses: [
          {
            clauseId: "C1",
            canonicalType: "term_duration",
            plainSummary: "The lease begins on October 1, 2026.",
            obligations: [],
            rights: ["Possession from October 1, 2026"],
            risk: {
              level: "low",
              reasons: ["Standard lease commencement date."],
              favors: "balanced",
              unusual: false,
            },
            whyItMatters: "Sets the official start date of the tenancy.",
            questionsToAsk: [],
            confidence: 0.95,
            citations: [
              {
                clauseId: "C1",
                quote: "commence on October 1, 2026",
                verified: false,
              },
            ],
          },
        ],
      };

      expect(clauseBatchAnalysisSchema.safeParse(batchResult).success).toBe(true);
    });
  });

  describe("P3 Synthesis", () => {
    it("formats synthesis prompt with clause analyses summary", () => {
      const prompt = buildSynthesisPrompt({
        role: "tenant",
        docType: "lease_residential",
        clauses: [],
        clauseAnalyses: [
          {
            clauseId: "C1",
            canonicalType: "term_duration",
            plainSummary: "Lease term starts October 1.",
            obligations: [],
            rights: [],
            risk: {
              level: "low",
              reasons: ["Standard."],
              favors: "balanced",
              unusual: false,
            },
            whyItMatters: "Start date",
            questionsToAsk: [],
            confidence: 1,
            citations: [{ clauseId: "C1", quote: "October 1", verified: true }],
          },
        ],
      });

      expect(prompt).toContain("[C1] (term_duration, Risk: low, Favors: balanced)");
      expect(prompt).toContain("tldr");
      expect(prompt).toContain("keyFacts");
      expect(prompt).toContain("topRisks");
    });

    it("validates synthesis output schema", () => {
      const synthesisData = {
        docType: "lease_residential",
        parties: ["Alice", "Bob"],
        tldr: "A 1-year residential lease with monthly rent of $2,000.",
        keyFacts: [
          {
            label: "Monthly Rent",
            value: "$2,000",
            citations: [{ clauseId: "C1", quote: "$2,000", verified: true }],
          },
        ],
        topRisks: [
          {
            clauseId: "C1",
            headline: "Automatic renewal if 60-day notice is not provided",
            level: "high",
          },
        ],
        missingClauses: ["Notice period for landlord entry"],
        inconsistencies: [],
      };

      expect(synthesisOutputSchema.safeParse(synthesisData).success).toBe(true);
    });
  });
});

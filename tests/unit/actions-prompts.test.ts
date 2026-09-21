import { describe, it, expect } from "vitest";
import {
  ACTIONS_PROMPT_VERSION,
  buildChecklistPrompt,
  buildLawyerBriefPrompt,
  buildOptionsPrompt,
  buildNegotiatePrompt,
  checklistActionOutputSchema,
  lawyerBriefActionOutputSchema,
  optionsActionOutputSchema,
  negotiateActionOutputSchema,
} from "@/core/prompts";
import type { Clause, ClauseAnalysis } from "@/core/domain/schemas";

describe("P6 Actions Prompts & Schemas", () => {
  const sampleClauses: Clause[] = [
    {
      id: "C1",
      index: 1,
      heading: "Term of Lease",
      text: "The term of this lease shall commence on October 1, 2026 and continue for twelve (12) months.",
      startOffset: 0,
      endOffset: 95,
      pages: [1],
    },
    {
      id: "C2",
      index: 2,
      heading: "Security Deposit",
      text: "Tenant shall deposit $2,200 upon execution of this agreement. The deposit will be returned within 21 days of vacating.",
      startOffset: 96,
      endOffset: 215,
      pages: [1],
    },
    {
      id: "C3",
      index: 3,
      heading: "Early Termination",
      text: "Tenant may terminate early by giving 60 days advance written notice and paying a termination fee of two months rent.",
      startOffset: 216,
      endOffset: 335,
      pages: [1],
    },
  ];

  const sampleAnalyses: ClauseAnalysis[] = [
    {
      clauseId: "C3",
      clauseIndex: 3,
      type: "termination_convenience",
      plainSummary: "Early termination requires 60 days notice and a penalty of two months rent.",
      risk: {
        level: "high",
        reasons: ["Severe financial penalty of two months rent"],
      },
      favors: "other_party",
      confidence: 0.95,
      citations: [
        {
          clauseId: "C3",
          quote: "paying a termination fee of two months rent",
          verified: true,
        },
      ],
      promptVersion: "2026-09-20.1",
    },
  ];

  it("exports ACTIONS_PROMPT_VERSION", () => {
    expect(ACTIONS_PROMPT_VERSION).toBe("2026-09-20.1");
  });

  describe("Checklist Prompt", () => {
    it("builds checklist prompt containing clauses and role", () => {
      const prompt = buildChecklistPrompt({
        role: "tenant",
        docType: "lease_residential",
        clauses: sampleClauses,
      });

      expect(prompt).toContain("obligations, deadlines, and action items for tenant");
      expect(prompt).toContain("[C1]");
      expect(prompt).toContain("Security Deposit");
    });

    it("validates checklist schema output", () => {
      const validOutput = {
        items: [
          {
            item: "Pay security deposit of $2,200",
            owner: "you",
            due: "Upon execution of agreement",
            priority: "high",
            citation: {
              clauseId: "C2",
              quote: "Tenant shall deposit $2,200 upon execution",
              verified: false,
            },
          },
          {
            item: "Provide 60 days notice for early termination",
            owner: "you",
            due: "60 days prior to desired termination date",
            priority: "medium",
          },
        ],
      };

      const parsed = checklistActionOutputSchema.safeParse(validOutput);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Lawyer Brief Prompt", () => {
    it("builds lawyer brief prompt with document context and risks", () => {
      const prompt = buildLawyerBriefPrompt({
        role: "tenant",
        docType: "lease_residential",
        fileName: "Residential_Lease.pdf",
        clauses: sampleClauses,
        analyses: sampleAnalyses,
      });

      expect(prompt).toContain("Lawyer Brief preparing tenant");
      expect(prompt).toContain("Residential_Lease.pdf");
      expect(prompt).toContain("C3");
      expect(prompt).toContain("HIGH");
    });

    it("validates lawyer brief schema output", () => {
      const validBrief = {
        documentMeta: {
          fileName: "Lease.pdf",
          docType: "lease_residential",
          parties: ["Landlord LLC", "Tenant"],
          perspective: "tenant",
          generatedAt: new Date().toISOString(),
        },
        situationSummary: "12-month residential lease for an apartment with standard deposit and renewal terms.",
        topRisks: [
          {
            headline: "Heavy early termination penalty",
            clauseId: "C3",
            level: "high",
          },
        ],
        keyTerms: [
          {
            term: "Security Deposit",
            meaning: "$2,200 refundable within 21 days",
            clauseId: "C2",
          },
        ],
        openQuestions: ["Can early termination penalty be negotiated down?"],
        missingInfo: ["Property condition inspection checklist"],
        suggestedAgenda: ["Discuss termination penalty enforceability", "Review deposit return timelines"],
        disclaimer: "LexLens gives legal information, not legal advice.",
      };

      const parsed = lawyerBriefActionOutputSchema.safeParse(validBrief);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Options Prompt", () => {
    it("builds options prompt incorporating the user's specific scenario", () => {
      const prompt = buildOptionsPrompt({
        role: "tenant",
        clauses: sampleClauses,
        scenario: "I need to relocate for a job in 3 months. Can I terminate?",
      });

      expect(prompt).toContain("I need to relocate for a job in 3 months");
      expect(prompt).toContain("options");
      expect(prompt).toContain("nextSteps");
      expect(prompt).toContain("deadlinesToWatch");
    });

    it("validates options schema output", () => {
      const validOptions = {
        scenario: "Can I break the lease early?",
        options: [
          {
            title: "Option 1: Exercise Clause 3 Early Termination",
            description: "Provide 60 days advance written notice and pay 2 months rent penalty.",
            pros: ["Clean contractual exit without breach litigation"],
            cons: ["Costly 2 months rent termination fee"],
            citations: [
              {
                clauseId: "C3",
                quote: "giving 60 days advance written notice",
                verified: true,
              },
            ],
          },
        ],
        nextSteps: ["Draft written termination notice", "Budget for termination fee"],
        deadlinesToWatch: ["60 days prior to departure"],
        questionsForProfessional: ["Does local statutory law limit termination fees?"],
      };

      const parsed = optionsActionOutputSchema.safeParse(validOptions);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Negotiate Prompt", () => {
    it("builds negotiate prompt targeting high and medium clauses", () => {
      const prompt = buildNegotiatePrompt({
        role: "tenant",
        clauses: sampleClauses,
        analyses: sampleAnalyses,
      });

      expect(prompt).toContain("negotiation proposals for tenant");
      expect(prompt).toContain("[CLAUSE C3]");
      expect(prompt).toContain("alternativeWording");
      expect(prompt).toContain("fallbackPosition");
    });

    it("validates negotiate schema output", () => {
      const validNegotiate = {
        suggestions: [
          {
            clauseId: "C3",
            clauseHeading: "Early Termination",
            problem: "Two months rent penalty is excessive if landlord re-rents quickly.",
            whyItMatters: "Forces payment even if no actual rental income is lost.",
            alternativeWording: "Tenant may terminate early upon 60 days notice plus 1 month rent or actual vacancy loss, whichever is less.",
            fallbackPosition: "Cap fee at 1.5 months rent and allow sub-leasing with approval.",
            citations: [
              {
                clauseId: "C3",
                quote: "paying a termination fee of two months rent",
                verified: true,
              },
            ],
          },
        ],
      };

      const parsed = negotiateActionOutputSchema.safeParse(validNegotiate);
      expect(parsed.success).toBe(true);
    });
  });
});

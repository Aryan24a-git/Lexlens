/**
 * DemoProvider — offline canned LLM provider for hackathon presentation and network fallback.
 * instruction.md §6 Prompt 18, workthrough.md §A.9
 *
 * Provides instant, zero-network responses for fixtures, ensuring the entire product
 * functions flawlessly offline or under conference Wi-Fi constraints.
 */

import fs from "fs";
import path from "path";
import type { ZodTypeAny, z } from "zod";
import type {
  LLMProvider,
  GenerateObjectOptions,
  StreamTextOptions,
  CountTokensOptions,
} from "./provider";

export class DemoProvider implements LLMProvider {
  private demoLeaseData: {
    docType: string;
    analyses: Array<{
      clauseId: string;
      canonicalType: string;
      plainSummary: string;
      obligations?: string[];
      rights?: string[];
      risk: {
        level: string;
        reasons: string[];
        favors: string;
        unusual: boolean;
      };
      whyItMatters: string;
      questionsToAsk: string[];
      confidence: number;
      citations: Array<{
        clauseId: string;
        quote: string;
        claim: string;
        verified: boolean;
      }>;
    }>;
    synthesis: unknown;
  } | null = null;

  private demoAskData: {
    answers: Array<{
      query: string;
      answer: {
        text: string;
        basis: string;
        citations: Array<{
          clauseId: string;
          quote: string;
          claim: string;
          verified: boolean;
        }>;
        followUpQuestions: string[];
      };
    }>;
  } | null = null;

  private demoCompareData: {
    docType: string;
    summary: unknown;
  } | null = null;

  constructor() {
    this.loadFixtures();
  }

  private loadFixtures() {
    try {
      const demoDir = path.resolve(process.cwd(), "public/demo");

      const leaseFile = path.join(demoDir, "lease-v1.json");
      if (fs.existsSync(leaseFile)) {
        this.demoLeaseData = JSON.parse(fs.readFileSync(leaseFile, "utf-8"));
      }

      const askFile = path.join(demoDir, "ask-demo.json");
      if (fs.existsSync(askFile)) {
        this.demoAskData = JSON.parse(fs.readFileSync(askFile, "utf-8"));
      }

      const compareFile = path.join(demoDir, "compare-lease.json");
      if (fs.existsSync(compareFile)) {
        this.demoCompareData = JSON.parse(fs.readFileSync(compareFile, "utf-8"));
      }
    } catch {
      // Fall back gracefully if files are not on disk yet
    }
  }

  async generateObject<S extends ZodTypeAny>(
    options: GenerateObjectOptions<S>
  ): Promise<z.infer<S>> {
    const { system, user, schema } = options;
    const combined = `${system}\n${user}`.toLowerCase();

    let resultPayload: unknown = null;

    // 1. Classification
    if (combined.includes("classify the document type") || combined.includes("p0") || combined.includes("classifydoctype")) {
      resultPayload = {
        docType: this.demoLeaseData?.docType ?? "lease_residential",
        confidence: 1.0,
      };
    }
    // 2. Clause Analysis
    else if (combined.includes("analyze the following clauses") || combined.includes("p2") || combined.includes("clauseanalysis")) {
      // Extract requested clause IDs from user prompt (e.g. <clause id="C1">)
      const matches = Array.from(user.matchAll(/id="([^"]+)"/g)).map((m) => m[1]);
      const cachedAnalyses = this.demoLeaseData?.analyses ?? [];

      const filtered = matches.length > 0
        ? cachedAnalyses.filter((a) => matches.includes(a.clauseId))
        : cachedAnalyses;

      resultPayload = {
        analyses: filtered.length > 0 ? filtered : cachedAnalyses.slice(0, 3),
      };
    }
    // 3. Synthesis
    else if (combined.includes("synthesize") || combined.includes("p3") || combined.includes("documentsynthesis")) {
      resultPayload = this.demoLeaseData?.synthesis ?? {
        docType: "lease_residential",
        parties: ["Landlord", "Tenant"],
        tldr: "Standard 1-year residential apartment lease with $2,200 monthly rent. Tenant-friendly terms including 48-hour entry notice and 14-day security deposit return.",
        keyFacts: [
          {
            label: "Monthly Rent",
            value: "$2,200.00 / month",
            citations: [{ clauseId: "C3", quote: "$2,200.00 USD", claim: "Rent is $2,200.", verified: true }],
          },
        ],
        topRisks: [
          {
            clauseId: "C10",
            headline: "Early termination fee equal to 1 month rent with 60-day notice requirement",
            level: "medium",
          },
        ],
        missingClauses: ["Pet policy addendum"],
        inconsistencies: [],
        perspective: "tenant",
        promptVersion: "demo-v1.0",
      };
    }
    // 4. Comparison
    else if (combined.includes("compare") || combined.includes("comparison") || combined.includes("p5")) {
      resultPayload = this.demoCompareData?.summary ?? {
        tldr: "Draft 2 increases rent from $2,200 to $2,500 and shortens landlord notice from 48h to 24h.",
        topChanges: [
          {
            clauseId: "C3",
            title: "Rent Increased by $300/mo ($2,200 → $2,500)",
            explanation: "Monthly rent increased from $2,200 to $2,500.",
            severity: "high",
            favorsNow: "other_party",
          },
        ],
        perspective: "tenant",
        recommendation: "Reject Draft 2 adjustments to rent and notice periods.",
      };
    }
    // 5. Grounded Q&A (P4 Ask)
    else if (
      combined.includes("answer the user's question") ||
      combined.includes("grounding and basis rules") ||
      combined.includes("<question>") ||
      combined.includes("p4")
    ) {
      const qMatch = user.match(/<question>([\s\S]*?)<\/question>/i);
      const queryText = (qMatch ? qMatch[1] : user)?.toLowerCase() ?? "";

      if (
        queryText.includes("terminate") ||
        queryText.includes("early") ||
        queryText.includes("leave") ||
        queryText.includes("cancel") ||
        queryText.includes("break")
      ) {
        resultPayload = {
          text: "Yes, you may terminate the lease early by providing at least sixty (60) days prior written notice to the landlord and paying an early termination fee equal to one (1) month of rent.",
          basis: "document",
          citations: [
            {
              clauseId: "C10",
              quote: "early termination fee equal to one (1) month rent upon sixty (60) days notice",
              claim: "Early termination requires 60 days notice and one month fee.",
              verified: true,
            },
          ],
          followUpQuestions: [
            "Can the termination fee be waived if a replacement tenant is found?",
            "How must the 60 days notice be delivered to the landlord?",
            "What happens to the security deposit upon early termination?",
          ],
        };
      } else if (
        queryText.includes("late") ||
        queryText.includes("grace") ||
        queryText.includes("due") ||
        queryText.includes("rent")
      ) {
        resultPayload = {
          text: "Rent is due on the 1st of each month with a 5-day grace period. If payment is not received by the 5th business day, a late charge of $50.00 USD is assessed.",
          basis: "document",
          citations: [
            {
              clauseId: "C3",
              quote: "A grace period of five (5) business days is permitted. If rent is not received by the fifth (5th) business day, Tenant shall pay a late charge of $50.00 USD.",
              claim: "5-day grace period permitted; $50 late charge applies on the 6th day.",
              verified: true,
            },
          ],
          followUpQuestions: [
            "Are online bank transfers considered paid on transmission or settlement date?",
            "Can repeated late payments trigger default proceedings?",
          ],
        };
      } else if (
        queryText.includes("pet") ||
        queryText.includes("dog") ||
        queryText.includes("cat") ||
        queryText.includes("animal")
      ) {
        resultPayload = {
          text: "This document contains no clause, addendum, or mention regarding pets, animal policies, or pet deposits.",
          basis: "not_found",
          citations: [],
          nearestClauses: ["C1", "C2", "C3"],
          followUpQuestions: [
            "Should we draft a written pet addendum to present to the landlord?",
            "What is the standard pet deposit policy in your jurisdiction?",
          ],
        };
      } else {
        resultPayload = {
          text: "According to the terms of the agreement, the document outlines standard obligations between Landlord and Tenant including monthly rent of $2,200, a refundable security deposit, maintenance duties, and notice periods.",
          basis: "document",
          citations: [
            {
              clauseId: "C1",
              quote: "agrees to lease to Tenant, and Tenant agrees to lease from Landlord",
              claim: "Establishes lease terms and conditions.",
              verified: true,
            },
          ],
          followUpQuestions: [
            "What are the landlord's notice requirements before entering?",
            "What are my rights regarding security deposit return?",
          ],
        };
      }
    }
    // 6. Actions: Checklist
    else if (combined.includes("checklist") || combined.includes("action items for")) {
      resultPayload = {
        items: [
          {
            item: "Pay monthly rent of $2,200.00 USD on or before the 1st of each calendar month",
            owner: "you",
            due: "1st of each calendar month",
            priority: "high",
            citation: {
              clauseId: "C3",
              quote: "Tenant shall pay to Landlord the sum of $2,200.00 USD per month",
              claim: "Monthly rent due on 1st.",
              verified: true,
            },
          },
          {
            item: "Provide at least sixty (60) days prior written notice before early departure",
            owner: "you",
            due: "60 days prior to vacating",
            priority: "high",
            citation: {
              clauseId: "C10",
              quote: "early termination fee equal to one (1) month rent upon sixty (60) days notice",
              claim: "60-day notice required for early departure.",
              verified: true,
            },
          },
          {
            item: "Perform joint move-in walkthrough inspection report with Landlord",
            owner: "both",
            due: "Within 5 business days of occupancy",
            priority: "medium",
            citation: {
              clauseId: "C4",
              quote: "joint walkthrough inspection of the Premises within five (5) business days",
              claim: "Joint walkthrough within 5 days.",
              verified: true,
            },
          },
          {
            item: "Return full security deposit within fourteen (14) days following lease termination",
            owner: "other_party",
            due: "Within 14 days after lease termination",
            priority: "high",
            citation: {
              clauseId: "C4",
              quote: "Landlord shall return the security deposit within fourteen (14) days",
              claim: "Landlord must return deposit within 14 days.",
              verified: true,
            },
          },
        ],
      };
    }
    // 7. Actions: Lawyer Brief
    else if (combined.includes("lawyer_brief") || combined.includes("client consultation brief")) {
      resultPayload = {
        documentMeta: {
          fileName: "Residential_Lease_Agreement.pdf",
          docType: "lease_residential",
          parties: ["Landlord", "Tenant"],
          perspective: "tenant",
          generatedAt: new Date().toISOString(),
        },
        situationSummary:
          "One-year residential apartment lease agreement with monthly rent of $2,200. Key risks for the tenant include a strict 60-day written notice requirement and 1-month penalty for early termination, late fees assessed after a 5-day grace period, and specific notice-of-entry rules.",
        topRisks: [
          {
            headline: "Strict 60-day notice requirement and 1-month penalty for early termination",
            clauseId: "C10",
            level: "medium",
          },
          {
            headline: "Late fee of $50 assessed if payment is not received by 5th business day",
            clauseId: "C3",
            level: "low",
          },
        ],
        keyTerms: [
          { term: "Monthly Rent", meaning: "$2,200.00 USD payable on 1st of month", clauseId: "C3" },
          { term: "Security Deposit", meaning: "$2,200.00 USD refundable within 14 days of vacating", clauseId: "C4" },
        ],
        openQuestions: [
          "Can the 60-day early termination notice period be reduced to 30 days under local tenancy laws?",
          "Does state statute cap late fee assessments or require mitigation of damages upon early surrender?",
        ],
        missingInfo: [
          "Specific pet deposit and animal liability terms",
          "Utility calculation methodology",
        ],
        suggestedAgenda: [
          "Review early termination penalties and mitigation duties",
          "Confirm security deposit escrow conditions",
          "Verify local statutory rent-withholding and repair remedies",
        ],
        disclaimer:
          "LexLens gives legal information, not legal advice. For decisions that matter, talk to a qualified lawyer.",
      };
    }
    // 8. Actions: Options & Scenarios
    else if (combined.includes("options") || combined.includes("actionable legal options")) {
      resultPayload = {
        scenario: "Evaluating legal options and rights under this residential lease agreement",
        options: [
          {
            title: "Option A: Negotiated Mutual Lease Surrender",
            description:
              "Approach landlord in writing to propose early surrender conditioned on finding an approved replacement tenant.",
            pros: ["Avoids early termination penalty fee", "Protects security deposit from forfeiture"],
            cons: ["Requires landlord's voluntary written agreement", "May require assisting with showings"],
            citations: [
              {
                clauseId: "C10",
                quote: "early termination fee equal to one (1) month rent upon sixty (60) days notice",
                claim: "Early termination rights.",
                verified: true,
              },
            ],
          },
          {
            title: "Option B: Contractual Early Termination",
            description:
              "Formally deliver 60 days written notice to landlord and pay the 1-month early termination fee.",
            pros: ["Unilateral legal right under lease contract", "Clean, definite liability cutoff"],
            cons: ["Requires payment of 1 month penalty plus 60 days rent"],
            citations: [
              {
                clauseId: "C10",
                quote: "early termination fee equal to one (1) month rent upon sixty (60) days notice",
                claim: "Early termination fee clause.",
                verified: true,
              },
            ],
          },
        ],
        nextSteps: [
          "Check exact notice deadline relative to your target move-out date",
          "Draft written notice letter requesting confirmation of receipt",
          "Schedule pre-move-out joint walkthrough inspection",
        ],
        deadlinesToWatch: [
          "60 days written notice prior to departure",
          "14 days for landlord to return security deposit after surrender",
        ],
        questionsForProfessional: [
          "Does local law require landlords to mitigate damages by actively marketing the property?",
          "Can early termination fees be applied against the existing security deposit?",
        ],
      };
    }
    // 9. Actions: Negotiate Suggestions
    else if (combined.includes("negotiate") || combined.includes("negotiating compromise wording")) {
      resultPayload = {
        suggestions: [
          {
            clauseId: "C10",
            clauseHeading: "Early Termination",
            problem:
              "60 days notice is restrictive and a 1-month penalty fee creates substantial financial exposure if unexpected job relocation occurs.",
            whyItMatters: "Forces paying two months rent while unable to occupy the residence.",
            alternativeWording:
              "Tenant may terminate this Agreement upon thirty (30) days prior written notice, subject to an early termination fee equal to one-half (0.5) month's rent.",
            fallbackPosition:
              "Retain sixty (60) days notice, but waive the termination fee entirely if Tenant presents a commercially qualified replacement tenant.",
            citations: [
              {
                clauseId: "C10",
                quote: "early termination fee equal to one (1) month rent upon sixty (60) days notice",
                claim: "Notice and fee clause.",
                verified: true,
              },
            ],
          },
          {
            clauseId: "C7",
            clauseHeading: "Landlord Access",
            problem: "24-hour notice of entry is insufficient notice for working tenants.",
            whyItMatters: "Landlord entry can disrupt remote work and personal privacy.",
            alternativeWording:
              "Landlord shall provide at least forty-eight (48) hours advance written notice prior to entering the Premises, except in cases of immediate life-safety emergencies.",
            fallbackPosition:
              "Twenty-four (24) hours notice, but strictly restricted to standard business hours (9:00 AM to 5:00 PM Monday through Friday).",
            citations: [
              {
                clauseId: "C7",
                quote: "Landlord may enter the Premises upon forty-eight (48) hours advance written notice",
                claim: "Notice of entry clause.",
                verified: true,
              },
            ],
          },
        ],
      };
    }

    const parsed = schema.safeParse(resultPayload);
    if (parsed.success) {
      return parsed.data;
    }

    throw new Error(
      `DemoProvider: unable to construct valid schema payload for demo query: ${parsed.error.message}`
    );
  }

  async *streamText(options: StreamTextOptions): AsyncIterable<string> {
    const userQuery = options.user.toLowerCase();
    let textToSend =
      "According to the agreement, monthly rent is $2,200.00 USD due on the first day of each calendar month. A grace period of five (5) business days is permitted before a $50 late charge applies.";

    if (this.demoAskData?.answers) {
      for (const item of this.demoAskData.answers) {
        if (userQuery.includes(item.query)) {
          textToSend = item.answer.text;
          break;
        }
      }
    }

    // Yield words as simulated tokens
    const words = textToSend.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield (i === 0 ? "" : " ") + words[i];
    }
  }

  countTokens(options: CountTokensOptions): number {
    return Math.ceil(options.text.length / 4);
  }
}

let _demoProvider: DemoProvider | null = null;

export function getDemoProvider(): DemoProvider {
  if (!_demoProvider) {
    _demoProvider = new DemoProvider();
  }
  return _demoProvider;
}

import { describe, it, expect } from "vitest";
import { handleActionsRequest } from "@app/api/actions/route";
import { MockProvider } from "@/server/llm/mock-provider";
import type {
  Clause,
  ActionsRequest,
  ActionResult,
} from "@/core/domain/schemas";

describe("Actions API Integration (POST /api/actions)", () => {
  const sampleClauses: Clause[] = [
    {
      id: "C1",
      index: 1,
      heading: "Rent",
      text: "Tenant shall pay monthly rent of $2,000.00 due on the first day of each month.",
      startOffset: 0,
      endOffset: 77,
      pages: [1],
    },
    {
      id: "C2",
      index: 2,
      heading: "Security Deposit",
      text: "Tenant shall deposit $2,000 as security for performance of obligations.",
      startOffset: 78,
      endOffset: 150,
      pages: [1],
    },
    {
      id: "C3",
      index: 3,
      heading: "Early Termination",
      text: "Tenant may terminate upon 60 days written notice and payment of two months rent fee.",
      startOffset: 151,
      endOffset: 235,
      pages: [1],
    },
  ];

  it("handles 'checklist' action and returns verified obligations", async () => {
    const mock = new MockProvider();
    mock.onGenerateMatching(
      (opt) => opt.user.includes("obligations, deadlines, and action items"),
      {
        items: [
          {
            item: "Pay monthly rent of $2,000",
            owner: "you",
            due: "1st day of each month",
            priority: "high",
            citation: {
              clauseId: "C1",
              quote: "Tenant shall pay monthly rent of $2,000.00",
              verified: false,
            },
          },
          {
            item: "Deposit $2,000 security deposit",
            owner: "you",
            priority: "high",
            citation: {
              clauseId: "C2",
              quote: "Tenant shall deposit $2,000 as security",
              verified: false,
            },
          },
        ],
      }
    );

    const payload: ActionsRequest = {
      actionType: "checklist",
      perspective: "tenant",
      clauses: sampleClauses,
      language: "en",
    };

    const req = new Request("http://localhost:3000/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await handleActionsRequest(req, mock);
    expect(res.status).toBe(200);

    const json = (await res.json()) as ActionResult;
    expect(json.actionType).toBe("checklist");
    if (json.actionType === "checklist") {
      expect(json.items).toHaveLength(2);
      expect(json.items[0]?.item).toContain("monthly rent");
      expect(json.items[0]?.citation?.verified).toBe(true);
      expect(json.items[1]?.citation?.verified).toBe(true);
    }
  });

  it("handles 'lawyer_brief' action and returns structured brief", async () => {
    const mock = new MockProvider();
    mock.onGenerateMatching(
      (opt) => opt.user.includes("Lawyer Brief preparing"),
      {
        documentMeta: {
          fileName: "Lease.pdf",
          docType: "lease_residential",
          parties: ["Landlord LLC", "Tenant Doe"],
          perspective: "tenant",
          generatedAt: new Date().toISOString(),
        },
        situationSummary: "Standard 12-month residential apartment lease.",
        topRisks: [
          {
            headline: "Two-month rent termination penalty",
            clauseId: "C3",
            level: "high",
          },
        ],
        keyTerms: [
          {
            term: "Security Deposit",
            meaning: "$2,000 refundable performance bond",
            clauseId: "C2",
          },
        ],
        openQuestions: ["Can early termination penalty be capped at 1 month?"],
        missingInfo: ["Appliance warranty and inspection report"],
        suggestedAgenda: ["Review termination terms (15 mins)", "Clarify deposit returns (15 mins)"],
        disclaimer: "LexLens gives legal information, not legal advice.",
      }
    );

    const payload: ActionsRequest = {
      actionType: "lawyer_brief",
      perspective: "tenant",
      clauses: sampleClauses,
      fileName: "Lease.pdf",
      language: "en",
    };

    const req = new Request("http://localhost:3000/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await handleActionsRequest(req, mock);
    expect(res.status).toBe(200);

    const json = (await res.json()) as ActionResult;
    expect(json.actionType).toBe("lawyer_brief");
    if (json.actionType === "lawyer_brief") {
      expect(json.brief.documentMeta.fileName).toBe("Lease.pdf");
      expect(json.brief.topRisks[0]?.clauseId).toBe("C3");
      expect(json.brief.openQuestions).toHaveLength(1);
    }
  });

  it("handles 'options' action with user scenario", async () => {
    const mock = new MockProvider();
    mock.onGenerateMatching(
      (opt) => opt.user.includes("The user is in the role of"),
      {
        scenario: "Can I break the lease early?",
        options: [
          {
            title: "Option 1: 60-day notice with penalty",
            description: "Provide formal 60-day written notice and pay termination fee.",
            pros: ["Contractually permitted path"],
            cons: ["Loss of 2 months rent"],
            citations: [
              {
                clauseId: "C3",
                quote: "Tenant may terminate upon 60 days written notice",
                verified: false,
              },
            ],
          },
        ],
        nextSteps: ["Review financial ability to pay penalty", "Draft notice letter"],
        deadlinesToWatch: ["60 days prior to move-out"],
        questionsForProfessional: ["Is the 2-month fee enforceable?"],
      }
    );

    const payload: ActionsRequest = {
      actionType: "options",
      perspective: "tenant",
      clauses: sampleClauses,
      scenario: "Can I break the lease early?",
      language: "en",
    };

    const req = new Request("http://localhost:3000/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await handleActionsRequest(req, mock);
    expect(res.status).toBe(200);

    const json = (await res.json()) as ActionResult;
    expect(json.actionType).toBe("options");
    if (json.actionType === "options") {
      expect(json.result.options[0]?.citations[0]?.verified).toBe(true);
      expect(json.result.nextSteps).toHaveLength(2);
    }
  });

  it("handles 'negotiate' action and provides compromise proposals", async () => {
    const mock = new MockProvider();
    mock.onGenerateMatching(
      (opt) => opt.user.includes("negotiation proposals"),
      {
        suggestions: [
          {
            clauseId: "C3",
            clauseHeading: "Early Termination",
            problem: "Flat two-month fee is disproportionate.",
            whyItMatters: "Tenant pays full penalty even if landlord re-leases immediately.",
            alternativeWording: "Tenant may terminate upon 60 days notice and payment of one month rent.",
            fallbackPosition: "Allow subletting with landlord reasonable consent.",
            citations: [
              {
                clauseId: "C3",
                quote: "payment of two months rent fee",
                verified: false,
              },
            ],
          },
        ],
      }
    );

    const payload: ActionsRequest = {
      actionType: "negotiate",
      perspective: "tenant",
      clauses: sampleClauses,
      language: "en",
    };

    const req = new Request("http://localhost:3000/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await handleActionsRequest(req, mock);
    expect(res.status).toBe(200);

    const json = (await res.json()) as ActionResult;
    expect(json.actionType).toBe("negotiate");
    if (json.actionType === "negotiate") {
      expect(json.result.suggestions[0]?.alternativeWording).toContain("one month rent");
      expect(json.result.suggestions[0]?.citations[0]?.verified).toBe(true);
    }
  });

  it("returns 400 for malformed or missing body parameters", async () => {
    const req = new Request("http://localhost:3000/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType: "invalid_action" }),
    });

    const res = await handleActionsRequest(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});

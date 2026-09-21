import { describe, it, expect } from "vitest";
import { handleAskRequest } from "@app/api/ask/route";
import { MockProvider } from "@/server/llm/mock-provider";
import { parseSSEChunk } from "@/features/analysis/hooks/use-sse";
import type { Clause, AskRequest, Answer } from "@/core/domain/schemas";

describe("Ask API & SSE Grounded Q&A Integration", () => {
  const sampleClauses: Clause[] = [
    {
      id: "C1",
      index: 1,
      heading: "Premises & Term",
      text: "The Landlord leases to Tenant the premises for a term of 12 months beginning October 1, 2026.",
      startOffset: 0,
      endOffset: 95,
      pages: [1],
    },
    {
      id: "C2",
      index: 2,
      heading: "Rent & Deposit",
      text: "The monthly rent is $2,000.00 payable on the first of each month. A security deposit of $2,000.00 is required.",
      startOffset: 96,
      endOffset: 206,
      pages: [1],
    },
    {
      id: "C3",
      index: 3,
      heading: "Early Termination",
      text: "Tenant may terminate this lease early by providing sixty (60) days advance written notice and paying a cancellation fee equal to one month's rent.",
      startOffset: 207,
      endOffset: 356,
      pages: [1],
    },
  ];

  it("returns grounded answer with verified verbatim citation", async () => {
    const mock = new MockProvider();

    mock.onGenerateMatching(
      (opt) => opt.user.includes("What is the monthly rent?"),
      {
        text: "The monthly rent is $2,000.00 payable on the first of each month.",
        basis: "document",
        citations: [
          {
            clauseId: "C2",
            quote: "The monthly rent is $2,000.00 payable on the first of each month.",
          },
        ],
        followUpQuestions: [
          "When is the rent due?",
          "How much is the security deposit?",
        ],
      }
    );

    const body: AskRequest = {
      question: "What is the monthly rent?",
      clauses: sampleClauses,
      perspective: "tenant",
      docType: "lease_residential",
    };

    const request = new Request("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await handleAskRequest(request, mock);
    expect(response.status).toBe(200);

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const events: Array<{ event: string; data: unknown }> = [];
    const decoder = new TextDecoder();
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSSEChunk(buffer, (event, data) => {
        events.push({ event, data });
      });
    }

    const answerEvent = events.find((e) => e.event === "answer");
    expect(answerEvent).toBeDefined();
    const answer = answerEvent?.data as Answer;

    expect(answer.basis).toBe("document");
    expect(answer.citations.length).toBe(1);
    expect(answer.citations[0]?.verified).toBe(true);
    expect(answer.followUpQuestions.length).toBe(2);

    const doneEvent = events.find((e) => e.event === "done");
    expect(doneEvent).toBeDefined();
  });

  it("downgrades to not_found when LLM claims document basis but fabricates quotes", async () => {
    const mock = new MockProvider();

    // LLM claims document basis but provides a quote that doesn't exist anywhere in the document
    mock.onGenerateMatching(
      (opt) => opt.user.includes("Does landlord provide free high-speed wifi?"),
      {
        text: "Yes, landlord provides free gigabit fiber internet throughout the lease term.",
        basis: "document",
        citations: [
          {
            clauseId: "C1",
            quote: "Landlord provides free gigabit fiber internet.", // FABRICATED
          },
        ],
        followUpQuestions: [],
      }
    );

    const body: AskRequest = {
      question: "Does landlord provide free high-speed wifi?",
      clauses: sampleClauses,
      perspective: "tenant",
    };

    const request = new Request("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await handleAskRequest(request, mock);
    const reader = response.body?.getReader();
    const events: Array<{ event: string; data: unknown }> = [];
    const decoder = new TextDecoder();
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSSEChunk(buffer, (event, data) => {
        events.push({ event, data });
      });
    }

    const answerEvent = events.find((e) => e.event === "answer");
    const answer = answerEvent?.data as Answer;

    // Grounding Policy: downgraded because citation quote could not be verified
    expect(answer.basis).toBe("not_found");
    expect(answer.text).toContain("does not contain verifiable terms");
    expect(answer.nearestClauses?.length).toBeGreaterThan(0);
  });

  it("intercepts crisis/self-harm inputs with immediate care referral without calling LLM", async () => {
    const mock = new MockProvider();

    const body: AskRequest = {
      question: "I am going to kill myself over this lease debt",
      clauses: sampleClauses,
      perspective: "tenant",
    };

    const request = new Request("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await handleAskRequest(request, mock);
    const reader = response.body?.getReader();
    const events: Array<{ event: string; data: unknown }> = [];
    const decoder = new TextDecoder();
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSSEChunk(buffer, (event, data) => {
        events.push({ event, data });
      });
    }

    const answerEvent = events.find((e) => e.event === "answer");
    const answer = answerEvent?.data as Answer;

    expect(answer.escalationTrigger).toBe("self_harm");
    expect(answer.text).toContain("988");
  });

  it("attaches escalationTrigger for urgent real-world emergencies", async () => {
    const mock = new MockProvider();

    mock.onGenerateMatching(
      (opt) => opt.user.includes("eviction notice"),
      {
        text: "Your lease outlines termination notices in Clause 3, but unlawful lockouts require legal intervention.",
        basis: "document",
        citations: [
          {
            clauseId: "C3",
            quote: "advance written notice",
          },
        ],
        followUpQuestions: ["Can my landlord lock me out without court?"],
      }
    );

    const body: AskRequest = {
      question: "I received an eviction notice and landlord threatened to lock me out tomorrow",
      clauses: sampleClauses,
      perspective: "tenant",
    };

    const request = new Request("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await handleAskRequest(request, mock);
    const reader = response.body?.getReader();
    const events: Array<{ event: string; data: unknown }> = [];
    const decoder = new TextDecoder();
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSSEChunk(buffer, (event, data) => {
        events.push({ event, data });
      });
    }

    const answerEvent = events.find((e) => e.event === "answer");
    const answer = answerEvent?.data as Answer;

    expect(answer.escalationTrigger).toBe("eviction_lockout");
  });
});

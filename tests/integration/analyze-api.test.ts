import { describe, it, expect } from "vitest";
import { handleAnalyzeRequest } from "@app/api/analyze/route";
import { MockProvider } from "@/server/llm/mock-provider";
import { parseSSEChunk } from "@/features/analysis/hooks/use-sse";
import type { Clause, AnalyzeRequest } from "@/core/domain/schemas";
import { env } from "@/server/config/env";

describe("Analyze API & SSE Stream Integration", () => {
  const clauses: Clause[] = [
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
  ];

  it("streams doc_type -> clause_analysis -> synthesis -> done with MockProvider", async () => {
    const mock = new MockProvider();

    // 1. P0 Classify response
    mock.onGenerateMatching(
      (opt) => opt.model === env.LLM_MODEL_FAST,
      {
        docType: "lease_residential",
        parties: ["Alice Landlord", "Bob Tenant"],
        roles: ["tenant", "landlord"],
        language: "en",
        suggestedPerspective: "tenant",
      }
    );

    // 2. P2 Batch analysis response
    mock.onGenerateMatching(
      (opt) => opt.user.includes("For EACH clause provided below"),
      {
        analyses: [
          {
            clauseId: "C1",
            canonicalType: "term_duration",
            plainSummary: "12-month lease starting October 1, 2026.",
            obligations: [],
            rights: ["Tenancy for 12 months"],
            risk: {
              level: "low",
              reasons: ["Standard lease term."],
              favors: "balanced",
              unusual: false,
            },
            whyItMatters: "Sets lease duration.",
            questionsToAsk: [],
            confidence: 0.95,
            citations: [
              {
                clauseId: "C1",
                quote: "term of 12 months",
                verified: false,
              },
            ],
          },
          {
            clauseId: "C2",
            canonicalType: "payment_fees",
            plainSummary: "$2,000 monthly rent and $2,000 security deposit.",
            obligations: ["Pay $2,000 monthly"],
            rights: [],
            risk: {
              level: "low",
              reasons: ["Clear payment and deposit terms."],
              favors: "balanced",
              unusual: false,
            },
            whyItMatters: "Core monthly financial obligation.",
            questionsToAsk: [],
            confidence: 0.98,
            citations: [
              {
                clauseId: "C2",
                quote: "monthly rent is $2,000.00",
                verified: false,
              },
            ],
          },
        ],
      }
    );

    // 3. P3 Synthesis response
    mock.onGenerateMatching(
      (opt) => opt.user.includes("You are synthesizing an entire legal document"),
      {
        docType: "lease_residential",
        parties: ["Alice Landlord", "Bob Tenant"],
        tldr: "Standard 1-year residential lease agreement for $2,000 monthly rent.",
        keyFacts: [
          {
            label: "Monthly Rent",
            value: "$2,000.00",
            citations: [
              {
                clauseId: "C2",
                quote: "monthly rent is $2,000.00",
                verified: false,
              },
            ],
          },
        ],
        topRisks: [],
        missingClauses: ["Notice period before landlord entry"],
        inconsistencies: [],
      }
    );

    const payload: AnalyzeRequest = {
      clauses,
      perspective: "tenant",
      language: "en",
    };

    const req = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await handleAnalyzeRequest(req, mock);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    // Read streamed chunks
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    const events: Array<{ event: string; data: any }> = [];
    const decoder = new TextDecoder();
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      buffer = parseSSEChunk(buffer + text, (event, data) => {
        events.push({ event, data });
      });
    }

    // Verify received sequence of events
    const eventTypes = events.map((e) => e.event);
    expect(eventTypes).toContain("doc_type");
    expect(eventTypes).toContain("clause_analysis");
    expect(eventTypes).toContain("synthesis");
    expect(eventTypes).toContain("done");

    // Verify clause analysis event data has verified citations
    const clauseEvents = events.filter((e) => e.event === "clause_analysis");
    expect(clauseEvents.length).toBe(2);
    expect(clauseEvents[0]?.data.clauseId).toBe("C1");
    expect(clauseEvents[0]?.data.citations[0]?.verified).toBe(true);

    // Verify synthesis event data
    const synthesisEvent = events.find((e) => e.event === "synthesis");
    expect(synthesisEvent).toBeDefined();
    expect(synthesisEvent?.data.tldr).toContain("residential lease");

    // Verify done event data
    const doneEvent = events.find((e) => e.event === "done");
    expect(doneEvent).toBeDefined();
    expect(doneEvent?.data.stats.totalClauses).toBe(2);
    expect(doneEvent?.data.stats.verifiedRatio).toBe(1);
  });

  it("emits warning on batch failure and preserves fallback clauses", async () => {
    const mock = new MockProvider();

    // P0 succeeds
    mock.onGenerateMatching(
      (opt) => opt.model === env.LLM_MODEL_FAST,
      {
        docType: "lease_residential",
        parties: ["Landlord"],
        roles: ["tenant"],
        language: "en",
      }
    );

    // P2 batch fails
    mock.onGenerateMatching(
      (opt) => opt.user.includes("For EACH clause provided below"),
      () => {
        throw new Error("Simulated rate limit / LLM outage");
      }
    );

    // P3 synthesis
    mock.onGenerateMatching(
      (opt) => opt.user.includes("You are synthesizing an entire legal document"),
      {
        docType: "lease_residential",
        parties: ["Landlord"],
        tldr: "Partial analysis.",
        keyFacts: [],
        topRisks: [],
        missingClauses: [],
        inconsistencies: [],
      }
    );

    const payload: AnalyzeRequest = {
      clauses,
      perspective: "tenant",
    };

    const req = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await handleAnalyzeRequest(req, mock);
    expect(response.status).toBe(200);

    const reader = response.body?.getReader();
    const events: Array<{ event: string; data: any }> = [];
    const decoder = new TextDecoder();
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      buffer = parseSSEChunk(buffer + text, (event, data) => {
        events.push({ event, data });
      });
    }

    const warningEvent = events.find((e) => e.event === "warning");
    expect(warningEvent).toBeDefined();
    expect(warningEvent?.data.code).toBe("BATCH_ANALYSIS_FAILED");

    // All clauses should still have fallback analyses emitted
    const clauseEvents = events.filter((e) => e.event === "clause_analysis");
    expect(clauseEvents.length).toBe(2);

    const doneEvent = events.find((e) => e.event === "done");
    expect(doneEvent).toBeDefined();
  });

  it("returns 400 VALIDATION_ERROR on empty or invalid request", async () => {
    const invalidPayload = {
      clauses: [], // min(1) required
      perspective: "tenant",
    };

    const req = new Request("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });

    const response = await handleAnalyzeRequest(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("parses split and chunked SSE streams correctly", () => {
    const chunks = [
      "event: doc_type\n",
      'data: {"docType":"lease_residential"}\n\n',
      ": heartbeat\n\n",
      "event: clause_analysis\ndata: ",
      '{"clauseId":"C1"}\n\n',
    ];

    const parsedEvents: Array<{ event: string; data: any }> = [];
    let remainder = "";

    for (const chunk of chunks) {
      remainder = parseSSEChunk(remainder + chunk, (event, data) => {
        parsedEvents.push({ event, data });
      });
    }

    expect(parsedEvents.length).toBe(2);
    expect(parsedEvents[0]?.event).toBe("doc_type");
    expect(parsedEvents[0]?.data.docType).toBe("lease_residential");
    expect(parsedEvents[1]?.event).toBe("clause_analysis");
    expect(parsedEvents[1]?.data.clauseId).toBe("C1");
  });
});

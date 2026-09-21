import { describe, it, expect } from "vitest";
import { handleCompareRequest } from "@app/api/compare/route";
import { MockProvider } from "@/server/llm/mock-provider";
import { parseSSEChunk } from "@/features/analysis/hooks/use-sse";
import type {
  Clause,
  CompareRequest,
  ComparisonPair,
} from "@/core/domain/schemas";
import type { CompareSummary } from "@/core/prompts";

describe("Compare API & SSE Stream Integration", () => {
  const clausesA: Clause[] = [
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
      heading: "Entry",
      text: "Landlord shall provide 48 hours notice prior to entry.",
      startOffset: 78,
      endOffset: 132,
      pages: [1],
    },
  ];

  const clausesB: Clause[] = [
    {
      id: "C1",
      index: 1,
      heading: "Rent",
      text: "Tenant shall pay monthly rent of $2,300.00 due on the first day of each month.",
      startOffset: 0,
      endOffset: 77,
      pages: [1],
    },
    {
      id: "C2",
      index: 2,
      heading: "Entry",
      text: "Landlord shall provide 12 hours notice prior to entry.",
      startOffset: 78,
      endOffset: 132,
      pages: [1],
    },
  ];

  it("streams alignment -> pair_explanation -> summary -> done with MockProvider", async () => {
    const mock = new MockProvider();

    // 1. P5b Explanation response
    mock.onGenerateMatching(
      (opt) => opt.user.includes("For EACH pair below"),
      {
        explanations: [
          {
            pairId: "C1_C1",
            whatChanged: "Monthly rent increased by $300.00.",
            favorsNow: "other_party",
            impactOnYou: "Annual housing expenses increase by $3,600.",
            severity: "high",
            citations: [
              {
                clauseId: "C1",
                quote: "monthly rent of $2,300.00",
              },
            ],
          },
          {
            pairId: "C2_C2",
            whatChanged: "Notice period for landlord entry reduced from 48 hours to 12 hours.",
            favorsNow: "other_party",
            impactOnYou: "Significantly less advance warning before landlord visits.",
            severity: "medium",
            citations: [
              {
                clauseId: "C2",
                quote: "provide 12 hours notice",
              },
            ],
          },
        ],
      }
    );

    // 2. P5c Summary response
    mock.onGenerateMatching(
      (opt) => opt.user.includes("Synthesize the overall document comparison"),
      {
        topChanges: [
          {
            headline: "Rent increased to $2,300/mo",
            clauseA: "C1",
            clauseB: "C1",
            severity: "high",
            summary: "Direct financial cost increase of $300 per month.",
          },
          {
            headline: "Notice for entry cut to 12 hours",
            clauseA: "C2",
            clauseB: "C2",
            severity: "medium",
            summary: "Reduces privacy window and quiet enjoyment.",
          },
        ],
        executiveSummary:
          "Draft B shifts key financial terms and entry access substantially in the landlord's favor.",
        overallShift: "favors_other_party",
      }
    );

    const body: CompareRequest = {
      clausesA,
      clausesB,
      fileNameA: "lease-v1.txt",
      fileNameB: "lease-v2.txt",
      mode: "versions",
      perspective: "tenant",
      language: "en",
    };

    const request = new Request("http://localhost:3000/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await handleCompareRequest(request, mock);
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

    // 1. Verify alignment event
    const alignmentEvent = events.find((e) => e.event === "alignment");
    expect(alignmentEvent).toBeDefined();
    const alignmentData = alignmentEvent?.data as { pairs: ComparisonPair[] };
    expect(alignmentData.pairs.length).toBe(2);
    expect(alignmentData.pairs[0]?.status).toBe("modified");

    // 2. Verify pair_explanation event
    const explanationEvent = events.find((e) => e.event === "pair_explanation");
    expect(explanationEvent).toBeDefined();
    const explanationData = explanationEvent?.data as { pairs: ComparisonPair[] };
    expect(explanationData.pairs.length).toBeGreaterThanOrEqual(1);
    expect(explanationData.pairs[0]?.whatChanged).toBe("Monthly rent increased by $300.00.");
    expect(explanationData.pairs[0]?.citations[0]?.verified).toBe(true);

    // 3. Verify summary event
    const summaryEvent = events.find((e) => e.event === "summary");
    expect(summaryEvent).toBeDefined();
    const summaryData = summaryEvent?.data as CompareSummary;
    expect(summaryData.topChanges.length).toBe(2);
    expect(summaryData.overallShift).toBe("favors_other_party");

    // 4. Verify done event
    const doneEvent = events.find((e) => e.event === "done");
    expect(doneEvent).toBeDefined();
  });
});

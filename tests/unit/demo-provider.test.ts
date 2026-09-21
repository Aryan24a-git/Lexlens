import { describe, it, expect } from "vitest";
import { DemoProvider } from "@/server/llm/demo-provider";
import { z } from "zod";
import { DOC_TYPES } from "@/core/domain/enums";
import { documentSynthesisSchema } from "@/core/domain/schemas";

describe("DemoProvider (Phase 8 Offline Mode)", () => {
  const provider = new DemoProvider();

  it("generates valid docType classification object", async () => {
    const result = await provider.generateObject({
      model: "llama-3.1-8b-instant",
      system: "Classify the document type",
      user: "Sample lease text",
      schema: z.object({
        docType: z.enum(DOC_TYPES),
        confidence: z.number(),
      }),
    });

    expect(result.docType).toBe("lease_residential");
    expect(result.confidence).toBe(1.0);
  });

  it("generates synthesis object matching documentSynthesisSchema", async () => {
    const result = await provider.generateObject({
      model: "llama-3.3-70b-versatile",
      system: "Synthesize document synthesis",
      user: "Synthesize all clauses",
      schema: documentSynthesisSchema,
    });

    expect(result.docType).toBe("lease_residential");
    expect(result.parties.length).toBeGreaterThan(0);
    expect(result.tldr.length).toBeGreaterThan(10);
    expect(result.keyFacts.length).toBeGreaterThan(0);
  });

  it("streams tokens for Q&A without network access", async () => {
    const tokens: string[] = [];
    const stream = provider.streamText({
      model: "llama-3.3-70b-versatile",
      system: "Answer question",
      user: "Can I leave early?",
    });

    for await (const token of stream) {
      tokens.push(token);
    }

    const fullAnswer = tokens.join("");
    expect(fullAnswer.length).toBeGreaterThan(10);
    expect(fullAnswer.toLowerCase()).toContain("terminate");
  });

  it("generates valid askOutputSchema payload for early termination question", async () => {
    const { askOutputSchema } = await import("@/core/prompts/ask");
    const result = await provider.generateObject({
      model: "llama-3.3-70b-versatile",
      system: "You are LexLens. Answer the user's question about the legal document below. GROUNDING AND BASIS RULES: ...",
      user: "<question>Can I terminate this agreement early?</question>",
      schema: askOutputSchema,
    });

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(10);
    expect(result.basis).toBe("document");
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0]?.clauseId).toBe("C10");
  });

  it("generates valid checklistActionOutputSchema payload", async () => {
    const { checklistActionOutputSchema } = await import("@/core/prompts/actions");
    const result = await provider.generateObject({
      model: "llama-3.3-70b-versatile",
      system: "Extract checklist of action items for tenant",
      user: "Extract checklist",
      schema: checklistActionOutputSchema,
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]?.item).toBeDefined();
    expect(result.items[0]?.owner).toBe("you");
  });

  it("generates valid lawyerBriefActionOutputSchema payload", async () => {
    const { lawyerBriefActionOutputSchema } = await import("@/core/prompts/actions");
    const result = await provider.generateObject({
      model: "llama-3.3-70b-versatile",
      system: "Prepare client consultation brief for tenant",
      user: "Generate lawyer_brief",
      schema: lawyerBriefActionOutputSchema,
    });

    expect(result.situationSummary).toBeDefined();
    expect(result.topRisks.length).toBeGreaterThan(0);
    expect(result.documentMeta.docType).toBe("lease_residential");
  });

  it("generates valid optionsActionOutputSchema payload", async () => {
    const { optionsActionOutputSchema } = await import("@/core/prompts/actions");
    const result = await provider.generateObject({
      model: "llama-3.3-70b-versatile",
      system: "Analyze actionable legal options for tenant",
      user: "Generate options",
      schema: optionsActionOutputSchema,
    });

    expect(result.options.length).toBeGreaterThan(0);
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });

  it("generates valid negotiateActionOutputSchema payload", async () => {
    const { negotiateActionOutputSchema } = await import("@/core/prompts/actions");
    const result = await provider.generateObject({
      model: "llama-3.3-70b-versatile",
      system: "Suggest compromise wording for negotiate",
      user: "Generate negotiate",
      schema: negotiateActionOutputSchema,
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]?.alternativeWording).toBeDefined();
  });
});


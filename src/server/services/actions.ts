/**
 * Action Workflows Service (Checklist, Lawyer Brief, Options, Negotiate).
 * architecture.md §5.3, brain.md §7 P6, §8
 */

import type { LLMProvider } from "../llm/provider";
import { env } from "../config/env";
import type { ActionsRequest, ActionResult, Clause } from "@/core/domain/schemas";
import {
  buildPreamble,
  buildChecklistPrompt,
  buildLawyerBriefPrompt,
  buildOptionsPrompt,
  buildNegotiatePrompt,
  checklistActionOutputSchema,
  lawyerBriefActionOutputSchema,
  optionsActionOutputSchema,
  negotiateActionOutputSchema,
} from "@/core/prompts";
import { verifyCitation } from "@/core/citations";

export interface ActionsServiceOptions {
  provider: LLMProvider;
  signal?: AbortSignal | undefined;
}

/**
 * Executes a requested P6 Action workflow (Checklist, Lawyer Brief, Options, or Negotiate).
 * Deterministically verifies all returned clause citations against provided clauses.
 */
export async function executeAction(
  request: ActionsRequest,
  options: ActionsServiceOptions
): Promise<ActionResult> {
  const { provider, signal } = options;

  const clauseMap = new Map<string, Clause>();
  for (const c of request.clauses) {
    clauseMap.set(c.id, c);
  }

  const preamble = buildPreamble({
    role: request.perspective,
    docType: request.synthesis?.docType,
    language: request.language,
  });

  switch (request.actionType) {
    case "checklist": {
      const prompt = buildChecklistPrompt({
        role: request.perspective,
        docType: request.synthesis?.docType,
        clauses: request.clauses,
        analyses: request.analyses,
        synthesis: request.synthesis,
      });

      const raw = await provider.generateObject({
        model: env.LLM_MODEL_MAIN,
        system: preamble,
        user: prompt,
        schema: checklistActionOutputSchema,
        temperature: 0,
        signal,
      });

      const verifiedItems = raw.items.map((item) => {
        if (!item.citation) return item;
        return {
          ...item,
          citation: verifyCitation(item.citation, clauseMap),
        };
      });

      return {
        actionType: "checklist",
        items: verifiedItems,
      };
    }

    case "lawyer_brief": {
      const fileName = request.fileName ?? "Document.pdf";
      const prompt = buildLawyerBriefPrompt({
        role: request.perspective,
        docType: request.synthesis?.docType,
        clauses: request.clauses,
        analyses: request.analyses,
        synthesis: request.synthesis,
        fileName,
      });

      const raw = await provider.generateObject({
        model: env.LLM_MODEL_MAIN,
        system: preamble,
        user: prompt,
        schema: lawyerBriefActionOutputSchema,
        temperature: 0,
        signal,
      });

      return {
        actionType: "lawyer_brief",
        brief: raw,
      };
    }

    case "options": {
      const scenario =
        request.scenario?.trim() || "What are my general options, rights, and next steps under this agreement?";

      const prompt = buildOptionsPrompt({
        role: request.perspective,
        docType: request.synthesis?.docType,
        clauses: request.clauses,
        analyses: request.analyses,
        synthesis: request.synthesis,
        scenario,
      });

      const raw = await provider.generateObject({
        model: env.LLM_MODEL_MAIN,
        system: preamble,
        user: prompt,
        schema: optionsActionOutputSchema,
        temperature: 0,
        signal,
      });

      const verifiedOptions = raw.options.map((opt) => ({
        ...opt,
        citations: opt.citations.map((c) => verifyCitation(c, clauseMap)),
      }));

      return {
        actionType: "options",
        result: {
          ...raw,
          options: verifiedOptions,
        },
      };
    }

    case "negotiate": {
      const prompt = buildNegotiatePrompt({
        role: request.perspective,
        docType: request.synthesis?.docType,
        clauses: request.clauses,
        analyses: request.analyses,
        synthesis: request.synthesis,
      });

      const raw = await provider.generateObject({
        model: env.LLM_MODEL_MAIN,
        system: preamble,
        user: prompt,
        schema: negotiateActionOutputSchema,
        temperature: 0,
        signal,
      });

      const verifiedSuggestions = raw.suggestions.map((sug) => {
        const clause = clauseMap.get(sug.clauseId);
        return {
          ...sug,
          clauseHeading: sug.clauseHeading ?? clause?.heading,
          citations: sug.citations.map((c) => verifyCitation(c, clauseMap)),
        };
      });

      return {
        actionType: "negotiate",
        result: {
          suggestions: verifiedSuggestions,
        },
      };
    }
  }
}

/**
 * GroqProvider — implements LLMProvider using groq-sdk.
 * D-003: Groq with LLaMA 3.3-70B (main) and LLaMA 3.1-8B (fast).
 *
 * Uses JSON mode for structured outputs (Groq doesn't support tool-use
 * with forced tool_choice the same way as Anthropic, so we use JSON mode
 * + Zod validation + repair loop).
 */

import Groq from "groq-sdk";
import type { ZodTypeAny, z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type {
  LLMProvider,
  GenerateObjectOptions,
  StreamTextOptions,
  CountTokensOptions,
} from "./provider";
import { withRetry } from "./retry";
import { makeError } from "@/lib/result";
import { env } from "@/server/config/env";

/** Build the JSON schema instruction appended to the system prompt */
function jsonModeInstruction(schemaDescription: string): string {
  return `\n\nRespond with ONLY a valid JSON object. No prose, no markdown fences.\nSchema: ${schemaDescription}`;
}

/** Rough token estimator: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class GroqProvider implements LLMProvider {
  private readonly client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: env.GROQ_API_KEY,
      timeout: env.LLM_TIMEOUT_MS,
      maxRetries: 0, // We handle retries ourselves
    });
  }

  async generateObject<S extends ZodTypeAny>(
    options: GenerateObjectOptions<S>
  ): Promise<z.infer<S>> {
    const { model, system, user, schema, temperature = 0.1, signal } = options;

    // Build a complete JSON schema for the model
    const jsonSchema = zodToJsonSchema(schema as any, "Output");
    const schemaDesc = JSON.stringify(jsonSchema);

    const systemWithJson = system + jsonModeInstruction(schemaDesc);

    return withRetry(async (attempt) => {
      const response = await this.client.chat.completions.create(
        {
          model,
          temperature,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemWithJson },
            { role: "user", content: user },
          ],
        },
        { signal }
      );

      let content = response.choices[0]?.message?.content;
      if (!content) {
        throw makeError("LLM_SCHEMA_INVALID", "Model returned empty content.", false);
      }

      // Strip markdown code blocks if the model outputs them despite json_object format
      content = content.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        if (attempt < 3) {
          // Repair: ask the model to fix the JSON
          throw { status: 500, message: "Invalid JSON from model" };
        }
        throw makeError("LLM_SCHEMA_INVALID", "Model returned invalid JSON after retries.", false);
      }

      // Validate against Zod schema
      const result = schema.safeParse(parsed);
      if (!result.success) {
        if (attempt < 3) {
          // Surface validation errors to trigger retry with repaired output
          throw { status: 500, message: `Schema validation failed: ${result.error.message}` };
        }
        throw makeError(
          "LLM_SCHEMA_INVALID",
          `AI output didn't match expected format: ${result.error.issues.map((i) => i.message).join(", ")}`,
          false
        );
      }

      return result.data;
    });
  }

  async *streamText(options: StreamTextOptions): AsyncIterable<string> {
    const { model, system, user, temperature = 0.3, signal } = options;

    const stream = await this.client.chat.completions.create(
      {
        model,
        temperature,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { signal }
    );

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }

  countTokens(options: CountTokensOptions): number {
    return estimateTokens(options.text);
  }
}



/** Singleton — one provider instance per server process */
let _provider: GroqProvider | null = null;

export function getGroqProvider(): LLMProvider {
  if (!_provider) {
    _provider = new GroqProvider();
  }
  return _provider;
}

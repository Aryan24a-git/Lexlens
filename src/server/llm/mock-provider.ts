/**
 * MockProvider — for unit & integration testing.
 * Implements LLMProvider with configurable responses.
 */

import type { ZodTypeAny, z } from "zod";
import type {
  LLMProvider,
  GenerateObjectOptions,
  StreamTextOptions,
  CountTokensOptions,
} from "./provider";

type Matcher = (options: GenerateObjectOptions<ZodTypeAny>) => boolean;

export class MockProvider implements LLMProvider {
  private handlers: Array<{
    matcher: Matcher;
    response: unknown | ((options: GenerateObjectOptions<ZodTypeAny>) => unknown);
  }> = [];

  onGenerateMatching(
    matcher: Matcher,
    response: unknown | ((options: GenerateObjectOptions<ZodTypeAny>) => unknown)
  ): this {
    this.handlers.unshift({ matcher, response });
    return this;
  }

  async generateObject<S extends ZodTypeAny>(
    options: GenerateObjectOptions<S>
  ): Promise<z.infer<S>> {
    for (const handler of this.handlers) {
      if (handler.matcher(options as GenerateObjectOptions<ZodTypeAny>)) {
        const raw =
          typeof handler.response === "function"
            ? (handler.response as (opt: GenerateObjectOptions<S>) => unknown)(options)
            : handler.response;
        return options.schema.parse(raw);
      }
    }
    throw new Error(`MockProvider: No matching handler for prompt:\n${options.user.slice(0, 100)}...`);
  }

  async *streamText(options: StreamTextOptions): AsyncIterable<string> {
    yield "Mock stream response for: " + options.user.slice(0, 50);
  }

  countTokens(options: CountTokensOptions): number {
    return Math.ceil(options.text.length / 4);
  }
}

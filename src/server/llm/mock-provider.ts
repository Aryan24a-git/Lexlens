/**
 * MockProvider — a deterministic LLMProvider for tests.
 * Never makes real network calls. (rules.md A2.10)
 */

import type { ZodTypeAny, z } from "zod";
import type {
  LLMProvider,
  GenerateObjectOptions,
  StreamTextOptions,
  CountTokensOptions,
} from "./provider";

export type MockHandler = (
  options: GenerateObjectOptions<ZodTypeAny>
) => unknown | Promise<unknown>;

export type MockPredicate = (
  options: GenerateObjectOptions<ZodTypeAny>
) => boolean;

export class MockProvider implements LLMProvider {
  private objectResponses: Map<string, unknown> = new Map();
  private responseQueue: unknown[] = [];
  private handlers: Array<{ predicate: MockPredicate; handler: MockHandler }> =
    [];
  private streamResponse: string[] = [];

  /** Register a canned response for generateObject (keyed by model) */
  onGenerateObject(model: string, value: unknown): this {
    this.objectResponses.set(model, value);
    return this;
  }

  /** Queue sequential canned responses for generateObject */
  queueResponse(value: unknown): this {
    this.responseQueue.push(value);
    return this;
  }

  /** Register a custom handler matching options with a predicate */
  onGenerateMatching(
    predicate: MockPredicate,
    handler: unknown | MockHandler
  ): this {
    const fn: MockHandler =
      typeof handler === "function" ? (handler as MockHandler) : () => handler;
    this.handlers.push({ predicate, handler: fn });
    return this;
  }

  /** Register tokens to stream */
  onStreamText(tokens: string[]): this {
    this.streamResponse = tokens;
    return this;
  }

  async generateObject<S extends ZodTypeAny>(
    options: GenerateObjectOptions<S>
  ): Promise<z.infer<S>> {
    let canned: unknown;

    // 1. Check custom predicate handlers
    for (const entry of this.handlers) {
      if (entry.predicate(options)) {
        canned = await entry.handler(options);
        break;
      }
    }

    // 2. Check sequential queue
    if (canned === undefined && this.responseQueue.length > 0) {
      canned = this.responseQueue.shift();
    }

    // 3. Fallback to model map
    if (canned === undefined) {
      canned = this.objectResponses.get(options.model);
    }

    if (canned === undefined) {
      throw new Error(
        `MockProvider: no response registered for model "${options.model}"`
      );
    }

    const result = options.schema.safeParse(canned);
    if (!result.success) {
      throw new Error(
        `MockProvider: canned response failed schema validation: ${result.error.message}`
      );
    }
    return result.data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *streamText(_options: StreamTextOptions): AsyncIterable<string> {
    for (const token of this.streamResponse) {
      yield token;
    }
  }

  countTokens(options: CountTokensOptions): number {
    return Math.ceil(options.text.length / 4);
  }
}

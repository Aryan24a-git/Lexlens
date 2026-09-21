/**
 * LLMProvider interface — the only abstraction between services and the LLM.
 * Code in server/services/ uses this interface; never imports groq-sdk directly.
 * D-003: Groq adapter is the default; swap by implementing this interface.
 */

import type { ZodTypeAny, z } from "zod";

/** A streamed text token event */
export interface TokenEvent {
  type: "token";
  text: string;
}

/** A structured object event (from generateObject) */
export interface ObjectEvent<T> {
  type: "object";
  value: T;
}

/** Provider-level error */
export interface ErrorEvent {
  type: "error";
  code: string;
  message: string;
  retryable: boolean;
}

export type LLMEvent<T = unknown> = TokenEvent | ObjectEvent<T> | ErrorEvent;

export interface GenerateObjectOptions<S extends ZodTypeAny> {
  /** Model name (from env — never hard-code) */
  model: string;
  /** System prompt */
  system: string;
  /** User message */
  user: string;
  /** Zod schema for the expected output */
  schema: S;
  /** Temperature: 0 for analysis, up to 0.5 for friendly rewordings */
  temperature?: number | undefined;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal | undefined;
}

export interface StreamTextOptions {
  model: string;
  system: string;
  user: string;
  temperature?: number | undefined;
  signal?: AbortSignal | undefined;
}

export interface CountTokensOptions {
  text: string;
}

export interface LLMProvider {
  /**
   * Generate a structured object matching the Zod schema.
   * Uses JSON mode / tool-use depending on the provider.
   * Returns the parsed, validated object or throws on schema failure.
   */
  generateObject<S extends ZodTypeAny>(
    options: GenerateObjectOptions<S>
  ): Promise<z.infer<S>>;

  /**
   * Stream free-form text (for Q&A).
   * Yields tokens as strings via AsyncIterable.
   */
  streamText(options: StreamTextOptions): AsyncIterable<string>;

  /**
   * Rough token count for budget planning.
   */
  countTokens(options: CountTokensOptions): number;
}

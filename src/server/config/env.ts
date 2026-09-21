import { z } from "zod";

/**
 * Validated environment configuration.
 * This is the ONLY place in the codebase that reads process.env.
 * Import `env` from here — never access process.env directly. (D-002)
 */
const envSchema = z.object({
  // Only read the API key from environment
  GROQ_API_KEY:
    process.env.NODE_ENV === "test"
      ? z.string().default("mock-groq-api-key-for-tests")
      : z.string().min(1, "GROQ_API_KEY is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment configuration — check .env.example");
}

export const env = {
  ...parsed.data,
  // Hardcoded LLM config to prevent Vercel overrides
  LLM_MODEL_MAIN: "llama-3.1-8b-instant",
  LLM_MODEL_FAST: "llama-3.1-8b-instant",
  LLM_MODEL_DEEP: "llama-3.1-8b-instant",
  
  // Hardcoded Limits
  MAX_CLAUSES_PER_REQUEST: 600,
  MAX_BODY_BYTES: 2_000_000,
  LLM_TIMEOUT_MS: 55_000,
  
  // Hardcoded Flags
  DEBUG_PROMPTS: false,
  NODE_ENV: process.env.NODE_ENV || "development",
};

export type Env = typeof env;

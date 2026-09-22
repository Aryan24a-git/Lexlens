import { z } from "zod";

/**
 * Validated environment configuration.
 * This is the ONLY place in the codebase that reads process.env.
 * Import `env` from here — never access process.env directly. (D-002)
 */
const envSchema = z.object({
  // LLM (Groq)
  GROQ_API_KEY:
    process.env.NODE_ENV === "test"
      ? z.string().default("mock-groq-api-key-for-tests")
      : z.string().min(1, "GROQ_API_KEY is required").transform((s) => s.trim()),
      
  LLM_MODEL_MAIN: z.string().default("openai/gpt-oss-120b").transform((s) => s.trim()),
  LLM_MODEL_FAST: z.string().default("qwen/qwen3.8-27b").transform((s) => s.trim()),
  LLM_MODEL_DEEP: z.string().default("openai/gpt-oss-120b").transform((s) => s.trim()),

  // Limits
  MAX_CLAUSES_PER_REQUEST: z.coerce.number().positive().catch(600),
  MAX_BODY_BYTES: z.coerce.number().positive().catch(2_000_000),
  LLM_TIMEOUT_MS: z.coerce.number().positive().catch(55_000),

  // Flags
  DEBUG_PROMPTS: z.coerce.boolean().default(false),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment configuration — check .env.example");
}

export const env = parsed.data;

export type Env = typeof env;

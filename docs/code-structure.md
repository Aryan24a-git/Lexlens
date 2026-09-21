# code-structure.md — Code Structure & Quality Standards

Goal: **clean, structured, easy to understand, easy to debug.** A new contributor (or AI agent) should find any behaviour in under a minute.

## 1. Repository layout

```
lexlens/
├─ AGENTS.md                     # pointer for AI IDEs → docs/instruction.md, rules.md, memory.md
├─ docs/                         # the 11 planning docs + memory-archive.md
├─ public/
│  ├─ svg/                       # logo, sprite, illustrations (from assets/svg)
│  ├─ demo/                      # cached demo analyses (synthetic)
│  └─ fonts/                     # only if self-hosting
├─ scripts/
│  ├─ build-shaders.mjs          # .frag/.vert → generated.ts
│  └─ eval.ts                    # runs golden-set evals
├─ src/
│  ├─ app/                       # Next.js routes ONLY — thin composition, no business logic
│  │  ├─ (marketing)/page.tsx
│  │  ├─ (app)/workspace/page.tsx
│  │  ├─ (app)/workspace/[docId]/page.tsx
│  │  ├─ api/
│  │  │  ├─ analyze/route.ts
│  │  │  ├─ ask/route.ts
│  │  │  ├─ compare/route.ts
│  │  │  ├─ actions/route.ts
│  │  │  └─ health/route.ts
│  │  ├─ layout.tsx  globals.css  error.tsx  not-found.tsx
│  ├─ features/                  # vertical slices: everything for one capability
│  │  ├─ ingest/      { components/ hooks/ services/ index.ts }
│  │  ├─ xray/        { components/ hooks/ index.ts }
│  │  ├─ ask/         { components/ hooks/ index.ts }
│  │  ├─ compare/     { components/ hooks/ index.ts }
│  │  ├─ actions/     { components/ hooks/ exporters/ index.ts }
│  │  ├─ safety/      { DisclaimerBar, EscalationBanner, ConfidenceMeter }
│  │  └─ workspace/   { shell, history, perspective picker }
│  ├─ core/                      # PURE domain logic. No React, no Next, no fetch.
│  │  ├─ domain/                 # Zod schemas + inferred types (single source of truth)
│  │  ├─ parsing/                # pdf.ts docx.ts text.ts normalize.ts
│  │  ├─ segmentation/           # heuristics.ts merge.ts split.ts index.ts
│  │  ├─ citations/              # verify.ts normalizeQuote.ts
│  │  ├─ comparison/             # align.ts diff.ts similarity.ts
│  │  ├─ retrieval/              # bm25.ts context-builder.ts
│  │  ├─ safety/                 # escalation-rules.ts pii.ts
│  │  └─ prompts/                # one file per prompt, versioned (see brain.md)
│  ├─ server/                    # server-only code
│  │  ├─ llm/                    # provider.ts anthropic.ts retry.ts repair.ts budget.ts
│  │  ├─ services/               # analyze.ts ask.ts compare.ts actions.ts (orchestration)
│  │  ├─ security/               # sanitize.ts rate-limit.ts injection-guard.ts headers.ts
│  │  ├─ http/                   # sse.ts errors.ts route-helpers.ts request-id.ts
│  │  └─ config/env.ts           # Zod-validated env; the ONLY place reading process.env
│  ├─ ui/                        # design system (no feature logic)
│  │  ├─ primitives/             # Button, Chip, Tabs, Tooltip, Dialog, Sheet, Toast…
│  │  ├─ patterns/               # PaperSheet, MarginRail, RiskTab, CitationPill, RedlineText…
│  │  ├─ shaders/                # ShaderCanvas.tsx, source/*.frag, generated.ts
│  │  ├─ motion/                 # easing, variants, useReducedMotion
│  │  └─ icons/                  # <Icon name="risk-high" /> over sprite.svg
│  ├─ store/                     # zustand slices + dexie db
│  ├─ lib/                       # tiny pure helpers (cn, format, ids, result.ts)
│  └─ styles/tokens.css          # design tokens (from assets/css/tokens.css)
├─ tests/
│  ├─ unit/  integration/  e2e/
│  ├─ fixtures/                  # synthetic docs + *.golden.json
│  └─ evals/                     # citations, qa, compare, injection, escalation
├─ .env.example  .eslintrc  .prettierrc  tsconfig.json  next.config.ts  package.json
```

## 2. Dependency rules (enforced by lint)

| From ↓ can import → | core | server | features | ui | lib/store |
|---|---|---|---|---|---|
| **core** | ✔ (self) | ✘ | ✘ | ✘ | lib only |
| **server** | ✔ | ✔ | ✘ | ✘ | lib only |
| **features** | ✔ | ✘ | ✔ (other features via `index.ts` only) | ✔ | ✔ |
| **ui** | ✘ | ✘ | ✘ | ✔ | lib only |
| **app** | ✔ | ✔ (api routes only) | ✔ | ✔ | ✔ |

ESLint `no-restricted-imports` patterns implement this table. Imports across features go through the feature's `index.ts` (public API).

## 3. Naming & file conventions

- **Files:** `kebab-case.ts`; React components `PascalCase.tsx`; hooks `use-thing.ts`; tests `thing.test.ts` next to unit or under `tests/`.
- **Exports:** named exports (no default) except Next.js pages/layouts/routes.
- **Functions:** verbs (`segmentDocument`, `verifyCitations`). **Booleans:** `is/has/can/should`. **Constants:** `SCREAMING_SNAKE`.
- **Size limits:** function ≤ 40 lines, file ≤ 250 lines, component ≤ 150 lines, ≤ 4 parameters (else object param). Split before exceeding.
- **One responsibility per file.** If the file name needs "and", split it.
- **No barrel-everything:** `index.ts` only at feature/module boundaries to expose the public API.

## 4. TypeScript & validation

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. **No `any`** (use `unknown` + Zod). No non-null `!` outside tests.
- **Zod at every boundary:** API bodies, LLM outputs, env, IndexedDB reads, `postMessage`. Types are `z.infer` of schemas in `core/domain`.
- Discriminated unions for state (`{ status: "idle" | "loading" | "success" | "error" }`), not boolean soup.

## 5. Error handling

```ts
// src/lib/result.ts
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

- Services return `Result`; **throw only for programmer errors**.
- `AppError { code, message, retryable, cause? }` with stable `code` strings (`LLM_TIMEOUT`, `SCHEMA_INVALID`, `FILE_UNSUPPORTED`, `RATE_LIMITED`…).
- User-facing messages come from a single `messages.ts` map (plain language, says how to fix).
- Never swallow errors. Log with context (no document text) or surface to the UI.

## 6. Canonical examples

**Route handler (thin):**
```ts
// src/app/api/analyze/route.ts
import { withApi } from "@/server/http/route-helpers";
import { analyzeRequestSchema } from "@/core/domain";
import { analyzeDocument } from "@/server/services/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withApi({ schema: analyzeRequestSchema, stream: true, rateLimit: "analyze" },
  async ({ body, emit, signal, requestId }) => {
    await analyzeDocument(body, { emit, signal, requestId });
  });
```

**Service (orchestration, no HTTP):**
```ts
// src/server/services/analyze.ts
export async function analyzeDocument(input: AnalyzeInput, ctx: ServiceCtx): Promise<Result<void>> {
  const docType = await classifyDocType(input.clauses, ctx);          // fast model
  ctx.emit("doc_type", docType);
  for await (const batch of analyzeBatches(input, docType, ctx)) {    // main model, concurrency-limited
    for (const a of verifyAnalysisCitations(batch, input.clauses)) ctx.emit("clause_analysis", a);
  }
  ctx.emit("synthesis", await synthesize(input, ctx));
  return ok(undefined);
}
```

**Prompt module (versioned, testable):**
```ts
// src/core/prompts/clause-analysis.ts
export const CLAUSE_ANALYSIS_PROMPT_VERSION = "2026-09-20.1";
export function buildClauseAnalysisPrompt(p: { docType: DocType; role: string; jurisdiction?: string; clauses: Clause[] }) { /* … */ }
```

**Hook (client):**
```ts
// src/features/xray/hooks/use-analysis-stream.ts
export function useAnalysisStream(doc: LegalDocument, perspective: Perspective) { /* returns {state, retryClause} */ }
```

## 7. UI code rules

- Components are **presentational + hooks**: data fetching/streaming in hooks, rendering in components.
- Styling: Tailwind utilities mapped to tokens (`bg-paper`, `text-ink`, `border-brass`). **No raw hex, no magic px** in components.
- Every interactive element: visible focus, keyboard operable, accessible name.
- Motion via `ui/motion` variants only; always respect `prefers-reduced-motion`.
- Loading/empty/error states are designed for every async surface (skeletons, not spinners, for content).

## 8. Testing strategy

| Level | Tool | What |
|---|---|---|
| Unit | Vitest | segmentation, normalization, verifier, align/diff, escalation rules, Result helpers |
| Component | Testing Library | RiskTab, CitationPill, Dropzone states |
| Integration | Vitest + mocked `LLMProvider` | services produce valid, verified output; repair loop; degrade path |
| E2E | Playwright | upload → analyze → ask → compare → export brief (with `DEMO_MODE`) |
| Evals | `pnpm eval` | golden sets: citation accuracy, Q&A grounding, compare recall, injection, escalation |
| Visual/a11y | Playwright + axe | no serious/critical violations on key screens |

Rules: bug fix ⇒ failing test first. Core logic ≥ 90% line coverage. LLM calls are **never** made in unit tests.

## 9. Tooling & workflow

- `pnpm lint` (ESLint + import rules) · `pnpm typecheck` · `pnpm test` · `pnpm eval` · `pnpm build`. All must pass before a commit is called "done".
- Prettier + `lint-staged` + Husky pre-commit; `gitleaks` pre-commit hook for secrets.
- **Conventional Commits:** `feat(xray): add risk filter` · `fix(core/segmentation): handle (a)(i) nesting` · `docs(memory): update status`.
- Small commits; one concern each; reference feature IDs (`F-04`).

## 10. Documentation in code

- Public functions in `core/` and `server/services/` get a 1–3 line TSDoc: *what, inputs, edge cases*.
- Comments explain **why**, not what. Link decisions to `memory.md` IDs (`// D-005`).
- Any non-obvious regex gets an example comment.

## 11. Debugging aids

- `x-request-id` flows from request → logs → SSE error events → UI toast ("Reference: abc123").
- `DEBUG_PROMPTS=1` (dev only) prints prompt **versions and token counts**, never text.
- `?debug=1` (dev build) shows verifier stats, timings, and unverified-citation counts in a side drawer.
- `DEMO_MODE=1` serves cached analyses so UI work never needs the API.

## 12. Code review checklist (self-review before "done")

- [ ] Respects layer rules; no cross-feature deep imports
- [ ] Zod at boundaries; no `any`
- [ ] Errors handled and user-visible where relevant
- [ ] No document content in logs
- [ ] Tokens used for colour/space/type; a11y states present
- [ ] Tests added/updated; `lint`, `typecheck`, `test` green
- [ ] `memory.md` updated

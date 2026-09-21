# instruction.md — Instructions for the AI Agent (Vibe-Coding Playbook)

You are the AI engineer building **LexLens**. This file tells you *how to work*: what to read, how to run a session, and a sequence of copy-paste prompts that build the product in the right order. The human is the product owner; you own execution quality.

## 1. Reading order (every new session)

1. `docs/memory.md` — where we are, decisions, next steps  ← **always first**
2. `docs/rules.md` — what you must / must not do
3. This file — the workflow
4. Task-specific docs: `prd.md` (what), `architecture.md` (how), `code-structure.md` (where/style), `brain.md` (AI logic), `design.md` (UI), `security.md` (guardrails), `tech-stack.md` (tools), `workthrough.md` (phases & demo)

If any doc conflicts with another: `rules.md` > `security.md` > `prd.md` > `architecture.md` > `design.md` > others. Record conflicts in `memory.md` (Open questions) and ask the human.

## 2. IDE pointer file (create at repo root as `AGENTS.md`; also copy to `CLAUDE.md` / `.cursorrules` / `.windsurfrules` if your IDE uses those)

```md
# Agent instructions
Before doing anything: read docs/memory.md, docs/rules.md, docs/instruction.md.
Build LexLens exactly as specified in docs/*. Never violate docs/rules.md.
After every task: run `pnpm lint && pnpm typecheck && pnpm test`, then update docs/memory.md.
Ask the human when blocked or when a decision changes scope, security, legal wording or dependencies.
```

## 3. Session protocol

**Start:** read the docs (§1) → state in 3 lines what phase/task you'll do → list the acceptance criteria you'll satisfy (cite F-IDs).
**During:** plan (3–6 lines) → implement in small steps → run checks often → keep files within size limits.
**End:** run all checks → commit (Conventional Commits) → update `memory.md` (snapshot, status board, change log, decisions, next step) → give the human a short report: *what changed · how to verify · what's next · any question*.

## 4. Operating principles

- **Vertical slices first**, polish later. Ugly-but-working end-to-end beats perfect isolated parts.
- **Truth over confidence:** run the code; read real errors; check library docs before using an API.
- **Small diffs:** one concern per commit. No drive-by refactors.
- **Contract-first:** define Zod schemas in `core/domain` before writing services/UI.
- **Fixtures first:** create synthetic sample documents + golden files early; build against them.
- **Design is not optional:** every UI task includes states, a11y, tokens, and the shader/asset rules from `design.md`.
- **Never hide uncertainty:** if you had to assume, write the assumption in `memory.md` and the final report.

## 5. Master kickoff prompt (paste once into the IDE agent)

```text
You are the lead engineer for LexLens, a GenAI legal-information assistant (see docs/prd.md).
Follow docs/rules.md strictly. Read docs/memory.md, docs/architecture.md, docs/code-structure.md,
docs/design.md and docs/brain.md before you write code. We will build in phases (docs/workthrough.md).
For each task: plan briefly, implement, run lint/typecheck/tests, update docs/memory.md, and report.
Do not add dependencies outside docs/tech-stack.md without asking. Ask me if anything is ambiguous.
Start with Prompt 01 from docs/instruction.md.
```

## 6. Build prompts (run in order; each is self-contained)

> After each prompt: verify the **Acceptance** list, run checks, update `memory.md`, commit.

### Prompt 01 — Scaffold & tooling (Phase 0)
```text
Scaffold a Next.js (App Router, TypeScript strict, Tailwind, ESLint) project with pnpm in the current directory
following docs/code-structure.md §1 (create the folders with .gitkeep where empty). Add: Prettier, Husky +
lint-staged, gitleaks pre-commit config, Vitest (+ jsdom, Testing Library), Playwright skeleton, path alias @/*
→ src/*. Add ESLint no-restricted-imports rules implementing the dependency table in code-structure.md §2.
Create src/server/config/env.ts (Zod) and .env.example from docs/tech-stack.md §10. Add package.json scripts:
dev, build, lint, typecheck, test, e2e, eval, shaders:build. Copy docs/ into ./docs and create AGENTS.md (docs/instruction.md §2).
Acceptance: pnpm dev/build/lint/typecheck/test all pass; env validation fails clearly when a required var is missing.
```

### Prompt 02 — Tokens, fonts, shell, icons (Phase 0)
```text
Implement the design foundation from docs/design.md §3 and §5. Copy assets/css/tokens.css to src/styles/tokens.css and import it
in globals.css. Map tokens into the Tailwind theme (colors baize/brass/vellum/ink/risk/redline, fontFamily display=Literata
and ui=Public Sans via next/font, boxShadow paper, timing functions settle/stamp/std). Copy assets/svg/* to public/svg/.
Create <Icon name /> using public/svg/sprite.svg. Build the app shell (nav rail, main area, DisclaimerBar) and a /design-system
route (dev only) that shows tokens, type scale, icons, RiskChip and IndexTab variants.
Acceptance: /design-system renders all tokens and icons; contrast for all listed pairs ≥ WCAG AA; focus rings visible.
```

### Prompt 03 — Domain schemas & helpers (Phase 1)
```text
In src/core/domain define Zod schemas + inferred types exactly as in docs/architecture.md §4 (Clause, LegalDocument,
ClauseAnalysis, Citation, DocumentSynthesis, Answer, ComparisonPair, request/response schemas for /api/analyze, /ask, /compare,
/actions) and the ClauseType/DocType enums from docs/brain.md §4. Add src/lib/result.ts (Result, ok, err) and AppError with
stable codes. Unit-test schema edge cases.
Acceptance: tests pass; no `any`; schemas exported via core/domain/index.ts.
```

### Prompt 04 — Parsing & normalization (Phase 1)
```text
Implement src/core/parsing: text (paste/TXT), docx (mammoth), pdf (pdfjs-dist in a Web Worker, page-aware), file-type
sniffing by magic bytes, size/page limits from docs/security.md §5, and normalize.ts (whitespace, hyphenation fix, remove
repeated headers/footers, keep page map). Create synthetic fixtures in tests/fixtures (see docs/prd.md §15) — at least the
lease (v1+v2) and freelance agreement. Build the ingest feature hook `useParseFile` with progress + friendly errors from
docs/design.md §11.
Acceptance: fixtures parse; scanned/encrypted PDFs give specific messages; unit tests cover normalize edge cases.
```

### Prompt 05 — Segmentation (Phase 1)
```text
Implement src/core/segmentation (heuristics for numbered/lettered/Article/Section headings, ALL-CAPS headings, merge tiny
fragments, split >1,200-token clauses at sentence boundaries) producing Clause[] with ids C1..Cn, offsets and page. Add
golden files for fixtures and a test measuring boundary accuracy (target ≥ 90%). No LLM here.
Acceptance: accuracy target met on fixtures; idempotent; offsets slice back to exact text.
```

### Prompt 06 — Paper sheet, clause view, dropzone (Phase 1)
```text
Build PaperSheet, ClauseBlock (Bates-style gutter stamp), Dropzone (states: idle/dragging/parsing/error), and the Intake
screen with PerspectivePicker (role chips) per docs/design.md §7–8. Selecting a clause ID highlights its span with the
marker underlay. Use DEMO fixtures (no API yet).
Acceptance: drop a fixture → sheet renders clauses with stamps; keyboard + screen-reader friendly; mobile layout works.
```

### Prompt 07 — LLM provider (Phase 2)
```text
Implement src/server/llm: LLMProvider interface (generateObject via forced tool-use with Zod→JSON Schema, stream, countTokens),
AnthropicProvider using @anthropic-ai/sdk with prompt caching on the document prefix, timeouts, retry.ts (exp backoff+jitter),
repair.ts (one retry with validation errors). Model names only from env (docs/tech-stack.md §2). Provide a MockProvider for tests.
Acceptance: unit tests with MockProvider cover success, schema-invalid → repair → success, timeout, 429 retry. No real network in tests.
```

### Prompt 08 — Analyze pipeline + SSE (Phase 2)
```text
Create prompts (core/prompts): preamble, classify (P0), clause-analysis (P2), synthesis (P3) exactly per docs/brain.md with
version constants and structure-snapshot tests. Implement server/services/analyze.ts (batching ~8 clauses, concurrency 4),
server/http helpers (withApi, sse, errors, request-id), route POST /api/analyze streaming events per architecture.md §5.2.
Client: useSSE (fetch+ReadableStream, abortable) and use-analysis-stream. Add rate limiting + body-size caps.
Acceptance: with MockProvider integration test streams doc_type → clause_analysis* → synthesis → done; partial failures emit warning.
```

### Prompt 09 — Citation verifier (Phase 2/3)
```text
Implement core/citations/verify.ts per docs/brain.md §8 (NFKC, whitespace/quote/dash normalization, casefold, ellipsis split).
Integrate in analyze/ask/compare services so unverified citations are removed and claims without citations are downgraded.
Add tests: exact, fuzzy whitespace, smart quotes, ellipsis, fabricated quote, wrong clause id.
Acceptance: 100% of fabricated quotes rejected in tests; verified ratio metric is logged (no content).
```

### Prompt 10 — X-Ray UI + analysis reveal (Phase 2/6)
```text
Build IndexTab, MarginNote, ConfidenceMeter, RiskChip, CitationPill, summary strip and "Check first" list. Implement the analysis
reveal from docs/design.md §9: ScanOverlay using ShaderCanvas(scan-beam) with uProgress driven by streamed progress, tabs stamping in
on arrival, aria-live status. Filter/sort by risk; role change triggers re-analysis (confirm). Reduced-motion and no-WebGL fallbacks required.
Acceptance: design QA items for analysis in design.md §13 pass; Playwright e2e (DEMO_MODE) covers upload → tabs → margin note.
```

### Prompt 11 — Ask (Phase 3)
```text
Implement core/retrieval (BM25 with MiniSearch, context builder: full doc ≤ ~60k tokens else top-k + neighbours + definitions),
prompt P4, server/services/ask.ts, POST /api/ask (SSE: token → answer → done), and the Ask UI in the margin rail with streamed text,
CitationPills (hover highlight, click scroll), basis labels (From the document / General information / Not found), 3 follow-up chips.
Acceptance: golden Q&A evals ≥ targets in docs/brain.md §14; unanswerable questions return not_found with nearest clauses.
```

### Prompt 12 — Safety layer (Phase 3/7)
```text
Implement core/safety/escalation-rules.ts (+ FAST classifier hook), EscalationBanner, DisclaimerBar (non-dismissable), injection-guard
heuristics (security.md §4) that flag clauses with instruction-like text, and PII redaction toggle with preview. Add eval cases.
Acceptance: escalation recall ≥ 95% on scripted cases; injection fixtures are treated as data; disclaimer present on all AI surfaces.
```

### Prompt 13 — Compare (Phase 4)
```text
Implement core/comparison (align by canonicalType + similarity, greedy assignment, ambiguous-pair confirm hook), diff (jsdiff word-level),
RedlineText, prompts P5/P5b/P5c, POST /api/compare (SSE), and the Compare screen per docs/design.md §7.5 with aligned rows, gutter status
marks, "3 changes that matter", mode toggle. Add fixtures lease v1 vs v2 with 5 planted changes + golden.
Acceptance: all 5 planted changes detected and explained with citations to both sides; added/removed rows shown.
```

### Prompt 14 — Actions & exports (Phase 5)
```text
Implement POST /api/actions (checklist, lawyer_brief, options, negotiate) with prompts per brain.md §7, UI for Checklist, Options (scenario chips),
Lawyer Brief page with print stylesheet (2 pages, disclaimer footer), Copy text, and .ics export (ics lib).
Acceptance: brief prints cleanly; .ics imports into a calendar app; every option/checklist item has a verified citation.
```

### Prompt 15 — Landing & shaders (Phase 6)
```text
Build the landing page per docs/design.md §7.1 using ShaderCanvas(marble-hero) with scrim, the live mini-sheet with stamped tabs, and
the three ruled sections. Ensure lazy-loading after first paint, DPR cap, pause off-screen, reduced-motion static frame, no-WebGL fallback
(hero-document-lens.svg). Match assets/preview/design-preview.html.
Acceptance: Lighthouse a11y ≥ 95, perf ≥ 85; visual parity with the preview at 1440 and 390 px.
```

### Prompt 16 — Security hardening (Phase 7)
```text
Apply docs/security.md: CSP + security headers (verify PDF worker, fonts, WebGL still work), per-route rate limits, size/clauses caps,
log redaction audit (grep test proving no document text is logged), Private mode, "What we send" panel, Clear everything.
Acceptance: security.md §12 checklist all ticked.
```

### Prompt 17 — Evals (Phase 7)
```text
Create tests/evals runners and golden data per docs/brain.md §14: citations, qa, risk agreement, perspective swap, compare, injection,
escalation, readability. `pnpm eval` prints a table and writes tests/evals/results/<date>.json. Never run evals in CI unless EVAL=1.
Acceptance: report generated; failing gates listed with actionable notes in memory.md.
```

### Prompt 18 — Demo mode & polish (Phase 8)
```text
Add DEMO_MODE serving cached analyses/answers/compare results for all fixtures (public/demo/*.json) through the same UI paths.
Run the design QA checklist, fix issues, rehearse workthrough §C. Update README with setup, env vars, disclaimer and architecture diagram.
Acceptance: full demo works without network; Playwright e2e passes in DEMO_MODE; README complete.
```

## 7. Debugging protocol

1. **Reproduce** with the smallest fixture; write a failing test if possible.
2. **Read the real error** (stack, network tab, SSE `error` event, `x-request-id` in logs).
3. **Locate the layer** (parse → segment → API → LLM → verifier → UI) using `?debug=1` and verifier stats.
4. **One hypothesis, one change.** Re-run tests. Don't stack speculative fixes.
5. **Add a regression test**, then note the root cause in `memory.md` (Known issues → resolved).
6. If stuck after 3 attempts: stop, summarise findings, propose 2–3 options, ask the human.

## 8. Common pitfalls & fixes

| Problem | Fix |
|---|---|
| pdf.js worker fails in Next.js | Import inside client component dynamically; set `workerSrc` via `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`; ensure CSP `worker-src 'self' blob:` |
| SSE arrives all at once on deploy | Set `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`, use `runtime="nodejs"`, flush heartbeat; disable proxy buffering |
| Zod → JSON Schema mismatch for tool-use | Use a single converter util; test each schema by round-tripping a sample; avoid unsupported Zod features (transforms) in tool schemas |
| Model returns quote with different whitespace/quotes | Normalize in verifier (NFKC, collapse spaces, unify quotes) — never loosen to fuzzy matching |
| Hydration errors from shaders | Render `ShaderCanvas` client-only; no `window` access at module scope |
| Tailwind can't see token colours | Map CSS variables in theme (`colors: { vellum: { 100: "var(--vellum-100)" } }`) |
| Long docs time out | Batch by token budget, raise `maxDuration`, stream partials, allow "retry remaining" |
| WebGL context lost | `ShaderCanvas` handles `webglcontextlost`; ensure fallback CSS is visible beneath |
| IndexedDB in private windows | Wrap in try/catch; fall back to in-memory state with a notice |

## 9. Commit & report format

**Commit:** `type(scope): summary (F-04)` — types: feat, fix, refactor, test, docs, chore, perf, style.
**Report at end of task:**
```
Done: <what>
Verify: <commands / steps>
Files: <key paths>
Assumptions: <if any>
Next: <next prompt/task>
Questions: <if any>
```

## 10. When to stop and ask the human

- Legal wording, disclaimer text, escalation copy, jurisdiction notes
- New dependency, new external service, changed model defaults
- Anything that would send or store data in a new way
- Requirement ambiguity that affects the data model or API contract
- Test/eval gates cannot be met without a scope change

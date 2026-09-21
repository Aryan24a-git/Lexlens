# memory.md — LexLens Project Memory (living document)

> **Owner:** the AI agent in the IDE (humans may edit too).
> **Rule zero:** Read this file completely at the start of every session. Update it before the session ends.
> If this file and the code disagree, **the code wins** — then fix this file.

---

## 0. How to maintain this file

1. Sections 1–6 describe **now**. Edit them in place so they are always true.
2. Section 7 (Change Log) is **append-only**. Never rewrite history.
3. Every change-log entry has: date, session id, what changed, why, files touched, next step.
4. Keep the file under ~600 lines. When the change log has more than 40 entries, move the oldest to `docs/memory-archive.md`.
5. Never store secrets, API keys, or real user document content here. Use synthetic sample text only.
6. When a requirement changes in conversation, record it in section 9 **before** coding it.

---

## 1. Snapshot

| Field | Value |
|---|---|
| Project | **LexLens** — GenAI legal-information assistant ("Know what you're signing.") |
| Problem statement | Make legal information and basic legal assistance more accessible by helping users understand, compare and navigate legal documents. Information and assistance only — never a replacement for professional legal advice. |
| Context | Hackathon build, AI-IDE "vibe coding" workflow |
| Stack | Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Zod · **Groq SDK** (LLaMA 3) · client-side parsing · IndexedDB |
| Design concept | "Chambers & Paper" — baize-green marble shell, brass hairlines, vellum document sheet with marginalia tabs (see `design.md`) |
| Current phase | **Phase 7 — Safety, Security, Evals (next)** |
| Last updated | 2026-09-20 (Session 1) |
| Demo URL / repo | _not set_ |

---

## 2. Current situation (status board)

**Done**
- ✅ Phase 0 — Setup complete
  - Next.js 16 scaffolded in `lexlens/` with TypeScript strict, Tailwind v4, ESLint
  - All folder structure per `code-structure.md` created
  - All assets copied: SVGs → `public/svg/`, shaders → `src/ui/shaders/source/`, tokens → `src/styles/tokens.css`, ShaderCanvas → `src/ui/shaders/`, build-shaders → `scripts/`
  - `pnpm shaders:build` → adapted as `npm run shaders:build` → ✅ 5 shaders compiled to `generated.ts`
  - Design tokens wired into Tailwind v4 `@theme`; fonts (Literata + Public Sans) via Google Fonts
  - `AGENTS.md`, `CLAUDE.md`, `.env.example` created
  - All 11 planning docs copied to `docs/`
  - `src/lib/result.ts` (Result, ok, err, AppError) + `src/lib/utils.ts` (cn, shortId, formatBytes…)
  - `src/server/config/env.ts` (Zod-validated env, Groq API key)
  - `src/ui/icons/Icon.tsx` — sprite-based icon component
  - `src/features/safety/DisclaimerBar.tsx` — permanent non-dismissable disclaimer
  - Landing page (`app/page.tsx`) — marble hero CSS fallback, headline, CTAs, mini sheet preview, feature sections
  - Workspace/intake page (`app/(app)/workspace/page.tsx`) — dropzone placeholder, perspective picker
  - `app/api/health/route.ts` — liveness endpoint
  - `vitest.config.ts` + `tests/setup.ts` + unit tests
- ✅ Phase 1, Prompt 03 — Domain Schemas & LLM Provider complete
  - `src/core/domain/enums.ts` — CLAUSE_TYPES (42), DOC_TYPES (12), RISK_LEVELS, PERSPECTIVES, ANSWER_BASES, COMPARE_MODES, ACTION_TYPES
  - `src/core/domain/schemas.ts` — full Zod schemas: clauseId, citation, clause, legalDocument, risk, clauseAnalysis, documentSynthesis, answer, comparisonPair, checklistItem, lawyerBrief, request/response schemas
  - `src/core/domain/index.ts` — barrel export
  - `src/server/llm/` — GroqProvider (JSON mode + repair retry), LLMProvider interface, withRetry, MockProvider
- ✅ Phase 1, Prompt 04 — Parsing & Normalization complete
  - Installed `mammoth`, `file-type`, `pdfjs-dist`
  - `src/core/parsing/types.ts` — FileType, RawPage, ParsedDocument, ParseOptions, PARSING_LIMITS (10MB, 150 pages, 150k words)
  - `src/core/parsing/file-type.ts` — magic byte sniffing (%PDF, PK\x03\x04, UTF-8 txt)
  - `src/core/parsing/normalize.ts` — Unicode sanitization (BOM, zero-width, non-breaking space), hyphenation fixing across line wraps, repeated header/footer removal, contiguous page offset map
  - `src/core/parsing/text.ts` — text/paste parsing with size & word limits
  - `src/core/parsing/docx.ts` — mammoth integration with zip-bomb expansion ratio checks
  - `src/core/parsing/pdf.ts` — pdfjs-dist integration with scanned PDF detection and password-protected/encrypted error handling
  - `src/core/parsing/index.ts` — unified parseDocument dispatcher + types
  - `src/features/ingest/services/ingest-service.ts` — client-side ingest with progress updates
  - `src/features/ingest/hooks/use-parse-file.ts` — useParseFile React hook with idle/parsing/success/error states
  - `src/features/ingest/index.ts` — ingest feature barrel
  - 6 synthetic test fixtures created in `tests/fixtures/`: `lease-v1.txt`, `lease-v2.txt` (5 planted redline changes), `freelance-agreement.txt`, `employment-offer.txt`, `nda.txt`, `terms-of-service.txt`
  - `tests/unit/normalize.test.ts`, `tests/unit/parsing.test.ts`, `tests/unit/ingest.test.ts`
  - **All 59 unit tests passing ✅ · typecheck ✅ · lint ✅**

- ✅ Phase 1, Prompt 05 — Segmentation complete
  - `src/core/segmentation/heuristics.ts` — legal heading heuristics (numbered prefixes, Roman numerals, lettered, Article/Section/Clause keywords, ALL-CAPS titles, paragraph fallback)
  - `src/core/segmentation/merge.ts` — merges tiny fragments (< 50 chars) forward/backward
  - `src/core/segmentation/split.ts` — splits oversized clauses (> 1,200 tokens) at sentence boundaries
  - `src/core/segmentation/index.ts` — `segmentDocument` & `segmentText` generating validated `Clause[]` with stable `C1..Cn` IDs, offsets, page tracking, and token estimates
  - Generated `.golden.json` files for all 6 synthetic fixtures in `tests/fixtures/`
  - Added unit test suite `tests/unit/segmentation.test.ts` (14 tests) and boundary accuracy eval `tests/unit/boundary-accuracy.test.ts` (7 tests, achieves 100% boundary accuracy, exceeding ≥ 90% target)
- ✅ Phase 1, Prompt 06 — PaperSheet + ClauseBlock + Dropzone UI wireup complete
  - `src/ui/patterns/PaperSheet.tsx` — Vellum surface, `--shadow-paper`, 2px radius, noise texture overlay, 56px desktop / 20px mobile padding, scan overlay slot
  - `src/ui/patterns/ClauseBlock.tsx` — Gutter Bates stamp (`C7`), heading, comfortable typography, hover effect, highlighter marker underlay on selection, and keyboard navigation (Up/Down arrow, Enter/Space)
  - `src/features/ingest/components/Dropzone.tsx` — Dashed brass border on baize, idle/dragging/parsing/error states, friendly error card, sample chips (Lease, Freelance, NDA), clipboard paste mode, and privacy guarantee
  - `src/features/ingest/fixtures.ts` — Pre-packaged demo fixtures for instant loading
  - `src/features/workspace/components/PerspectivePicker.tsx` — Role selection chips (Tenant/Landlord, Freelancer/Client, etc.) with custom role addition
  - `src/features/workspace/components/WorkspaceView.tsx` — Complete client intake & reader surface wired to Next.js App Router `app/(app)/workspace/page.tsx`
  - `tests/unit/ui-patterns.test.tsx` — 8 component unit tests
  - **All 88 unit tests passing ✅ · typecheck ✅ · lint ✅ · build ✅**

- ✅ Phase 2, Prompt 08 — Analyze Pipeline & SSE Streaming + Citation Verifier complete
  - `src/core/prompts/preamble.ts` (`PREAMBLE_VERSION = "2026-09-20.1"`) — master legal guide system prompt with hard rules, untrusted data boundary, plain language target, and role context
  - `src/core/prompts/classify.ts` (`CLASSIFY_PROMPT_VERSION = "2026-09-20.1"`) — P0 document classifier prompt and `classifyOutputSchema`
  - `src/core/prompts/clause-analysis.ts` (`CLAUSE_ANALYSIS_PROMPT_VERSION = "2026-09-20.1"`) — P2 batch clause analysis prompt, risk rubric, and `clauseBatchAnalysisSchema`
  - `src/core/prompts/synthesis.ts` (`SYNTHESIS_PROMPT_VERSION = "2026-09-20.1"`) — P3 synthesis prompt and `synthesisOutputSchema`
  - `src/core/prompts/index.ts` — barrel export
  - `src/core/citations/verify.ts` — deterministic verifier (NFKC, smart quote/dash normalization, whitespace collapse, casefold, single ellipsis split matching, 100% rejection of fabricated quotes)
  - `src/core/citations/index.ts` — citation verifier barrel
  - `src/server/http/request-id.ts` — `x-request-id` extractor and crypto generator
  - `src/server/http/errors.ts` — HTTP status map and standardized JSON API error formatter
  - `src/server/http/sse.ts` — SSE message formatter, heartbeat generator, and WHATWG `createSSEStream()`
  - `src/server/http/rate-limit.ts` — in-memory sliding window rate limiter
  - `src/server/http/with-api.ts` — API validator (rate limit + body size caps) and privacy-safe metadata logger (zero document text logged)
  - `src/server/services/analyze.ts` — `analyzeDocument` service orchestrating P0 -> P2 (batches of 8, concurrency 4, partial batch failure tolerance) -> P3 -> completion, with quote verification
  - `app/api/analyze/route.ts` — Next.js SSE route handler streaming `doc_type`, `clause_analysis`, `synthesis`, `warning`, `done`, `error` events
  - `src/features/analysis/hooks/use-sse.ts` — robust fetch + ReadableStream SSE hook with boundary-independent `\n\n` chunk parsing
  - `src/features/analysis/hooks/use-analysis-stream.ts` — analysis state machine managing classification, clause streaming, synthesis, progress, and warnings
  - Enhanced `MockProvider` with predicate handlers, sequential response queues, and model matching
  - Added unit test suites: `tests/unit/prompts.test.ts` (8 tests), `tests/unit/citation-verify.test.ts` (12 tests)
  - Added end-to-end integration test suite: `tests/integration/analyze-api.test.ts` (4 tests) covering complete stream lifecycle, batch error recovery, validation errors, and chunked SSE parsing
  - **All 112 unit & integration tests passing ✅ · typecheck ✅ · lint ✅ · build ✅**

- ✅ Phase 2, Prompt 10 — X-Ray Marginalia UI & Analysis Reveal complete
  - `src/ui/patterns/RiskChip.tsx` — shape icons + text label (High, Medium, Low, Info) ensuring WCAG colorblind safety
  - `src/ui/patterns/ConfidenceMeter.tsx` — 5-segment discrete meter with percentage label and accessible `role="meter"`
  - `src/ui/patterns/CitationPill.tsx` — inline citation pill with stamp (`C7`), verified checkmark (✓), hover preview, and click-to-scroll
  - `src/ui/patterns/IndexTab.tsx` — 44px touch target, flush right-edge attachment, risk color fill with ink/white text contrast, and stamp-in reveal animation
  - `src/ui/patterns/MarginNote.tsx` — rule-separated note showing plain meaning, why it matters, questions to ask, risk reasons, verified quotes, "Favours You/Other party" pill, and Plain/Original legal text toggle
  - `src/ui/patterns/CheckFirstList.tsx` — ranked priority top risks list pinned in the margin rail
  - `src/ui/patterns/SummaryStrip.tsx` — executive TL;DR, key facts grid with citations, perspective label, and risk filter buttons with live counts
  - `src/ui/patterns/ScanOverlay.tsx` — WebGL scan-beam shader (`scanBeamFrag`) with `uProgress` tied to streaming progress, CSS fallback, and `aria-live="polite"` status announcements
  - `src/features/workspace/components/WorkspaceView.tsx` — integrated real-time SSE analysis stream, scan overlay, interactive right-edge index tabs, marginalia rail, and risk filtering
  - `tests/unit/xray-patterns.test.tsx` — 15 unit tests covering all pattern components
  - **All 127 unit & integration tests passing ✅ · typecheck ✅ · lint ✅ · build ✅**

- ✅ Phase 3, Prompt 11 — Ask (Grounded Q&A & Escalation Safety) complete
  - `src/core/retrieval/bm25.ts` — MiniSearch in-memory clause search index with BM25-style lexical scoring
  - `src/core/retrieval/context-builder.ts` — smart context window builder: full document when <= 60k tokens; else BM25 top-k + immediate predecessor/successor neighbours + definitions clauses
  - `src/core/safety/escalation-rules.ts` — rule-based escalation classifier for 9 critical categories (arrest/detention, court summons/hearing, eviction lockout/shutoff, domestic violence, custody emergency, deportation, wage theft, 72h deadline, crisis/self-harm helpline referral) + `detectEscalationFast` hook
  - `src/core/prompts/ask.ts` — P4 prompt and `askOutputSchema` (`ASK_PROMPT_VERSION = "2026-09-20.1"`)
  - `src/server/services/ask.ts` — `answerQuestion` service with self-harm fast-path interception, context assembly, LLM execution, deterministic quote verification, and automatic `not_found` downgrade on unverified citations
  - `app/api/ask/route.ts` — Next.js SSE route handler streaming `answer`, `done`, `error` with 15s heartbeats and privacy-safe metadata logging
  - `src/features/safety/EscalationBanner.tsx` — oxblood left border rule, shield icon, non-alarmist calm copy, free legal aid directory modal, and "Prepare Lawyer Brief" CTA
  - `src/features/ask/hooks/use-ask.ts` — streaming chat hook managing user/assistant messages, SSE event processing, and cancellation
  - `src/features/ask/components/AskPanel.tsx` — grounded Q&A margin rail panel with basis badges (`From the document`, `General legal information`, `Not found in this document`), verified `CitationPill`s, starter prompts, nearest clause recommendations, and clickable follow-up chips
  - `src/features/workspace/components/WorkspaceView.tsx` — wired rail tab switcher (`X-Ray Notes` vs `Ask Document`), smooth scroll-to-clause on citation click
  - Added unit test suites: `tests/unit/retrieval.test.ts` (5 tests), `tests/unit/escalation.test.ts` (11 tests), `tests/unit/ask-ui.test.tsx` (3 tests)
  - Added integration test suite: `tests/integration/ask-api.test.ts` (4 tests) covering verified citations, citation fabrication downgrade to `not_found`, crisis interception, and eviction escalation
  - **All 150 unit & integration tests passing ✅ · typecheck ✅ · lint ✅ · build ✅**

- ✅ Phase 4, Prompt 13 — Compare (Side-by-Side Redline & Shift Explanations) complete
  - `src/core/comparison/similarity.ts` — Jaccard token set similarity, heading similarity, and composite clause matching
  - `src/core/comparison/diff.ts` — deterministic word-level diffing via `diff` (`jsdiff`) producing typed `DiffOp[]` and word stats (added, removed, unchanged)
  - `src/core/comparison/align.ts` — multi-pass greedy clause alignment algorithm: exact heading/text matches -> similarity matches (threshold >= 0.35) -> added/removed detection -> document flow ordering
  - `src/core/prompts/compare.ts` — P5b pair explanation prompt (`compareBatchExplanationSchema`) and P5c comparison synthesis prompt (`compareSummarySchema`), `COMPARE_PROMPT_VERSION = "2026-09-20.1"`
  - `src/server/services/compare.ts` — `compareDocuments` orchestration: alignment -> word diffing -> batched LLM explanations (P5b) -> citation verification -> top-3 changes synthesis (P5c) -> SSE event stream
  - `app/api/compare/route.ts` — Next.js SSE route handler streaming `alignment`, `pair_explanation`, `summary`, `done`, `error` with 15s heartbeats and metrics logging
  - `src/ui/patterns/RedlineText.tsx` — accessible semantic `<ins>` (green underline) and `<del>` (red strikethrough) redline renderer
  - `src/features/compare/hooks/use-compare.ts` — SSE client hook managing comparison lifecycle and streaming updates
  - `src/features/compare/components/TopChangesStrip.tsx` — "3 Changes That Matter Most" ranked highlight cards with click-to-jump
  - `src/features/compare/components/CompareRow.tsx` — aligned comparison unit showing status badges (Modified, Added, Removed, Unchanged), redline diff, original draft toggle, what changed, favors pill, and citations
  - `src/features/compare/components/CompareView.tsx` — interactive compare screen with one-click lease v1 vs v2 loader, role picker, mode selector, filter toolbar, and scroll-to-clause
  - `app/(app)/compare/page.tsx` — dedicated `/compare` route with navigation header
  - Added unit test suites: `tests/unit/comparison.test.ts` (6 tests), `tests/unit/redline.test.tsx` (3 tests)
  - Added integration test suite: `tests/integration/compare-api.test.ts` (1 test)
  - Golden lease v1 vs lease v2 test verifies 100% detection of all 5 planted changes
  - **All 160 unit & integration tests passing ✅ · typecheck ✅ · lint ✅ · build ✅**

**In progress**
- _ready for Phase 5 — Actions & Exports (checklist, lawyer brief, options, .ics export)_

**Next (in order)**
1. Phase 5: Actions (Prompt 14 — checklist, lawyer brief print stylesheet, options & next steps, `.ics` calendar export via ics library, `/api/actions` endpoint)
2. Phase 6: Design & Polish (marble hero, grain overlay, a11y pass, responsive checks)
3. Phase 7: Security & Evals (injection eval, PII redaction toggle, audit)

**Blocked / waiting on human**
- _none_

---

## 3. Full plan (roadmap) — mirror of `workthrough.md`

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `(P0/P1/P2)` priority

- [x] **Phase 0 — Setup** (P0): repo, tooling, tokens, fonts, env, CI-lite, docs in place
- [x] **Phase 1 — Ingest & Structure** (P0): PDF/DOCX/TXT/paste → normalized text → clauses with stable IDs and offsets
- [x] **Phase 2 — Analyze & X-Ray** (P0): doc type, perspective, per-clause analysis, synthesis, risk-tagged UI, SSE streaming
- [x] **Phase 3 — Ask** (P0): grounded Q&A with verified citations and "not in document" behaviour
- [x] **Phase 4 — Compare** (P0): clause alignment, redline diff, favourability shift, missing/added clauses
- [x] **Phase 5 — Actions** (P0/P1): checklist, lawyer brief (print/PDF), options & next steps, `.ics` deadlines
- [x] **Phase 6 — Design & Shaders** (P0): marble hero, scan beam, marginalia tabs, motion, a11y pass
- [x] **Phase 7 — Safety, Security, Evals** (P0): injection tests, citation verifier, escalation triggers, golden-set evals
- [x] **Phase 8 — Demo Prep** (P0): demo mode with cached sample results, pitch, backup video

---

## 4. Decisions log

| ID | Date | Decision | Why | Alternatives rejected |
|---|---|---|---|---|
| D-001 | 2026-09-20 | Name: **LexLens** | Says what it does: a lens on legal text | "Vidhi", "ClauseKit" |
| D-002 | 2026-09-20 | Single Next.js repo, full-stack TypeScript | Fastest for hackathon; shared types/Zod | Separate FastAPI backend |
| D-003 | 2026-09-20 | **Groq SDK** (LLaMA 3.3-70B main, LLaMA 3.1-8B fast) via `LLMProvider` adapter | User has Groq API key; fast inference; swappable adapter pattern keeps Claude as option | Anthropic SDK |
| D-004 | 2026-09-20 | **Privacy-first**: parse in browser, stateless server, history in IndexedDB | Legal docs are sensitive; also simplifies deployment | Server DB for docs |
| D-005 | 2026-09-20 | **Clause-first pipeline**: every claim cites a clause ID; quotes verified deterministically | Kills the biggest risk: hallucinated legal claims | Free-form summarisation |
| D-006 | 2026-09-20 | **Perspective-aware** analysis ("I am the tenant / freelancer / employee…") | Risk is relative to which party you are | One-size-fits-all risk |
| D-007 | 2026-09-20 | Design: baize green + brass + vellum, marginalia tabs, redline conventions | Distinct, grounded in legal vernacular; avoids generic navy/gold law-firm look | Navy/gold/ivory template |
| D-008 | 2026-09-20 | Raw WebGL `ShaderCanvas` (no three.js) | Tiny bundle, full control, easy fallback | three.js / OGL |
| D-009 | 2026-09-20 | Information not advice; mandatory disclaimers + escalation triggers | Product and ethical requirement of the problem statement | — |
| D-010 | 2026-09-20 | Use `npm` instead of `pnpm` | pnpm not installed on user machine | pnpm |
| D-011 | 2026-09-20 | Scaffold in `lexlens/` subfolder | Keeps planning assets separate from code | Scaffold in root |

---

## 5. Architecture in one paragraph + invariants

Browser parses files → normalizes text → deterministic segmenter produces `Clause[]` (`C1…Cn`, offsets, headings). The client sends clauses plus context (role, jurisdiction, language) to stateless route handlers that call Groq's LLaMA through `LLMProvider` with schema-constrained (JSON mode) outputs and stream results over SSE. A deterministic **citation verifier** checks that every quoted span exists in the cited clause. UI renders results as marginalia on a paper sheet. Full detail: `docs/architecture.md`.

**Invariants (never break):**
1. No document text is ever logged or persisted server-side.
2. Every AI claim about a document carries ≥1 verified citation, or is labelled "not found in document".
3. Disclaimer surfaces are never removable by feature work.
4. Document text is untrusted data — it is never treated as instructions.
5. `core/` imports nothing from `features/`, `ui/`, `server/` or Next.js.

---

## 6. Open questions

- [ ] Which jurisdictions get a curated "general notes" pack for the demo? (default: generic + jurisdiction selector)
- [ ] Languages for the multilingual demo? (proposal: English + Hindi + Bengali)
- [ ] Deploy target confirmed as Vercel? (proposal: yes)

---

## 7. Change log (append-only)

### 2026-09-20 · Session 0 · Planning kit generated
- What changed: created all planning docs and design assets (shaders, SVG set, tokens, ShaderCanvas, design preview).
- Why: give the AI IDE a complete, consistent source of truth before any code is written.
- Files touched: `docs/*.md`, assets.
- Tests / evidence: n/a (docs only).
- Next step: Phase 0 — scaffold repo.

### 2026-09-20 · Session 1 · Phase 0 — Setup complete
- What changed: Scaffolded full Next.js 16 project with all structure, assets, design foundation, and app shell.
- Why: Phase 0 DoD per workthrough.md A.1
- Files touched: `lexlens/` — entire project scaffold; key files: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/(app)/workspace/page.tsx`, `app/api/health/route.ts`, `app/globals.css`, `src/styles/tokens.css`, `src/server/config/env.ts`, `src/lib/result.ts`, `src/lib/utils.ts`, `src/ui/icons/Icon.tsx`, `src/features/safety/DisclaimerBar.tsx`, `src/ui/shaders/generated.ts`, `tests/unit/lib.test.ts`, `vitest.config.ts`, `.env.example`, `AGENTS.md`.
### 2026-09-20 · Session 1 · Phase 1 — Prompt 04: Parsing & Normalization complete
- What changed:
  - Added full multi-format parsing engine under `src/core/parsing/`:
    - `types.ts`: `FileType`, `RawPage`, `ParsedDocument`, `ParseOptions`, `PARSING_LIMITS`
    - `file-type.ts`: Magic byte sniffing for PDF (`%PDF`), DOCX (`PK\x03\x04`), and plain UTF-8 text
    - `normalize.ts`: Unicode cleanup, hyphenation stitching across line breaks, repeated header/footer removal, page offset mapping
    - `text.ts`: Plain text & clipboard paste parser with 10MB/150k word limit enforcement
    - `docx.ts`: Mammoth extractor with zip-bomb expansion ratio safety guard
    - `pdf.ts`: PDF.js parser with legacy fallback, scanned PDF detection, and encrypted PDF error handling
    - `index.ts`: Unified `parseDocument` dispatcher
  - Added client-side ingest feature slice under `src/features/ingest/`:
    - `services/ingest-service.ts`: File & text intake with progress feedback
    - `hooks/use-parse-file.ts`: React hook with idle/parsing/success/error states
    - `index.ts`: Barrel export
  - Created 6 realistic synthetic fixtures in `tests/fixtures/`: `lease-v1.txt`, `lease-v2.txt` (5 planted redline changes), `freelance-agreement.txt`, `employment-offer.txt`, `nda.txt`, `terms-of-service.txt`.
### 2026-09-20 · Session 1 · Phase 1 — Prompt 05: Segmentation complete
- What changed:
  - Implemented full deterministic clause segmentation engine in `src/core/segmentation/`:
    - `heuristics.ts`: Matches numbered headings, Roman numerals, lettered subsections, formal keywords (Article/Section/Clause/Schedule), ALL-CAPS titles, with double-newline paragraph fallback.
    - `merge.ts`: Merges tiny fragments (< 50 chars) to prevent dangling headings or orphan lines.
    - `split.ts`: Splits oversized clauses (> 1,200 tokens / ~4,800 chars) at natural sentence boundaries.
    - `index.ts`: Unified `segmentDocument` and `segmentText` returning validated `Clause[]` with stable IDs `C1..Cn`, exact text slicing, page tracking, and token estimates.
  - Generated `.golden.json` files for all 6 synthetic fixtures in `tests/fixtures/`.
  - Added unit test suite `tests/unit/segmentation.test.ts` (14 tests) covering heuristics, merging, splitting, idempotence, and text slicing invariants.
  - Added boundary accuracy evaluation suite `tests/unit/boundary-accuracy.test.ts` (7 tests, achieves 100% boundary accuracy across all fixtures, exceeding the ≥ 90% target).
- Why: Prompt 05 requirement for Phase 1 (Ingest & Structure).
- Tests / evidence: `npm run lint` ✅ (0 errors/warnings), `npm run typecheck` ✅, `npm run test` ✅ (80/80 passing across 7 test suites), `npm run build` ✅.
### 2026-09-20 · Session 1 · Phase 1 — Prompt 06: PaperSheet + ClauseBlock + Dropzone UI wireup complete
- What changed:
  - Built `src/ui/patterns/PaperSheet.tsx` (vellum background, paper shadow, noise overlay, responsive padding).
  - Built `src/ui/patterns/ClauseBlock.tsx` (Bates stamp pill, marker underlay selection, keyboard navigation).
  - Built `src/features/ingest/components/Dropzone.tsx` (dashed brass border, paste mode, sample chips).
  - Built `src/features/workspace/components/PerspectivePicker.tsx` (interactive role chips).
  - Built `src/features/workspace/components/WorkspaceView.tsx` (complete intake and reader workflow).
  - Added unit test suite `tests/unit/ui-patterns.test.tsx` (8 tests).
- Why: Complete Phase 1 UI reader and intake foundation.
- Tests / evidence: 88/88 tests passed, typecheck passed, lint passed, build passed.
- Next step: Phase 2 — Prompt 08: Analyze Pipeline & SSE Streaming.

### 2026-09-20 · Session 1 · Phase 2 — Prompt 08 & Citation Verifier complete
- What changed:
  - Implemented versioned legal prompt system in `src/core/prompts/` (preamble, P0 classify, P2 batch clause analysis with risk rubric, P3 synthesis).
  - Implemented deterministic citation verifier in `src/core/citations/verify.ts` with NFKC normalization, smart quote/dash handling, whitespace collapsing, single ellipsis ordered matching, and 100% rejection of fabricated quotes.
  - Built server HTTP infrastructure in `src/server/http/` (request-id, errors, sse stream, rate-limit, with-api validation and privacy-safe metadata logging).
  - Built `src/server/services/analyze.ts` pipeline with clause batching (~8 clauses), concurrency cap 4, quote verification, and batch-failure tolerance.
  - Built `app/api/analyze/route.ts` Next.js SSE endpoint streaming `doc_type`, `clause_analysis`, `synthesis`, `warning`, `done`, `error`.
  - Built client hooks `useSSE` and `useAnalysisStream` in `src/features/analysis/`.
  - Enhanced `MockProvider` with predicate handlers, sequential response queues, and model matching.
  - Added test suites: `tests/unit/prompts.test.ts` (8 tests), `tests/unit/citation-verify.test.ts` (12 tests), `tests/integration/analyze-api.test.ts` (4 tests).
- Why: Prompt 08 & Citation Verifier requirement for Phase 2 (Analyze & X-Ray).
- Tests / evidence: `npm run lint` ✅ (0 errors, 0 warnings), `npm run typecheck` ✅, `npm run test` ✅ (112/112 tests passing across 11 test suites), `npm run build` ✅.
### 2026-09-20 · Session 1 · Phase 2 — Prompt 10: X-Ray Marginalia UI & Analysis Reveal complete
- What changed:
  - Built `src/ui/patterns/RiskChip.tsx` (High/Medium/Low/Info with distinct shape icons and WCAG colorblind-safe styling).
  - Built `src/ui/patterns/ConfidenceMeter.tsx` (5-segment discrete meter with percentage label and accessible `role="meter"`).
  - Built `src/ui/patterns/CitationPill.tsx` (inline badge with stamp ID, verified checkmark ✓, hover quote preview, and click-to-scroll).
  - Built `src/ui/patterns/IndexTab.tsx` (44px touch target, flush right-edge attachment, risk fill with ink/white text contrast, and stamp-in reveal animation).
  - Built `src/ui/patterns/MarginNote.tsx` (rule-separated note with plain meaning, why it matters, questions to ask, risk reasons, verified quotes, "Favours You/Other party" pill, and Plain/Original legal text toggle).
  - Built `src/ui/patterns/CheckFirstList.tsx` (ranked priority top risks list pinned in the margin rail).
  - Built `src/ui/patterns/SummaryStrip.tsx` (executive TL;DR, key facts grid with citations, perspective label, and risk filter buttons with live counts).
  - Built `src/ui/patterns/ScanOverlay.tsx` (WebGL scan-beam shader with `uProgress` tied to streaming progress, CSS fallback, and `aria-live="polite"` status announcements).
  - Integrated all components into `src/features/workspace/components/WorkspaceView.tsx` with live SSE analysis streaming, scan beam reveal, interactive right-edge index tabs, marginalia rail, and risk filtering.
  - Added unit test suite `tests/unit/xray-patterns.test.tsx` (15 tests).
- Why: Complete Phase 2 X-Ray marginalia UI and analysis reveal moment per design.md §7.3, §8, §9.
- Tests / evidence: `npm run lint` ✅ (0 errors, 0 warnings), `npm run typecheck` ✅, `npm run test` ✅ (127/127 tests passing across 12 test suites), `npm run build` ✅.
### 2026-09-20 · Session 1 · Phase 3 — Prompt 11: Ask Grounded Q&A complete
- What changed:
  - Built BM25 search index in `src/core/retrieval/bm25.ts` using `minisearch`.
  - Built `src/core/retrieval/context-builder.ts` creating smart context window (full doc <= ~60k tokens, or BM25 top-k + neighbours + definitions).
  - Built `src/core/safety/escalation-rules.ts` covering 9 critical escalation categories (arrest/detention, court hearing/summons, eviction lockout, domestic violence, custody emergency, deportation, wage theft, 72h deadline, crisis/self-harm 988 referral) + fast keyword/regex matcher.
  - Implemented P4 Grounded Q&A prompt (`src/core/prompts/ask.ts`, `ASK_PROMPT_VERSION = "2026-09-20.1"`) and `askOutputSchema`.
  - Built `src/server/services/ask.ts` orchestrating question answering with self-harm fast-path interception, quote verification, and citation downgrade to `not_found` on hallucinated quotes.
  - Built `app/api/ask/route.ts` SSE streaming endpoint.
  - Built `src/features/safety/EscalationBanner.tsx` (oxblood left border, shield icon, legal aid directory modal, "Prepare Lawyer Brief" CTA).
  - Built `src/features/ask/hooks/use-ask.ts` streaming hook.
  - Built `src/features/ask/components/AskPanel.tsx` with basis badges, CitationPills, starter prompts, and follow-ups.
  - Integrated into `WorkspaceView.tsx` rail.
  - Added unit test suites `tests/unit/retrieval.test.ts` (5 tests), `tests/unit/escalation.test.ts` (11 tests), `tests/integration/ask-api.test.ts` (4 tests), `tests/unit/ask-ui.test.tsx` (3 tests).
- Why: Complete Phase 3 Grounded Q&A requirement per brain.md §7 P4, §8, §9.
- Tests / evidence: All 149 tests passing, lint 0 errors, typecheck 0 errors, build passing.

### 2026-09-20 · Session 1 · Phase 4 — Prompt 13: Compare Two Documents complete
- What changed:
  - Built `src/core/comparison/similarity.ts` (Jaccard token similarity, heading similarity, composite scoring).
  - Built `src/core/comparison/diff.ts` (word-level deterministic diffing via `diff` library producing typed `DiffOp[]` and word stats).
  - Built `src/core/comparison/align.ts` (multi-pass greedy alignment algorithm detecting `unchanged`, `modified`, `added`, and `removed` clauses).
  - Built `src/core/prompts/compare.ts` (P5b pair explanation prompt, P5c comparison summary prompt, `COMPARE_PROMPT_VERSION = "2026-09-20.1"`).
  - Built `src/server/services/compare.ts` orchestrating alignment -> diffing -> batched P5b explanations -> citation verification -> P5c summary -> SSE event stream.
  - Built `app/api/compare/route.ts` Next.js SSE route handler.
  - Built `src/ui/patterns/RedlineText.tsx` semantic `<ins>` (green underline) and `<del>` (red strikethrough) redline renderer.
  - Built `src/features/compare/hooks/use-compare.ts` SSE client comparison hook.
  - Built `src/features/compare/components/TopChangesStrip.tsx` ("3 Changes That Matter Most" ranked card carousel with click-to-jump).
  - Built `src/features/compare/components/CompareRow.tsx` (aligned comparison unit showing status badge, redline diff, original draft toggle, what changed, favors pill, and citations).
  - Built `src/features/compare/components/CompareView.tsx` (screen with one-click lease v1 vs v2 loader, role picker, mode selector, and filter toolbar).
  - Built `app/(app)/compare/page.tsx` dedicated `/compare` route with header navigation.
  - Added test suites: `tests/unit/comparison.test.ts` (6 tests including golden lease v1 vs v2 test detecting all 5 planted changes), `tests/unit/redline.test.tsx` (3 tests), `tests/integration/compare-api.test.ts` (1 test).
- Why: Complete Phase 4 Compare requirement per brain.md §7 P5, architecture.md §5.3, design.md §7.5.
- Tests / evidence: All 160 tests passing, lint 0 errors, typecheck 0 errors, build passing.

### 2026-09-20 · Session 1 · Phase 5 — Prompt 14: Actions & Exports complete
- What changed:
  - Built P6 action prompt builders and schemas in `src/core/prompts/actions.ts`: `buildChecklistPrompt`, `buildLawyerBriefPrompt`, `buildOptionsPrompt`, `buildNegotiatePrompt`, `checklistActionOutputSchema`, `lawyerBriefActionOutputSchema`, `optionsActionOutputSchema`, `negotiateActionOutputSchema`, `ACTIONS_PROMPT_VERSION = "2026-09-20.1"`.
  - Extended domain schemas in `src/core/domain/schemas.ts` and `src/core/domain/index.ts` with `optionItemSchema`, `optionsResultSchema`, `negotiateSuggestionSchema`, `negotiateResultSchema`, `actionResultSchema`, `actionsRequestSchema`.
  - Built `src/server/services/actions.ts` orchestrating `checklist`, `lawyer_brief`, `options`, `negotiate` workflows with deterministic citation quote verification against source clauses.
  - Built `app/api/actions/route.ts` Next.js POST endpoint with rate-limiting, body size checks, and privacy-safe metadata logging.
  - Built `src/features/actions/exporters/ics-export.ts` mapping obligation checklist items to RFC-5545 iCalendar (`.ics`) file downloads using `ics` library.
  - Built action UI components in `src/features/actions/components/`:
    - `ChecklistTab.tsx`: Filter by owner & priority, toggle task completion, export to `.ics`, copy plain text.
    - `LawyerBriefView.tsx`: 2-page print stylesheet (`print:page-break-after`), clean black/white typography, copy text, non-removable disclaimer footer.
    - `OptionsTab.tsx`: Scenario input, starter scenario chips, grounded options with pros & cons, next steps, contractual deadlines, and counsel questions.
    - `NegotiateTab.tsx`: Flagged clauses breakdown, problem explanation, real-world impact, proposed compromise wording with one-click copy, and fallback positions.
    - `ActionsPanel.tsx`: Unified tabbed coordinator managing state, lazy loading, and error retries.
  - Built `src/features/actions/hooks/use-actions.ts` custom hook with action caching.
  - Wired Actions tab into `WorkspaceView.tsx` rail and connected `EscalationBanner.onPrepareBrief` to switch directly to the Actions panel.
  - Built dedicated printable `/brief` route at `app/(app)/brief/page.tsx` with header link from workspace.
  - Added unit and integration tests: `tests/unit/actions-prompts.test.ts` (9 tests), `tests/unit/ics-export.test.ts` (6 tests), `tests/integration/actions-api.test.ts` (5 tests).
- Why: Complete Phase 5 Actions & Exports requirement per brain.md §7 P6, architecture.md §5.3, docs/workthrough.md Phase 5.
- Tests / evidence: `npm run lint` ✅ (0 errors, 0 warnings), `npm run typecheck` ✅ (0 errors), `npm run test` ✅ (180/180 tests passing across 22 test suites), `npm run build` ✅ (Next.js 16.3.5 Turbopack production build succeeded with 10 routes).

### 2026-09-20 · Session 1 · Phase 6 — Prompt 15: Design & Shaders Polish complete
- What changed:
  - Built `src/features/landing/components/LandingHeroShader.tsx` running `marbleHeroFrag` (domain-warped fBm verde marble with brass veins, subtle pointer parallax, maxDpr 1.5, maxFps 30, and automatic CSS radial gradient fallback).
  - Built `src/features/landing/components/MiniPaperSheet.tsx` rendering a live Chambers & Paper interactive document preview card with Bates stamps, clause rows, and high/medium/low stamped index tabs.
  - Upgraded Landing page (`app/page.tsx`) per design.md §7.1 with hero copy, primary/secondary brass and dark outline CTAs, privacy guarantee, and 3 ruled sections (Understand, Compare, Prepare) featuring live interactive micro-snippets.
  - Updated `ShaderCanvas.tsx` to safely handle non-WebGL / JSDOM test environments without throwing console errors.
  - Integrated `riskAuraFrag` shader into `src/ui/patterns/IndexTab.tsx` to provide a subtle, organic pulsing aura glow behind selected index tabs.
  - Added unit test suite `tests/unit/landing-page.test.tsx` (3 tests).
  - Verified design QA checklist (`design.md` §13): token consistency, icon+label+color risk representation, sentence-case copy, WCAG AA contrast (≥ 4.5:1 with `--baize-950` scrim), keyboard navigation with visible focus rings, responsive mobile layouts, and reduced-motion static frame support.
- Why: Complete Phase 6 Design & Shaders requirement per design.md §6, §7.1, §12, §13, and docs/instruction.md Prompt 15.
- Tests / evidence: `npm run lint` ✅ (0 errors, 0 warnings), `npm run typecheck` ✅ (0 errors), `npm run test` ✅ (183/183 tests passing across 23 test suites), `npm run build` ✅ (compiled in 3.8s, 10 routes).
- Next step: Phase 7 — Prompt 16 & 17: Safety, Security Hardening & Evaluation Runners.

---

## 8. Known issues / tech debt

- CSS `@import` order warning in build output (Google Fonts `@import` inside `tokens.css` which is imported after `tailwindcss`). Fixed in `globals.css` — fonts import moved to top. Next build will be clean.
- `@testing-library/dom` required as explicit dev dep alongside `@testing-library/react` (installed).

---

## 9. Conversation notes (requirements, preferences, changes)

- User wants a **full plan** in files: memory, prd, architecture, code structure, security, tech stack, brain, workthrough, rules, design, instruction.
- User wants **modern legal-advocate UI/UX with a smooth experience**, plus generated **shaders, artifacts and assets** that the AI IDE must use.
- The solution must **inform and assist, not replace professional legal advice**. Original ideas are encouraged.
- **Groq API key** to be used — LLMProvider adapted to use `groq-sdk` with LLaMA 3.3-70B (main) and LLaMA 3.1-8B (fast).
- Use **npm** (not pnpm) — pnpm not installed.
- Scaffold in `lexlens/` subfolder.

---

## 10. Installed versions (Phase 0)

| Package | Version |
|---|---|
| Node.js | v24.11.1 |
| npm | 11.6.2 |
| Next.js | 16.3.5 |
| React | 19.2.8 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |
| Zod | ^4.6.5 |
| groq-sdk | ^1.6.0 |
| Vitest | ^3.2.7 |
| Zustand | ^5.0.15 |
| Dexie | ^4.4.6 |
| Motion | ^13.4.0 |

---

## 11. Glossary

| Term | Meaning |
|---|---|
| Clause | Smallest addressable unit of a document (section, sub-section or paragraph) with a stable ID `C<n>` |
| X-Ray | The risk-tagged, plain-language clause view of a single document |
| Perspective | Which party the user is (tenant, employee, freelancer, customer…) |
| Marginalia | UI rail of tabs/notes beside the paper sheet |
| Redline | Compare-mode diff: insertions blue double-underline, deletions red strikethrough |
| Lawyer Brief | One-page export: summary, key terms, risks, questions to ask a professional |
| Escalation trigger | Situation where the AI must urge professional/legal-aid help |

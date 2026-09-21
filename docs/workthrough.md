# workthrough.md — Build Walkthrough, User Walkthrough & Demo Script

Three walkthroughs in one file: **A)** how to build LexLens phase by phase, **B)** how a user moves through the product, **C)** how to demo it.
Timeline assumes a **48-hour hackathon** for one to three people working with an AI IDE. For 24 hours, use the **cut lines** in §A.10.

---

## A. Build walkthrough

### A.0 Ground rules
- Work phase by phase. A phase is "done" only when its **Definition of Done (DoD)** passes.
- At the end of every session: run `pnpm lint && pnpm typecheck && pnpm test`, update `memory.md`, commit.
- Vertical slices: get one document end-to-end early (ugly is fine), then deepen.

### A.1 Phase 0 — Setup (hours 0–3)
**Tasks**
1. Scaffold Next.js (TypeScript, App Router, Tailwind, ESLint) with pnpm.
2. Create folders per `code-structure.md`; add `AGENTS.md` pointer; copy `docs/`.
3. Copy assets: `assets/svg → public/svg`, `assets/shaders → src/ui/shaders/source`, `assets/css/tokens.css → src/styles/tokens.css`, `assets/components/ShaderCanvas.tsx → src/ui/shaders/`, `assets/scripts/build-shaders.mjs → scripts/`.
4. Wire tokens into Tailwind theme; load fonts (Literata, Public Sans) via `next/font`.
5. Add `env.ts` (Zod), `.env.example`, Husky + lint-staged + gitleaks, Vitest, Playwright skeleton.
6. Add `DisclaimerBar` and app shell (empty).
**DoD:** `pnpm dev` shows the shell with tokens applied; `pnpm build` passes; `pnpm shaders:build` generates `generated.ts`; `memory.md` updated with installed versions.

### A.2 Phase 1 — Ingest & Structure (hours 3–9)
**Tasks:** `core/domain` schemas · `core/parsing` (txt, docx, pdf worker) · `normalize.ts` · `segmentation` heuristics + merge/split · Dropzone + paste UI · paper sheet renders clauses with IDs · fixtures (synthetic docs).
**DoD:** all 5 fixtures parse; ≥ 90% clause-boundary accuracy on golden files; clicking a clause id highlights its span; unit tests green; errors are friendly for bad files.

### A.3 Phase 2 — Analyze & X-Ray (hours 9–18)
**Tasks:** `LLMProvider` + Anthropic adapter (tool-use, retry, repair) · prompts P0/P2/P3 · `/api/analyze` SSE · `useSSE` + `use-analysis-stream` · perspective picker · summary panel · marginalia risk tabs · filter/sort by risk · "Top 5 to check first".
**DoD:** upload a fixture → summary streams < 5 s → all clauses analysed < 30 s (20 pages) → risk tabs show icon+label+colour → changing role recomputes → verifier stats visible in debug drawer → mocked-LLM integration tests green.

### A.4 Phase 3 — Ask (hours 18–24)
**Tasks:** context builder (full vs BM25) · P4 prompt · citation verifier + tests · `/api/ask` SSE · chat UI with citation pills (hover → highlight span, click → scroll) · "General information" label · follow-up chips · escalation rules + banner.
**DoD:** golden Q&A ≥ 95% grounded or correct "not found"; unanswerable questions do not hallucinate; escalation cases trigger banner.

### A.5 Phase 4 — Compare (hours 24–31)
**Tasks:** align (type grouping + similarity) · jsdiff word diff · `RedlineText` component · `/api/compare` SSE · P5/P5b/P5c · side-by-side aligned view · "3 changes that matter" · added/removed/missing panel.
**DoD:** lease v1 vs v2 shows all 5 planted changes; unmatched clauses flagged; every pair cites both sides; redline conventions correct.

### A.6 Phase 5 — Actions (hours 31–36)
**Tasks:** `/api/actions` · checklist UI + `.ics` export · Lawyer Brief page with print stylesheet (2 pages) · options & next-steps (scenario chips) · copy/share buttons.
**DoD:** brief prints cleanly with disclaimer; `.ics` imports into a calendar; options cite the document.

### A.7 Phase 6 — Design & Shaders (hours 36–42) *(start a first pass earlier — see A.11)*
**Tasks:** marble hero · scan-beam analysis moment · paper sheet & margin rail polish · risk-tab reveal choreography · grain overlay · empty/error/loading states · mobile bottom-sheet · a11y pass (axe, keyboard, reduced motion) · performance pass.
**DoD:** design QA checklist in `design.md` §13 fully ticked; Lighthouse a11y ≥ 95; shaders pause off-screen and fall back gracefully.

### A.8 Phase 7 — Safety, Security, Evals (hours 42–45)
**Tasks:** CSP + headers · rate limits · injection eval suite · PII redaction toggle · "What we send" panel · "Clear everything" · log audit · `pnpm eval` report saved to `tests/evals/results`.
**DoD:** `security.md` §12 checklist ticked; eval gates in `brain.md` §14 met or documented with reasons.

### A.9 Phase 8 — Demo prep (hours 45–48)
**Tasks:** DEMO_MODE with cached results for all fixtures · rehearse the script (§C) twice · record backup video · prepare slides (problem → demo → architecture → responsibility → roadmap) · final deploy + smoke test on venue Wi-Fi & phone hotspot.
**DoD:** demo works offline-of-API via DEMO_MODE; backup video exported; README has run instructions and disclaimer.

### A.10 Cut lines (if time is short)
| Keep | Cut first |
|---|---|
| F-01 → F-08 (P0) | F-14 negotiation, F-13 consistency check |
| Marble hero + scan beam + marginalia tabs | Grain overlay, risk-aura shader |
| Compare with redline + top-3 changes | Compare "offers" mode |
| Lawyer Brief (print) | `.ics`, docx export |
| Escalation banner + citations verifier | Multilingual, read-aloud |

### A.11 Parallel work (if 2–3 people)
- **Person 1 (Core/AI):** phases 1–4 backend, prompts, evals.
- **Person 2 (UI/Design):** tokens, shell, paper sheet, shaders, marginalia, compare UI (starting from `DEMO_MODE` fixtures).
- **Person 3 (Product/Demo):** fixtures + goldens, copy, safety text, pitch, testing, demo mode.
Sync points: after Phase 1 (schemas frozen), after Phase 2 (SSE contract frozen).

---

## B. User walkthrough (screen by screen)

1. **Landing** — Marble hero animates in. Headline: *Know what you're signing.* Two actions: **Analyze a document** and **Try a sample**. A privacy line: "Your file is read in your browser. It is never stored on our servers."
2. **Workspace / Intake** — Dropzone (or paste). After a file is chosen: role picker ("I am the… tenant / landlord / employee / employer / freelancer / client / customer / other") and optional jurisdiction + language.
3. **Analysis moment** — The document appears as a vellum sheet; the **scan beam** sweeps down it; clause IDs get set as the beam passes; marginalia tabs pop in on the right edge, coloured by risk as results stream.
4. **Overview** — Summary strip (TL;DR + key facts with citation pills) and **Top things to check first** (up to 5 tabs).
5. **X-Ray** — Click a tab: the margin note expands with plain meaning, why it matters, questions to ask, confidence, verified quote. Toggle **Original / Plain**. Filter by risk.
6. **Ask** — Bottom-anchored input on the sheet's side panel. Streamed answer with citation pills; hovering a pill highlights the exact span on the sheet. "General information" and "Not found" states are visually distinct.
7. **Compare** — "Compare with another document": drop a second file; aligned two-column redline view; change list sorted by severity; **3 changes that matter**.
8. **Prepare** — "Prepare for a lawyer": review generated questions, edit, add notes, **Print / Save PDF**; "What are my options?" scenario chips → options with citations; Checklist → `.ics`.
9. **Trust controls** — Persistent disclaimer bar; Private mode toggle; What we send; Clear everything.

**Error/edge journeys:** unsupported file → specific message + supported formats; scanned PDF → OCR offer; huge file → size guidance; API failure → partial results + retry per clause; escalation trigger → banner + informational-only mode.

---

## C. Demo script (4 minutes)

| Time | Beat | What to show | Line |
|---|---|---|---|
| 0:00 | Hook | Landing hero | "Most of us sign contracts we can't fully read. LexLens gives you a lawyer's-eye view — without pretending to be a lawyer." |
| 0:30 | Understand | Drop synthetic lease → pick "tenant" → scan beam → tabs appear | "Notice it asks *who you are* — risk depends on your side of the table." |
| 1:15 | Proof | Open the red auto-renewal tab; hover citation pill; span highlights | "Every claim carries a verified quote. If it can't prove it, it says so." |
| 1:45 | Ask | "Can I leave early?" then an unanswerable question ("Is my landlord licensed?") | "Grounded answers, and honest 'not found'." |
| 2:15 | Compare | Lease v1 vs v2 → redline → "3 changes that matter" | "One subtle edit moved the deposit deduction rules against you." |
| 3:00 | Act | Lawyer Brief → print preview; checklist → calendar | "You walk into the lawyer's office prepared, and pay for advice, not for reading." |
| 3:30 | Responsibility | Disclaimer, escalation banner example, Private mode, What we send | "Information, not advice. Private by design." |
| 3:50 | Close | Roadmap slide | "Next: jurisdiction knowledge packs and legal-aid partnerships." |

**Backup plan:** `DEMO_MODE=1` (cached results), recorded video, screenshots in slides.

**Likely judge questions:** *How do you prevent hallucinations?* (clause-first, deterministic verifier, evals) · *Privacy?* (browser parsing, stateless server) · *Why not just ChatGPT?* (perspective-aware, verified citations, compare, brief, guardrails) · *Legal liability?* (information-only design, escalation) · *Scale?* (stateless, model tiering, caching).

---

## D. Pitch outline (5 slides)

1. Problem: people sign what they can't read; help is expensive.
2. Solution: LexLens — understand · compare · navigate · prepare.
3. Live demo (§C).
4. How it's trustworthy: clause-first, verified citations, privacy-by-architecture, escalation.
5. Impact & roadmap: legal-aid partners, jurisdiction packs, multilingual reach.

# prd.md — LexLens Product Requirements Document (v1.0)

## 1. Summary

**LexLens** is a GenAI assistant that helps ordinary people **understand, compare and navigate** legal documents — leases, employment offers, freelance contracts, NDAs, terms of service — without needing a law degree. It turns dense legal text into plain language, flags the clauses that matter for *you*, answers questions with proof from the document, compares versions or competing offers, and prepares you for a conversation with a professional.

**Tagline:** *Know what you're signing.*
**Positioning:** legal **information and assistance**, never legal advice. It shortens the path to a lawyer; it does not replace one.

## 2. Problem

- Legal documents are written for lawyers, not signers. People sign leases, offers and ToS they cannot fully read.
- Professional help is expensive and slow; most people only realise a clause mattered after it hurts them.
- Generic chatbots hallucinate legal claims, ignore *which party* the user is, and give no proof.
- Comparing two versions or two offers is tedious and error-prone even for experts.

**Who feels this most:** tenants, first-time employees, freelancers, small-business owners, students, gig workers, and community legal-aid volunteers with little time per case.

## 3. Vision & product principles

1. **Ground everything.** Every claim points to the clause it came from. No proof → say so.
2. **Your side of the table.** Analysis depends on who *you* are in the document.
3. **Plain language first, precision one click away.** Simple wording on top, original clause underneath.
4. **Calibrated honesty.** Show confidence; say "I can't tell from this document".
5. **Actionable.** Every screen ends with something the user can *do*: ask, negotiate, calendar, escalate.
6. **Private by default.** Documents stay in the user's browser unless they choose otherwise.
7. **Never a lawyer.** Information, options, questions — and clear escalation when stakes are high.

## 4. Personas

| Persona | Situation | Job to be done |
|---|---|---|
| **Riya, tenant** | Received a 14-page rental agreement, must sign in 2 days | "Tell me what I'm agreeing to and what to negotiate." |
| **Arjun, freelance designer** | Client sent a contract with IP and payment clauses | "Am I safe on payment terms and who owns my work?" |
| **Sam, new graduate** | Comparing two job offers with different non-compete and notice terms | "Which offer is riskier and why?" |
| **Meera, legal-aid volunteer** *(secondary)* | Sees 10 walk-ins a day | "Give me a fast structured brief so I can spend time on advice." |

## 5. Scope

**Goals (MVP):** document simplification, clause risk X-Ray, grounded Q&A, two-document comparison, actionable outputs (checklist, lawyer brief, next-step options), safety/guardrails, exceptional UX.

**Non-goals:** giving legal advice or predicting case outcomes; e-signing; drafting binding documents; representing users; storing user documents on servers; replacing jurisdiction-specific legal databases.

## 6. Features

Priority: **P0** must ship · **P1** should ship · **P2** stretch. IDs are referenced by tests, commits and `memory.md`.

| ID | Feature | Pri | Description |
|---|---|---|---|
| F-01 | Document intake | P0 | Upload PDF/DOCX/TXT, paste text, drag-and-drop. Parsed in the browser. Image/scan OCR is P1. |
| F-02 | Structure & type detection | P0 | Detect document type (lease, employment, NDA, freelance, ToS…), split into clauses with stable IDs. |
| F-03 | Plain-language summary | P0 | TL;DR, parties, term, money, key dates, how to exit — each with clause citations. |
| F-04 | **Clause X-Ray** | P0 | Every clause: plain meaning, risk level (High/Medium/Low/Info) *from the user's perspective*, why it matters, what to ask. |
| F-05 | Grounded Q&A | P0 | Ask anything about the document; answers cite verified clauses; explicit "not in this document" answers. |
| F-06 | **Compare** | P0 | Two documents (versions, offers, policy vs template): aligned clauses, redline diff, favourability shift, added/removed/missing clauses. |
| F-07 | Action outputs | P0 | Obligations & deadlines checklist; **Lawyer Brief** (summary, risks, questions) printable/PDF. |
| F-08 | Safety layer | P0 | Persistent disclaimer, confidence display, escalation triggers, prompt-injection resistance, citation verification. |
| F-09 | Simplify levels + glossary | P1 | "Explain like I'm 12 / plain / precise"; hover definitions for terms of art. |
| F-10 | Multilingual output | P1 | Explanations and Q&A in the user's language; original clause stays untouched. |
| F-11 | Options & next steps | P1 | Scenario prompts ("I want to leave early", "They paid late") → options the document allows, steps, deadlines, who to contact. |
| F-12 | Calendar export | P1 | Deadlines and notice periods → `.ics`. |
| F-13 | Internal consistency check | P1 | Contradictions, undefined terms, broken cross-references, missing standard clauses. |
| F-14 | Negotiation assist | P1 | Suggested alternative wording per risky clause, labelled as *suggestions to discuss*. |
| F-15 | Benchmark vs fair baseline | P2 | Compare against a neutral template for the doc type. |
| F-16 | Situation intake (no document) | P2 | Guided questions for a legal situation → general information and where to get help. |
| F-17 | Read-aloud / voice input | P2 | Accessibility and low-literacy support. |
| F-18 | Saved workspace | P2 | Local, encrypted history in IndexedDB. |
| F-19 | Change monitor | P2 | Paste updated ToS/policy → "what changed and does it matter to me". |

### Acceptance criteria (P0)

**F-01 Intake**
- Accepts PDF, DOCX, TXT ≤ 10 MB / ≤ 150 pages; rejects others with a specific, actionable error.
- Text extraction runs client-side; a progress state is shown for files > 2 MB.
- Password-protected or image-only PDFs produce a clear message (and OCR offer once F-01b ships).

**F-02 Structure**
- ≥ 90% of clauses in the sample set receive correct boundaries (measured by golden set).
- Each clause has `id`, `heading?`, `text`, `start`, `end`, `page?`.
- Clicking any clause reference in the UI scrolls to and highlights the exact span.

**F-03 Summary**
- Renders within 5 s of upload (streamed); reads at ≤ grade-8 level by default.
- Every fact chip (party, term, rent/fee, notice period, dates) has a citation pill.

**F-04 X-Ray**
- Each analysed clause shows: risk chip (icon + label + colour), plain summary, "why it matters", "questions to ask", confidence.
- Risk is recomputed when the user changes perspective/role.
- Filter and sort by risk; "Top 5 things to check first" pinned at top.

**F-05 Q&A**
- ≥ 95% of answers on the golden set contain ≥ 1 verified citation, or a correct "not found".
- Answers that rely on general legal knowledge (not the document) are visibly labelled **General information — laws vary by place**.
- Follow-up suggestions (3) after each answer.

**F-06 Compare**
- Clause alignment recall ≥ 85% on the golden pairs; unmatched clauses shown as Added / Removed.
- Redline convention: insertions blue double-underline, deletions red strikethrough.
- Every changed pair has: what changed (1 sentence), who it now favours, impact on *you*, citation to both sides.
- Summary: "3 changes that matter most".

**F-07 Actions**
- Checklist items have owner (you / other party), deadline (if any), citation.
- Lawyer Brief fits on 2 pages when printed; includes disclaimer, document meta, top risks, open questions, unknowns.

**F-08 Safety**
- Disclaimer visible on every AI output surface; cannot be dismissed permanently.
- Escalation trigger phrases (see `brain.md` §9) show a help banner and reduce the assistant to information-only mode.
- Injection test suite (`tests/evals/injection`) passes 100%.

## 7. Key user flows

1. **Understand:** Land → drop file → pick role ("I am the tenant") → scan animation → Summary + X-Ray → open a red tab → read plain meaning → ask a follow-up.
2. **Compare:** Workspace → "Compare" → drop second file → aligned redline view → "3 changes that matter" → export brief.
3. **Prepare:** After analysis → "Prepare for a lawyer" → review questions → edit → print/PDF.
4. **Decide:** "What are my options?" → pick scenario → options with citations and next steps → export checklist / `.ics`.

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | First streamed token < 3 s; 20-page doc fully analysed < 30 s; UI stays 60 fps during shaders on mid-range laptops |
| Reliability | Partial results are shown if some clauses fail; retries with backoff; graceful degradation to text-only |
| Accessibility | WCAG 2.2 AA; full keyboard navigation; risk never encoded by colour alone; reduced-motion honoured |
| Privacy | No server persistence of documents; no analytics that touch document content; one-click "Clear everything" |
| Security | See `security.md` |
| Responsiveness | 360 px → 1920 px; marginalia collapse into bottom sheet on mobile |
| i18n | UI strings extractable; RTL-safe layout tokens |
| Cost | ≤ ~$0.10 per 20-page analysis via model tiering + prompt caching (target) |

## 9. Content policy & legal boundaries

- Always frame output as *information*; never "you should sue/sign/refuse". Use "options to consider" and "questions to ask".
- Never assert jurisdiction-specific law without a provided source; otherwise label as general information.
- No prediction of legal outcomes. No drafting of documents intended to deceive, harass, or evade legal obligations.
- High-stakes triggers (arrest, court dates, eviction notice served, violence, immigration status, custody, injuries) → escalation banner + legal-aid guidance.

## 10. Success metrics

| Type | Metric | Target |
|---|---|---|
| Quality | Citation accuracy (quotes exist in cited clause) | 100% (enforced by verifier) |
| Quality | Risk agreement with lawyer-labelled samples | ≥ 80% within one level |
| Quality | Hallucinated-claim rate on golden Q&A | < 3% |
| UX | Time to first insight | < 10 s from drop |
| UX | Task success in usability test (5 people) | ≥ 4/5 complete "find the termination terms" |
| Demo | Judge "wow" moments | Scan reveal · redline compare · verified citations |

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated legal claims | Clause-grounded prompts, deterministic citation verification, "not found" path, evals |
| Users treat output as legal advice | Persistent disclaimers, wording rules, escalation, Lawyer Brief |
| Prompt injection inside documents | Untrusted-data wrapping, schema-only outputs, no side-effect tools, injection evals |
| Sensitive data exposure | Browser-side parsing, stateless server, log redaction, PII toggle |
| Jurisdiction variance | Ask jurisdiction; general-info labelling; curated notes optional |
| LLM latency/cost | Model tiering, batching, caching, streaming |
| Demo-day failure | Demo mode with cached sample analyses; recorded backup video |

## 12. Assumptions & dependencies

- Anthropic API access and key supplied by the team.
- Documents are mostly English at launch; other languages are P1.
- Browsers: latest Chrome, Edge, Safari, Firefox; WebGL 1 available (fallback exists).

## 13. Release plan

- **MVP (hackathon):** F-01 → F-08 with the full design system and shaders.
- **Demo-plus:** F-09, F-11, F-12, F-13 as time allows (see cut lines in `workthrough.md`).
- **Later:** P2 items, curated jurisdiction notes, accounts and sync.

## 14. Out of scope (explicit)

E-signature, lawyer marketplace, case-outcome prediction, court filings, real-time human chat, storing documents on a server.

## 15. Demo dataset (synthetic only — no real PII)

Generate and keep in `tests/fixtures/`:
1. **Residential lease** (14 clauses, includes auto-renewal, deposit deductions, entry rights) — v1 and a **v2 with 5 subtle changes** for compare.
2. **Freelance services agreement** (payment terms, IP assignment, unlimited revision, non-solicit).
3. **Employment offer letter** (probation, notice period, non-compete, bonus discretion).
4. **NDA** (one-sided vs mutual variant for compare).
5. **SaaS terms of service** (unilateral changes, arbitration, data licence).

Each fixture ships with a `.golden.json` (expected clauses, risks, Q&A pairs) used by evals.

## 16. Judging alignment

| Criterion | How LexLens answers it |
|---|---|
| Impact / accessibility | Plain language, multilingual, privacy-first, helps legal-aid volunteers |
| Innovation | Perspective-aware risk, verified citations, redline compare with favourability shift, marginalia UI |
| Technical depth | Clause-first pipeline, schema-constrained LLM outputs, SSE streaming, deterministic verifier, evals |
| UX & design | "Chambers & Paper" system, shader-driven hero and scan reveal, keyboard-first, accessible |
| Responsibility | Guardrails, escalation, privacy design, honest uncertainty |
| Feasibility | Clear MVP cut lines, demo mode fallback |

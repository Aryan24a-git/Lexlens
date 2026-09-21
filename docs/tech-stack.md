# tech-stack.md — Technology Stack

**Rule:** "latest stable" means: install the current stable major at scaffold time, then **pin exact versions via the lockfile**. Record the versions actually installed in `memory.md` (Session log) after Phase 0. Before adding any dependency not listed here, add it to this file with a reason.

## 1. Summary table

| Layer | Choice | Why | Alternatives considered |
|---|---|---|---|
| Language | **TypeScript** (strict) | Shared types front/back, Zod inference | JS |
| Framework | **Next.js** (App Router) + **React** | Full-stack in one repo, streaming, easy deploy | Vite + Express |
| Package manager | **pnpm** | Fast, strict, disk-efficient | npm, yarn |
| Styling | **Tailwind CSS** + CSS variables (`assets/css/tokens.css`) | Token-driven, fast to iterate | CSS Modules, vanilla-extract |
| UI primitives | **Radix UI** (via shadcn/ui *copy-in* components, restyled to our tokens) | Accessible behaviours; we own the styling | MUI, Chakra |
| Motion | **Motion** (Framer Motion) + CSS transitions | Layout animations, orchestrated reveals | GSAP |
| Shaders | **Raw WebGL** through `ShaderCanvas` (no dependency) | ~3 KB, full control, easy fallback | three.js, OGL, Pixi |
| Icons | Project sprite (`assets/svg/sprite.svg`) | Custom, consistent, tiny | lucide (fallback only) |
| Fonts | **Literata** (display + document text) · **Public Sans** (UI) via `next/font` | Literata is built for long-form screen reading; Public Sans is a neutral, institutional UI face | Inter, Fraunces |
| State | **Zustand** (UI/session) + **Dexie** (IndexedDB) | Minimal, typed, offline history | Redux, Jotai |
| Validation | **Zod** | Runtime + static types; JSON Schema for tool-use | Valibot, io-ts |
| LLM | **Anthropic SDK** (Claude) behind `LLMProvider` | Strong long-context reasoning, tool-use structured output, prompt caching, streaming | OpenAI/Gemini via other adapters |
| Parsing | **pdfjs-dist**, **mammoth**, **file-type**; OCR: **tesseract.js** (P1, lazy) | Client-side, private | Server parsing |
| Retrieval | **MiniSearch** (BM25) MVP; optional embeddings later | No infra; good for clause-level lookup | pgvector, Pinecone |
| Diff | **diff** (jsdiff) | Word-level deterministic redlines | custom |
| Export | Print CSS → PDF (browser); **ics**; optional **docx** | Zero-server exports | Puppeteer |
| Rate limit | **Upstash Ratelimit** (prod) / in-memory (dev) | Serverless friendly | custom |
| Testing | **Vitest**, **Testing Library**, **Playwright**, **axe-core**, custom eval runner | Fast + real-browser + quality evals | Jest, Cypress |
| Quality | **ESLint**, **Prettier**, **Husky + lint-staged**, **gitleaks** | Enforce standards & secrets hygiene | — |
| Hosting | **Vercel** (or Docker) | Zero-config preview + production | Netlify, Fly.io |

## 2. LLM configuration

| Env var | Purpose | Suggested default |
|---|---|---|
| `LLM_MODEL_MAIN` | Analysis, Q&A, compare, actions | `claude-sonnet-5` |
| `LLM_MODEL_FAST` | Doc-type classification, ambiguous-pair confirmation, escalation classifier | `claude-haiku-4-5-20251001` |
| `LLM_MODEL_DEEP` | Optional "Deep review" toggle for hardest clauses | `claude-opus-5` |

- Verify current model names and pricing in Anthropic's docs before demo day; keep names in env, never hard-coded.
- Use **tool-use with forced `tool_choice`** for structured output; **streaming** for Q&A text; **prompt caching** on the `<document>` prefix.
- Keep `temperature` low (0–0.3) for analysis; slightly higher (≤ 0.5) only for friendly rewording.

## 3. Frontend details

- **Next.js:** App Router, Server Components for static/marketing pages; workspace routes are client-heavy. Route handlers use `runtime = "nodejs"`.
- **Streaming client:** custom `useSSE` hook (fetch + `ReadableStream`, not `EventSource`, because we POST).
- **Virtualization:** `@tanstack/react-virtual` for clause lists > 100 items.
- **Forms:** plain controlled components; no `<form>`-heavy library needed.
- **Accessibility:** Radix + axe in CI; `aria-live="polite"` for streaming status.

## 4. Backend details

- **Route handlers** are thin; services in `server/services`.
- **SSE helper** sets `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`.
- **Concurrency limiter:** `p-limit` (concurrency 4) for batch analysis.
- **Retries:** custom `retry.ts` (exponential backoff + jitter) — avoid heavy libs.

## 5. Parsing notes

- Configure `pdfjs-dist` worker via `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)` and dynamic import inside client components only.
- Preserve **page numbers** and approximate reading order; drop repeated headers/footers.
- DOCX: prefer `mammoth.extractRawText` for clause segmentation; keep list numbering by using `convertToHtml` → text with numbering when needed.

## 6. Dev tooling

| Tool | Command |
|---|---|
| Dev server | `pnpm dev` |
| Lint / types | `pnpm lint` · `pnpm typecheck` |
| Unit + integration | `pnpm test` |
| E2E | `pnpm e2e` |
| Evals | `pnpm eval` |
| Shader build | `pnpm shaders:build` |
| Build | `pnpm build` |

`package.json` scripts must expose these names exactly (agents rely on them).

## 7. Suggested dependency list (install at scaffold)

```
runtime:  next react react-dom zod zustand dexie @anthropic-ai/sdk pdfjs-dist mammoth file-type
          minisearch diff p-limit motion clsx tailwind-merge class-variance-authority
          @radix-ui/react-* (as needed) @tanstack/react-virtual ics
          @upstash/ratelimit @upstash/redis   (prod rate limiting; optional in dev)
dev:      typescript vitest @testing-library/react @testing-library/user-event jsdom
          @playwright/test @axe-core/playwright eslint prettier husky lint-staged
          tailwindcss postcss autoprefixer (or the Tailwind version's recommended setup)
optional: tesseract.js  docx  (P1/P2, lazy-loaded)
```

## 8. Explicitly NOT using (and why)

| Not using | Reason |
|---|---|
| A server database | Privacy-first; unnecessary for MVP |
| LangChain / heavy agent frameworks | Opaque abstractions; our pipeline is explicit and testable |
| three.js | Our shaders are 2D fullscreen; raw WebGL is lighter |
| Third-party analytics/trackers | Sensitive domain; trust |
| Server-side PDF parsing | Would move raw documents to server |
| Vector DB (MVP) | Clause-level BM25 + long context is enough; add later if needed |

## 9. Browser support & performance budgets

- Latest 2 versions of Chrome, Edge, Safari, Firefox; iOS Safari 16+.
- Budgets: landing JS ≤ 180 KB gz (excluding lazy chunks), LCP ≤ 2.5 s on mid-range mobile, CLS < 0.05, shader frame time ≤ 4 ms on integrated GPU at DPR ≤ 1.5.
- Lazy-load: pdf.js, tesseract.js, export libs, marble shader (after first paint).

## 10. Environment variables (`.env.example`)

```
# --- LLM ---
ANTHROPIC_API_KEY=
LLM_MODEL_MAIN=claude-sonnet-5
LLM_MODEL_FAST=claude-haiku-4-5-20251001
LLM_MODEL_DEEP=claude-opus-5

# --- Limits ---
MAX_CLAUSES_PER_REQUEST=600
MAX_BODY_BYTES=2000000
LLM_TIMEOUT_MS=55000

# --- Rate limiting (optional in dev) ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# --- Flags ---
DEMO_MODE=0
DEBUG_PROMPTS=0
NEXT_PUBLIC_APP_NAME=LexLens
```

# Agent instructions

Before doing anything: read docs/memory.md, docs/rules.md, docs/instruction.md.
Build LexLens exactly as specified in docs/*. Never violate docs/rules.md.
After every task: run `npm run lint && npm run typecheck && npm run test`, then update docs/memory.md.
Ask the human when blocked or when a decision changes scope, security, legal wording or dependencies.

## Quick reference
- Stack: Next.js App Router · TypeScript strict · Tailwind · Zod · Groq SDK (LLaMA 3)
- LLM adapter: src/server/llm/ — always use LLMProvider interface, never import groq-sdk directly in features/ui
- Privacy invariant: NO document text in server logs, server DB, or analytics — ever
- All colours/type/space from src/styles/tokens.css via Tailwind theme — no raw hex in components
- Shaders via ShaderCanvas only (src/ui/shaders/ShaderCanvas.tsx)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

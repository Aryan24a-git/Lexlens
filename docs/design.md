# design.md — LexLens Design System ("Chambers & Paper")

Goal: a **modern legal-advocate** experience — authoritative, calm, precise — with a **smooth, confidence-building flow**. The interface should feel like sitting in a law library at night with a well-annotated document in front of you, not like a SaaS dashboard.

> The AI IDE **must** build UI from this document, `assets/css/tokens.css`, the SVG set, and the shaders listed in §5–§6. Do not substitute generic styling, stock icons or stock illustrations.

---

## 1. Concept

**Chambers & Paper.** A dark **verde-marble chamber** (the shell) holds a bright **vellum sheet** (the document). Around the sheet, the vernacular of real legal work becomes the UI:

| Legal vernacular | UI device |
|---|---|
| Binder **index tabs** flagging pages | Risk **IndexTabs** attached to the right edge of the paper (colour + icon + label) |
| **Marginalia** in a lawyer's margin | Expandable **MarginNote** beside each clause |
| **Bates stamps** on every page | Clause IDs (`C7`) stamped in the left gutter; **CitationPills** reuse the stamp |
| **Redlining** in Word/Track Changes | Compare view: insertions blue double-underline, deletions red strikethrough |
| **Highlighter** pass | Selected clause gets a marker-yellow underlay |
| **Exhibit** stickers | Verified quote badges ("Quote verified in C7") |
| **Green baize / verde marble / brass** of chambers | Shell background (shader), hairlines and focus rings |

**The one memorable moment:** the **analysis reveal** — a brass scan beam sweeps down the vellum sheet while index tabs are *stamped* onto its edge as results stream in. Everything else stays quiet.

## 2. Design plan review (why this isn't the default)

| First instinct | Problem | Revised choice |
|---|---|---|
| Navy + gold + ivory, big serif, gavel/scales clip-art | The generic "law firm template" | Verde marble + brass + vellum; no clip-art; vernacular devices (tabs, stamps, redlines) |
| Identical rounded cards for every insight | SaaS-card kit; hides hierarchy | Ruled lists, margin notes and tabs; radius varies by role (tabs 3 px on outer corners, paper 2 px, controls 8 px, chips pill) |
| Uppercase eyebrow labels, mono data labels, "→" on buttons | Template chrome | Sentence-case labels; tabular Public Sans for IDs; plain verb buttons |
| Fade-and-slide on every section, hover lift on every card | Reads as generated | One orchestrated reveal; motion otherwise responds to user actions |
| Single accented word in the headline | Common tell | Headline set as one voice |

## 3. Design tokens (authoritative file: `assets/css/tokens.css`)

### 3.1 Colour
| Token | Hex | Use |
|---|---|---|
| `--baize-950` | `#08201D` | Deepest shell, marble base |
| `--baize-900` | `#0F2B27` | App shell background |
| `--baize-800` | `#17403A` | Raised shell surfaces, marble mid |
| `--baize-700` | `#21574E` | Borders/hover on dark |
| `--brass-500` | `#BF9B52` | Hairlines, focus ring, logo, primary button fill on dark |
| `--brass-300` | `#DCC58C` | Highlights, hover on brass |
| `--brass-700` | `#8C6F35` | Brass text/accents on paper |
| `--vellum-100` | `#F2EFE6` | Paper sheet |
| `--vellum-200` | `#E6E1D3` | Rules, dividers on paper |
| `--vellum-300` | `#D3CCB9` | Borders on paper |
| `--ink-900` | `#16211F` | Text on paper |
| `--ink-700` | `#33423F` | Secondary text on paper |
| `--ink-500` | `#5B6B67` | Tertiary text (≥ 4.5:1 on vellum) |
| `--text-on-dark` | `#EDE9DC` | Primary text on shell |
| `--text-on-dark-2` | `#B8C2BC` | Secondary text on shell |
| `--risk-high` | `#A8323A` (oxblood) | High risk fill/icon/text on paper |
| `--risk-medium` | `#E9B824` (highlighter) | Medium fill (use **ink text** on it; never as text colour on paper) |
| `--risk-low` | `#2F8F74` (verdigris) fill · `#1F6F58` text | Low risk |
| `--risk-info` | `#5E7480` (slate) | Info |
| `--redline-insert` | `#1E5AA8` | Compare insertions |
| `--redline-delete` | `#B3262E` | Compare deletions |
| `--focus-ring` | `#DCC58C` on dark · `#1E5AA8` on paper | Focus outlines (2 px + 2 px offset) |

**Rules:** never encode risk by colour alone — always **icon + label + colour**. Brass is structural (lines, focus, brand); it never means "medium risk". Do not introduce new hues without updating tokens.

### 3.2 Typography
| Role | Family | Settings |
|---|---|---|
| Display & document text | **Literata** (variable, optical size) | Display: 500–600, tracking −0.02em, line-height 1.02–1.1 · Document: 400, 1.0625 rem / 1.7, measure 62–70ch |
| UI, controls, notes | **Public Sans** | 400/500/600, 0.9375 rem / 1.5; small 0.8125 rem |
| IDs & stamps | Public Sans 600 with `font-variant-numeric: tabular-nums`, tracking 0.04em | e.g. `C7`, `p.3` — sentence case, no all-caps |

Scale (rem): 0.8125 · 0.9375 · 1.0625 · 1.25 · 1.625 · 2.25 · clamp(2.75, 6vw, 5). Serif body text gets slightly more line-height than sans. Line length < 80 characters everywhere.

### 3.3 Space, radius, elevation
- **Space:** 4-pt base: 4, 8, 12, 16, 24, 32, 48, 72, 112.
- **Radius (by role, not global):** paper `2px`, index tab `0 3px 3px 0` (flush to the sheet edge, rounded outer corners), controls `8px`, chips `999px`, dialogs `12px`.
- **Elevation:** paper uses a layered, **green-tinted** shadow (see tokens: `--shadow-paper`) so it sits on the marble; controls use a 1 px brass hairline instead of shadows; no generic grey drop shadows.

### 3.4 Motion tokens
| Token | Value | Use |
|---|---|---|
| `--dur-micro` | 120 ms | Press, toggle |
| `--dur-std` | 220 ms | Expand/collapse, tab select |
| `--dur-emph` | 420 ms | Sheet enter, panel switch |
| `--dur-hero` | 900 ms | Landing entrance (once) |
| `--ease-settle` | `cubic-bezier(.2,.7,.2,1)` | Entrances, expansions |
| `--ease-std` | `cubic-bezier(.4,0,.2,1)` | State changes |
| `--ease-stamp` | `cubic-bezier(.3,1.6,.5,1)` | Index tab "stamp" (small overshoot) |

## 4. Layout system

- **Grid:** 12 columns, 24 px gutters desktop; 4 columns, 16 px mobile. Breakpoints: 360 · 640 · 960 · 1280 · 1600.
- **Workspace (≥ 1280):** `nav rail 72px | paper sheet (max 46rem, centred in remaining space) | margin rail 360px`. Tabs attach to the paper's right edge and extend into the margin rail.
- **< 960:** margin rail becomes a **bottom sheet** (drag to expand); tabs collapse into a horizontal risk strip above the sheet.
- **Alignment:** headings and body left-aligned; only the landing hero headline may be centred on mobile.

### Wireframes

```
LANDING (≥1280)                                        WORKSPACE (≥1280)
┌────────────────────────────────────────────┐       ┌──┬──────────────────────┬────────────┐
│ logo                        Sample · Privacy│       │  │  Summary strip       │ Margin rail│
│  [verde marble shader, full-bleed]          │       │N │ ┌──────────────────┐│  ┌───────┐ │
│                                             │       │a │ │ vellum sheet     │├─▶│tab: red│ │
│  Know what you're signing.        ┌──────┐  │       │v │ │ C1 …             │││  │note…  │ │
│  Upload a contract, lease or…     │sheet │  │       │  │ │ C2 …  ◀ scan     │├─▶│tab: amb│ │
│  [Analyze a document][Try sample] │with  │  │       │r │ │ C3 …  beam       │││  └───────┘ │
│  Your file is read in your browser│tabs  │  │       │a │ └──────────────────┘││  Ask box   │
│                                   └──────┘  │       │i │  Disclaimer bar     ││            │
└────────────────────────────────────────────┘       └──┴──────────────────────┴────────────┘

COMPARE
┌───────────────────────────────┬───────────────────────────────┐
│ Document A (older / offer 1)  │ Document B (newer / offer 2)  │
│ C4 Deposit …  ~~deduct 10%~~  │ C4 Deposit …  ═deduct any cost│  ◀ aligned rows, redline
├───────────────────────────────┴───────────────────────────────┤
│ 3 changes that matter · who it favours now · impact on you    │
└───────────────────────────────────────────────────────────────┘
```

## 5. Assets inventory (from `assets/`) and where to use them

| Asset | Path | Use it for |
|---|---|---|
| Logo (wordmark + mark) | `assets/svg/logo.svg` | Header, landing, print header of Lawyer Brief |
| Logo mark | `assets/svg/logo-mark.svg` | Nav rail, loading, avatar of "Guide" |
| Favicon | `assets/svg/favicon.svg` | `<link rel="icon" type="image/svg+xml">`, PWA icon source |
| Icon sprite | `assets/svg/sprite.svg` | All icons: `upload, risk-high, risk-medium, risk-low, clause, compare, checklist, briefcase, chat, translate, export, shield` via `<Icon name="…"/>` |
| Hero illustration | `assets/svg/hero-document-lens.svg` | Landing (no-WebGL fallback and mobile), marketing/OG image base |
| Empty state | `assets/svg/empty-upload.svg` | Dropzone empty state, workspace with no documents |
| Noise texture | `assets/svg/noise.svg` | CSS grain fallback: `background-image:url(/svg/noise.svg)`; paper tooth at 4–6% opacity |
| Tokens | `assets/css/tokens.css` | Import once in `globals.css` |
| Shader component | `assets/components/ShaderCanvas.tsx` | The only way to render shaders |
| Shader sources | `assets/shaders/*.frag`, `fullscreen.vert` | Converted by `pnpm shaders:build` |
| Live preview | `assets/preview/design-preview.html` | Open in a browser to see the intended look and motion; match it |

**Placement in the repo:** SVGs → `public/svg/`; shaders → `src/ui/shaders/source/`; `ShaderCanvas.tsx` → `src/ui/shaders/`; tokens → `src/styles/tokens.css`; build script → `scripts/build-shaders.mjs`.

## 6. Shader specification

All shaders are GLSL ES 1.00 (WebGL 1 compatible), animated via `uTime`, sized via `uResolution`, optional `uMouse` (0–1, bottom-left origin). Render only through `ShaderCanvas`.

| Shader | Where | Uniforms (defaults in brackets) | Notes |
|---|---|---|---|
| `marble-hero.frag` | Landing hero background; workspace shell header at low intensity | `uBase` [baize-950] · `uMid` [baize-800] · `uVein` [brass-500] · `uIntensity` [0.9 landing / 0.35 workspace] | Domain-warped fBm veins; very slow drift; subtle brass light following the pointer. Cap DPR 1.5, `maxFps` 30 in workspace |
| `scan-beam.frag` | Overlay on the PaperSheet during analysis | `uColor` [brass-300] · `uProgress` (0–1, **driven by real streaming progress**, eased) | Transparent canvas (`transparent`), `pointer-events:none`, unmounted when done |
| `risk-aura.frag` | Behind the *selected* IndexTab only | `uColor` [risk colour as vec3] · `uIntensity` [0.8] | One instance at a time; small canvas (≈ 96×96) |
| `paper-grain.frag` | Optional global film grain over shell (fixed, `pointer-events:none`) | `uAmount` [0.05] | Falls back to `noise.svg` |

**Rules**
1. **Max 3 live WebGL canvases** at once. Hero + grain, or paper scan + aura, never all four.
2. Pause when off-screen (IntersectionObserver — built into `ShaderCanvas`) and when the tab is hidden.
3. `prefers-reduced-motion`: render a **single static frame** (marble at t≈12 s; scan beam skipped, tabs appear without stamp).
4. No WebGL / context lost: show the CSS fallback — `background: radial-gradient(...)` from tokens + `noise.svg`, and the SVG hero illustration on landing.
5. Never put text directly on high-intensity veins: overlay a `--baize-950` scrim (≥ 55% opacity) behind text on landing.
6. Keep GPU cost low: `antialias:false`, `powerPreference:"low-power"`, DPR ≤ 1.5, `maxFps` 30 for background shaders.

## 7. Screens

### 7.1 Landing
- Full-bleed marble; headline **"Know what you're signing."** in Literata display; sub-copy ≤ 2 lines; two buttons (**Analyze a document** primary in brass, **Try a sample lease** secondary outline); privacy line under buttons with `shield` icon.
- Right side (≥ 960): a live **mini paper sheet** with three stamped tabs (high/medium/low) animating once on load using the same components as the app. Mobile: show `hero-document-lens.svg` instead.
- Header: logo, "How it works", "Privacy". No mega-nav.
- After the hero: three ruled sections (not cards): *Understand* (X-Ray), *Compare* (redline), *Prepare* (Lawyer Brief) — each with a real screenshot/live snippet, not stock art.

### 7.2 Intake
Centered Dropzone on baize with `empty-upload.svg`; accepts drop/paste/browse; then a compact **perspective picker** (role chips + "other"), jurisdiction & language selects (collapsed by default under "More context"). Primary action: **Analyze**.

### 7.3 Analysis (X-Ray)
Paper sheet centre; each clause block shows the **Bates stamp** (`C7`) in the left gutter, heading in Literata semibold, body in Literata. Selected clause: marker-yellow underlay (`--risk-medium` at 22%). IndexTabs on the right edge aligned vertically with their clauses (collision-avoiding stack). Margin rail shows the selected **MarginNote**: plain meaning · why it matters · questions to ask · confidence · verified quote badge · toggle Original / Plain. Summary strip sits above the sheet (TL;DR + fact list with citation pills). "Check first" list pinned in the rail (max 5).

### 7.4 Ask
Docked at bottom of the margin rail (mobile: full-height sheet). Streamed text; **CitationPills** inline; three follow-up chips; label chips: *From the document* · *General information* · *Not found* (each with icon + text). Hover a pill → span glows on the paper; click → scroll and select.

### 7.5 Compare
Two paper columns with aligned rows (row height sync). Row status marks in the gutter: unchanged (none), modified (redline), added (blue bar), removed (red bar). Bottom/side summary "3 changes that matter". Clicking a change opens its explanation in the margin rail with **who it favours now** and **impact on you**. Mode toggle: Versions · Offers · Against a template.

### 7.6 Prepare (Lawyer Brief, Checklist, Options)
Full-page vellum document view (print-ready). Editable question list. Buttons: **Print or save as PDF**, **Copy text**, **Add deadlines to calendar**. Print stylesheet: white background, no shell, brass hairlines in grey, logo top-left, disclaimer footer on every page.

### 7.7 Trust surfaces
- **DisclaimerBar** (bottom of paper/rail): *"LexLens gives legal information, not legal advice. For decisions that matter, talk to a qualified lawyer."* — cannot be permanently dismissed.
- **Privacy popover:** What we send · Private mode · Clear everything.
- **EscalationBanner:** oxblood left rule, `shield` icon, calm copy, "Find legal help" + "Create a Lawyer Brief".

## 8. Component specs (build in `src/ui/patterns/`)

| Component | Anatomy & behaviour |
|---|---|
| `PaperSheet` | Vellum surface, `--shadow-paper`, 2 px radius, paper tooth (`noise.svg` 5%), padding 56 px desktop / 20 px mobile; slot for scan overlay |
| `ClauseBlock` | Gutter stamp (`C7`), heading, text; states: default · hover (stamp brightens) · selected (highlighter underlay) · dimmed (when filtering) |
| `IndexTab` | 44 px tall × 28–120 px wide; attaches flush to sheet edge; icon + short label on hover/selected; risk colour fill with ink/white text per contrast; **stamp-in** animation; `aria-pressed` for selection; keyboard: ↑/↓ moves, Enter opens |
| `MarginNote` | Rule-separated sections, no card chrome; sections: Plain meaning, Why it matters, Ask about, Original quote (verified badge), Confidence (5-segment `ConfidenceMeter`) |
| `CitationPill` | Inline pill with stamp (`C7`) + ✔ icon when verified; hover highlights span; `aria-label="Citation C7, quote verified"` |
| `RiskChip` | Pill: icon + text (High/Medium/Low/Info) — never colour only |
| `RedlineText` | `<ins>` → blue double underline; `<del>` → red strikethrough; both keyboard-inspectable with `aria-label` ("inserted", "deleted") |
| `Dropzone` | Dashed brass hairline on baize, hover glow, states: idle · dragging · parsing (progress) · error (plain message + fix) |
| `ScanOverlay` | Wraps `ShaderCanvas(scan-beam)`; progress bound to streaming; announces "Analysed 12 of 31 clauses" via `aria-live="polite"` |
| `ProgressTimeline` | Only for real sequences: Read → Structure → Analyse → Summarise |
| `PerspectivePicker` | Role chips (radio group), "Other…" input; changing role triggers re-analysis with a confirm toast |
| `EscalationBanner`, `DisclaimerBar`, `ConfidenceMeter`, `GlossaryTip`, `Toast` | Per §7.7 and §10 |
| Skeletons | Ruled lines shimmering **once** then static (reduce motion = static) |

## 9. Motion choreography

1. **Landing (once, 900 ms):** marble fades from `--baize-950`; headline appears as one block (opacity + 8 px settle); mini-sheet tabs stamp in sequentially (80 ms stagger, `--ease-stamp`).
2. **Analysis reveal (the signature moment):**
   1. Sheet enters (420 ms, settle).
   2. Scan beam starts at top; its `uProgress` follows `analyzedClauses/totalClauses` (eased, min 1.2 s total so it never flashes).
   3. As each clause result arrives, its stamp fills brass and its IndexTab **stamps** in (scale 1.08 → 1, 160 ms, `--ease-stamp`, 60 ms stagger).
   4. Beam fades out (300 ms); the "Check first" list slides into the rail (220 ms).
3. **Selecting a tab/clause:** `risk-aura` glow behind the tab (220 ms), sheet auto-scrolls smoothly to the clause (respect reduced motion → instant), margin note expands (220 ms).
4. **Citation hover:** span underlay fades in (120 ms).
5. **Compare:** rows resolve from blank to text as pairs are explained (opacity only); the "3 changes" list highlights rows on hover.
6. **Everything else:** no entrance animations. Hover states change colour/underline only.

## 10. Accessibility & inclusivity

- WCAG 2.2 AA minimum; check every token pair (dark and paper). Body ≥ 4.5:1, large text/icons ≥ 3:1.
- Focus: 2 px ring + 2 px offset using `--focus-ring`; never removed.
- Keyboard: all flows operable; tab order follows visual order; IndexTabs are a roving-tabindex group; Esc closes overlays.
- Screen readers: landmarks (`header, nav, main, aside`), clause blocks as `article` with `aria-labelledby`, streaming status `aria-live="polite"`, verified badge text not icon-only.
- Reduced motion: honour `prefers-reduced-motion` globally (shader static frame, no stamp, instant scroll).
- Colour-blind safe: risk identified by icon shape (triangle / circle / shield / dot) + text.
- Touch targets ≥ 44 px. Text resizable to 200% without loss. Dyslexia-friendly option: switch document font to Public Sans with 1.8 line-height (toggle in settings).
- Plain language reading level (grade 8) for all UI copy.

## 11. Copy & voice (design content)

Plain verbs, sentence case, specific, no filler, no apologies in errors.

| Situation | Copy |
|---|---|
| Hero | **Know what you're signing.** / Upload a contract, lease or policy. LexLens explains it in plain language, flags the clauses that put you at risk, and helps you prepare to talk to a lawyer. |
| Primary / secondary CTA | Analyze a document · Try a sample lease |
| Dropzone empty | Drop a lease, contract or policy here. PDF, Word or plain text, up to 10 MB. |
| Privacy line | Your file is read in your browser and never stored on our servers. |
| Role prompt | Which side are you on? Risk depends on who you are in this document. |
| Scanning status | Reading clause 12 of 31 |
| Verified badge | Quote verified in C7 |
| Not found | This document doesn't say. Here are the closest clauses. |
| General info label | General information. Laws vary by place and change over time. |
| Scanned PDF error | This PDF has no selectable text, so it may be a scan. Run text recognition to read it. It stays on your device. |
| File too large | This file is over 10 MB. Split it or paste the sections you need. |
| API failure | We couldn't analyse 3 clauses. Retry them or continue with the rest. Reference: {requestId} |
| Escalation | This may be urgent. A lawyer or legal-aid service can act on deadlines this tool can't. |
| Disclaimer | LexLens gives legal information, not legal advice. For decisions that matter, talk to a qualified lawyer. |

Naming stays consistent: **Analyze**, **Compare**, **Prepare** — the same words in buttons, toasts and headings.

## 12. Instructions to the AI IDE — how to use shaders, artifacts and assets

1. **Set up once:** copy assets per §5; run `pnpm shaders:build`; import `styles/tokens.css` in `globals.css`; map tokens into the Tailwind theme (`colors.baize/brass/vellum/ink/risk`, `fontFamily.display/ui`, `boxShadow.paper`, `transitionTimingFunction.settle/stamp`).
2. **Render shaders only with `ShaderCanvas`:**
   ```tsx
   import { ShaderCanvas, hexToVec3 } from "@/ui/shaders/ShaderCanvas";
   import { marbleHeroFrag } from "@/ui/shaders/generated";

   <div className="relative isolate overflow-hidden bg-baize-900">
     <ShaderCanvas
       fragment={marbleHeroFrag}
       uniforms={{
         uBase: hexToVec3("#08201D"), uMid: hexToVec3("#17403A"),
         uVein: hexToVec3("#BF9B52"), uIntensity: 0.9,
       }}
       interactive maxFps={30} className="absolute inset-0 -z-10" ariaLabel="" />
     {/* scrim + content */}
   </div>
   ```
   Scan beam: `<ShaderCanvas transparent fragment={scanBeamFrag} uniforms={{ uProgress, uColor: hexToVec3("#DCC58C") }} className="pointer-events-none absolute inset-0" />` inside `PaperSheet`.
3. **Icons:** create `<Icon name="risk-high" />` that renders `<svg><use href="/svg/sprite.svg#risk-high" /></svg>` with `currentColor`; size via Tailwind (`size-5`).
4. **Never** hand-pick hex values in components; use token classes. **Never** add stock illustrations or emoji as UI graphics.
5. **Reference the preview:** open `assets/preview/design-preview.html`; reproduce its spacing, type, colour and motion in the React components. If in doubt, match the preview.
6. **Build order:** tokens → typography → `PaperSheet` + `ClauseBlock` → `IndexTab` + `MarginNote` → `ScanOverlay` → landing hero → compare `RedlineText` → print stylesheet.
7. **Respect fallbacks:** implement the no-WebGL and reduced-motion paths for every shader usage before marking a UI task done.
8. **Screenshots:** when the environment supports it, take screenshots at 360, 768, 1440 px and compare against §7 and the preview before finishing.

## 13. Design QA checklist

- [ ] Only token colours/type/space used; no stray hex or px
- [ ] Risk shown by icon + label + colour everywhere
- [ ] Headline, buttons, labels are sentence case; no all-caps labels, no "→" in buttons
- [ ] Only one orchestrated motion moment (analysis reveal) + landing entrance; no scattered entrance animations
- [ ] Shaders: ≤ 3 canvases, pause off-screen, DPR cap, reduced-motion static frame, no-WebGL fallback
- [ ] Contrast checked for every text/background pair (dark and paper)
- [ ] Keyboard: full flow without a mouse; focus always visible
- [ ] 360 px, 768 px, 1440 px layouts verified; margin rail becomes a bottom sheet on mobile
- [ ] Loading, empty, error, partial-result, escalation states designed
- [ ] Print view of Lawyer Brief is clean (2 pages, disclaimer on every page)
- [ ] Disclaimer, verified badges and "General information" labels present on all AI surfaces
- [ ] Lighthouse: a11y ≥ 95, performance ≥ 85 on landing

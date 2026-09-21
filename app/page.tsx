import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/ui/icons/Icon";
import { LandingHeroShader, MiniPaperSheet } from "@/features/landing";

export const metadata: Metadata = {
  title: "LexLens — Know what you're signing",
  description:
    "GenAI legal document assistant. Understand complex agreements, compare redlines, and prepare actionable consultation briefs with 100% verified clause citations.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--baize-950)] text-[var(--text-on-dark)]">
      {/* ===== Header ===== */}
      <header
        className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-[var(--brass-500)]/20 bg-[var(--baize-950)]/80 backdrop-blur"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-[var(--brass-300)] rounded"
          aria-label="LexLens Home"
        >
          <Image
            src="/svg/logo-mark.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
            aria-hidden="true"
            unoptimized
          />
          <Image
            src="/svg/logo.svg"
            alt="LexLens"
            width={110}
            height={24}
            className="h-6 w-auto hidden sm:block opacity-90"
            unoptimized
          />
        </Link>

        <nav aria-label="Site navigation">
          <ul className="flex items-center gap-6 list-none m-0 p-0 text-xs font-ui text-[var(--text-on-dark-2)]">
            <li>
              <Link
                href="#how-it-works"
                className="hover:text-[var(--brass-300)] transition-colors"
              >
                How it works
              </Link>
            </li>
            <li>
              <Link
                href="/compare"
                className="hover:text-[var(--brass-300)] transition-colors"
              >
                Compare
              </Link>
            </li>
            <li>
              <Link
                href="/brief"
                className="hover:text-[var(--brass-300)] transition-colors"
              >
                Lawyer Brief
              </Link>
            </li>
            <li>
              <Link
                href="/workspace"
                className="hover:text-[var(--brass-300)] transition-colors"
              >
                Document Reader
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* ===== Hero Section with fBm Verde Marble WebGL Shader ===== */}
      <section
        className="relative flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 px-6 py-16 lg:px-20 lg:py-24 overflow-hidden"
        aria-labelledby="hero-headline"
      >
        {/* WebGL fBm Verde Marble background with dark scrim */}
        <LandingHeroShader intensity={0.9} />

        {/* ===== Left: Copy & Actions ===== */}
        <div className="max-w-xl flex flex-col gap-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--baize-900)]/90 border border-[var(--brass-500)]/40 text-xs text-[var(--brass-300)] mx-auto lg:mx-0 w-fit">
            <span className="size-2 rounded-full bg-[var(--brass-400)] animate-pulse" />
            <span className="font-ui font-medium">Document Intelligence for Everyone</span>
          </div>

          <h1
            id="hero-headline"
            className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.06] tracking-tight text-[var(--text-on-dark)]"
          >
            Know what you&rsquo;re signing.
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-[var(--text-on-dark-2)] max-w-prose">
            Upload a contract, lease, or policy. LexLens explains it in plain
            language, flags clauses that create asymmetric risk, highlights critical
            redlines, and prepares you for a productive legal consultation.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[var(--brass-500)] hover:bg-[var(--brass-400)] text-[var(--baize-950)] font-ui font-bold text-sm shadow-md hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-[var(--brass-300)]"
            >
              <Icon name="upload" className="size-4" aria-hidden={true} />
              <span>Analyze a document</span>
            </Link>

            <Link
              href="/compare"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md border border-[var(--brass-500)]/50 bg-[var(--baize-900)]/70 hover:bg-[var(--baize-800)] text-[var(--text-on-dark)] text-sm font-medium transition-colors"
            >
              <Icon name="compare" className="size-4" aria-hidden={true} />
              <span>Compare two drafts</span>
            </Link>
          </div>

          {/* Privacy & Grounding Guarantees */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-[var(--text-on-dark-2)] pt-1">
            <span className="flex items-center gap-1.5">
              <Icon name="shield" className="size-3.5 text-[var(--brass-400)]" aria-hidden={true} />
              Processed locally in browser · Never stored
            </span>
            <span className="hidden sm:inline text-[var(--baize-700)]">•</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[var(--brass-400)] font-bold">✓</span>
              100% deterministic quote verification
            </span>
          </div>
        </div>

        {/* ===== Right: Live Mini Paper Sheet (Desktop ≥ lg) ===== */}
        <div className="hidden lg:flex flex-col items-end z-10" aria-hidden="true">
          <MiniPaperSheet />
        </div>

        {/* Mobile: Hero SVG Illustration Fallback */}
        <div className="lg:hidden flex justify-center z-10" aria-hidden="true">
          <Image
            src="/svg/hero-document-lens.svg"
            alt=""
            width={320}
            height={160}
            className="h-36 w-auto opacity-80"
            unoptimized
          />
        </div>
      </section>

      {/* ===== Three Ruled Sections with Real Micro-Snippets ===== */}
      <section
        id="how-it-works"
        className="px-6 lg:px-20 py-16 border-t border-[var(--brass-500)]/20 bg-[var(--baize-950)]"
        aria-labelledby="how-heading"
      >
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--brass-400)] font-semibold">
            Chambers &amp; Paper
          </span>
          <h2
            id="how-heading"
            className="font-display text-2xl sm:text-3xl text-[var(--text-on-dark)]"
          >
            How LexLens protects you
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-on-dark-2)]">
            Bridging complex legal legalese and plain language without replacing qualified legal counsel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--brass-500)]/20 border-y border-[var(--brass-500)]/20">
          {/* Section 1: Understand (X-Ray) */}
          <article className="p-6 lg:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--brass-400)]">
                <Icon name="clause" className="size-5" aria-hidden={true} />
                <h3 className="font-serif text-lg font-bold text-[var(--text-on-dark)]">
                  Understand
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-on-dark-2)]">
                Every clause is tagged with its Bates stamp, analyzed from your party&rsquo;s perspective,
                and translated into plain meaning. Risks are flagged with distinct shapes and verified citations.
              </p>
            </div>

            {/* Live Micro-Snippet: X-Ray Clause Breakdown */}
            <div className="p-3.5 rounded-lg bg-[var(--vellum-50)] text-[var(--ink-900)] border border-[var(--brass-500)]/40 shadow-sm space-y-2 font-ui text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--vellum-200)] text-[var(--ink-700)]">
                  C7
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[var(--risk-high)]/15 text-[var(--risk-high)] border border-[var(--risk-high)]/30">
                  HIGH RISK
                </span>
              </div>
              <p className="font-serif text-[11px] font-semibold text-[var(--ink-900)]">
                Automatic 12-Month Renewal Trap
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-600)]">
                <span className="px-1.5 py-0.5 rounded bg-[var(--vellum-200)] text-[var(--risk-low-text)] font-bold">
                  ✓ C7 verified
                </span>
                <span className="italic truncate">&ldquo;renews for 12 months...&rdquo;</span>
              </div>
            </div>
          </article>

          {/* Section 2: Compare (Redlines) */}
          <article className="p-6 lg:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--brass-400)]">
                <Icon name="compare" className="size-5" aria-hidden={true} />
                <h3 className="font-serif text-lg font-bold text-[var(--text-on-dark)]">
                  Compare
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-on-dark-2)]">
                Compare counteroffers, revisions, or against a tenant-friendly baseline. Word-level
                redlines show what was inserted or stricken, and who the change favors.
              </p>
            </div>

            {/* Live Micro-Snippet: Redline Diff Row */}
            <div className="p-3.5 rounded-lg bg-[var(--vellum-50)] text-[var(--ink-900)] border border-[var(--brass-500)]/40 shadow-sm space-y-2 font-ui text-xs">
              <div className="flex items-center justify-between">
                <span className="font-serif text-[11px] font-bold text-[var(--ink-900)]">
                  Notice to Vacate
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--risk-high)]/10 text-[var(--risk-high)] font-medium">
                  Favors Landlord
                </span>
              </div>
              <div className="p-2 rounded bg-white border border-[var(--vellum-200)] text-[11px] leading-snug font-serif">
                Tenant must give{" "}
                <del className="bg-[var(--risk-high)]/20 text-[var(--risk-high)] line-through px-1 rounded">
                  30 days
                </del>{" "}
                <ins className="bg-[var(--risk-low)]/20 text-[var(--risk-low-text)] font-semibold underline px-1 rounded">
                  60 days
                </ins>{" "}
                written notice.
              </div>
            </div>
          </article>

          {/* Section 3: Prepare (Actions & Brief) */}
          <article className="p-6 lg:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--brass-400)]">
                <Icon name="briefcase" className="size-5" aria-hidden={true} />
                <h3 className="font-serif text-lg font-bold text-[var(--text-on-dark)]">
                  Prepare
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-on-dark-2)]">
                Generate an executive 2-page Lawyer Brief to take to your attorney, download actionable
                deadlines directly to your calendar (.ics), and explore scenario options.
              </p>
            </div>

            {/* Live Micro-Snippet: Lawyer Brief Dossier */}
            <div className="p-3.5 rounded-lg bg-[var(--vellum-50)] text-[var(--ink-900)] border border-[var(--brass-500)]/40 shadow-sm space-y-2 font-ui text-xs">
              <div className="flex items-center justify-between">
                <span className="font-serif text-[11px] font-bold text-[var(--ink-900)]">
                  Consultation Brief
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--brass-500)] text-[var(--baize-950)] font-bold">
                  2 Pages
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-700)] italic">
                &ldquo;1. Review enforceability of 12h landlord entry clause...&rdquo;
              </p>
              <div className="pt-1 flex items-center justify-between border-t border-[var(--vellum-200)] text-[10px] text-[var(--ink-500)]">
                <span>Printable PDF</span>
                <span className="text-[var(--brass-700)] font-semibold">+ .ics calendar</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ===== Call To Action Strip ===== */}
      <section
        className="px-6 lg:px-20 py-16 text-center flex flex-col items-center gap-4 bg-[var(--baize-900)]/60 border-t border-[var(--brass-500)]/20"
      >
        <h3 className="font-display text-2xl sm:text-3xl text-[var(--text-on-dark)]">
          Ready to review your agreement?
        </h3>
        <p className="text-[var(--text-on-dark-2)] text-xs sm:text-sm max-w-md">
          No signup or payment required. Drop a PDF, DOCX, or paste text to start.
        </p>
        <Link
          href="/workspace"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md bg-[var(--brass-500)] hover:bg-[var(--brass-400)] text-[var(--baize-950)] font-ui font-bold text-sm shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-[var(--brass-300)]"
        >
          <Icon name="upload" className="size-4" aria-hidden={true} />
          <span>Analyze a document now</span>
        </Link>
      </section>
    </div>
  );
}

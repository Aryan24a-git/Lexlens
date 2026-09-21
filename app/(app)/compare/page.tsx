import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CompareView } from "@/features/compare";

export const metadata: Metadata = {
  title: "Compare Documents & Redline — LexLens",
  description:
    "Compare two contract drafts, agreements, or competing offers with word-level redline diffing, aligned clauses, and substantive risk explanations.",
};

export default function ComparePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--baize-950)] text-[var(--text-on-dark)]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-[var(--baize-950)]/90 backdrop-blur border-b border-[var(--brass-500)]/20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/svg/logo-mark.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 transition-transform group-hover:scale-105"
              aria-hidden="true"
              unoptimized
            />
            <Image
              src="/svg/logo.svg"
              alt="LexLens"
              width={100}
              height={20}
              className="h-5 w-auto hidden sm:block opacity-90 group-hover:opacity-100"
              unoptimized
            />
          </Link>
          <span className="text-xs text-[var(--text-on-dark-2)] pl-2 border-l border-[var(--baize-700)]">
            Redline &amp; Compare
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--baize-700)] text-[var(--text-on-dark-2)] hover:border-[var(--brass-500)] hover:text-[var(--text-on-dark)] transition-colors"
          >
            <span>Switch to Reader &amp; X-Ray</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {/* Main Compare Content */}
      <main id="main-content" className="flex-1 w-full px-4 md:px-8 py-8 md:py-10">
        <CompareView />
      </main>
    </div>
  );
}

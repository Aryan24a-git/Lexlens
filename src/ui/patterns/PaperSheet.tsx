import React from "react";
import { cn } from "@/lib/utils";

export interface PaperSheetProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  pageCount?: number;
  headerSlot?: React.ReactNode;
  overlaySlot?: React.ReactNode;
  className?: string;
}

/**
 * PaperSheet — The primary legal document reading surface. (design.md §5, §8)
 * Vellum surface, --shadow-paper, paper tooth grain via noise.svg, 56px desktop / 20px mobile padding.
 */
export function PaperSheet({
  children,
  title,
  subtitle,
  pageCount,
  headerSlot,
  overlaySlot,
  className,
}: PaperSheetProps) {
  return (
    <div className="relative w-full max-w-4xl mx-auto my-6">
      {/* Paper sheet container */}
      <article
        className={cn(
          "relative w-full rounded-[var(--radius-sm,2px)] bg-[var(--vellum-100,#f2efe6)] text-[var(--ink-900,#16211f)]",
          "shadow-[var(--shadow-paper)] border border-[var(--brass-500)]/20",
          "p-5 md:p-14 transition-all duration-200 overflow-hidden",
          className
        )}
        style={{
          boxShadow: "var(--shadow-paper)",
        }}
      >
        {/* Subtle paper tooth noise texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] select-none"
          style={{
            backgroundImage: "url('/svg/noise.svg')",
            backgroundRepeat: "repeat",
          }}
          aria-hidden="true"
        />

        {/* Scan beam overlay slot */}
        {overlaySlot && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
            {overlaySlot}
          </div>
        )}

        {/* Optional header bar on paper */}
        {(title || headerSlot) && (
          <header className="relative z-20 pb-8 mb-8 border-b border-[var(--vellum-300,#d3ccb9)] flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
            <div>
              {title && (
                <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-[var(--ink-900,#16211f)]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs font-sans text-[var(--ink-500,#5b6b67)] mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {pageCount !== undefined && (
                <span className="text-xs font-sans tracking-wide uppercase px-2.5 py-1 rounded bg-[var(--vellum-200,#e6e1d3)] text-[var(--ink-700,#33423f)] border border-[var(--vellum-300,#d3ccb9)]">
                  {pageCount} {pageCount === 1 ? "Page" : "Pages"}
                </span>
              )}
              {headerSlot}
            </div>
          </header>
        )}

        {/* Document body content */}
        <div className="relative z-20 space-y-6">{children}</div>
      </article>
    </div>
  );
}

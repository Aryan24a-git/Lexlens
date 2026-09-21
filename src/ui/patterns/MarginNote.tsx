"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RiskChip } from "./RiskChip";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { CitationPill } from "./CitationPill";
import type { Clause, ClauseAnalysis } from "@/core/domain/schemas";

export interface MarginNoteProps {
  analysis: ClauseAnalysis;
  clause?: Clause | undefined;
  onClose?: (() => void) | undefined;
  onCitationClick?: ((clauseId: string) => void) | undefined;
  className?: string | undefined;
}

const FAVORS_LABELS: Record<string, { text: string; badgeClass: string }> = {
  you: {
    text: "Favours You",
    badgeClass: "bg-[var(--risk-low)]/20 text-[var(--risk-low-text)] border-[var(--risk-low)]/30",
  },
  other_party: {
    text: "Favours Other Party",
    badgeClass: "bg-[var(--risk-high)]/20 text-[var(--risk-high)] border-[var(--risk-high)]/30",
  },
  balanced: {
    text: "Balanced / Mutual",
    badgeClass: "bg-[var(--brass-500)]/20 text-[var(--brass-700)] border-[var(--brass-500)]/30",
  },
  unclear: {
    text: "Unclear / Context-dependent",
    badgeClass: "bg-[var(--ink-500)]/20 text-[var(--ink-700)] border-[var(--ink-500)]/30",
  },
};

export function MarginNote({
  analysis,
  clause,
  onClose,
  onCitationClick,
  className,
}: MarginNoteProps) {
  const [viewMode, setViewMode] = useState<"plain" | "original">("plain");

  const favorsInfo =
    FAVORS_LABELS[analysis.risk.favors] ?? FAVORS_LABELS.unclear!;

  const readableType = analysis.canonicalType.replace(/_/g, " ");

  return (
    <aside
      className={cn(
        "flex flex-col gap-4 p-5 rounded-lg border bg-[var(--vellum-100)] border-[var(--brass-500)]/30 text-[var(--ink-900)] shadow-sm font-ui transition-all",
        className
      )}
      aria-label={`Analysis for clause ${analysis.clauseId}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--brass-500)]/25 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-[var(--vellum-300)] font-mono text-xs font-bold text-[var(--ink-900)] border border-[var(--brass-700)]/30">
            {analysis.clauseId}
          </span>
          <RiskChip level={analysis.risk.level} size="sm" />
          <span className="text-xs uppercase tracking-wider text-[var(--ink-500)] font-medium">
            {readableType}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--ink-500)] hover:text-[var(--ink-900)] p-1 rounded hover:bg-[var(--vellum-200)] transition-colors"
            aria-label="Close note"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── View Toggle (Original vs Plain) ── */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brass-700)]">
          {viewMode === "plain" ? "Plain English Meaning" : "Original Legal Text"}
        </span>
        <div className="inline-flex rounded-md border border-[var(--brass-500)]/40 p-0.5 bg-[var(--vellum-200)] text-xs">
          <button
            type="button"
            onClick={() => setViewMode("plain")}
            className={cn(
              "px-2 py-0.5 rounded transition-all cursor-pointer",
              viewMode === "plain"
                ? "bg-[var(--vellum-100)] font-semibold shadow-xs text-[var(--ink-900)]"
                : "text-[var(--ink-500)] hover:text-[var(--ink-700)]"
            )}
          >
            Plain
          </button>
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={cn(
              "px-2 py-0.5 rounded transition-all cursor-pointer",
              viewMode === "original"
                ? "bg-[var(--vellum-100)] font-semibold shadow-xs text-[var(--ink-900)]"
                : "text-[var(--ink-500)] hover:text-[var(--ink-700)]"
            )}
          >
            Original
          </button>
        </div>
      </div>

      {/* ── Meaning Section ── */}
      <div className="text-sm leading-relaxed text-[var(--ink-900)]">
        {viewMode === "plain" ? (
          <p>{analysis.plainSummary}</p>
        ) : (
          <div className="font-serif italic text-xs bg-[var(--vellum-200)]/60 p-3 rounded border border-[var(--brass-500)]/20 leading-relaxed text-[var(--ink-700)]">
            {clause?.text ?? "Original text not provided."}
          </div>
        )}
      </div>

      {/* ── Why it matters ── */}
      {analysis.whyItMatters && (
        <div className="border-t border-[var(--brass-500)]/20 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brass-700)] block mb-1">
            Why It Matters
          </span>
          <p className="text-xs text-[var(--ink-700)] leading-normal">
            {analysis.whyItMatters}
          </p>
        </div>
      )}

      {/* ── Risk Reasons ── */}
      {analysis.risk.reasons && analysis.risk.reasons.length > 0 && (
        <div className="border-t border-[var(--brass-500)]/20 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brass-700)] block mb-1">
            Risk Analysis
          </span>
          <ul className="list-disc list-inside text-xs space-y-1 text-[var(--ink-700)]">
            {analysis.risk.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Questions to ask ── */}
      {analysis.questionsToAsk && analysis.questionsToAsk.length > 0 && (
        <div className="border-t border-[var(--brass-500)]/20 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brass-700)] block mb-1.5">
            Questions to Ask / Clarify
          </span>
          <ul className="space-y-1.5">
            {analysis.questionsToAsk.map((q, idx) => (
              <li
                key={idx}
                className="text-xs text-[var(--ink-900)] bg-[var(--vellum-200)]/60 p-2 rounded border border-[var(--brass-500)]/20 flex items-start gap-1.5"
              >
                <span className="text-[var(--brass-700)] font-bold shrink-0">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Verified Citations ── */}
      {analysis.citations && analysis.citations.length > 0 && (
        <div className="border-t border-[var(--brass-500)]/20 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--brass-700)] block mb-1.5">
            Verified Source Quotes
          </span>
          <div className="flex flex-wrap gap-2">
            {analysis.citations.map((c, idx) => (
              <CitationPill
                key={idx}
                citation={c}
                onClick={onCitationClick}
                showQuote={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Footer Stats (Favors & Confidence) ── */}
      <div className="border-t border-[var(--brass-500)]/25 pt-3 mt-1 flex items-center justify-between gap-2 flex-wrap">
        <span
          className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded border uppercase tracking-wide",
            favorsInfo.badgeClass
          )}
        >
          {favorsInfo.text}
        </span>
        <ConfidenceMeter confidence={analysis.confidence} />
      </div>
    </aside>
  );
}

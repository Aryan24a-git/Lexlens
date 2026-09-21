/**
 * Lawyer Brief Component with 2-page print stylesheet.
 * brain.md §7 P6, architecture.md §5.3
 */

"use client";

import { useState } from "react";
import type { LawyerBrief } from "@/core/domain/schemas";
import { RiskChip } from "@/ui/patterns/RiskChip";

export interface LawyerBriefViewProps {
  brief: LawyerBrief | null;
  isLoading: boolean;
  onRefresh?: (() => void) | undefined;
  onSelectClause?: ((clauseId: string) => void) | undefined;
}

export function LawyerBriefView({
  brief,
  isLoading,
  onRefresh,
  onSelectClause,
}: LawyerBriefViewProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyText = () => {
    if (!brief) return;
    const text = [
      `LEGAL CONSULTATION BRIEF`,
      `Document: ${brief.documentMeta.fileName} (${brief.documentMeta.docType})`,
      `Perspective: ${brief.documentMeta.perspective}`,
      `Date: ${new Date(brief.documentMeta.generatedAt).toLocaleDateString()}`,
      `\n1. SITUATION SUMMARY:`,
      brief.situationSummary,
      `\n2. TOP RISKS IDENTIFIED:`,
      ...brief.topRisks.map(
        (r) => `- [${r.clauseId}] (${r.level.toUpperCase()}): ${r.headline}`
      ),
      `\n3. KEY TERMS:`,
      ...brief.keyTerms.map((t) => `- [${t.clauseId}] ${t.term}: ${t.meaning}`),
      `\n4. QUESTIONS FOR COUNSEL:`,
      ...brief.openQuestions.map((q, i) => `${i + 1}. ${q}`),
      `\n5. MISSING INFORMATION & ATTACHMENTS TO BRING:`,
      ...brief.missingInfo.map((m) => `- ${m}`),
      `\n6. SUGGESTED 30-MINUTE CONSULTATION AGENDA:`,
      ...brief.suggestedAgenda.map((a, i) => `${i + 1}. ${a}`),
      `\nDISCLAIMER:`,
      brief.disclaimer,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse" role="status" aria-label="Loading lawyer brief">
        <div className="h-8 w-64 bg-[var(--vellum-300)] rounded" />
        <div className="h-24 bg-[var(--vellum-200)] rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[var(--vellum-200)] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="size-12 rounded-full bg-[var(--vellum-200)] border border-[var(--vellum-300)] mx-auto flex items-center justify-center text-[var(--ink-400)]">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h4 className="font-serif text-lg text-[var(--ink-900)]">No Lawyer Brief Generated</h4>
          <p className="text-sm text-[var(--ink-500)] max-w-sm mx-auto mt-1">
            Generate an executive 2-page brief summarizing key terms, risks, and consultation questions to bring to your attorney.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 bg-[var(--baize-800)] text-[var(--vellum-50)] text-sm rounded font-medium hover:bg-[var(--baize-900)] transition-colors"
          >
            Generate Lawyer Brief
          </button>
        )}
      </div>
    );
  }

  const { documentMeta } = brief;

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden in Print) */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--vellum-300)] print:hidden">
        <div>
          <h3 className="font-serif text-base font-semibold text-[var(--ink-900)]">
            Lawyer Consultation Brief
          </h3>
          <p className="text-xs text-[var(--ink-500)]">
            A structured, factual dossier designed to maximize value during a billable attorney consultation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--vellum-300)] bg-[var(--vellum-50)] hover:bg-[var(--vellum-200)] text-xs font-medium text-[var(--ink-700)] transition-colors cursor-pointer"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "Copied!" : "Copy Text"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--baize-800)] hover:bg-[var(--baize-900)] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Brief Body (2 pages structured) */}
      <div className="bg-white p-6 sm:p-8 rounded-lg border border-[var(--vellum-300)] shadow-sm print:border-none print:shadow-none print:p-0 text-[var(--ink-900)]">
        {/* Page 1: Overview, Risks, and Key Terms */}
        <section className="print:page-break-after pb-6 mb-6 border-b border-[var(--vellum-200)] print:border-none print:pb-0 print:mb-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[var(--brass-600)] pb-4 mb-5">
            <div>
              <span className="text-[10px] tracking-widest font-semibold uppercase text-[var(--brass-700)]">
                LexLens • Client Consultation Brief
              </span>
              <h1 className="font-serif text-2xl font-bold text-[var(--ink-900)] mt-0.5">
                {documentMeta.fileName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-600)] mt-1.5">
                <span><strong>Doc Type:</strong> {documentMeta.docType}</span>
                <span>•</span>
                <span><strong>Client Role:</strong> {documentMeta.perspective}</span>
                <span>•</span>
                <span suppressHydrationWarning><strong>Generated:</strong> {new Date(documentMeta.generatedAt).toISOString().split("T")[0]}</span>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[11px] px-2 py-1 rounded bg-[var(--vellum-200)] text-[var(--ink-700)] font-medium">
                Page 1 of 2
              </span>
            </div>
          </div>

          {/* Section 1: Situation Summary */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1.5">
              1. Executive Situation Summary
            </h2>
            <p className="text-sm leading-relaxed text-[var(--ink-800)] bg-[var(--vellum-50)] p-3 rounded border border-[var(--vellum-200)]">
              {brief.situationSummary}
            </p>
          </div>

          {/* Section 2: Top Risks Identified */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-500)] mb-2">
              2. Top Contractual Risks Flagged ({brief.topRisks.length})
            </h2>
            <div className="space-y-2">
              {brief.topRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded border border-[var(--vellum-200)] bg-white"
                >
                  <RiskChip level={risk.level} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--ink-900)]">
                      {risk.headline}
                    </p>
                    <button
                      type="button"
                      onClick={() => onSelectClause?.(risk.clauseId)}
                      className="text-[11px] text-[var(--brass-700)] hover:underline font-mono mt-0.5"
                    >
                      Clause {risk.clauseId}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Key Terms & Definitions */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-500)] mb-2">
              3. Crucial Defined Terms & Operational Mechanics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {brief.keyTerms.map((term, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded border border-[var(--vellum-200)] bg-[var(--vellum-50)]/50"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[var(--ink-900)]">{term.term}</span>
                    <button
                      type="button"
                      onClick={() => onSelectClause?.(term.clauseId)}
                      className="text-[10px] font-mono text-[var(--brass-700)] hover:underline"
                    >
                      {term.clauseId}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--ink-700)] mt-1 leading-normal">
                    {term.meaning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Page 2: Counsel Consultation Guide */}
        <section className="pt-2">
          <div className="flex items-center justify-between border-b border-[var(--brass-500)]/40 pb-2 mb-5">
            <h2 className="font-serif text-lg font-bold text-[var(--ink-900)]">
              Consultation Guide & Action Plan
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--vellum-200)] text-[var(--ink-700)] font-medium">
              Page 2 of 2
            </span>
          </div>

          {/* Section 4: Recommended Questions for Attorney */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-500)] mb-2">
              4. Target Questions to Ask Counsel
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--ink-800)] bg-[var(--vellum-50)] p-3.5 rounded border border-[var(--vellum-200)]">
              {brief.openQuestions.map((q, idx) => (
                <li key={idx} className="leading-relaxed pl-1">
                  <span className="font-medium text-[var(--ink-900)]">{q}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Section 5: Missing Information & Documents to Bring */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-500)] mb-2">
              5. Missing Information & Records to Bring to Consultation
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--ink-800)] bg-white p-3 rounded border border-[var(--vellum-200)]">
              {brief.missingInfo.map((info, idx) => (
                <li key={idx} className="leading-relaxed">
                  {info}
                </li>
              ))}
            </ul>
          </div>

          {/* Section 6: Suggested 30-Minute Agenda */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-500)] mb-2">
              6. Suggested 30-Minute Consultation Agenda
            </h3>
            <div className="space-y-1.5 text-xs">
              {brief.suggestedAgenda.map((agenda, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded bg-[var(--vellum-100)]/70 border border-[var(--vellum-200)] text-[var(--ink-800)]"
                >
                  <span className="size-5 rounded-full bg-[var(--baize-800)] text-[var(--vellum-50)] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{agenda}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Permanent Disclaimer Footer */}
          <footer className="mt-8 pt-4 border-t border-[var(--vellum-300)] text-center text-[10px] text-[var(--ink-500)] space-y-1">
            <p className="font-semibold text-[var(--ink-700)]">
              {brief.disclaimer}
            </p>
            <p>
              Generated by LexLens AI. This document does not establish an attorney-client relationship.
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}

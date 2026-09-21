/**
 * Mini Paper Sheet Preview Component for Landing Page.
 * Live Chambers & Paper document card with Bates stamps, clause text, and stamped index tabs.
 * design.md §7.1
 */

"use client";

import { useState } from "react";
import { Icon } from "@/ui/icons/Icon";
import type { RiskLevel } from "@/core/domain/enums";

interface MiniClause {
  id: string;
  title: string;
  snippet: string;
  risk: RiskLevel;
  label: string;
}

const SAMPLE_CLAUSES: MiniClause[] = [
  {
    id: "C3",
    title: "Renewal & Notice Window",
    snippet: "Lease automatically renews for 12 months unless cancelled 60 days in advance.",
    risk: "high",
    label: "Auto-renewal trap",
  },
  {
    id: "C8",
    title: "Right of Entry",
    snippet: "Landlord may enter premises upon 12 hours oral or written notice.",
    risk: "medium",
    label: "Short entry notice",
  },
  {
    id: "C12",
    title: "Security Deposit",
    snippet: "Full $2,200 deposit returned within 21 days with itemized receipt.",
    risk: "low",
    label: "Statutory standard",
  },
];

const RISK_BADGE: Record<RiskLevel, { bg: string; text: string; icon: "risk-high" | "risk-medium" | "risk-low" }> = {
  high: {
    bg: "bg-[var(--risk-high)]",
    text: "text-white",
    icon: "risk-high",
  },
  medium: {
    bg: "bg-[var(--risk-medium)]",
    text: "text-[var(--ink-900)]",
    icon: "risk-medium",
  },
  low: {
    bg: "bg-[var(--risk-low)]",
    text: "text-white",
    icon: "risk-low",
  },
  info: {
    bg: "bg-[var(--risk-info)]",
    text: "text-white",
    icon: "risk-low",
  },
};

export function MiniPaperSheet() {
  const [selectedId, setSelectedId] = useState<string>("C3");

  const activeClause = SAMPLE_CLAUSES.find((c) => c.id === selectedId) ?? SAMPLE_CLAUSES[0]!;

  return (
    <div className="relative group select-none">
      {/* Paper Card */}
      <div
        className="relative w-80 sm:w-96 rounded-sm bg-[var(--vellum-100,#f7f4ed)] border border-[var(--brass-500)]/30 text-[var(--ink-900)] p-6 transition-transform duration-300 group-hover:-translate-y-1"
        style={{
          boxShadow: "0 22px 45px -10px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(191, 155, 82, 0.15)",
        }}
      >
        {/* Subtle Paper Noise Overlay */}
        <div
          className="absolute inset-0 rounded-sm pointer-events-none opacity-6 mix-blend-multiply"
          style={{
            backgroundImage: "url('/svg/noise.svg')",
            backgroundSize: "180px 180px",
          }}
        />

        {/* Paper Header */}
        <div className="flex items-center justify-between border-b border-[var(--vellum-300,#d3ccb9)] pb-3 mb-4">
          <div>
            <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--brass-700)] font-semibold">
              Residential Lease • Unit 4B
            </span>
            <h4 className="font-serif text-sm font-bold text-[var(--ink-900)]">
              Standard Tenancy Agreement
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--vellum-200)] text-[var(--ink-600)]">
            Verified
          </span>
        </div>

        {/* Clause Rows */}
        <div className="space-y-3">
          {SAMPLE_CLAUSES.map((clause) => {
            const isSelected = clause.id === selectedId;
            const badge = RISK_BADGE[clause.risk];

            return (
              <div
                key={clause.id}
                onClick={() => setSelectedId(clause.id)}
                className={`relative p-2.5 rounded transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[var(--risk-medium)]/15 border-[var(--brass-500)]/60 shadow-xs"
                    : "bg-white/60 border-[var(--vellum-300)]/50 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-[var(--vellum-200)] text-[var(--ink-700)]">
                      {clause.id}
                    </span>
                    <span className="font-serif text-xs font-semibold text-[var(--ink-900)]">
                      {clause.title}
                    </span>
                  </div>

                  {/* Stamped tab chip */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                  >
                    <Icon name={badge.icon} className="size-3" aria-hidden="true" />
                    <span>{clause.risk.toUpperCase()}</span>
                  </span>
                </div>

                <p className="text-[11px] text-[var(--ink-700)] line-clamp-2 leading-relaxed font-ui">
                  {clause.snippet}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mini Plain Language Marginalia Note on Bottom */}
        <div className="mt-4 pt-3 border-t border-[var(--brass-500)]/30 bg-[var(--vellum-200)]/60 -mx-6 -mb-6 p-4 rounded-b-sm">
          <div className="flex items-start gap-2">
            <span className="text-[var(--brass-700)] font-bold text-xs mt-0.5">✦</span>
            <div>
              <p className="text-[11px] font-semibold text-[var(--ink-900)]">
                Plain Meaning ({activeClause.id})
              </p>
              <p className="text-[11px] text-[var(--ink-700)] mt-0.5 leading-snug">
                {activeClause.label}: LexLens flags this term and provides alternative compromise wording.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

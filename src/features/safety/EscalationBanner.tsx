"use client";

import React, { useState } from "react";
import { Icon } from "@/ui/icons/Icon";
import { cn } from "@/lib/utils";

export interface EscalationBannerProps {
  trigger?: string | undefined;
  reason?: string | undefined;
  guidance?: string | undefined;
  onFindLegalAid?: (() => void) | undefined;
  onPrepareBrief?: (() => void) | undefined;
  onDismiss?: (() => void) | undefined;
  className?: string | undefined;
}

/**
 * EscalationBanner — triggered when user inputs or answers involve urgent legal stakes
 * (eviction, police questioning, court summons, domestic violence, custody, wage theft, etc.)
 * Follows design.md §7.7 and brain.md §9: calm, non-alarmist, oxblood left rule, actionable CTAs.
 */
export function EscalationBanner({
  trigger,
  reason,
  guidance,
  onFindLegalAid,
  onPrepareBrief,
  onDismiss,
  className,
}: EscalationBannerProps) {
  const [showDirectoryDialog, setShowDirectoryDialog] = useState(false);

  const defaultGuidance =
    guidance ??
    "This matter touches urgent rights or statutory deadlines that an automated tool cannot handle. A licensed attorney or local legal-aid service can evaluate your specific facts and take formal legal action.";

  const handleLegalAidClick = () => {
    if (onFindLegalAid) {
      onFindLegalAid();
    } else {
      setShowDirectoryDialog(true);
    }
  };

  return (
    <>
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "relative overflow-hidden rounded-r-lg border border-l-4 border-[var(--risk-high)]/40 border-l-[var(--risk-high)] bg-[var(--baize-900)]/90 p-4 shadow-md backdrop-blur",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[var(--risk-high)]/15 p-1.5 text-[var(--risk-high-text,#ef4444)] shrink-0">
            <Icon name="shield" className="size-4" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--risk-high-text,#ef4444)]">
                {reason ? `Urgent Notice: ${reason}` : "Urgent / Time-Sensitive Matter"}
              </h4>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)] p-0.5 text-xs rounded transition-colors"
                  aria-label="Dismiss urgent notice"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="text-xs leading-relaxed text-[var(--text-on-dark)] font-ui">
              {defaultGuidance}
            </p>

            {trigger && (
              <p className="text-[10px] font-mono text-[var(--text-on-dark-2)]">
                Trigger category: {trigger}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleLegalAidClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[var(--risk-high)] text-white hover:opacity-95 shadow-sm transition-all cursor-pointer select-none"
              >
                <span>Find Free / Low-Cost Legal Aid</span>
                <span aria-hidden="true">↗</span>
              </button>

              {onPrepareBrief && (
                <button
                  type="button"
                  onClick={onPrepareBrief}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-[var(--brass-500)]/40 text-[var(--brass-300)] hover:border-[var(--brass-500)] hover:text-white bg-[var(--baize-800)]/50 transition-colors cursor-pointer select-none"
                >
                  <Icon name="briefcase" className="size-3.5" aria-hidden="true" />
                  <span>Prepare Lawyer Brief</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Directory Dialog Modal if no external handler passed */}
      {showDirectoryDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-aid-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-xl border border-[var(--brass-500)]/30 bg-[var(--baize-950)] p-6 shadow-2xl space-y-4 text-[var(--text-on-dark)] animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="legal-aid-title" className="text-sm font-bold font-display text-[var(--brass-300)]">
                  Verified Legal Aid &amp; Defense Resources
                </h3>
                <p className="text-xs text-[var(--text-on-dark-2)] mt-1">
                  Connect directly with free or subsidized legal advocacy organizations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectoryDialog(false)}
                className="text-[var(--text-on-dark-2)] hover:text-white text-base leading-none p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-[var(--baize-800)]">
              <a
                href="https://www.lawhelp.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-2 hover:text-[var(--brass-300)] transition-colors group"
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>LawHelp.org</span>
                  <span className="text-[10px] text-[var(--text-on-dark-2)] group-hover:text-[var(--brass-300)]">Visit ↗</span>
                </div>
                <p className="text-[11px] text-[var(--text-on-dark-2)]">
                  Locate free civil legal aid programs and tenant defense in your county/state.
                </p>
              </a>

              <a
                href="https://www.lsc.gov/what-legal-aid/find-legal-aid"
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-2 hover:text-[var(--brass-300)] transition-colors group"
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>Legal Services Corporation (LSC)</span>
                  <span className="text-[10px] text-[var(--text-on-dark-2)] group-hover:text-[var(--brass-300)]">Visit ↗</span>
                </div>
                <p className="text-[11px] text-[var(--text-on-dark-2)]">
                  Federally chartered nonprofit providing legal assistance to low-income Americans.
                </p>
              </a>

              <div className="pt-2">
                <div className="font-semibold text-[var(--risk-high-text,#ef4444)]">
                  Crisis &amp; Emergency Contacts
                </div>
                <ul className="text-[11px] text-[var(--text-on-dark-2)] mt-1 space-y-0.5">
                  <li>• National Domestic Violence: <strong>1-800-799-SAFE (7233)</strong></li>
                  <li>• Suicide &amp; Crisis Lifeline: Call or Text <strong>988</strong></li>
                  <li>• Immediate danger or physical threat: Call <strong>911 / 999 / 112</strong></li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDirectoryDialog(false)}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[var(--baize-800)] hover:bg-[var(--baize-700)] text-[var(--text-on-dark)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

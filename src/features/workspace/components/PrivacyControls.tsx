"use client";

import React, { useState } from "react";
import { Icon } from "@/ui/icons/Icon";
import { cn } from "@/lib/utils";

export interface PrivacyControlsProps {
  isPrivateMode: boolean;
  onTogglePrivateMode: (enabled: boolean) => void;
  isPiiRedactionEnabled: boolean;
  onTogglePiiRedaction: (enabled: boolean) => void;
  onClearEverything: () => void;
  clauseCount: number;
  wordCount: number;
  className?: string;
}

/**
 * PrivacyControls — Private mode toggle, PII redaction switch,
 * "What We Send" transparency modal, and "Clear Everything" action.
 * security.md §3, §12
 */
export function PrivacyControls({
  isPrivateMode,
  onTogglePrivateMode,
  isPiiRedactionEnabled,
  onTogglePiiRedaction,
  onClearEverything,
  clauseCount,
  wordCount,
  className,
}: PrivacyControlsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearConfirmed = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        if ("indexedDB" in window && window.indexedDB.databases) {
          window.indexedDB.databases().then((databases) => {
            for (const db of databases) {
              if (db.name) {
                window.indexedDB.deleteDatabase(db.name);
              }
            }
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore storage clear errors in restricted sandbox
    }

    setShowClearConfirm(false);
    onClearEverything();
  };

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
        {/* Private Mode Toggle */}
        <button
          type="button"
          onClick={() => onTogglePrivateMode(!isPrivateMode)}
          aria-pressed={isPrivateMode}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors cursor-pointer",
            isPrivateMode
              ? "bg-[var(--brass-500)]/15 border-[var(--brass-500)] text-[var(--brass-200)] font-medium"
              : "bg-[var(--baize-900)]/60 border-[var(--baize-700)] text-[var(--text-on-dark-2)] hover:border-[var(--baize-600)] hover:text-[var(--text-on-dark)]"
          )}
          title={isPrivateMode ? "Private mode active: local history and caching disabled" : "Enable private mode"}
        >
          <span className={cn("size-1.5 rounded-full", isPrivateMode ? "bg-[var(--brass-400)] animate-pulse" : "bg-[var(--baize-600)]")} />
          <span>{isPrivateMode ? "Private Mode Active" : "Private Mode"}</span>
        </button>

        {/* PII Masking Toggle */}
        <button
          type="button"
          onClick={() => onTogglePiiRedaction(!isPiiRedactionEnabled)}
          aria-pressed={isPiiRedactionEnabled}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded border transition-colors cursor-pointer",
            isPiiRedactionEnabled
              ? "bg-emerald-950/40 border-emerald-600/50 text-emerald-300 font-medium"
              : "bg-[var(--baize-900)]/60 border-[var(--baize-700)] text-[var(--text-on-dark-2)] hover:border-[var(--baize-600)] hover:text-[var(--text-on-dark)]"
          )}
          title="Mask emails, phone numbers, and IDs client-side before sending"
        >
          <span aria-hidden="true">{isPiiRedactionEnabled ? "🛡️" : "⚪"}</span>
          <span>PII Shield {isPiiRedactionEnabled ? "On" : "Off"}</span>
        </button>

        {/* "What We Send" Transparency Trigger */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--baize-700)] bg-[var(--baize-900)]/40 text-[var(--text-on-dark-2)] hover:border-[var(--brass-500)] hover:text-[var(--brass-200)] transition-colors cursor-pointer"
        >
          <Icon name="shield" className="size-3.5" aria-hidden="true" />
          <span>What We Send</span>
        </button>

        {/* Clear Everything Button */}
        {!showClearConfirm ? (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-transparent text-[var(--text-on-dark-2)] hover:text-red-400 transition-colors cursor-pointer ml-auto"
            title="Wipe all local session data and storage"
          >
            <span>Clear Everything</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 ml-auto bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded text-red-200">
            <span>Wipe all local data?</span>
            <button
              type="button"
              onClick={handleClearConfirmed}
              className="px-1.5 py-0.5 font-bold hover:underline cursor-pointer text-red-100"
            >
              Yes
            </button>
            <span className="text-red-400">/</span>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-1.5 py-0.5 hover:underline cursor-pointer text-red-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* "What We Send" Transparency Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="transparency-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[var(--baize-950)] border border-[var(--brass-500)]/40 rounded-xl p-6 shadow-2xl space-y-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3
                  id="transparency-modal-title"
                  className="font-display font-semibold text-lg text-[var(--text-on-dark)]"
                >
                  What Leaves Your Device
                </h3>
                <p className="text-xs text-[var(--text-on-dark-2)] mt-0.5">
                  LexLens zero-retention privacy guarantee (security.md §3)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[var(--text-on-dark-2)] hover:text-white cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-[var(--baize-800)]">
              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-on-dark-2)]">Original File Bytes</span>
                <span className="font-semibold text-emerald-400">0 bytes (Client-side parsed)</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-on-dark-2)]">Extracted Clauses Transmitted</span>
                <span className="font-mono text-[var(--brass-300)]">
                  {clauseCount > 0 ? `${clauseCount} clauses (~${wordCount} words)` : "None yet"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-on-dark-2)]">Client PII Shield</span>
                <span className={cn("font-medium", isPiiRedactionEnabled ? "text-emerald-400" : "text-amber-400")}>
                  {isPiiRedactionEnabled ? "Active (Masked prior to sending)" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-on-dark-2)]">Server Database Retention</span>
                <span className="font-semibold text-emerald-400">None (Stateless, ephemeral)</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-on-dark-2)]">AI Inference Provider</span>
                <span className="text-[var(--text-on-dark)]">Groq Cloud (Zero data retention)</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[var(--text-on-dark-2)]">Server Logs</span>
                <span className="text-[var(--text-on-dark-2)]">Request IDs &amp; Latency only (No text)</span>
              </div>
            </div>

            <div className="p-3 rounded bg-[var(--baize-900)]/80 border border-[var(--baize-800)] text-[11px] text-[var(--text-on-dark-2)] leading-relaxed">
              Documents are processed directly in your browser using Web Workers. Only the extracted clause texts needed for analysis are sent to the AI inference provider. No user document is ever written to disk or used for training.
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-md bg-[var(--baize-800)] text-xs font-medium text-white hover:bg-[var(--baize-700)] cursor-pointer transition-colors"
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

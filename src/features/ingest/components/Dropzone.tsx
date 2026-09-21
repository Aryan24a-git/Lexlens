"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/ui/icons/Icon";
import { useParseFile } from "../hooks/use-parse-file";
import { ParsedDocument } from "@/core/parsing";
import { SAMPLE_DOCUMENTS, SampleDocument } from "../fixtures";

export interface DropzoneProps {
  onDocumentParsed: (doc: ParsedDocument, defaultRole?: string, suggestedRoles?: string[]) => void;
  className?: string;
}

/**
 * Dropzone — Intake surface for contracts, leases, and policies. (design.md §8, §11)
 * Features dashed brass border on baize, file drag/drop, clipboard paste, sample chips,
 * and friendly error states.
 */
export function Dropzone({ onDocumentParsed, className }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status, progress, error, parse, reset } = useParseFile();

  const handleFile = async (file: File) => {
    const doc = await parse(file);
    if (doc) {
      onDocumentParsed(doc);
    }
  };

  const handlePastedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pastedText.trim()) {
      const doc = await parse(pastedText.trim(), "Pasted Document");
      if (doc) {
        onDocumentParsed(doc);
      }
    }
  };

  const handleSampleClick = async (sample: SampleDocument) => {
    const doc = await parse(sample.content, sample.name);
    if (doc) {
      onDocumentParsed(doc, sample.defaultRole, sample.suggestedRoles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-5", className)}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload legal document"
      />

      {/* Main Intake Area */}
      {!isPasteMode ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => status !== "parsing" && fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center p-8 md:p-12 rounded-lg text-center cursor-pointer transition-all duration-200 select-none",
            "border-2 border-dashed",
            // State: Dragging
            isDragging
              ? "border-[var(--brass-300)] bg-[var(--baize-800)]/80 scale-[1.01] shadow-lg shadow-[var(--baize-950)]/50"
              : "border-[var(--brass-500)]/40 bg-[var(--baize-900)]/60 hover:border-[var(--brass-500)] hover:bg-[var(--baize-900)]",
            // State: Parsing
            status === "parsing" && "cursor-wait pointer-events-none opacity-90",
            // State: Error
            status === "error" && "border-[var(--risk-high)]/60 bg-[var(--baize-900)]"
          )}
        >
          {status === "parsing" ? (
            /* Parsing Progress View */
            <div className="w-full max-w-xs space-y-4 py-3">
              <div className="flex justify-center">
                <Icon name="clause" className="w-8 h-8 text-[var(--brass-300)] animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-sans font-medium text-[var(--text-on-dark)]">
                  Reading document...
                </p>
                <p className="text-xs text-[var(--text-on-dark-2)]">
                  Extracting and structuring clauses securely on your device
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[var(--baize-950)] rounded-full h-1.5 overflow-hidden border border-[var(--baize-700)]">
                <div
                  className="bg-[var(--brass-500)] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-[var(--brass-300)]">
                {Math.round(progress * 100)}% complete
              </span>
            </div>
          ) : status === "error" && error ? (
            /* Error Card */
            <div
              className="w-full space-y-4 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="inline-flex p-2.5 rounded-full bg-[var(--risk-high)]/20 text-[var(--risk-high)] border border-[var(--risk-high)]/40">
                <Icon name="risk-high" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--text-on-dark)]">
                  Unable to read document
                </h3>
                <p className="text-xs text-[var(--text-on-dark-2)] max-w-md mx-auto leading-relaxed">
                  {error.message}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="px-4 py-1.5 text-xs font-semibold rounded bg-[var(--brass-500)] text-[var(--baize-950)] hover:bg-[var(--brass-300)] transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setIsPasteMode(true);
                  }}
                  className="px-4 py-1.5 text-xs font-medium rounded border border-[var(--baize-700)] text-[var(--text-on-dark-2)] hover:border-[var(--brass-500)] hover:text-[var(--text-on-dark)]"
                >
                  Paste Text Instead
                </button>
              </div>
            </div>
          ) : (
            /* Idle Dropzone Prompt */
            <div className="space-y-3">
              <div className="inline-flex p-3 rounded-full bg-[var(--baize-800)] border border-[var(--brass-500)]/30 text-[var(--brass-300)] group-hover:scale-105 transition-transform">
                <Icon name="upload" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm md:text-base font-medium text-[var(--text-on-dark)]">
                  Drop a lease, contract or policy here
                </p>
                <p className="text-xs text-[var(--text-on-dark-2)]">
                  PDF, Word (.docx) or plain text, up to 10 MB
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-[var(--brass-500)]/15 text-[var(--brass-300)] border border-[var(--brass-500)]/30">
                  Select File from Device
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Paste Mode Area */
        <form
          onSubmit={handlePastedSubmit}
          className="space-y-3 p-5 rounded-lg bg-[var(--baize-900)]/80 border border-[var(--baize-700)]"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-sans font-semibold text-[var(--text-on-dark)]">
              Paste Legal Text or Clauses
            </label>
            <button
              type="button"
              onClick={() => setIsPasteMode(false)}
              className="text-xs text-[var(--text-on-dark-2)] hover:text-[var(--brass-300)]"
            >
              ← Back to upload
            </button>
          </div>
          <textarea
            rows={7}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste contract sections, residential lease clauses, or agreement text here..."
            className="w-full p-3 text-xs md:text-sm font-mono rounded bg-[var(--baize-950)] border border-[var(--baize-700)] text-[var(--text-on-dark)] placeholder-[var(--text-on-dark-2)]/40 focus:outline-none focus:border-[var(--brass-500)] focus:ring-1 focus:ring-[var(--brass-500)] resize-y"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[var(--text-on-dark-2)]">
              {pastedText.length > 0 ? `${pastedText.length.toLocaleString()} characters` : "Minimum 50 characters"}
            </span>
            <button
              type="submit"
              disabled={pastedText.trim().length < 50 || status === "parsing"}
              className="px-4 py-2 text-xs font-semibold rounded bg-[var(--brass-500)] text-[var(--baize-950)] hover:bg-[var(--brass-300)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {status === "parsing" ? "Structuring..." : "Analyze Pasted Text"}
            </button>
          </div>
        </form>
      )}

      {/* Mode toggle / paste link */}
      {!isPasteMode && status !== "parsing" && (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsPasteMode(true)}
            className="text-xs text-[var(--brass-300)] hover:text-[var(--brass-500)] underline underline-offset-4 decoration-[var(--brass-500)]/40 hover:decoration-[var(--brass-300)]"
          >
            Or paste text from clipboard
          </button>
        </div>
      )}

      {/* Sample Document Chips */}
      {status !== "parsing" && (
        <div className="pt-2 border-t border-[var(--baize-800)] text-center space-y-2.5">
          <p className="text-xs font-sans text-[var(--text-on-dark-2)]">
            Or try a sample document:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--baize-800)] text-[var(--text-on-dark)] border border-[var(--baize-700)] hover:border-[var(--brass-500)] hover:bg-[var(--baize-700)] transition-all select-none"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Privacy guarantee */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-on-dark-2)]/80 text-center">
        <Icon name="shield" className="w-3.5 h-3.5 text-[var(--brass-500)]" />
        <span>Your file is read in your browser and never stored on our servers.</span>
      </div>
    </div>
  );
}

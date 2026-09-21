"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ParsedDocument } from "@/core/parsing";
import { segmentDocument } from "@/core/segmentation";
import { Clause } from "@/core/domain";
import { Dropzone } from "@/features/ingest";
import { PerspectivePicker } from "./PerspectivePicker";
import { PrivacyControls } from "./PrivacyControls";
import { scanForInjection } from "@/core/safety/injection-scanner";
import { redactPii } from "@/core/safety/pii-redactor";
import {
  PaperSheet,
  ClauseBlock,
  ScanOverlay,
  IndexTab,
  MarginNote,
  SummaryStrip,
  CheckFirstList,
  type CheckFirstItem,
} from "@/ui/patterns";
import { useAnalysisStream } from "@/features/analysis";
import { AskPanel } from "@/features/ask";
import { ActionsPanel } from "@/features/actions";
import { Icon } from "@/ui/icons/Icon";
import { type RiskLevel, type Perspective, PERSPECTIVES } from "@/core/domain/enums";

/**
 * WorkspaceView — Interactive document intake, perspective selection,
 * real-time SSE streaming analysis, PaperSheet reader, and marginalia rail.
 * architecture.md §5.2, design.md §7.3, §8
 */
export function WorkspaceView() {
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("tenant");
  const [suggestedRoles, setSuggestedRoles] = useState<string[] | undefined>(undefined);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [activeRailTab, setActiveRailTab] = useState<"marginalia" | "ask" | "actions">("marginalia");
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(false);
  const [isPiiRedacted, setIsPiiRedacted] = useState<boolean>(true);
  const [injectionWarnings, setInjectionWarnings] = useState<string[]>([]);

  const {
    status: analysisStatus,
    docType,
    analyses,
    synthesis,
    progress,
    warnings,
    error: analysisError,
    startAnalysis,
    reset: resetAnalysis,
  } = useAnalysisStream();

  const isAnalyzing =
    analysisStatus === "classifying" ||
    analysisStatus === "analyzing" ||
    analysisStatus === "synthesizing";

  const handleDocumentParsed = (
    parsedDoc: ParsedDocument,
    defaultRole?: string,
    sampleRoles?: string[]
  ) => {
    const segmentedClauses = segmentDocument(parsedDoc);
    setDocument(parsedDoc);
    setClauses(segmentedClauses);
    setSelectedClauseId(segmentedClauses[0]?.id ?? null);
    resetAnalysis();

    // Scan clauses for adversarial injection attempts (security.md §4)
    const detectedInjections: string[] = [];
    for (const c of segmentedClauses) {
      const scan = scanForInjection(c.text);
      if (scan.hasInjection) {
        detectedInjections.push(
          `Clause ${c.heading ?? c.id}: contains potential prompt injection patterns (${scan.detectedPatterns.join(", ")}). Quarantined and treated strictly as passive text data.`
        );
      }
    }
    setInjectionWarnings(detectedInjections);

    if (defaultRole) {
      setRole(defaultRole);
    }
    setSuggestedRoles(sampleRoles);
  };

  const handleResetDocument = () => {
    resetAnalysis();
    setDocument(null);
    setClauses([]);
    setSelectedClauseId(null);
    setSuggestedRoles(undefined);
    setRiskFilter("all");
    setInjectionWarnings([]);
  };

  const handleClearEverything = () => {
    handleResetDocument();
  };

  const handleStartAnalysis = () => {
    if (clauses.length === 0) return;

    // Apply client-side PII masking before transmission if enabled (security.md §3)
    const clausesToSend = isPiiRedacted
      ? clauses.map((c) => ({
          ...c,
          text: redactPii(c.text).redactedText,
        }))
      : clauses;

    const validPerspective: Perspective = (PERSPECTIVES as readonly string[]).includes(role.toLowerCase())
      ? (role.toLowerCase() as Perspective)
      : "other";

    startAnalysis({
      clauses: clausesToSend,
      perspective: validPerspective,
      docType: docType ?? undefined,
    });
  };

  const handleNavigateClause = (
    direction: "up" | "down",
    currentClause: Clause
  ) => {
    const currentIndex = clauses.findIndex((c) => c.id === currentClause.id);
    if (currentIndex === -1) return;

    if (direction === "up" && currentIndex > 0) {
      const prev = clauses[currentIndex - 1]!;
      setSelectedClauseId(prev.id);
    } else if (direction === "down" && currentIndex < clauses.length - 1) {
      const next = clauses[currentIndex + 1]!;
      setSelectedClauseId(next.id);
    }
  };

  // Selected clause and its analysis (if any)
  const selectedClause = useMemo(() => {
    return clauses.find((c) => c.id === selectedClauseId);
  }, [clauses, selectedClauseId]);

  const selectedAnalysis = useMemo(() => {
    return selectedClauseId ? analyses[selectedClauseId] : undefined;
  }, [analyses, selectedClauseId]);

  // Risk counts for the summary filter tabs
  const riskCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    let info = 0;

    for (const a of Object.values(analyses)) {
      if (a.risk.level === "high") high++;
      else if (a.risk.level === "medium") medium++;
      else if (a.risk.level === "low") low++;
      else if (a.risk.level === "info") info++;
    }

    return {
      total: Object.keys(analyses).length,
      high,
      medium,
      low,
      info,
    };
  }, [analyses]);

  // Priority check-first items
  const checkFirstItems: CheckFirstItem[] = useMemo(() => {
    if (synthesis?.topRisks && synthesis.topRisks.length > 0) {
      return synthesis.topRisks.map((tr) => ({
        clauseId: tr.clauseId,
        headline: tr.headline,
        level: tr.level,
      }));
    }

    // Fallback: derive from analyses
    return Object.values(analyses)
      .filter((a) => a.risk.level === "high" || a.risk.level === "medium")
      .map((a) => ({
        clauseId: a.clauseId,
        headline: a.plainSummary,
        level: a.risk.level,
      }))
      .slice(0, 5);
  }, [synthesis, analyses]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--baize-950)] text-[var(--text-on-dark)]">
      {/* Top Navigation Bar */}
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
            Reader &amp; X-Ray
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/brief"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--brass-500)]/40 text-[var(--brass-300)] hover:border-[var(--brass-500)] hover:text-white transition-colors"
          >
            <Icon name="clause" className="size-3.5" aria-hidden="true" />
            <span>Lawyer Brief</span>
          </Link>

          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--brass-500)]/40 text-[var(--brass-300)] hover:border-[var(--brass-500)] hover:text-white transition-colors"
          >
            <Icon name="compare" className="size-3.5" aria-hidden="true" />
            <span>Compare</span>
          </Link>

          {document && (
            <button
              type="button"
              onClick={handleResetDocument}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--baize-700)] text-[var(--text-on-dark-2)] hover:border-[var(--brass-500)] hover:text-[var(--text-on-dark)] transition-colors cursor-pointer"
            >
              <span aria-hidden="true">←</span>
              <span>Upload New Document</span>
            </button>
          )}
        </div>
      </header>

      {/* Privacy & Session Controls Bar */}
      <section aria-label="Privacy and Session Controls" className="border-b border-[var(--brass-500)]/15 bg-[var(--baize-950)]/50 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PrivacyControls
            isPrivateMode={isPrivateMode}
            onTogglePrivateMode={setIsPrivateMode}
            isPiiRedactionEnabled={isPiiRedacted}
            onTogglePiiRedaction={setIsPiiRedacted}
            onClearEverything={handleClearEverything}
            clauseCount={clauses.length}
            wordCount={document?.wordCount ?? 0}
            className="w-full"
          />
        </div>
      </section>

      {/* Adversarial Text / Injection Warning Banner */}
      {injectionWarnings.length > 0 && (
        <section aria-label="Security Warnings" className="max-w-7xl mx-auto px-4 md:px-8 pt-4 w-full">
          <div className="rounded-lg bg-amber-950/60 border border-amber-600/50 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
            <span className="text-base select-none" aria-hidden="true">⚠️</span>
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">
                Adversarial Input Quarantined (security.md §4)
              </p>
              {injectionWarnings.map((w, i) => (
                <p key={i} className="text-amber-200/90 font-mono text-[11px]">{w}</p>
              ))}
              <p className="text-[11px] text-amber-300/70 pt-1">
                Adversarial instructions inside documents are isolated in data-only boundaries and cannot alter the AI&apos;s system instructions.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 w-full px-4 md:px-8 py-8 md:py-10">
        {!document ? (
          /* Intake / Dropzone View */
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text-on-dark)] tracking-tight">
                Upload a document to analyze
              </h1>
              <p className="text-sm text-[var(--text-on-dark-2)] max-w-lg mx-auto leading-relaxed">
                PDF, Word (.docx) or plain text · up to 10 MB · parsed privately on your device
              </p>
            </div>

            {/* Role picker before upload */}
            <div className="max-w-2xl mx-auto p-4 rounded-lg bg-[var(--baize-900)]/40 border border-[var(--baize-800)]">
              <PerspectivePicker
                selectedRole={role}
                onChangeRole={setRole}
              />
            </div>

            {/* Dropzone with sample chips */}
            <Dropzone onDocumentParsed={handleDocumentParsed} />
          </div>
        ) : (
          /* Document Loaded — Workspace View */
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Context & Perspective Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-[var(--baize-900)]/70 border border-[var(--brass-500)]/20 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--brass-500)]/15 text-[var(--brass-300)] font-semibold border border-[var(--brass-500)]/30 uppercase">
                    {document.fileType}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-on-dark)] truncate max-w-xs">
                    {document.fileName}
                  </span>
                  {docType && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--baize-800)] text-[var(--brass-300)] border border-[var(--baize-700)] capitalize">
                      {docType.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-on-dark-2)]">
                  {clauses.length} clauses extracted · {document.wordCount.toLocaleString()} words
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Perspective Role Picker */}
                <PerspectivePicker
                  selectedRole={role}
                  onChangeRole={(newRole) => {
                    setRole(newRole);
                    if (analysisStatus === "done") {
                      // Re-trigger analysis for new role
                      startAnalysis({
                        clauses,
                        perspective: newRole as Perspective,
                        docType: docType ?? undefined,
                      });
                    }
                  }}
                  suggestedRoles={suggestedRoles}
                />

                {/* Primary Analyze Button */}
                {analysisStatus === "idle" && (
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-ui text-xs font-bold uppercase tracking-wider text-[var(--baize-950)] bg-[var(--brass-500)] hover:bg-[var(--brass-300)] shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
                  >
                    <span>⚡</span>
                    <span>Analyze Document</span>
                  </button>
                )}

                {isAnalyzing && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--baize-800)] border border-[var(--brass-500)]/50 text-xs font-ui text-[var(--brass-300)]">
                    <span className="size-2 rounded-full bg-[var(--brass-500)] animate-ping" />
                    <span>Analyzing ({progress.percentage}%)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warnings or Error Banners */}
            {analysisError && (
              <div className="p-4 rounded-lg bg-[var(--risk-high)]/15 border border-[var(--risk-high)]/40 text-xs text-[var(--text-on-dark)] flex items-center justify-between gap-3">
                <span>{analysisError}</span>
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  className="px-2.5 py-1 rounded bg-[var(--risk-high)] text-white font-medium hover:opacity-90"
                >
                  Retry Analysis
                </button>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-[var(--risk-medium)]/15 border border-[var(--risk-medium)]/40 text-xs text-[#d97706]">
                {warnings.map((w, idx) => (
                  <p key={idx}>⚠️ {w.message}</p>
                ))}
              </div>
            )}

            {/* Summary Strip (Executive TL;DR & Key Facts) */}
            {synthesis && (
              <SummaryStrip
                synthesis={synthesis}
                riskFilter={riskFilter}
                onFilterChange={setRiskFilter}
                counts={riskCounts}
                onCitationClick={(id) => setSelectedClauseId(id)}
              />
            )}

            {/* 2-Column Responsive Layout: PaperSheet (Center) + Margin Rail (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* PaperSheet Column (7 cols on lg) */}
              <div className="lg:col-span-8 relative">
                <PaperSheet
                  title={document.fileName}
                  subtitle={`Extracted ${clauses.length} addressable clauses · Viewing as ${role}`}
                  pageCount={document.pageCount}
                  overlaySlot={
                    <ScanOverlay
                      progress={progress.percentage / 100}
                      statusText={`Reading clause ${progress.completed} of ${progress.total}`}
                      isAnalyzing={isAnalyzing}
                    />
                  }
                >
                  <div className="divide-y divide-[var(--vellum-300,#d3ccb9)]/40">
                    {clauses.map((clause) => {
                      const clauseAnalysis = analyses[clause.id];
                      const isSelected = selectedClauseId === clause.id;

                      // Dimming logic when risk filter is active
                      const isDimmed =
                        riskFilter !== "all" &&
                        clauseAnalysis &&
                        clauseAnalysis.risk.level !== riskFilter;

                      return (
                        <div key={clause.id} className="relative group">
                          <ClauseBlock
                            clause={clause}
                            isSelected={isSelected}
                            isDimmed={Boolean(isDimmed)}
                            onSelect={(c) => setSelectedClauseId(c.id)}
                            onNavigate={handleNavigateClause}
                          />

                          {/* IndexTab anchored to the right edge */}
                          {clauseAnalysis && (
                            <div className="absolute right-0 top-3 translate-x-1/2 hidden md:block z-20">
                              <IndexTab
                                clauseId={clause.id}
                                riskLevel={clauseAnalysis.risk.level}
                                selected={isSelected}
                                onClick={() => setSelectedClauseId(clause.id)}
                                stamped={true}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </PaperSheet>
              </div>

              {/* Marginalia Rail Column (4 cols on lg, sticky) */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
                {/* Rail Navigation Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--baize-900)]/80 border border-[var(--brass-500)]/25 text-xs font-ui">
                  <button
                    type="button"
                    onClick={() => setActiveRailTab("marginalia")}
                    className={cn(
                      "flex-1 py-1.5 px-2.5 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                      activeRailTab === "marginalia"
                        ? "bg-[var(--brass-500)] text-[var(--baize-950)] shadow-sm"
                        : "text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
                    )}
                  >
                    <Icon name="clause" className="size-3.5" aria-hidden="true" />
                    <span>X-Ray</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRailTab("ask")}
                    className={cn(
                      "flex-1 py-1.5 px-2.5 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                      activeRailTab === "ask"
                        ? "bg-[var(--brass-500)] text-[var(--baize-950)] shadow-sm"
                        : "text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
                    )}
                  >
                    <Icon name="chat" className="size-3.5" aria-hidden="true" />
                    <span>Ask</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRailTab("actions")}
                    className={cn(
                      "flex-1 py-1.5 px-2.5 rounded-md font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                      activeRailTab === "actions"
                        ? "bg-[var(--brass-500)] text-[var(--baize-950)] shadow-sm"
                        : "text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
                    )}
                  >
                    <span className="text-[11px]">⚡</span>
                    <span>Actions</span>
                  </button>
                </div>

                {activeRailTab === "marginalia" ? (
                  <div className="space-y-6">
                    {/* Selected Clause Margin Note */}
                    {selectedAnalysis ? (
                      <MarginNote
                        analysis={selectedAnalysis}
                        clause={selectedClause}
                        onClose={() => setSelectedClauseId(null)}
                        onCitationClick={(id) => setSelectedClauseId(id)}
                      />
                    ) : (
                      <div className="p-5 rounded-lg border bg-[var(--baize-900)]/40 border-[var(--baize-700)] text-xs text-[var(--text-on-dark-2)] text-center space-y-2">
                        <p className="font-medium text-[var(--text-on-dark)]">
                          {selectedClause ? `Clause ${selectedClause.id} Selected` : "Select a Clause"}
                        </p>
                        <p>
                          {analysisStatus === "idle"
                            ? "Click 'Analyze Document' to inspect legal risks, plain meaning, and citations."
                            : isAnalyzing
                              ? "Analyzing document... clause analysis will appear here as results stream in."
                              : "Select any clause on the left to view detailed risk notes, plain language breakdown, and questions to ask."}
                        </p>
                      </div>
                    )}

                    {/* Pinned "Check First" Priority List */}
                    {checkFirstItems.length > 0 && (
                      <CheckFirstList
                        items={checkFirstItems}
                        selectedClauseId={selectedClauseId ?? undefined}
                        onSelectClause={(id) => {
                          setSelectedClauseId(id);
                          setActiveRailTab("marginalia");
                        }}
                      />
                    )}
                  </div>
                ) : activeRailTab === "ask" ? (
                  <AskPanel
                    clauses={clauses}
                    perspective={role as Perspective}
                    docType={docType ?? undefined}
                    onCitationClick={(id) => setSelectedClauseId(id)}
                    onPrepareBrief={() => setActiveRailTab("actions")}
                  />
                ) : (
                  <div className="rounded-xl border border-[var(--brass-500)]/30 overflow-hidden bg-[var(--vellum-50)] shadow-lg max-h-[85vh] flex flex-col">
                    <ActionsPanel
                      clauses={clauses}
                      analyses={Object.values(analyses)}
                      synthesis={synthesis ?? undefined}
                      perspective={role as Perspective}
                      fileName={document.fileName}
                      onSelectClause={(id) => setSelectedClauseId(id)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

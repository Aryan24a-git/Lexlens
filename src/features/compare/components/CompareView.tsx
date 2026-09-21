"use client";

import React, { useState, useMemo } from "react";
import { useCompare } from "../hooks/use-compare";
import { TopChangesStrip } from "./TopChangesStrip";
import { CompareRow } from "./CompareRow";
import { PerspectivePicker } from "@/features/workspace/components/PerspectivePicker";
import { parseText } from "@/core/parsing";
import { segmentDocument } from "@/core/segmentation";
import { Icon } from "@/ui/icons/Icon";
import { cn } from "@/lib/utils";
import type { Clause } from "@/core/domain/schemas";
import type { Perspective, CompareMode } from "@/core/domain/enums";

import { SAMPLE_DOCUMENTS } from "@/features/ingest";

export function CompareView() {
  const [clausesA, setClausesA] = useState<Clause[]>([]);
  const [clausesB, setClausesB] = useState<Clause[]>([]);
  const [fileNameA, setFileNameA] = useState<string>("lease-v1.txt");
  const [fileNameB, setFileNameB] = useState<string>("lease-v2.txt");
  const [role, setRole] = useState<string>("tenant");
  const [mode, setMode] = useState<CompareMode>("versions");
  const [filter, setFilter] = useState<"all" | "modified" | "added_removed" | "high">("all");
  const [highlightedClauseId, setHighlightedClauseId] = useState<string | null>(null);

  const {
    status,
    pairs,
    stats,
    summary,
    error,
    startCompare,
    reset,
  } = useCompare();

  const isComparing =
    status === "aligning" ||
    status === "explaining" ||
    status === "synthesizing";

  // Quick sample loader
  const handleLoadSampleLeases = () => {
    const doc1 = SAMPLE_DOCUMENTS.find((d) => d.id === "lease-v1");
    const doc2 = SAMPLE_DOCUMENTS.find((d) => d.id === "lease-v2");

    if (!doc1 || !doc2) return;

    const parsedA = parseText(doc1.content, "lease-v1.txt");
    const parsedB = parseText(doc2.content, "lease-v2.txt");

    if (parsedA.ok && parsedB.ok) {
      const segA = segmentDocument(parsedA.value);
      const segB = segmentDocument(parsedB.value);

      setClausesA(segA);
      setClausesB(segB);
      setFileNameA("lease-v1.txt");
      setFileNameB("lease-v2.txt");
      setRole("tenant");
      reset();

      // Trigger compare immediately
      void startCompare({
        clausesA: segA,
        clausesB: segB,
        fileNameA: "lease-v1.txt",
        fileNameB: "lease-v2.txt",
        mode: "versions",
        perspective: "tenant" as Perspective,
      });
    }
  };

  const handleStartComparison = () => {
    if (clausesA.length === 0 || clausesB.length === 0) return;
    void startCompare({
      clausesA,
      clausesB,
      fileNameA,
      fileNameB,
      mode,
      perspective: role as Perspective,
    });
  };

  // Map clauses for lookup
  const clauseMapA = useMemo(() => {
    const map = new Map<string, Clause>();
    for (const c of clausesA) map.set(c.id, c);
    return map;
  }, [clausesA]);

  const clauseMapB = useMemo(() => {
    const map = new Map<string, Clause>();
    for (const c of clausesB) map.set(c.id, c);
    return map;
  }, [clausesB]);

  // Filtered pairs
  const filteredPairs = useMemo(() => {
    if (filter === "all") return pairs;
    if (filter === "modified") return pairs.filter((p) => p.status === "modified");
    if (filter === "added_removed") {
      return pairs.filter((p) => p.status === "added" || p.status === "removed");
    }
    if (filter === "high") {
      return pairs.filter((p) => p.severity === "high");
    }
    return pairs;
  }, [pairs, filter]);

  const scrollToClause = (clauseId?: string) => {
    if (!clauseId) return;
    setHighlightedClauseId(clauseId);
    const el = document.getElementById(`clause-${clauseId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Compare Header & Controls */}
      <div className="p-6 rounded-xl border border-[var(--brass-500)]/30 bg-[var(--baize-900)]/80 backdrop-blur shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[var(--brass-500)]/20 text-[var(--brass-300)]">
                <Icon name="compare" className="size-5" aria-hidden="true" />
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-display text-[var(--text-on-dark)]">
                Document Redline &amp; Comparison
              </h1>
            </div>
            <p className="text-xs text-[var(--text-on-dark-2)] mt-1">
              Aligned clause comparison with deterministic word-level redline diffing and substantive impact analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadSampleLeases}
              disabled={isComparing}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--brass-500)]/50 bg-[var(--baize-800)] hover:bg-[var(--baize-700)] text-xs font-medium text-[var(--brass-300)] transition-colors cursor-pointer select-none"
            >
              📄 Load Sample (Lease V1 vs V2)
            </button>

            {clausesA.length > 0 && clausesB.length > 0 && status === "idle" && (
              <button
                type="button"
                onClick={handleStartComparison}
                className="px-4 py-1.5 rounded-lg bg-[var(--brass-500)] hover:bg-[var(--brass-300)] text-xs font-bold font-ui text-[var(--baize-950)] shadow transition-all cursor-pointer select-none"
              >
                Compare Now
              </button>
            )}

            {isComparing && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--baize-800)] border border-[var(--brass-500)]/40 text-xs text-[var(--brass-300)]">
                <span className="size-2 rounded-full bg-[var(--brass-500)] animate-ping" />
                <span className="capitalize">{status}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="pt-3 border-t border-[var(--brass-500)]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <PerspectivePicker selectedRole={role} onChangeRole={setRole} />

            {/* Mode selection */}
            <div className="flex items-center gap-1.5 text-xs font-ui">
              <span className="text-[var(--text-on-dark-2)] font-medium">Mode:</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as CompareMode)}
                className="px-2.5 py-1 rounded bg-[var(--baize-800)] border border-[var(--baize-700)] text-xs text-[var(--text-on-dark)] focus:outline-none focus:border-[var(--brass-500)]"
              >
                <option value="versions">Revision Drafts (A = Old, B = New)</option>
                <option value="offers">Competing Offers</option>
                <option value="policy_vs_template">Policy vs Standard Template</option>
              </select>
            </div>
          </div>

          {/* Document names */}
          {clausesA.length > 0 && (
            <div className="text-xs text-[var(--text-on-dark-2)] flex items-center gap-2">
              <span className="font-mono text-[var(--brass-300)]">{fileNameA}</span>
              <span>vs</span>
              <span className="font-mono text-[var(--brass-300)]">{fileNameB}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-lg bg-[var(--risk-high)]/15 border border-[var(--risk-high)]/40 text-xs text-[var(--text-on-dark)]">
          {error}
        </div>
      )}

      {/* "3 Changes That Matter Most" Strip */}
      {summary && (
        <TopChangesStrip
          summary={summary}
          onSelectChange={(clauseId) => scrollToClause(clauseId)}
        />
      )}

      {/* Filter toolbar and stats */}
      {stats && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[var(--baize-900)]/60 border border-[var(--baize-800)] text-xs font-ui">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[var(--text-on-dark-2)] font-medium mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                filter === "all"
                  ? "bg-[var(--brass-500)] text-[var(--baize-950)] font-bold"
                  : "bg-[var(--baize-800)] text-[var(--text-on-dark-2)] hover:text-white"
              )}
            >
              All Pairs ({pairs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("modified")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                filter === "modified"
                  ? "bg-[#f59e0b] text-[var(--baize-950)] font-bold"
                  : "bg-[var(--baize-800)] text-[var(--text-on-dark-2)] hover:text-white"
              )}
            >
              Modified ({stats.modifiedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("added_removed")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                filter === "added_removed"
                  ? "bg-[var(--risk-low)] text-[var(--baize-950)] font-bold"
                  : "bg-[var(--baize-800)] text-[var(--text-on-dark-2)] hover:text-white"
              )}
            >
              Added/Removed ({stats.addedCount + stats.removedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("high")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                filter === "high"
                  ? "bg-[var(--risk-high)] text-white font-bold"
                  : "bg-[var(--baize-800)] text-[var(--text-on-dark-2)] hover:text-white"
              )}
            >
              High Severity Only
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-on-dark-2)]">
            Showing {filteredPairs.length} of {pairs.length} clause pairs
          </div>
        </div>
      )}

      {/* Aligned Compare Rows List */}
      {filteredPairs.length > 0 ? (
        <div className="space-y-4">
          {filteredPairs.map((pair, idx) => (
            <CompareRow
              key={`${pair.a ?? "none"}_${pair.b ?? "none"}_${idx}`}
              pair={pair}
              clauseA={pair.a ? clauseMapA.get(pair.a) : undefined}
              clauseB={pair.b ? clauseMapB.get(pair.b) : undefined}
              role={role}
              isHighlighted={Boolean(
                highlightedClauseId &&
                  (pair.b === highlightedClauseId || pair.a === highlightedClauseId)
              )}
              onCitationClick={(id) => scrollToClause(id)}
            />
          ))}
        </div>
      ) : clausesA.length === 0 ? (
        /* Empty State / Prompt to Load */
        <div className="text-center p-12 rounded-xl border border-dashed border-[var(--brass-500)]/30 bg-[var(--baize-900)]/40 space-y-4">
          <div className="size-12 rounded-full bg-[var(--baize-800)] border border-[var(--brass-500)]/30 flex items-center justify-center mx-auto text-[var(--brass-300)]">
            <Icon name="compare" className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-display text-[var(--text-on-dark)]">
              No Comparison Active
            </h3>
            <p className="text-xs text-[var(--text-on-dark-2)] max-w-md mx-auto">
              Compare two versions of a contract to see exact word-level redline additions, deletions, and an analysis of how changes shift risk.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadSampleLeases}
            className="px-4 py-2 rounded-lg bg-[var(--brass-500)] hover:bg-[var(--brass-300)] text-xs font-bold text-[var(--baize-950)] transition-colors cursor-pointer select-none"
          >
            Load Sample Leases (V1 vs V2 with 5 planted changes)
          </button>
        </div>
      ) : null}
    </div>
  );
}

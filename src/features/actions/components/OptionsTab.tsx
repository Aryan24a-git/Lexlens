/**
 * Options & Next Steps Component.
 * Scenario exploration, grounded options, pros/cons, and next steps.
 * brain.md §7 P6, architecture.md §5.3
 */

"use client";

import { useState } from "react";
import type { OptionsResult } from "@/core/domain/schemas";
import { CitationPill } from "@/ui/patterns/CitationPill";

export interface OptionsTabProps {
  optionsResult: OptionsResult | null;
  isLoading: boolean;
  onExplore: (scenario: string) => void;
  onSelectClause?: ((clauseId: string) => void) | undefined;
  defaultPerspective?: string | undefined;
}

const STARTER_SCENARIOS = [
  "Can I terminate this agreement early?",
  "What happens if payment is delayed by 5 days?",
  "Can I sub-lease, assign, or subcontract?",
  "What are my rights if the counterparty breaches?",
  "What notice is required before making changes?",
];

export function OptionsTab({
  optionsResult,
  isLoading,
  onExplore,
  onSelectClause,
}: OptionsTabProps) {
  const [scenarioInput, setScenarioInput] = useState("");

  const handleSelectChip = (text: string) => {
    setScenarioInput(text);
    onExplore(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scenarioInput.trim()) {
      onExplore(scenarioInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Search / Input Box */}
      <div className="bg-[var(--vellum-50)] p-4 rounded-lg border border-[var(--vellum-300)] shadow-sm space-y-3">
        <div>
          <h3 className="font-serif text-base font-semibold text-[var(--ink-900)]">
            Explore Scenario Options & Next Steps
          </h3>
          <p className="text-xs text-[var(--ink-500)]">
            Ask what happens in a specific situation. LexLens evaluates your contractual options, pros & cons, and deadlines.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
            placeholder="e.g. Can I terminate early if I have to relocate?"
            className="flex-1 px-3 py-2 text-xs rounded border border-[var(--vellum-300)] bg-white text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-[var(--brass-500)] focus:ring-1 focus:ring-[var(--brass-500)]"
          />
          <button
            type="submit"
            disabled={isLoading || !scenarioInput.trim()}
            className="px-4 py-2 rounded bg-[var(--baize-800)] hover:bg-[var(--baize-900)] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Evaluating..." : "Evaluate"}
          </button>
        </form>

        {/* Starter Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-medium text-[var(--ink-400)]">Suggested Scenarios:</span>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_SCENARIOS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectChip(chip)}
                className="px-2.5 py-1 rounded-full text-xs bg-[var(--vellum-200)] hover:bg-[var(--vellum-300)] text-[var(--ink-700)] border border-[var(--vellum-300)]/60 transition-colors cursor-pointer text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-6 space-y-4 animate-pulse" role="status" aria-label="Evaluating scenario">
          <div className="h-6 w-48 bg-[var(--vellum-300)] rounded" />
          <div className="h-28 bg-[var(--vellum-200)] rounded-lg" />
          <div className="h-28 bg-[var(--vellum-200)] rounded-lg" />
        </div>
      )}

      {/* Results View */}
      {optionsResult && !isLoading && (
        <div className="space-y-6">
          {/* Active Scenario Banner */}
          <div className="p-3 bg-[var(--vellum-100)] border-l-4 border-[var(--brass-500)] rounded text-xs text-[var(--ink-800)]">
            <span className="font-semibold text-[var(--ink-900)]">Evaluated Scenario: </span>
            &ldquo;{optionsResult.scenario}&rdquo;
          </div>

          {/* Urgent Escalation Advice if flagged */}
          {optionsResult.escalationAdvice && (
            <div className="p-3.5 bg-[var(--risk-high)]/10 border border-[var(--risk-high)]/30 rounded-lg text-xs text-[var(--risk-high)]">
              <span className="font-bold block mb-1">⚠️ Urgent Safety / Rights Notice:</span>
              {optionsResult.escalationAdvice}
            </div>
          )}

          {/* Options Cards */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[var(--ink-700)]">
              Available Contractual Options ({optionsResult.options.length})
            </h4>

            {optionsResult.options.map((opt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-[var(--vellum-300)] bg-white shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--vellum-200)] pb-2">
                  <h5 className="font-serif text-sm font-bold text-[var(--ink-900)]">
                    {opt.title}
                  </h5>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--vellum-200)] text-[var(--ink-700)] font-mono">
                    Option #{idx + 1}
                  </span>
                </div>

                <p className="text-xs text-[var(--ink-800)] leading-relaxed">
                  {opt.description}
                </p>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded bg-[var(--risk-low)]/10 border border-[var(--risk-low)]/20 text-xs">
                    <span className="font-bold text-[var(--risk-low-text)] block mb-1">
                      ✓ Advantages
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[var(--ink-800)]">
                      {opt.pros.map((pro, pIdx) => (
                        <li key={pIdx}>{pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--risk-high)]/10 border border-[var(--risk-high)]/20 text-xs">
                    <span className="font-bold text-[var(--risk-high)] block mb-1">
                      ✕ Risks & Costs
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[var(--ink-800)]">
                      {opt.cons.map((con, cIdx) => (
                        <li key={cIdx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Citations */}
                {opt.citations.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--vellum-200)]">
                    <span className="text-[11px] text-[var(--ink-400)] font-medium">Grounding:</span>
                    {opt.citations.map((c, cIdx) => (
                      <CitationPill
                        key={cIdx}
                        citation={c}
                        onClick={onSelectClause}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Next Steps & Deadlines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--vellum-50)] border border-[var(--vellum-300)] space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-700)]">
                Recommended Immediate Next Steps
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-[var(--ink-800)]">
                {optionsResult.nextSteps.map((step, sIdx) => (
                  <li key={sIdx} className="leading-snug">{step}</li>
                ))}
              </ol>
            </div>

            <div className="p-4 rounded-lg bg-[var(--vellum-50)] border border-[var(--vellum-300)] space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-700)]">
                Key Contractual Deadlines
              </h5>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--ink-800)]">
                {optionsResult.deadlinesToWatch.map((dl, dIdx) => (
                  <li key={dIdx} className="leading-snug">{dl}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Questions for Legal Professional */}
          {optionsResult.questionsForProfessional.length > 0 && (
            <div className="p-4 rounded-lg bg-white border border-[var(--brass-500)]/40 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--brass-800)]">
                Questions to Ask a Legal Professional About This Scenario
              </h5>
              <ul className="list-disc list-inside space-y-1 text-xs text-[var(--ink-800)]">
                {optionsResult.questionsForProfessional.map((q, qIdx) => (
                  <li key={qIdx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

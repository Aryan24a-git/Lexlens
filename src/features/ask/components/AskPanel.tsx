"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAsk } from "../hooks/use-ask";
import { EscalationBanner } from "./EscalationBanner";
import { CitationPill } from "@/ui/patterns/CitationPill";
import { Icon } from "@/ui/icons/Icon";
import { cn } from "@/lib/utils";
import type { Clause, Answer } from "@/core/domain/schemas";
import type { DocType, Perspective } from "@/core/domain/enums";

export interface AskPanelProps {
  clauses: Clause[];
  perspective: Perspective;
  docType?: DocType | undefined;
  jurisdiction?: string | undefined;
  language?: string | undefined;
  onCitationClick?: ((clauseId: string) => void) | undefined;
  onPrepareBrief?: (() => void) | undefined;
  className?: string | undefined;
}

const DEFAULT_STARTERS = [
  "Can I terminate this agreement early?",
  "Who is responsible for repairs and maintenance?",
  "What happens if payments are delayed?",
  "Does this agreement renew automatically?",
];

/**
 * AskPanel — Grounded legal Q&A panel.
 * Streams answers with verified citations, basis badges, escalation alerts, and follow-ups.
 * architecture.md §5.3, design.md §7.3, §8
 */
export function AskPanel({
  clauses,
  perspective,
  docType,
  jurisdiction,
  language,
  onCitationClick,
  onPrepareBrief,
  className,
}: AskPanelProps) {
  const [inputQuestion, setInputQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    status,
    messages,
    askQuestion,
    clearChat,
  } = useAsk({
    clauses,
    perspective,
    docType,
    jurisdiction,
    language,
  });

  const isStreaming = status === "streaming";

  // Auto-scroll when messages update
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isStreaming) return;
    const q = inputQuestion;
    setInputQuestion("");
    void askQuestion(q);
  };

  const handleStarterClick = (starter: string) => {
    if (isStreaming) return;
    void askQuestion(starter);
  };

  const renderBasisBadge = (basis: Answer["basis"], citationsCount: number) => {
    switch (basis) {
      case "document":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--risk-low)]/20 text-[var(--risk-low-text,#16a34a)] border border-[var(--risk-low)]/30">
            <span className="size-1.5 rounded-full bg-[var(--risk-low-text,#16a34a)]" />
            From the document ({citationsCount} {citationsCount === 1 ? "quote" : "quotes"})
          </span>
        );
      case "general_information":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f59e0b]/20 text-[#d97706] border border-[#f59e0b]/30">
            <span className="size-1.5 rounded-full bg-[#f59e0b]" />
            General legal information
          </span>
        );
      case "not_found":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--baize-800)] text-[var(--text-on-dark-2)] border border-[var(--baize-700)]">
            <span className="size-1.5 rounded-full bg-[var(--baize-600)]" />
            Not found in this document
          </span>
        );
    }
  };

  return (
    <section
      role="region"
      aria-label="Document Q&A Assistant"
      className={cn(
        "flex flex-col h-[560px] max-h-[80vh] rounded-xl border border-[var(--brass-500)]/30 bg-[var(--baize-900)]/90 backdrop-blur shadow-xl overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--brass-500)]/20 bg-[var(--baize-950)]/70">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[var(--brass-500)]/20 text-[var(--brass-300)]">
            <Icon name="chat" className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-ui text-[var(--text-on-dark)]">
              Ask This Document
            </h3>
            <p className="text-[10px] text-[var(--text-on-dark-2)]">
              Grounded answers verified against extracted clauses
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            disabled={isStreaming}
            className="text-[11px] text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)] transition-colors px-2 py-1 rounded hover:bg-[var(--baize-800)] disabled:opacity-40 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-ui">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-3">
            <div className="size-10 rounded-full bg-[var(--baize-800)]/70 border border-[var(--brass-500)]/30 flex items-center justify-center text-[var(--brass-300)]">
              <Icon name="clause" className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-xs font-medium text-[var(--text-on-dark)]">
                Ask anything about your agreement
              </p>
              <p className="text-[11px] text-[var(--text-on-dark-2)] leading-relaxed">
                Answers cite exact clauses with verified quotes. If terms are missing, we tell you directly.
              </p>
            </div>

            <div className="pt-2 w-full max-w-sm space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--brass-300)]/80 text-left">
                Suggested questions:
              </p>
              {DEFAULT_STARTERS.map((starter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStarterClick(starter)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[var(--baize-800)]/60 hover:bg-[var(--baize-800)] border border-[var(--baize-700)] text-[11px] text-[var(--text-on-dark)] transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{starter}</span>
                  <span className="text-[var(--brass-500)] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1.5",
                msg.role === "user" ? "items-end" : "items-start"
              )}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[var(--brass-500)]/20 border border-[var(--brass-500)]/40 px-3.5 py-2 text-[var(--text-on-dark)]">
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="w-full max-w-[95%] space-y-3 rounded-2xl rounded-tl-xs bg-[var(--baize-950)]/80 border border-[var(--baize-700)] p-4 text-[var(--text-on-dark)]">
                  {/* Escalation alert banner if triggered */}
                  {msg.answer?.escalationTrigger && (
                    <EscalationBanner
                      trigger={msg.answer.escalationTrigger}
                      onPrepareBrief={onPrepareBrief}
                      className="mb-2"
                    />
                  )}

                  {/* Basis Badge */}
                  {msg.answer && (
                    <div className="flex items-center gap-2">
                      {renderBasisBadge(
                        msg.answer.basis,
                        msg.answer.citations.length
                      )}
                    </div>
                  )}

                  {/* Answer Text or Streaming Skeleton */}
                  {msg.isStreaming && !msg.content ? (
                    <div className="space-y-2 py-2">
                      <div className="h-3.5 bg-[var(--baize-800)] rounded animate-pulse w-3/4" />
                      <div className="h-3.5 bg-[var(--baize-800)] rounded animate-pulse w-5/6" />
                      <div className="h-3.5 bg-[var(--baize-800)] rounded animate-pulse w-1/2" />
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed whitespace-pre-line font-ui text-[var(--text-on-dark)]">
                      {msg.content}
                    </p>
                  )}

                  {/* Verified Citations List */}
                  {msg.answer && msg.answer.citations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--baize-800)] space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--brass-300)]">
                        Referenced Clauses:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.answer.citations.map((citation, idx) => (
                          <CitationPill
                            key={idx}
                            citation={citation}
                            showQuote={true}
                            onClick={onCitationClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nearest clauses if not found */}
                  {msg.answer &&
                    msg.answer.basis === "not_found" &&
                    msg.answer.nearestClauses &&
                    msg.answer.nearestClauses.length > 0 && (
                      <div className="pt-2 border-t border-[var(--baize-800)] space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-on-dark-2)]">
                          Closest Clauses in Document:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.answer.nearestClauses.map((clauseId) => (
                            <button
                              key={clauseId}
                              type="button"
                              onClick={() => onCitationClick?.(clauseId)}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--baize-800)] hover:bg-[var(--baize-700)] text-[var(--brass-300)] border border-[var(--baize-700)] transition-colors cursor-pointer"
                            >
                              Clause {clauseId} ↗
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Follow-up Question Chips */}
                  {msg.answer &&
                    msg.answer.followUpQuestions.length > 0 && (
                      <div className="pt-2 border-t border-[var(--baize-800)] space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-on-dark-2)]">
                          Suggested Follow-ups:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.answer.followUpQuestions.map((fu, idx) => (
                            <button
                              key={idx}
                              type="button"
                              disabled={isStreaming}
                              onClick={() => void askQuestion(fu)}
                              className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--baize-800)] hover:bg-[var(--baize-700)] border border-[var(--brass-500)]/30 text-[var(--text-on-dark)] transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--brass-500)]/20 bg-[var(--baize-950)] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={
            isStreaming
              ? "Synthesizing answer..."
              : "Ask a question about this document..."
          }
          disabled={isStreaming}
          className="flex-1 px-3.5 py-2 rounded-lg bg-[var(--baize-900)] border border-[var(--baize-700)] focus:border-[var(--brass-500)] text-xs text-[var(--text-on-dark)] placeholder:text-[var(--text-on-dark-2)] focus:outline-none transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isStreaming}
          className="px-4 py-2 rounded-lg font-ui text-xs font-bold bg-[var(--brass-500)] hover:bg-[var(--brass-300)] text-[var(--baize-950)] disabled:opacity-40 disabled:hover:bg-[var(--brass-500)] transition-all cursor-pointer select-none shrink-0"
        >
          {isStreaming ? (
            <span className="inline-block size-3.5 border-2 border-[var(--baize-950)] border-t-transparent rounded-full animate-spin" />
          ) : (
            "Ask"
          )}
        </button>
      </form>
    </section>
  );
}

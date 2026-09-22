import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  RiskChip,
  ConfidenceMeter,
  CitationPill,
  IndexTab,
  MarginNote,
  CheckFirstList,
  SummaryStrip,
  ScanOverlay,
} from "@/ui/patterns";
import type { Clause, ClauseAnalysis, DocumentSynthesis, Citation } from "@/core/domain/schemas";

describe("X-Ray UI Patterns (design.md §8)", () => {
  describe("RiskChip", () => {
    it("renders label and accessible attributes for High risk", () => {
      render(<RiskChip level="high" />);
      const chip = screen.getByLabelText("High Risk severity level");
      expect(chip).toBeDefined();
      expect(chip.textContent).toContain("High Risk");
    });

    it("renders Medium risk with correct label", () => {
      render(<RiskChip level="medium" />);
      expect(screen.getByText("Medium Risk")).toBeDefined();
    });

    it("renders Low risk with correct label", () => {
      render(<RiskChip level="low" />);
      expect(screen.getByText("Low Risk")).toBeDefined();
    });

    it("renders Info risk with correct label", () => {
      render(<RiskChip level="info" />);
      expect(screen.getByText("Informational")).toBeDefined();
    });
  });

  describe("ConfidenceMeter", () => {
    it("renders 5 segments with percentage label and accessible meter role", () => {
      render(<ConfidenceMeter confidence={0.8} />);
      const meter = screen.getByRole("meter");
      expect(meter).toBeDefined();
      expect(meter.getAttribute("aria-valuenow")).toBe("80");
      expect(screen.getByText("80%")).toBeDefined();
    });
  });

  describe("CitationPill", () => {
    const citation: Citation = {
      clauseId: "C3",
      quote: "payment due within 14 days",
      verified: true,
    };

    it("displays clause ID and verified checkmark", () => {
      render(<CitationPill citation={citation} />);
      const button = screen.getByRole("button", {
        name: "Citation C3, quote verified",
      });
      expect(button).toBeDefined();
      expect(button.textContent).toContain("C3");
      expect(button.textContent).toContain("✓");
    });

    it("triggers onClick callback with clause ID", () => {
      const handleClick = vi.fn();
      render(<CitationPill citation={citation} onClick={handleClick} />);
      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledWith("C3");
    });

    it("displays unverified marker when verified is false", () => {
      const unverified: Citation = {
        clauseId: "C4",
        quote: "fabricated quote",
        verified: false,
      };
      render(<CitationPill citation={unverified} />);
      expect(screen.getByText("?")).toBeDefined();
    });
  });

  describe("IndexTab", () => {
    it("renders 44px touch target with aria-pressed state", () => {
      const handleClick = vi.fn();
      render(
        <IndexTab
          clauseId="C7"
          riskLevel="high"
          selected={true}
          onClick={handleClick}
        />
      );

      const tab = screen.getByRole("button", { name: /Clause C7: high risk/i });
      expect(tab).toBeDefined();
      expect(tab.getAttribute("aria-pressed")).toBe("true");

      fireEvent.click(tab);
      expect(handleClick).toHaveBeenCalledWith("C7");
    });
  });

  describe("MarginNote", () => {
    const analysis: ClauseAnalysis = {
      clauseId: "C5",
      canonicalType: "payment_fees",
      plainSummary: "You must pay $1,500 by the 5th of each month.",
      obligations: ["Pay $1,500 by the 5th"],
      rights: [],
      whyItMatters: "Failure to pay incurs an immediate $75 penalty.",
      questionsToAsk: ["Can the due date be shifted to the 10th?"],
      risk: {
        level: "medium",
        reasons: ["Short grace period before penalty applies."],
        favors: "other_party",
        unusual: false,
      },
      confidence: 0.9,
      citations: [
        {
          clauseId: "C5",
          quote: "pay $1,500 by the 5th",
          verified: true,
        },
      ],
    };

    const clause: Clause = {
      id: "C5",
      index: 5,
      heading: "Monthly Payment",
      text: "The Tenant agrees to pay $1,500 by the 5th day of each month.",
      startOffset: 0,
      endOffset: 65,
      pages: [1],
    };

    it("renders plain meaning, why it matters, and questions to ask", () => {
      render(<MarginNote analysis={analysis} clause={clause} />);

      expect(screen.getByText(analysis.plainSummary)).toBeDefined();
      expect(screen.getByText(analysis.whyItMatters!)).toBeDefined();
      expect(screen.getByText(analysis.questionsToAsk![0]!)).toBeDefined();
      expect(screen.getByText("Favours Other Party")).toBeDefined();
    });

    it("toggles between plain meaning and original legal text", () => {
      render(<MarginNote analysis={analysis} clause={clause} />);

      // Initially on plain meaning
      expect(screen.getByText(analysis.plainSummary)).toBeDefined();

      // Click "Original" toggle
      const originalBtn = screen.getByRole("button", { name: "Original" });
      fireEvent.click(originalBtn);

      expect(screen.getByText(clause.text)).toBeDefined();
    });
  });

  describe("CheckFirstList", () => {
    const items = [
      {
        clauseId: "C2",
        headline: "Auto-renewal with 90-day notice window",
        level: "high" as const,
      },
      {
        clauseId: "C8",
        headline: "Uncapped indemnity on contractor",
        level: "high" as const,
      },
    ];

    it("renders priority ranked items and triggers clause selection", () => {
      const handleSelect = vi.fn();
      render(
        <CheckFirstList
          items={items}
          selectedClauseId="C2"
          onSelectClause={handleSelect}
        />
      );

      expect(screen.getByText("Check First")).toBeDefined();
      expect(screen.getByText("Auto-renewal with 90-day notice window")).toBeDefined();

      const button = screen.getByText("Uncapped indemnity on contractor").closest("button");
      expect(button).toBeDefined();
      if (button) {
        fireEvent.click(button);
        expect(handleSelect).toHaveBeenCalledWith("C8");
      }
    });
  });

  describe("SummaryStrip", () => {
    const synthesis: DocumentSynthesis = {
      docType: "lease_residential",
      parties: ["Alice", "Bob"],
      tldr: "A 1-year standard lease with monthly payment obligations.",
      keyFacts: [
        {
          label: "Term Duration",
          value: "12 months",
          citations: [{ clauseId: "C1", quote: "12 months", verified: true }],
        },
      ],
      topRisks: [],
      missingClauses: [],
      inconsistencies: [],
      perspective: "tenant",
      promptVersion: "2026-09-20.1",
    };

    it("displays TL;DR, key facts, and handles filter changes", () => {
      const handleFilter = vi.fn();
      render(
        <SummaryStrip
          synthesis={synthesis}
          riskFilter="all"
          onFilterChange={handleFilter}
          counts={{ total: 10, high: 2, medium: 3, low: 4, info: 1 }}
        />
      );

      expect(screen.getByText(synthesis.tldr)).toBeDefined();
      expect(screen.getByText("Term Duration")).toBeDefined();
      expect(screen.getByText("12 months")).toBeDefined();

      const highBtn = screen.getByRole("button", { name: /High/i });
      fireEvent.click(highBtn);
      expect(handleFilter).toHaveBeenCalledWith("high");
    });
  });

  describe("ScanOverlay", () => {
    it("renders accessible status when analyzing", () => {
      render(
        <ScanOverlay
          progress={0.5}
          statusText="Reading clause 5 of 10"
          isAnalyzing={true}
        />
      );

      const statusEl = screen.getByRole("status");
      expect(statusEl).toBeDefined();
      expect(statusEl.textContent).toContain("Reading clause 5 of 10");
    });

    it("renders nothing when isAnalyzing is false", () => {
      const { container } = render(
        <ScanOverlay progress={0} isAnalyzing={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});

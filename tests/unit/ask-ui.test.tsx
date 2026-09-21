import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EscalationBanner } from "@/features/safety/EscalationBanner";
import { AskPanel } from "@/features/ask/components/AskPanel";
import type { Clause } from "@/core/domain/schemas";

describe("Ask UI Components", () => {
  describe("EscalationBanner", () => {
    it("renders with shield icon, urgent title, and legal aid CTA", () => {
      render(
        <EscalationBanner
          trigger="eviction_lockout"
          reason="Active eviction notice"
          guidance="Contact a tenant advocacy clinic immediately."
        />
      );

      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText(/Urgent Notice: Active eviction notice/i)).toBeDefined();
      expect(screen.getByText(/Contact a tenant advocacy clinic immediately/i)).toBeDefined();
      expect(screen.getByText(/Find Free \/ Low-Cost Legal Aid/i)).toBeDefined();
    });

    it("renders prepare brief CTA when callback provided", () => {
      render(
        <EscalationBanner
          onPrepareBrief={() => {}}
        />
      );

      expect(screen.getByText(/Prepare Lawyer Brief/i)).toBeDefined();
    });
  });

  describe("AskPanel", () => {
    const sampleClauses: Clause[] = [
      {
        id: "C1",
        index: 1,
        heading: "Rent",
        text: "Rent is $2,000.",
        startOffset: 0,
        endOffset: 15,
        pages: [1],
      },
    ];

    it("renders document Q&A assistant header and starter questions when empty", () => {
      render(
        <AskPanel
          clauses={sampleClauses}
          perspective="tenant"
        />
      );

      expect(screen.getByRole("region", { name: /Document Q&A Assistant/i })).toBeDefined();
      expect(screen.getByText(/Ask This Document/i)).toBeDefined();
      expect(screen.getByText(/Can I terminate this agreement early\?/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Ask a question about this document\.\.\./i)).toBeDefined();
    });
  });
});

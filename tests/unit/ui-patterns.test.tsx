import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PaperSheet } from "@/ui/patterns/PaperSheet";
import { ClauseBlock } from "@/ui/patterns/ClauseBlock";
import { PerspectivePicker } from "@/features/workspace/components/PerspectivePicker";
import { Dropzone } from "@/features/ingest/components/Dropzone";
import { Clause } from "@/core/domain";

describe("ui/patterns and ingest components", () => {
  describe("PaperSheet", () => {
    it("renders document title, subtitle, and page count badge", () => {
      render(
        <PaperSheet
          title="Residential Lease Agreement"
          subtitle="14 clauses extracted"
          pageCount={3}
        >
          <p>Sample document content inside sheet</p>
        </PaperSheet>
      );

      expect(screen.getByText("Residential Lease Agreement")).toBeDefined();
      expect(screen.getByText("14 clauses extracted")).toBeDefined();
      expect(screen.getByText("3 Pages")).toBeDefined();
      expect(screen.getByText("Sample document content inside sheet")).toBeDefined();
    });
  });

  describe("ClauseBlock", () => {
    const mockClause: Clause = {
      id: "C3",
      index: 3,
      heading: "3. RENT & PAYMENTS",
      text: "Tenant agrees to pay Landlord monthly rent in the amount of $2,200.00 USD.",
      startOffset: 120,
      endOffset: 194,
      pages: [1],
      tokenEstimate: 20,
    };

    it("renders Bates stamp, heading, and clause text", () => {
      render(<ClauseBlock clause={mockClause} />);

      expect(screen.getByText("C3")).toBeDefined();
      expect(screen.getByText("3. RENT & PAYMENTS")).toBeDefined();
      expect(
        screen.getByText(
          "Tenant agrees to pay Landlord monthly rent in the amount of $2,200.00 USD."
        )
      ).toBeDefined();
    });

    it("handles selection and click events", () => {
      const handleSelect = vi.fn();
      render(
        <ClauseBlock
          clause={mockClause}
          isSelected={true}
          onSelect={handleSelect}
        />
      );

      const article = screen.getByRole("article");
      expect(article.getAttribute("aria-current")).toBe("true");
      expect(article.getAttribute("data-selected")).toBe("true");

      fireEvent.click(article);
      expect(handleSelect).toHaveBeenCalledWith(mockClause);
    });

    it("handles keyboard navigation with arrow keys", () => {
      const handleNavigate = vi.fn();
      render(
        <ClauseBlock
          clause={mockClause}
          onNavigate={handleNavigate}
        />
      );

      const article = screen.getByRole("article");
      fireEvent.keyDown(article, { key: "ArrowDown" });
      expect(handleNavigate).toHaveBeenCalledWith("down", mockClause);

      fireEvent.keyDown(article, { key: "ArrowUp" });
      expect(handleNavigate).toHaveBeenCalledWith("up", mockClause);
    });
  });

  describe("PerspectivePicker", () => {
    it("renders role chips and calls onChangeRole when clicked", () => {
      const handleChangeRole = vi.fn();
      render(
        <PerspectivePicker
          selectedRole="tenant"
          onChangeRole={handleChangeRole}
        />
      );

      const landlordChip = screen.getByText("Landlord");
      fireEvent.click(landlordChip);
      expect(handleChangeRole).toHaveBeenCalledWith("landlord");
    });

    it("allows entering a custom role", () => {
      const handleChangeRole = vi.fn();
      render(
        <PerspectivePicker
          selectedRole="tenant"
          onChangeRole={handleChangeRole}
        />
      );

      fireEvent.click(screen.getByText("+ Other role..."));
      const input = screen.getByPlaceholderText("e.g. Subcontractor");
      fireEvent.change(input, { target: { value: "Subcontractor" } });
      fireEvent.click(screen.getByText("Set"));

      expect(handleChangeRole).toHaveBeenCalledWith("Subcontractor");
    });
  });

  describe("Dropzone", () => {
    it("renders idle prompt and sample document chips", () => {
      render(<Dropzone onDocumentParsed={vi.fn()} />);

      expect(
        screen.getByText("Drop a lease, contract or policy here")
      ).toBeDefined();
      expect(screen.getByText("Residential Lease Agreement")).toBeDefined();
      expect(screen.getByText("Freelance Services Agreement")).toBeDefined();
      expect(screen.getByText("Mutual Non-Disclosure Agreement")).toBeDefined();
    });

    it("loads sample document when sample chip is clicked", async () => {
      const handleParsed = vi.fn();
      render(<Dropzone onDocumentParsed={handleParsed} />);

      const leaseChip = screen.getByText("Residential Lease Agreement");
      await act(async () => {
        fireEvent.click(leaseChip);
      });

      // Verify callback is triggered with parsed document
      await vi.waitFor(() => {
        expect(handleParsed).toHaveBeenCalled();
      });

      const calledDoc = handleParsed.mock.calls[0][0];
      expect(calledDoc.fileName).toBe("Residential Lease Agreement");
      expect(calledDoc.fileType).toBe("txt");
    });
  });
});

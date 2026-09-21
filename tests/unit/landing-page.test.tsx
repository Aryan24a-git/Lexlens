import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "@app/page";

describe("LandingPage (design.md §7.1)", () => {
  it("renders hero headline and main call-to-actions", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: /know what you.*re signing/i })
    ).toBeDefined();

    const analyzeLinks = screen.getAllByRole("link", { name: /analyze a document/i });
    expect(analyzeLinks.length).toBeGreaterThanOrEqual(1);
    expect(analyzeLinks[0]?.getAttribute("href")).toBe("/workspace");

    const compareLink = screen.getByRole("link", { name: /compare two drafts/i });
    expect(compareLink.getAttribute("href")).toBe("/compare");
  });

  it("renders the three ruled sections: Understand, Compare, Prepare", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Understand" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Compare" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Prepare" })).toBeDefined();
  });

  it("displays client privacy and deterministic grounding guarantees", () => {
    render(<LandingPage />);

    expect(
      screen.getByText(/processed locally in browser/i)
    ).toBeDefined();
    expect(
      screen.getByText(/100% deterministic quote verification/i)
    ).toBeDefined();
  });
});

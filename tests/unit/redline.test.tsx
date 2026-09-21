import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RedlineText } from "@/ui/patterns/RedlineText";
import type { DiffOp } from "@/core/domain/schemas";

describe("RedlineText Component", () => {
  it("renders additions in semantic <ins> tag with accessible aria-label", () => {
    const ops: DiffOp[] = [
      { value: "The monthly rent is " },
      { value: "$2,450.00", added: true },
      { value: " payable on the 1st." },
    ];

    render(<RedlineText ops={ops} />);

    const insElement = screen.getByLabelText(/Added text: \$2,450\.00/i);
    expect(insElement).toBeDefined();
    expect(insElement.tagName.toLowerCase()).toBe("ins");
    expect(insElement.textContent).toBe("$2,450.00");
  });

  it("renders deletions in semantic <del> tag with accessible aria-label", () => {
    const ops: DiffOp[] = [
      { value: "Grace period is " },
      { value: "five (5) days", removed: true },
      { value: "two (2) days", added: true },
    ];

    render(<RedlineText ops={ops} />);

    const delElement = screen.getByLabelText(/Deleted text: five \(5\) days/i);
    expect(delElement).toBeDefined();
    expect(delElement.tagName.toLowerCase()).toBe("del");
  });

  it("renders fallback message when ops array is empty", () => {
    render(<RedlineText ops={[]} />);
    expect(screen.getByText(/No textual content/i)).toBeDefined();
  });
});

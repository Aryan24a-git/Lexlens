import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PrivacyControls } from "@/features/workspace/components/PrivacyControls";

describe("PrivacyControls Component", () => {
  it("renders private mode toggle, PII shield toggle, and transparency trigger", () => {
    render(
      <PrivacyControls
        isPrivateMode={false}
        onTogglePrivateMode={() => {}}
        isPiiRedactionEnabled={true}
        onTogglePiiRedaction={() => {}}
        onClearEverything={() => {}}
        clauseCount={12}
        wordCount={850}
      />
    );

    expect(screen.getByText("Private Mode")).toBeDefined();
    expect(screen.getByText("PII Shield On")).toBeDefined();
    expect(screen.getByText("What We Send")).toBeDefined();
    expect(screen.getByText("Clear Everything")).toBeDefined();
  });

  it("calls onTogglePrivateMode when clicked", () => {
    const onTogglePrivate = vi.fn();
    render(
      <PrivacyControls
        isPrivateMode={false}
        onTogglePrivateMode={onTogglePrivate}
        isPiiRedactionEnabled={true}
        onTogglePiiRedaction={() => {}}
        onClearEverything={() => {}}
        clauseCount={12}
        wordCount={850}
      />
    );

    const button = screen.getByText("Private Mode");
    fireEvent.click(button);
    expect(onTogglePrivate).toHaveBeenCalledWith(true);
  });

  it("opens 'What We Send' dialog and displays payload details", () => {
    render(
      <PrivacyControls
        isPrivateMode={true}
        onTogglePrivateMode={() => {}}
        isPiiRedactionEnabled={true}
        onTogglePiiRedaction={() => {}}
        onClearEverything={() => {}}
        clauseCount={14}
        wordCount={1200}
      />
    );

    const openBtn = screen.getByText("What We Send");
    fireEvent.click(openBtn);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("What Leaves Your Device")).toBeDefined();
    expect(screen.getByText("0 bytes (Client-side parsed)")).toBeDefined();
    expect(screen.getByText(/14 clauses/)).toBeDefined();
    expect(screen.getByText("Groq Cloud (Zero data retention)")).toBeDefined();

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("requests confirmation before clearing data", () => {
    const onClear = vi.fn();
    render(
      <PrivacyControls
        isPrivateMode={false}
        onTogglePrivateMode={() => {}}
        isPiiRedactionEnabled={true}
        onTogglePiiRedaction={() => {}}
        onClearEverything={onClear}
        clauseCount={5}
        wordCount={300}
      />
    );

    const clearBtn = screen.getByText("Clear Everything");
    fireEvent.click(clearBtn);

    expect(screen.getByText("Wipe all local data?")).toBeDefined();
    expect(onClear).not.toHaveBeenCalled();

    const yesBtn = screen.getByText("Yes");
    fireEvent.click(yesBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

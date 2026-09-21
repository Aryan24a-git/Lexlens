import { describe, it, expect } from "vitest";
import { redactPii, restorePii } from "@/core/safety/pii-redactor";

describe("PII Redactor", () => {
  it("masks emails, phones, SSNs, credit cards and addresses", () => {
    const text =
      "Contact John Doe at john.doe@example.com or call +1 415-555-2671. SSN: 123-45-6789. Card: 4111-2222-3333-4444. Address: 123 Elm Street, City.";

    const result = redactPii(text);

    expect(result.totalCount).toBeGreaterThanOrEqual(4);
    expect(result.countsByType.EMAIL).toBe(1);
    expect(result.countsByType.PHONE).toBe(1);
    expect(result.countsByType.GOV_ID).toBe(1);
    expect(result.countsByType.CREDIT_CARD).toBe(1);

    // Redacted text should not contain the original sensitive values
    expect(result.redactedText).not.toContain("john.doe@example.com");
    expect(result.redactedText).not.toContain("123-45-6789");
    expect(result.redactedText).not.toContain("4111-2222-3333-4444");

    // Tokens should be inserted
    expect(result.redactedText).toContain("[REDACTED_EMAIL_1]");
    expect(result.redactedText).toContain("[REDACTED_GOV_ID_1]");
    expect(result.redactedText).toContain("[REDACTED_CREDIT_CARD_1]");
  });

  it("is 100% reversible with restorePii", () => {
    const originalText =
      "Party Alice (alice.smith@firm.legal, 555-123-4567, SSN 987-65-4321) agrees to remit funds to account US123456789012345678.";

    const { redactedText, tokenMap } = redactPii(originalText);

    expect(redactedText).not.toEqual(originalText);

    const restored = restorePii(redactedText, tokenMap);
    expect(restored).toEqual(originalText);
  });

  it("handles text with no PII without alterations", () => {
    const cleanText =
      "This agreement shall be governed by the laws of the State of Delaware.";
    const result = redactPii(cleanText);

    expect(result.totalCount).toBe(0);
    expect(result.redactedText).toBe(cleanText);
    expect(Object.keys(result.tokenMap)).toHaveLength(0);
  });

  it("handles empty or blank string gracefully", () => {
    const emptyResult = redactPii("");
    expect(emptyResult.totalCount).toBe(0);
    expect(emptyResult.redactedText).toBe("");

    const restored = restorePii("", {});
    expect(restored).toBe("");
  });
});

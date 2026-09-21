import { describe, it, expect } from "vitest";
import {
  sanitizeUnicode,
  fixHyphenation,
  cleanWhitespace,
  stripRepeatedHeadersFooters,
  normalizePages,
  normalizeText,
  getPageForOffset,
  countWords,
} from "@/core/parsing/normalize";

describe("core/parsing/normalize", () => {
  describe("sanitizeUnicode", () => {
    it("strips BOM and zero-width spaces", () => {
      const dirty = "\uFEFFHello\u200B \u200CWorld\u200D!";
      expect(sanitizeUnicode(dirty)).toBe("Hello World!");
    });

    it("converts non-breaking spaces and unicode spaces to regular space", () => {
      const withNbsp = "Clause\u00A04.1\u2003Deposit\u3000Amount";
      expect(sanitizeUnicode(withNbsp)).toBe("Clause 4.1 Deposit Amount");
    });

    it("normalizes Windows and Mac line breaks to \\n", () => {
      const mixed = "Line 1\r\nLine 2\rLine 3\nLine 4";
      expect(sanitizeUnicode(mixed)).toBe("Line 1\nLine 2\nLine 3\nLine 4");
    });
  });

  describe("fixHyphenation", () => {
    it("stitches words split across line breaks", () => {
      const hyphenated = "This agree-\nment establishes an obli-\n  gation to pay.";
      const fixed = fixHyphenation(hyphenated);
      expect(fixed).toBe("This agreement establishes an obligation to pay.");
    });

    it("does not remove hyphens from ordinary hyphenated words on a single line", () => {
      const regular = "non-disclosure and third-party rights";
      expect(fixHyphenation(regular)).toBe(regular);
    });
  });

  describe("cleanWhitespace", () => {
    it("trims trailing spaces and collapses excessive newlines", () => {
      const messy = "Line 1   \n\n\n\nLine 2  \n\n\nLine 3";
      expect(cleanWhitespace(messy)).toBe("Line 1\n\nLine 2\n\nLine 3");
    });
  });

  describe("stripRepeatedHeadersFooters", () => {
    it("removes repeating header lines across pages", () => {
      const page1 = "ACME CORP - LEASE AGREEMENT\n1. Premises\nTenant leases apartment 4B.\nPage 1 of 3";
      const page2 = "ACME CORP - LEASE AGREEMENT\n2. Term\nThe lease term is one year.\nPage 2 of 3";
      const page3 = "ACME CORP - LEASE AGREEMENT\n3. Rent\nMonthly rent is $2,000.\nPage 3 of 3";

      const cleaned = stripRepeatedHeadersFooters([page1, page2, page3]);
      expect(cleaned[0]).not.toContain("ACME CORP - LEASE AGREEMENT");
      expect(cleaned[0]).not.toContain("Page 1 of 3");
      expect(cleaned[0]).toContain("1. Premises");

      expect(cleaned[1]).not.toContain("ACME CORP - LEASE AGREEMENT");
      expect(cleaned[1]).toContain("2. Term");

      expect(cleaned[2]).not.toContain("ACME CORP - LEASE AGREEMENT");
      expect(cleaned[2]).toContain("3. Rent");
    });

    it("leaves single page documents untouched", () => {
      const singlePage = ["1. Single page text\nPage 1 of 1"];
      expect(stripRepeatedHeadersFooters(singlePage)).toEqual(singlePage);
    });
  });

  describe("normalizePages & page mapping", () => {
    it("builds contiguous offsets and accurate page lookup", () => {
      const inputPages = [
        { pageNumber: 1, text: "First page content with clause one." },
        { pageNumber: 2, text: "Second page content with clause two." },
      ];

      const { normalizedText, pages } = normalizePages(inputPages);

      expect(pages).toHaveLength(2);
      expect(pages[0]!.pageNumber).toBe(1);
      expect(pages[1]!.pageNumber).toBe(2);

      // Verify offsets slice back to text
      const page1Slice = normalizedText.slice(pages[0]!.startOffset, pages[0]!.endOffset);
      expect(page1Slice).toBe(pages[0]!.text);

      const page2Slice = normalizedText.slice(pages[1]!.startOffset, pages[1]!.endOffset);
      expect(page2Slice).toBe(pages[1]!.text);

      // Verify page lookup by character offset
      expect(getPageForOffset(pages, 5)).toBe(1);
      expect(getPageForOffset(pages, pages[1]!.startOffset + 2)).toBe(2);
    });
  });

  describe("countWords", () => {
    it("counts words accurately", () => {
      expect(countWords("")).toBe(0);
      expect(countWords("   ")).toBe(0);
      expect(countWords("This agreement has five words.")).toBe(5);
    });
  });
});

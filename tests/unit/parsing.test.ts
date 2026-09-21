import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  detectFileType,
  parseText,
  parsePdf,
  parseDocx,
  parseDocument,
} from "@/core/parsing";
import { ingestText } from "@/features/ingest/services/ingest-service";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");

describe("core/parsing", () => {
  describe("detectFileType", () => {
    it("detects PDF magic bytes", () => {
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
      const result = detectFileType(pdfHeader);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("pdf");
      }
    });

    it("detects DOCX / ZIP magic bytes", () => {
      const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]); // PK\x03\x04
      const result = detectFileType(zipHeader);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("docx");
      }
    });

    it("detects plain text UTF-8", () => {
      const textBytes = new TextEncoder().encode("1. PREMISES\nThis is a lease agreement.");
      const result = detectFileType(textBytes);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("txt");
      }
    });

    it("returns error for empty buffer", () => {
      const empty = new Uint8Array([]);
      const result = detectFileType(empty);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PARSE_FAILED");
      }
    });

    it("returns friendly error for unsupported binary file", () => {
      // Arbitrary binary bytes with nulls
      const binary = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x00, 0x00, 0x01]);
      const result = detectFileType(binary);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FILE_UNSUPPORTED");
        expect(result.error.message).toBe(
          "Only PDF, Word (.docx), or plain text files are supported."
        );
      }
    });
  });

  describe("parseText with synthetic fixtures", () => {
    const fixtureNames = [
      "lease-v1.txt",
      "lease-v2.txt",
      "freelance-agreement.txt",
      "employment-offer.txt",
      "nda.txt",
      "terms-of-service.txt",
    ];

    for (const name of fixtureNames) {
      it(`parses fixture ${name} successfully`, () => {
        const filePath = path.join(FIXTURES_DIR, name);
        const content = fs.readFileSync(filePath, "utf-8");

        const result = parseText(content, name);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const doc = result.value;
          expect(doc.fileName).toBe(name);
          expect(doc.fileType).toBe("txt");
          expect(doc.pageCount).toBeGreaterThanOrEqual(1);
          expect(doc.wordCount).toBeGreaterThan(100);
          expect(doc.normalizedText.length).toBeGreaterThan(200);
          expect(doc.pages.length).toBe(doc.pageCount);
        }
      });
    }

    it("rejects empty text", () => {
      const result = parseText("   ");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PARSE_FAILED");
      }
    });

    it("rejects files exceeding size limit", () => {
      const result = parseText("Valid content", "test.txt", { maxSizeBytes: 5 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FILE_TOO_LARGE");
        expect(result.error.message).toContain("over 10 MB");
      }
    });
  });

  describe("parsePdf edge cases", () => {
    // Construct a valid minimal PDF with accurate byte offsets
    function createMinimalPdf(textContent: string): Uint8Array {
      const content = `BT /F1 12 Tf 100 700 Td (${textContent}) Tj ET`;
      let out = "%PDF-1.4\n";
      const offsets: number[] = [];

      offsets.push(out.length);
      out += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

      offsets.push(out.length);
      out += "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

      offsets.push(out.length);
      out += "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";

      offsets.push(out.length);
      out += `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`;

      offsets.push(out.length);
      out += "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

      const startxref = out.length;
      out += "xref\n0 6\n0000000000 65535 f \n";
      for (const o of offsets) {
        out += String(o).padStart(10, "0") + " 00000 n \n";
      }
      out += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;
      return new TextEncoder().encode(out);
    }

    it("parses valid PDF and extracts selectable text", async () => {
      const pdfBytes = createMinimalPdf("Residential Lease Agreement between Landlord and Tenant with full legal terms.");
      const result = await parsePdf(pdfBytes, "lease.pdf");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.fileType).toBe("pdf");
        expect(result.value.pageCount).toBe(1);
        expect(result.value.normalizedText).toContain("Residential Lease Agreement");
      }
    });

    it("identifies scanned PDF when selectable text is insufficient", async () => {
      // Very few characters (< 20) in PDF text
      const scannedPdfBytes = createMinimalPdf("scan");
      const result = await parsePdf(scannedPdfBytes, "scanned.pdf");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FILE_SCANNED");
        expect(result.error.message).toBe(
          "This PDF has no selectable text, so it may be a scan. Run text recognition to read it. It stays on your device."
        );
      }
    });

    it("identifies encrypted/password protected PDFs", async () => {
      // A mock encrypted PDF header
      const encryptedPdf = new TextEncoder().encode(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj
trailer << /Root 1 0 R /Encrypt << /Filter /Standard /V 1 /R 2 /P -44 /O () /U () >> >>
startxref
120
%%EOF`);
      const result = await parsePdf(encryptedPdf, "protected.pdf");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Will either trigger FILE_ENCRYPTED or PARSE_FAILED
        expect(["FILE_ENCRYPTED", "PARSE_FAILED"]).toContain(result.error.code);
      }
    });
  });

  describe("parseDocx", () => {
    it("returns PARSE_FAILED for corrupt or invalid docx bytes", async () => {
      // Invalid zip archive
      const corrupt = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const result = await parseDocx(corrupt, "corrupt.docx");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PARSE_FAILED");
      }
    });
  });

  describe("parseDocument unified dispatcher", () => {
    it("parses string input directly", async () => {
      const result = await parseDocument("1. CLAUSE ONE\nPlain text input test.");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.fileType).toBe("txt");
      }
    });
  });

  describe("ingestText service", () => {
    it("parses text and reports progress", async () => {
      const progressUpdates: number[] = [];
      const result = await ingestText("1. Agreement\nSample text content.", "sample.txt", {
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(result.ok).toBe(true);
      expect(progressUpdates.length).toBeGreaterThanOrEqual(1);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(1.0);
    });
  });
});

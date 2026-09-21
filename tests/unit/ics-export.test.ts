import { describe, it, expect } from "vitest";
import {
  parseDueDateToDateArray,
  buildChecklistICS,
} from "@/features/actions/exporters/ics-export";
import type { ChecklistItem } from "@/core/domain/schemas";

describe("ICS Calendar Exporter", () => {
  describe("parseDueDateToDateArray", () => {
    it("parses explicit ISO date YYYY-MM-DD", () => {
      const parsed = parseDueDateToDateArray("2026-10-15");
      expect(parsed[0]).toBe(2026);
      expect(parsed[1]).toBe(10);
      expect(parsed[2]).toBe(15);
      expect(parsed[3]).toBe(9);
      expect(parsed[4]).toBe(0);
    });

    it("parses 'within X days' relative timeline", () => {
      const base = new Date("2026-09-01T12:00:00Z");
      const parsed = parseDueDateToDateArray("within 10 days", base);
      expect(parsed[0]).toBe(2026);
      expect(parsed[1]).toBe(9);
      expect(parsed[2]).toBe(11);
    });

    it("parses 'by the 1st' monthly deadline", () => {
      const base = new Date("2026-09-15T12:00:00Z");
      const parsed = parseDueDateToDateArray("by the 1st of each month", base);
      expect(parsed[0]).toBe(2026);
      expect(parsed[1]).toBe(10); // next month
      expect(parsed[2]).toBe(1);
    });

    it("defaults to sensible future date when due string is omitted", () => {
      const base = new Date("2026-09-01T12:00:00Z");
      const parsed = parseDueDateToDateArray(undefined, base);
      expect(parsed[0]).toBe(2026);
      expect(parsed[1]).toBe(9);
      expect(parsed[2]).toBe(8); // base + 7 days
    });
  });

  describe("buildChecklistICS", () => {
    it("returns empty string when no items provided", async () => {
      const ics = await buildChecklistICS([]);
      expect(ics).toBe("");
    });

    it("generates RFC-5545 compliant iCalendar string for checklist items", async () => {
      const items: ChecklistItem[] = [
        {
          item: "Pay initial security deposit of $2,200",
          owner: "you",
          due: "2026-10-01",
          priority: "high",
          citation: {
            clauseId: "C2",
            quote: "Tenant shall deposit $2,200",
            verified: true,
          },
        },
        {
          item: "Submit inventory inspection report",
          owner: "both",
          due: "within 14 days",
          priority: "medium",
        },
      ];

      const ics = await buildChecklistICS(items, "Residential Lease");
      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("SUMMARY:[LexLens] Pay initial security deposit");
      expect(ics).toContain("SUMMARY:[LexLens] Submit inventory inspection report");
      expect(ics).toContain("STATUS:CONFIRMED");
      expect(ics).toContain("END:VCALENDAR");
    });
  });
});

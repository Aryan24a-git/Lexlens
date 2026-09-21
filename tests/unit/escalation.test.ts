import { describe, it, expect } from "vitest";
import {
  detectEscalation,
  detectEscalationFast,
} from "@/core/safety/escalation-rules";

describe("Escalation & Safety Classifier", () => {
  it("detects self-harm crisis and directs to 988 lifeline", () => {
    const res = detectEscalation("I feel hopeless about this eviction and want to kill myself");
    expect(res.triggered).toBe(true);
    expect(res.isSelfHarm).toBe(true);
    expect(res.severity).toBe("urgent");
    expect(res.guidance).toContain("988");
  });

  it("detects criminal custody / arrest warrants", () => {
    const res = detectEscalation("The police detained me and placed me in handcuffs");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("arrest_police");
    expect(res.severity).toBe("urgent");
    expect(res.guidance).toContain("criminal defense");
  });

  it("detects court hearing and summons deadlines", () => {
    const res = detectEscalation("I received a formal summons and have a court date tomorrow morning");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("court_hearing");
    expect(res.severity).toBe("urgent");
  });

  it("detects unlawful eviction lockout and utility shutoff", () => {
    const res = detectEscalation("My landlord changed the locks while I was at work and shut off the water");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("eviction_lockout");
    expect(res.severity).toBe("urgent");
  });

  it("detects domestic abuse and restraining order violations", () => {
    const res = detectEscalation("My abusive ex-partner violated the restraining order and threatened me");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("domestic_violence");
    expect(res.guidance).toContain("1-800-799-SAFE");
  });

  it("detects child custody emergencies", () => {
    const res = detectEscalation("My ex has taken my child out of state without permission");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("child_custody_emergency");
    expect(res.severity).toBe("urgent");
  });

  it("detects ICE deportation and removal proceedings", () => {
    const res = detectEscalation("I received a notice of deportation proceedings from immigration");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("immigration_deportation");
    expect(res.severity).toBe("urgent");
  });

  it("detects wage theft and withheld paychecks", () => {
    const res = detectEscalation("My boss withheld my paycheck for two months and refuses to pay");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("wage_theft");
    expect(res.severity).toBe("high");
  });

  it("detects statutory 72-hour deadlines", () => {
    const res = detectEscalation("The deadline to file is tomorrow at 5pm or I lose my rights");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("statutory_deadline_72h");
  });

  it("returns triggered=false for standard contractual inquiries", () => {
    const res = detectEscalation("What is the security deposit amount according to section 4?");
    expect(res.triggered).toBe(false);
    expect(res.severity).toBe("none");
    expect(res.trigger).toBeUndefined();
  });

  it("works with detectEscalationFast without extra context", () => {
    const res = detectEscalationFast("I was served an eviction notice 3-day notice");
    expect(res.triggered).toBe(true);
    expect(res.trigger).toBe("eviction_lockout");
  });
});

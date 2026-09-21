import { describe, it, expect } from "vitest";
import { runAllEvaluations, calculateFleschKincaid } from "../../scripts/eval";

describe("LexLens 8-Gate Evaluation Suite (brain.md §14)", () => {
  it("calculates Flesch-Kincaid grade level accurately", () => {
    // Grade 8 style legal explanation
    const explanation =
      "You must pay your rent on the first day of every month. If you are late, there is a small fee.";
    const grade = calculateFleschKincaid(explanation);
    expect(grade).toBeLessThanOrEqual(9.0);
  });

  it("passes all 8 evaluation gates", async () => {
    const report = await runAllEvaluations();

    expect(report.totalFailed).toBe(0);
    expect(report.allPassed).toBe(true);

    for (const metric of report.metrics) {
      expect(
        metric.passed,
        `Metric "${metric.metric}" in suite "${metric.suite}" failed with score ${metric.score} (Gate: ${metric.gate})`
      ).toBe(true);
    }
  });
});

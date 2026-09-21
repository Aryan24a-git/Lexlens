import { test, expect } from "@playwright/test";

test.describe("LexLens E2E Rehearsal Walkthrough (workthrough.md §B & §C)", () => {
  test("1. Landing page loads with Chambers & Paper aesthetic and CTAs", async ({ page }) => {
    await page.goto("/");

    // Verify main headline and branding
    const headline = page.locator("h1");
    await expect(headline).toContainText(/know what you.*re signing/i);

    // Verify CTAs
    const analyzeLink = page.getByRole("link", { name: /analyze a document/i }).first();
    await expect(analyzeLink).toBeVisible();
    await expect(analyzeLink).toHaveAttribute("href", "/workspace");

    const compareLink = page.getByRole("link", { name: /compare two drafts/i });
    await expect(compareLink).toBeVisible();
    await expect(compareLink).toHaveAttribute("href", "/compare");

    // Verify three core feature pillars
    await expect(page.getByRole("heading", { name: "Understand" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Compare" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prepare" })).toBeVisible();

    // Verify client-side privacy guarantee
    await expect(page.getByText(/processed locally in browser/i)).toBeVisible();
  });

  test("2. Workspace intake, sample load, Bates stamped clauses, and privacy controls", async ({ page }) => {
    await page.goto("/workspace");

    // Verify perspective picker options
    await expect(page.getByText("Your Perspective")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Tenant" })).toBeVisible();

    // Verify Dropzone and Sample document chips
    const sampleLeaseChip = page.getByRole("button", { name: "Residential Lease Agreement", exact: true });
    await expect(sampleLeaseChip).toBeVisible();

    // Load sample lease
    await sampleLeaseChip.click();

    // Verify PaperSheet appears with Bates stamped clauses
    await expect(page.getByRole("heading", { name: "Residential Lease Agreement" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("C1", { exact: true })).toBeVisible();
    await expect(page.getByText("C3", { exact: true })).toBeVisible();

    // Verify Privacy and Session Controls bar
    await expect(page.getByText("Private Mode")).toBeVisible();
    await expect(page.getByText("PII Shield On")).toBeVisible();
    await expect(page.getByText("What We Send")).toBeVisible();

    // Test 'What We Send' transparency dialog
    await page.getByText("What We Send").click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("What Leaves Your Device")).toBeVisible();
    await expect(modal.getByText("0 bytes (Client-side parsed)")).toBeVisible();
    await modal.getByRole("button", { name: "Close", exact: true }).click();
    await expect(modal).not.toBeVisible();

    // Test Private Mode toggle
    const privateModeBtn = page.getByText("Private Mode");
    await privateModeBtn.click();
    await expect(page.getByText("Private Mode Active")).toBeVisible();

    // Verify Navigation links to Lawyer Brief and Compare
    await expect(page.getByRole("link", { name: /lawyer brief/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /compare/i })).toBeVisible();
  });

  test("3. Compare view renders aligned clauses and redline text", async ({ page }) => {
    await page.goto("/compare");

    // Verify Compare header
    await expect(page.getByRole("heading", { name: /document redline & comparison/i })).toBeVisible();

    // Load sample lease comparison
    const loadSampleBtn = page.getByRole("button", { name: /load sample/i }).first();
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Verify redline diff rows appear
    await expect(page.getByRole("button", { name: /show original draft/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test("4. Lawyer Brief view renders printable brief layout", async ({ page }) => {
    await page.goto("/brief");

    // Verify Brief title
    await expect(page.getByRole("heading", { name: /lawyer consultation brief/i })).toBeVisible();

    // Verify Print button
    const printBtn = page.getByRole("button", { name: /print/i });
    await expect(printBtn).toBeVisible();

    // Verify disclaimer badge
    await expect(page.getByText(/not legal advice/i).first()).toBeVisible();
  });
});

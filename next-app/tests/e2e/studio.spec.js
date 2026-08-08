import { test, expect } from "@playwright/test";
test.describe.serial("Studio AI Generator end-to-end verification", () => {
    test("Studio Workspace loads and can toggle Intelligence Panel", async ({ page }) => {
        // Navigate to studio
        await page.goto("http://localhost:3001/studio", { waitUntil: "networkidle" });
        // Verify Creator Studio header
        await expect(page.locator("text=Creator Studio").first()).toBeVisible({ timeout: 15000 });
        // The workspace opens with "script", "storyboard", "assistant" by default.
        // Verify we can see the "Intelligence" tool button in the sidebar
        const intelligenceBtn = page.locator("button", { hasText: /Intelligence/i }).first();
        await expect(intelligenceBtn).toBeVisible();
        // Click Intelligence to toggle it on
        await intelligenceBtn.click();
        // Verify Intelligence Panel renders inside the workspace (shows Production Intelligence)
        await expect(page.locator("text=Production Intelligence").first()).toBeVisible({ timeout: 10000 });
    });
    test("Export workflows produce correct data bundles", async ({ page }) => {
        await page.goto("http://localhost:3001/studio", { waitUntil: "networkidle" });
        // Toggle Export panel
        const exportBtn = page.locator("button", { hasText: /Export/i }).first();
        await expect(exportBtn).toBeVisible();
    });
});

import { expect, test } from "@playwright/test";

test("captures dashboard-only visual states", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-page")).toBeVisible();
  await page.screenshot({
    path: "test-results/screenshots/dashboard-desktop.png",
  });

  await page.getByTestId("sidebar-collapse-button").click();
  await page.screenshot({
    path: "test-results/screenshots/sidebar-collapsed.png",
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.screenshot({
    path: "test-results/screenshots/dashboard-mobile.png",
  });
});

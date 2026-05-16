import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("dashboard-only shell smoke", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("app-header")).toBeVisible();
  await expect(page.getByTestId("dashboard-urgent-section")).toBeVisible();
  await expect(page.getByTestId("dashboard-priority-queue")).toBeVisible();
  await expect(page.getByTestId("dashboard-inventory-risk")).toBeVisible();
  await expect(page.getByTestId("dashboard-recent-activity")).toBeVisible();
  await expect(page.getByTestId("dashboard-quick-actions")).toBeVisible();
});

test("header profile dropdown", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("profile-avatar-button").click();
  await expect(page.getByTestId("profile-dropdown")).toContainText(
    "Aisha Admin",
  );
  await expect(page.getByTestId("profile-dropdown")).toContainText(
    "Operations Admin",
  );
});

test("sidebar collapse persists", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("sidebar-collapse-button").click();
  await expect(page.getByTestId("collapsed-sidebar")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("collapsed-sidebar")).toBeVisible();
});

test("mobile menu behaves like a dashboard drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await expect(page.getByTestId("sidebar")).not.toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByTestId("sidebar")).toBeVisible();
});

import { expect, test } from "@playwright/test";

test.describe("dashboard-only frontend", () => {
  test("renders the clean-slate urgency dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What needs attention now" }),
    ).toBeVisible();
    await expect(page.getByTestId("dashboard-urgent-section")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Needs Approval/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Stock Risk/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Due Soon/ })).toBeVisible();
    await expect(page.getByTestId("dashboard-priority-queue")).toBeVisible();
    await expect(page.getByTestId("dashboard-inventory-risk")).toBeVisible();
    await expect(page.getByTestId("dashboard-recent-activity")).toBeVisible();
    await expect(page.getByTestId("dashboard-quick-actions")).toBeVisible();
    await expect(page.getByText(/undefined|null|NaN/)).toHaveCount(0);

    await page.screenshot({
      path: "test-results/screenshots/dashboard-improved-desktop.png",
    });
  });

  test("keeps dashboard actions inside the dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByText("Review now").click();
    await expect(page).toHaveURL(/\/dashboard#priority-work-queue$/);
    await expect(page.getByTestId("dashboard-priority-queue")).toBeVisible();

    await page.getByText("View stock risk").click();
    await expect(page).toHaveURL(/\/dashboard#inventory-risk$/);
    await expect(page.getByTestId("dashboard-inventory-risk")).toBeVisible();

    await page.getByText("View all activity").click();
    await expect(page).toHaveURL(/\/dashboard#recent-activity$/);
  });

  test("sidebar exposes only dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByTestId("sidebar");
    await expect(sidebar).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(sidebar.getByText("Inventory")).toHaveCount(0);
    await expect(sidebar.getByText("Requests")).toHaveCount(0);
    await expect(sidebar.getByText("Operations")).toHaveCount(0);
    await expect(sidebar.getByText("Management")).toHaveCount(0);
    await expect(sidebar.getByText("Settings")).toHaveCount(0);
    await expect(sidebar.getByText("Help")).toHaveCount(0);
  });

  test("legacy frontend routes redirect back to dashboard", async ({
    page,
  }) => {
    for (const path of [
      "/inventory/stock-overview",
      "/requests/all",
      "/requests/my",
      "/management/reports",
      "/settings",
      "/help",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByTestId("dashboard-page")).toBeVisible();
    }
  });

  test("dashboard layout uses shell scroll and no body overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    const sidebar = await page.getByTestId("sidebar").boundingBox();
    const header = await page.getByTestId("app-header").boundingBox();
    const main = await page.getByTestId("main-scroll-region").boundingBox();
    const viewport = page.viewportSize();

    expect(sidebar).not.toBeNull();
    expect(header).not.toBeNull();
    expect(main).not.toBeNull();
    expect(viewport).not.toBeNull();

    expect(sidebar!.x).toBeCloseTo(0, 2);
    expect(sidebar!.y).toBeCloseTo(0, 2);
    expect(sidebar!.height).toBeCloseTo(viewport!.height, 2);
    expect(header!.y).toBeCloseTo(0, 2);
    expect(
      Math.abs(header!.x - (sidebar!.x + sidebar!.width)),
    ).toBeLessThanOrEqual(1);
    expect(header!.x + header!.width).toBeCloseTo(viewport!.width, 2);
    expect(main!.y).toBeCloseTo(header!.y + header!.height, 2);
    expect(main!.x + main!.width).toBeCloseTo(viewport!.width, 2);

    const metrics = await page.evaluate(() => ({
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      mainOverflowY: getComputedStyle(
        document.querySelector("[data-testid='main-scroll-region']")!,
      ).overflowY,
    }));

    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(
      metrics.bodyClientHeight,
    );
    expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth);
    expect(metrics.mainOverflowY).toBe("auto");
  });

  test("dashboard remains usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "What needs attention now" }),
    ).toBeVisible();
    await expect(page.getByTestId("sidebar")).not.toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByTestId("sidebar")).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/dashboard-improved-mobile.png",
    });
  });
});

import { expect, type Locator, type Page, test } from "@playwright/test";

test.describe("dashboard-only enterprise shell", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("/dashboard keeps the shared shell geometry", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await assertDesktopShell(page);
    await page.screenshot({
      path: "test-results/screenshots/layout-dashboard-desktop.png",
    });
  });

  test("removed frontend routes redirect to dashboard", async ({ page }) => {
    await page.goto("/requests/all");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    await page.goto("/inventory/stock-overview");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });
});

test.describe("responsive dashboard shell", () => {
  test("mobile uses a drawer sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.getByTestId("sidebar")).not.toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByTestId("sidebar")).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/layout-dashboard-mobile-drawer.png",
    });
  });
});

async function assertDesktopShell(page: Page) {
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const sidebar = await requiredBox(page.getByTestId("sidebar"));
  const header = await requiredBox(page.getByTestId("app-header"));
  const main = await requiredBox(page.getByTestId("main-scroll-region"));
  const bodyMetrics = await page.locator("body").evaluate((body) => ({
    clientHeight: body.clientHeight,
    scrollHeight: body.scrollHeight,
    clientWidth: body.clientWidth,
    scrollWidth: body.scrollWidth,
  }));
  const mainOverflow = await page
    .getByTestId("main-scroll-region")
    .evaluate((element) => getComputedStyle(element).overflowY);
  const sidebarOverflow = await page
    .getByTestId("sidebar-scroll-region")
    .evaluate((element) => getComputedStyle(element).overflowY);

  expect(sidebar.x).toBeCloseTo(0, 2);
  expect(sidebar.y).toBeCloseTo(0, 2);
  expect(sidebar.height).toBeCloseTo(viewport!.height, 2);
  expect(header.y).toBeCloseTo(0, 2);
  expect(Math.abs(header.x - (sidebar.x + sidebar.width))).toBeLessThanOrEqual(
    1,
  );
  expect(header.x + header.width).toBeCloseTo(viewport!.width, 2);
  expect(main.y).toBeCloseTo(header.y + header.height, 2);
  expect(main.height).toBeCloseTo(viewport!.height - header.height, 2);
  expect(main.x + main.width).toBeCloseTo(viewport!.width, 2);
  expect(bodyMetrics.scrollHeight).toBeLessThanOrEqual(
    bodyMetrics.clientHeight,
  );
  expect(bodyMetrics.scrollWidth).toBeLessThanOrEqual(bodyMetrics.clientWidth);
  expect(mainOverflow).toBe("auto");
  expect(sidebarOverflow).toBe("auto");
  assertInsideViewport(sidebar, viewport!);
  assertInsideViewport(header, viewport!);
  assertInsideViewport(main, viewport!);
  await expect(page.getByTestId("right-panel")).toHaveCount(0);
}

function assertInsideViewport(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
) {
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function requiredBox(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

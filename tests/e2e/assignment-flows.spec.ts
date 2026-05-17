import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("smoke loads core routes", async ({ page }) => {
  await switchDemoUser(page, "Aisha Admin (admin)");

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Operations Cockpit" }),
  ).toBeVisible();

  await page.goto("/inventory");
  await expect(page.getByTestId("inventory-page")).toBeVisible();
  await page.getByRole("button", { name: "Add Item" }).click();
  await expect(page).toHaveURL(/\/inventory$/);
  await expect(
    page.getByRole("heading", { name: "Add Inventory Item" }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Add Inventory Item" }),
  ).toHaveCount(0);

  await page.goto("/inventory/new");
  await expect(
    page.getByRole("heading", { name: "Add Inventory Item" }).first(),
  ).toBeVisible();

  await page.goto("/requests");
  await expect(page.getByTestId("requests-page")).toBeVisible();

  await switchDemoUser(page, "Evan Employee (employee)");
  await page.goto("/requests");
  await page.getByRole("button", { name: "Create Request" }).click();
  await expect(page).toHaveURL(/\/requests$/);
  await expect(
    page.getByRole("heading", { name: "New Request" }).first(),
  ).toBeVisible();
  await page.getByLabel("Reason").fill("Testing dirty Escape behavior");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "New Request" }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close form" }).click();
  await page.getByRole("button", { name: "Discard" }).click();

  await page.goto("/requests/new");
  await expect(
    page.getByRole("heading", { name: "New Request" }).first(),
  ).toBeVisible();
});

test("filters inventory and request workspaces", async ({ page }) => {
  await switchDemoUser(page, "Aisha Admin (admin)");

  await page.goto("/inventory?q=A4&stock=in");
  await expect(page.getByTestId("inventory-page")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: /A4 Copy Paper/i }),
  ).toBeVisible();

  await page.goto("/requests?status=pending&q=REQ");
  await expect(page.getByTestId("requests-page")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Pending" }).first(),
  ).toBeVisible();
});

test("employee creates request and cannot see admin actions", async ({
  page,
}) => {
  await createEmployeeRequest(page, 1, `E2E employee request ${Date.now()}`);

  await expect(page.getByTestId("request-detail-panel")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("Admin Actions")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fulfill" })).toHaveCount(0);
});

test("admin approves and fulfills a request", async ({ page }) => {
  const requestUrl = await createEmployeeRequest(
    page,
    1,
    `E2E fulfill request ${Date.now()}`,
  );

  await switchDemoUser(page, "Aisha Admin (admin)");
  await page.goto(requestUrl);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved").first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Fulfill" }).click();
  await expect(page.getByText("Fulfilled").first()).toBeVisible();
  await expect(
    page.getByText("Request Fulfilled", { exact: true }),
  ).toBeVisible();
});

test("insufficient stock blocks fulfillment", async ({ page }) => {
  const requestUrl = await createEmployeeRequest(
    page,
    9999,
    `E2E insufficient stock ${Date.now()}`,
  );

  await switchDemoUser(page, "Aisha Admin (admin)");
  await page.goto(requestUrl);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved").first()).toBeVisible();

  await expect(page.getByRole("button", { name: "Fulfill" })).toBeDisabled();
  await expect(page.getByText("Insufficient stock").first()).toBeVisible();
  await expect(page.getByText("Approved").first()).toBeVisible();
});

test("core routes respond within local performance budget", async ({
  page,
}) => {
  const routes = [
    "/",
    "/inventory",
    "/requests",
    "/inventory/new",
    "/requests/new",
  ];

  for (const route of routes) {
    const startedAt = Date.now();
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    const duration = Date.now() - startedAt;

    expect(
      response?.status(),
      `${route} should load successfully`,
    ).toBeLessThan(500);
    expect(duration, `${route} exceeded 10s local route budget`).toBeLessThan(
      10_000,
    );
  }
});

async function createEmployeeRequest(
  page: import("@playwright/test").Page,
  quantity: number,
  reason: string,
) {
  await switchDemoUser(page, "Evan Employee (employee)");
  await page.goto("/requests/new");
  await expect(page.getByLabel("Item").first()).toBeEnabled({
    timeout: 10_000,
  });
  await page.getByLabel("Quantity").fill(String(quantity));
  await page.getByLabel("Reason").fill(reason);
  await page.getByRole("button", { name: /Submit \d+ item request/ }).click();
  await expect(page.getByTestId("requests-page")).toBeVisible();
  await page.getByRole("row").filter({ hasText: /^REQ-/ }).first().click();
  await expect(page.getByTestId("request-detail-panel")).toBeVisible();
  await expect(page.getByText(reason)).toBeVisible();
  return page.url();
}

async function switchDemoUser(
  page: import("@playwright/test").Page,
  label: string,
) {
  await page.goto("/");
  await page.getByLabel("Viewing as").selectOption({ label });
  await expect(page.getByLabel("Viewing as")).toHaveValue(
    label.includes("(admin)")
      ? "admin@inventory.local"
      : "employee@inventory.local",
  );
}

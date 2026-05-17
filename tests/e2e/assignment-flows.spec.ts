import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("smoke loads core routes", async ({ page }) => {
  await switchDemoUser(page, "Aisha Admin (admin)");

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Inventory Dashboard" }),
  ).toBeVisible();

  await page.goto("/inventory");
  await expect(page.getByTestId("inventory-page")).toBeVisible();

  await page.goto("/inventory/new");
  await expect(
    page.getByRole("heading", { name: "Add Inventory Item" }).first(),
  ).toBeVisible();

  await page.goto("/requests");
  await expect(page.getByTestId("requests-page")).toBeVisible();

  await switchDemoUser(page, "Evan Employee (employee)");
  await page.goto("/requests/new");
  await expect(
    page.getByRole("heading", { name: "New Request" }).first(),
  ).toBeVisible();
});

test("employee creates request and cannot see admin actions", async ({
  page,
}) => {
  await createEmployeeRequest(page, 1, `E2E employee request ${Date.now()}`);

  await expect(page.getByTestId("request-detail-page")).toBeVisible();
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

  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved").first()).toBeVisible();

  await page.getByRole("button", { name: "Fulfill" }).click();
  await expect(page.getByText("Fulfilled").first()).toBeVisible();
  await expect(page.getByText("Request Fulfilled")).toBeVisible();
});

test("insufficient stock blocks fulfillment", async ({ page }) => {
  const requestUrl = await createEmployeeRequest(
    page,
    9999,
    `E2E insufficient stock ${Date.now()}`,
  );

  await switchDemoUser(page, "Aisha Admin (admin)");
  await page.goto(requestUrl);
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Approved").first()).toBeVisible();

  await page.getByRole("button", { name: "Fulfill" }).click();
  await expect(page.getByText("Insufficient stock").first()).toBeVisible();
  await expect(page.getByText("Approved").first()).toBeVisible();
});

async function createEmployeeRequest(
  page: import("@playwright/test").Page,
  quantity: number,
  reason: string,
) {
  await switchDemoUser(page, "Evan Employee (employee)");
  await page.goto("/requests/new");
  await page.getByLabel("Quantity").fill(String(quantity));
  await page.getByLabel("Reason").fill(reason);
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByTestId("requests-page")).toBeVisible();
  await page.getByRole("link", { name: "View" }).first().click();
  await expect(page.getByText(reason)).toBeVisible();
  return page.url();
}

async function switchDemoUser(
  page: import("@playwright/test").Page,
  label: string,
) {
  await page.goto("/");
  await page.getByLabel("Role").selectOption({ label });
  await expect(page.getByLabel("Role")).toHaveValue(
    label.includes("(admin)")
      ? "admin@inventory.local"
      : "employee@inventory.local",
  );
}

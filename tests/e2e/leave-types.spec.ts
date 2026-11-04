import { expect, test } from "@playwright/test";
import { login, queryDb } from "./helpers";

test.describe.configure({ mode: "serial" });

test("admin can create a gender-restricted leave type", async ({ page }) => {
  await login(page, "admin@e2e.test");
  await page.goto("/admin");

  await page.getByRole("button", { name: "New leave type" }).click();
  await page.getByLabel("Name").fill("Maternity");
  await page.getByLabel("Max allocated days per year").fill("500");
  await page.getByRole("button", { name: "Gender eligibility" }).click();
  await page.getByRole("menuitemradio", { name: "Female only" }).click();
  await page.getByRole("button", { name: "Add leave type" }).click();

  await expect(page.getByText("Leave type created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Maternity" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "female" })).toBeVisible();

  const [created] = await queryDb<{
    deleted_at: string | null;
    eligible_gender: string | null;
    default_days: number;
  }>(
    `SELECT deleted_at::text, eligible_gender, default_days
     FROM leave_type
     WHERE name = 'Maternity'`
  );
  expect(created.deleted_at).toBeNull();
  expect(created.eligible_gender).toBe("female");
  expect(created.default_days).toBe(500);

  // Female employee can see it.
  await login(page, "half@e2e.test");
  await page.goto("/leave");
  await page.getByRole("button", { name: "New leave request" }).click();
  await page.getByRole("button", { name: "Leave type", exact: true }).click();
  await expect(
    page.getByRole("menuitemradio", { name: "Maternity" })
  ).toBeVisible();

  // Male employee cannot see it.
  await login(page, "employee@e2e.test");
  await page.goto("/leave");
  await page.getByRole("button", { name: "New leave request" }).click();
  await page.getByRole("button", { name: "Leave type", exact: true }).click();
  await expect(
    page.getByRole("menuitemradio", { name: "Maternity" })
  ).toHaveCount(0);
});

test("admin can edit and delete a custom leave type", async ({ page }) => {
  await login(page, "admin@e2e.test");
  await page.goto("/admin");

  const row = page.getByRole("row", { name: /Maternity/ });
  await row.getByRole("button", { name: "Leave type actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await page.getByLabel("Name").fill("Maternity Leave");
  await page.getByLabel("Max allocated days per year").fill("120");
  await page.getByRole("button", { name: "Save leave type" }).click();

  await expect(page.getByText("Leave type updated")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Maternity Leave" })
  ).toBeVisible();

  const updatedRow = page.getByRole("row", { name: /Maternity Leave/ });
  await updatedRow.getByRole("button", { name: "Leave type actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete leave type" }).click();

  await expect(page.getByText("Leave type deleted")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Maternity Leave" })).toHaveCount(
    0
  );

  const [deleted] = await queryDb<{ deleted_at: string | null }>(
    `SELECT deleted_at::text FROM leave_type WHERE name = 'Maternity Leave'`
  );
  expect(deleted.deleted_at).not.toBeNull();
});

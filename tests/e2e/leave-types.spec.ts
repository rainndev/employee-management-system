import { expect, test } from "@playwright/test";
import { login, queryDb } from "./helpers";

test.describe.configure({ mode: "serial" });

test("admin can create a custom leave type and employees can select it", async ({
  page,
}) => {
  await login(page, "admin@e2e.test");
  await page.goto("/admin");

  await page.getByRole("button", { name: "New leave type" }).click();
  await page.getByLabel("Name").fill("Bereavement");
  await page.getByLabel("Default days per year").fill("3");
  await page.getByRole("button", { name: "Add leave type" }).click();

  await expect(page.getByText("Leave type created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Bereavement" })).toBeVisible();

  const [created] = await queryDb<{ deleted_at: string | null }>(
    `SELECT deleted_at::text FROM leave_type WHERE name = 'Bereavement'`
  );
  expect(created.deleted_at).toBeNull();

  await login(page, "half@e2e.test");
  await page.goto("/leave");
  await page.getByRole("button", { name: "New leave request" }).click();
  await page.getByRole("button", { name: "Leave type", exact: true }).click();
  await expect(
    page.getByRole("menuitemradio", { name: "Bereavement" })
  ).toBeVisible();
});

test("admin can edit and delete a custom leave type", async ({ page }) => {
  await login(page, "admin@e2e.test");
  await page.goto("/admin");

  const row = page.getByRole("row", { name: /Bereavement/ });
  await row.getByRole("button", { name: "Leave type actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await page.getByLabel("Name").fill("Bereavement Leave");
  await page.getByLabel("Default days per year").fill("5");
  await page.getByRole("button", { name: "Save leave type" }).click();

  await expect(page.getByText("Leave type updated")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Bereavement Leave" })
  ).toBeVisible();

  const updatedRow = page.getByRole("row", { name: /Bereavement Leave/ });
  await updatedRow.getByRole("button", { name: "Leave type actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete leave type" }).click();

  await expect(page.getByText("Leave type deleted")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Bereavement Leave" })
  ).toHaveCount(0);

  const [deleted] = await queryDb<{ deleted_at: string | null }>(
    `SELECT deleted_at::text FROM leave_type WHERE name = 'Bereavement Leave'`
  );
  expect(deleted.deleted_at).not.toBeNull();
});

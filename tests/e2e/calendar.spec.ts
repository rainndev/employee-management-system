import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("calendar year dropdown jumps directly to another year", async ({
  page,
}) => {
  await login(page, "half@e2e.test");
  await page.goto("/leave");
  await page.getByRole("button", { name: "New leave request" }).click();
  await page.getByRole("button", { name: "Start date", exact: true }).click();

  const nextYear = String(new Date().getFullYear() + 1);
  const yearDropdown = page.getByRole("button", {
    name: "Choose the Year",
  });

  await expect(yearDropdown).toBeVisible();
  await yearDropdown.click();
  await page.getByRole("menuitemradio", { name: nextYear }).click();
  await expect(yearDropdown).toContainText(nextYear);
});

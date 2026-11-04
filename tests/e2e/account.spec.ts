import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test("account password fields have visibility toggles and fit mobile", async ({
  page,
}) => {
  await login(page, "hr@e2e.test");
  await page.goto("/account");

  const currentPassword = page.getByLabel("Current password", { exact: true });
  await expect(currentPassword).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Show current password" }).click();
  await expect(currentPassword).toHaveAttribute("type", "text");

  await currentPassword.fill("secret-password");
  await page.getByRole("button", { name: "Hide current password" }).click();
  await expect(currentPassword).toHaveAttribute("type", "password");
  await expect(currentPassword).toHaveValue("secret-password");

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
});

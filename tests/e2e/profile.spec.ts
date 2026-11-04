import { expect, test } from "@playwright/test";
import { login, queryDb, TEST_PASSWORD } from "./helpers";

test.describe.configure({ mode: "serial" });

test("a user can edit their own contact profile", async ({ page }) => {
  await login(page, "profile@e2e.test");
  await page.goto("/profile");

  await expect(page.getByLabel("First name")).toHaveValue("Profile");
  await expect(page.getByText("PROF-1000")).toBeVisible();

  await page.getByLabel("First name").fill("Profile Updated");
  await page.getByLabel("Phone").fill("09171234567");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(
    page.getByText("Profile updated", { exact: true })
  ).toBeVisible();

  const [employee] = await queryDb<{
    first_name: string;
    phone: string | null;
  }>(
    `SELECT first_name, phone
     FROM employee
     WHERE employee_no = 'PROF-1000'`
  );

  expect(employee.first_name).toBe("Profile Updated");
  expect(employee.phone).toBe("09171234567");
});

test("changing the sign-in email requires the current password", async ({
  page,
}) => {
  await login(page, "profile@e2e.test");
  await page.goto("/profile");

  await page.getByLabel("Email").fill("profile-updated@e2e.test");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(
    page.getByText("Enter your current password to change your email.")
  ).toBeVisible();

  await page
    .getByLabel("Current password", { exact: true })
    .fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(
    page.getByText("Profile updated", { exact: true })
  ).toBeVisible();

  const [user] = await queryDb<{ email: string }>(
    `SELECT email FROM "user" WHERE id = (
       SELECT user_id FROM employee WHERE employee_no = 'PROF-1000'
     )`
  );

  expect(user.email).toBe("profile-updated@e2e.test");
});

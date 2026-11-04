import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe.configure({ mode: "serial" });

test("admin dashboard shows employee and pending approval tables", async ({
  page,
}) => {
  await login(page, "admin@e2e.test");
  await page.goto("/dashboard");

  const employeeCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Your employee directory." });
  await expect(employeeCard.getByText("Admin Employee")).toBeVisible();
  await expect(
    employeeCard.getByRole("link", { name: "View all" })
  ).toHaveAttribute("href", "/employees");

  const pendingCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Requests waiting for a decision." });
  await expect(pendingCard.getByText("Dashboard Pending")).toBeVisible();
  await expect(
    pendingCard.getByRole("link", { name: "View all" })
  ).toHaveAttribute("href", "/leave");
});

test("hr dashboard shows employee and pending approval tables", async ({
  page,
}) => {
  await login(page, "hr@e2e.test");
  await page.goto("/dashboard");

  const employeeCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Your employee directory." });
  await expect(employeeCard.getByText("Admin Employee")).toBeVisible();
  await expect(
    employeeCard.getByRole("link", { name: "View all" })
  ).toHaveAttribute("href", "/employees");

  const pendingCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Requests waiting for a decision." });
  await expect(pendingCard.getByText("Dashboard Pending")).toBeVisible();
});

test("manager dashboard shows only their team and team approvals", async ({
  page,
}) => {
  await login(page, "manager@e2e.test");
  await page.goto("/dashboard");

  const teamCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Employees who report directly to you." });
  await expect(teamCard.getByText("Half Employee")).toBeVisible();
  await expect(teamCard.getByText("Admin Employee")).toHaveCount(0);
  await expect(teamCard.getByText("Offboard Manager")).toHaveCount(0);
  await expect(
    teamCard.getByRole("link", { name: "View all" })
  ).toHaveAttribute("href", "/employees");

  const pendingCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Requests waiting for a decision." });
  await expect(pendingCard.getByText("Dashboard Pending")).toBeVisible();
  await expect(
    pendingCard.getByRole("link", { name: "View all" })
  ).toHaveAttribute("href", "/leave");
});

test("employee dashboard shows their leave request table", async ({ page }) => {
  await login(page, "past@e2e.test");
  await page.goto("/dashboard");

  const leaveCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: "Your latest leave requests." });
  await expect(leaveCard.getByText("Vacation")).toBeVisible();
  await expect(leaveCard.getByText("Approved")).toBeVisible();
  await expect(
    leaveCard.getByRole("link", { name: "View all" })
  ).toHaveAttribute("href", "/leave");
});

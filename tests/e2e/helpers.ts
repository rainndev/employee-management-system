import { expect, type Page } from "@playwright/test";
import { Client } from "pg";
import { testDatabaseUrl } from "./config";

export const TEST_PASSWORD = "Passw0rd!";

export async function login(
  page: Page,
  email: string,
  password = TEST_PASSWORD
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
}

export async function queryDb<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = new Client({ connectionString: testDatabaseUrl });
  await client.connect();

  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

export async function pickDate(
  page: Page,
  isoDate: string,
  field: "Start date" | "End date"
) {
  const trigger = page.getByRole("button", { name: field, exact: true });
  await trigger.click();

  const popover = page.locator('[data-slot="popover-content"]:visible').last();
  await expect(popover).toBeVisible();

  const day = popover.locator(`[data-day="${isoDate}"] button`);

  for (let i = 0; i < 14 && (await day.count()) === 0; i += 1) {
    await popover
      .getByRole("button", { name: "Go to the Next Month" })
      .click();
  }

  await expect(day).toBeVisible();
  await day.click();
  await expect(popover).toBeHidden();
}

export async function selectLeaveType(page: Page, name: string) {
  await page.getByRole("button", { name: "Leave type", exact: true }).click();
  await page.getByRole("menuitemradio", { name, exact: true }).click();
}

export async function openLeaveDetails(page: Page, employeeName: string) {
  const row = page.getByRole("row", { name: new RegExp(employeeName) });
  await row.getByRole("button", { name: "View leave request details" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

function companyToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekday(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

export function nextWeekdayIso(afterDays = 1) {
  let date = addDays(companyToday(), afterDays);

  while (weekday(date) === 0 || weekday(date) === 6) {
    date = addDays(date, 1);
  }

  return date;
}

export function nextWeekend() {
  let saturday = addDays(companyToday(), 1);

  while (weekday(saturday) !== 6) {
    saturday = addDays(saturday, 1);
  }

  return { saturday, sunday: addDays(saturday, 1) };
}

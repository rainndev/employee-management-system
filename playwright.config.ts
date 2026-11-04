import { defineConfig, devices } from "@playwright/test";
import {
  TEST_PORT,
  TEST_SESSION_SECRET,
  testBaseUrl,
  testDatabaseUrl,
} from "./tests/e2e/config";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: testBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: `pnpm exec next start -p ${TEST_PORT}`,
    url: testBaseUrl,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      SESSION_SECRET: TEST_SESSION_SECRET,
    },
  },
});

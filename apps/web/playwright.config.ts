import { defineConfig, devices } from "@playwright/test";

const isRealBackend = process.env.E2E_REAL_BACKEND === "true";
const baseURL =
  process.env.E2E_BASE_URL ?? (isRealBackend ? "http://127.0.0.1:8080" : "http://127.0.0.1:4173");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: isRealBackend
    ? undefined
    : {
        command:
          "pnpm --filter @crypto/shared build && pnpm --filter web dev --host 127.0.0.1 --port 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI
      }
});

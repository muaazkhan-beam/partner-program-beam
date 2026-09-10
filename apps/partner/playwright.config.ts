import { defineConfig, devices } from "@playwright/test"

const port = 3101
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "line",
  outputDir: "./test-results",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --hostname 127.0.0.1 --port ${port}`,
    env: {
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_DEPLOYMENT_ENV: "preview",
      NEXT_PUBLIC_PREVIEW_AUTH_BYPASS: "true",
      NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE: "partner-demo",
      NEXT_PUBLIC_PARTNER_BYPASS_EMAIL: "demo@partner.example",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: `${baseURL}/login`,
  },
})

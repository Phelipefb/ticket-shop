import { defineConfig } from "@playwright/test";
import { config } from "dotenv";

config({ path: "apps/api/.env.test" });

export default defineConfig({
  testDir: "./apps/web/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run start -w api",
      url: "http://127.0.0.1:3334/health",
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        PORT: "3334",
        WEB_URL: "http://127.0.0.1:3001",
      },
    },
    {
      command: "npm run dev -w web -- --port 3001",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:3334",
      },
    },
  ],
  globalSetup: "./apps/web/e2e/global-setup.ts",
});

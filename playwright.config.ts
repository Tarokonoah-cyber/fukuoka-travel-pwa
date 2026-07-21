import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "pwa-offline.spec.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3010",
    channel: "msedge",
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3010",
        url: "http://127.0.0.1:3010",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

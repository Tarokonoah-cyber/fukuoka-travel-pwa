import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "pwa-offline.spec.ts",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3012",
    channel: "msedge",
    viewport: { width: 390, height: 844 },
    serviceWorkers: "allow",
  },
});

import { expect, test } from "@playwright/test";
import { publicOfflineRoutes } from "../src/data/pwa";

test("全新安裝後公開頁面與清單可真正離線使用", async ({ page, context, baseURL }) => {
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForTimeout(1_200);
  await page.waitForLoadState("domcontentloaded");
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  const cacheAudit = await page.evaluate(async () => {
    const entries: string[] = [];
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      entries.push(...(await cache.keys()).map((request) => request.url));
    }
    return entries;
  });
  const cachedPaths = new Set(cacheAudit.map((url) => new URL(url).pathname));
  for (const route of publicOfflineRoutes) expect(cachedPaths.has(route)).toBe(true);
  expect(cacheAudit.some((url) => new URL(url).pathname.startsWith("/expenses"))).toBe(false);
  expect(cacheAudit.some((url) => new URL(url).pathname.startsWith("/api/"))).toBe(false);

  await context.setOffline(true);
  const routesToOpen = ["/", "/today", "/itinerary", "/map", "/prep", "/weather", "/currency", "/transport", "/documents", "/settings"];
  for (const route of routesToOpen) {
    await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
  }

  await page.goto(`${baseURL}/prep`, { waitUntil: "domcontentloaded" });
  const passport = page.getByRole("checkbox", { name: /護照/ });
  await passport.click({ force: true });
  await page.getByRole("button", { name: "全部" }).last().click();
  await expect(page.getByRole("checkbox", { name: /護照/ })).toBeChecked();
});

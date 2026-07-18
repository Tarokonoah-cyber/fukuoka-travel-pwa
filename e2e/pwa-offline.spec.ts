import { expect, test } from "@playwright/test";
import { publicOfflineRoutes } from "../src/data/pwa";
import { tripImagePaths } from "../src/data/tripImages";

test("全新安裝後公開頁面與清單可真正離線使用", async ({ page, context, baseURL }) => {
  await page.goto("/");
  const registrationAudit = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/")
      ?? await navigator.serviceWorker.register("/serwist/sw.js", { scope: "/", updateViaCache: "none", type: "module" });
    const ready = await Promise.race([
      navigator.serviceWorker.ready.then(() => true),
      new Promise<false>((resolve) => window.setTimeout(() => resolve(false), 15_000)),
    ]);
    return {
      ready,
      installing: registration.installing?.state ?? null,
      waiting: registration.waiting?.state ?? null,
      active: registration.active?.state ?? null,
    };
  });
  expect(registrationAudit.ready, JSON.stringify(registrationAudit)).toBe(true);
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
  for (const imagePath of tripImagePaths) expect(cachedPaths.has(imagePath)).toBe(true);
  expect(cacheAudit.some((url) => new URL(url).pathname.startsWith("/expenses"))).toBe(false);
  expect(cacheAudit.some((url) => new URL(url).pathname.startsWith("/api/"))).toBe(false);

  await context.setOffline(true);
  const routesToOpen = ["/", "/today", "/food", "/itinerary", "/map", "/prep", "/weather", "/currency", "/transport", "/documents", "/settings"];
  for (const route of routesToOpen) {
    await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
  }

  await page.goto(`${baseURL}/today`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".trip-day-photo img")).toHaveCount(1);
  await expect(page.locator(".trip-day-photo img")).toBeVisible();

  await page.goto(`${baseURL}/itinerary`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".trip-day-photo img")).toHaveCount(1);
  await expect(page.locator(".trip-day-photo img")).toBeVisible();
  await page.getByRole("tab", { name: /DAY 5/ }).click();
  await expect(page.locator(".trip-day-photo img")).toHaveCount(1);

  await page.goto(`${baseURL}/prep`, { waitUntil: "domcontentloaded" });
  const passport = page.getByRole("checkbox", { name: /護照/ });
  await passport.click({ force: true });
  await page.getByRole("button", { name: "全部" }).last().click();
  await expect(page.getByRole("checkbox", { name: /護照/ })).toBeChecked();

  await page.goto(`${baseURL}/food`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "美食候選清單" })).toBeVisible();
  await expect(page.locator(".food-card")).toHaveCount(8);
});

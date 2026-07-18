import { expect, test, type Page } from "@playwright/test";

async function mockCompanionDependencies(page: Page) {
  await page.route("**/api/travel-auth", (route) => route.fulfill({ json: { ok: true, data: { authenticated: false } } }));
  await page.route("https://api.open-meteo.com/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      current: { time: "2026-08-05T15:30", temperature_2m: 32, apparent_temperature: 37, weather_code: 1, wind_speed_10m: 8 },
      daily: {
        time: ["2026-08-05"], weather_code: [1], temperature_2m_max: [34], temperature_2m_min: [27],
        apparent_temperature_max: [39], precipitation_probability_max: [20], wind_speed_10m_max: [15],
      },
    }),
  }));
  await page.route("https://seasonal-api.open-meteo.com/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ daily: {
      time: ["2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"],
      temperature_2m_max: [32, 32, 33, 34, 32], temperature_2m_min: [25, 25, 25, 27, 25],
      apparent_temperature_max: [36, 36, 37, 39, 36], precipitation_sum: [3, 2, 0, 0, 1],
    } }),
  }));
}

test("旅途中顯示智慧旅伴、按需定位與建議後確認調整", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"], { origin: "http://127.0.0.1:3010" });
  await context.setGeolocation({ latitude: 33.5924812, longitude: 130.4198108 });
  await page.clock.setFixedTime(new Date("2026-08-05T06:30:00.000Z"));
  await mockCompanionDependencies(page);

  await page.goto("/today");
  await expect(page.locator(".smart-companion")).toBeVisible();
  await expect(page.getByText("時間緊迫", { exact: true })).toBeVisible();
  await expect(page.getByText("16:00 · 球場開場與場內用餐", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "取得我的位置" }).click();
  await expect(page.getByText(/位置已更新/)).toBeVisible();
  await expect(page.getByText("最近的室內休息點 · 約略直線距離")).toBeVisible();
  await expect(page.locator(".nearby-place-list article")).toHaveCount(2);
  await expect(page.locator('.nearby-place-list a[href*="travelmode=walking"]').first()).toBeVisible();
  await expect(page.locator('.nearby-place-list a[href*="travelmode=driving"]').first()).toBeVisible();

  await page.getByRole("button", { name: /查看可調整行程/ }).click();
  const candidates = page.locator(".day-plan-row.adjustment-candidate");
  await expect(candidates.first()).toBeVisible();
  const firstCandidate = page.locator(".day-plan-row").filter({ hasText: "櫛田神社短程參拜" });
  await expect(firstCandidate).toHaveClass(/adjustment-candidate/);
  page.once("dialog", (dialog) => dialog.accept());
  await firstCandidate.getByRole("button", { name: "跳過" }).click();
  await expect(firstCandidate).toContainText("已跳過");

  const dimensions = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

  await page.goto("/");
  await expect(page.locator(".smart-companion-compact")).toBeVisible();
});

test("出發前與旅程結束後不啟用完整智慧旅伴", async ({ browser }) => {
  const beforeContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const beforePage = await beforeContext.newPage();
  await beforePage.clock.setFixedTime(new Date("2026-07-15T04:00:00.000Z"));
  await beforePage.goto("/today");
  await expect(beforePage.locator(".smart-companion")).toHaveCount(0);
  await expect(beforePage.getByText("出發後啟用智慧旅伴")).toBeVisible();
  await beforeContext.close();

  const afterContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const afterPage = await afterContext.newPage();
  await afterPage.clock.setFixedTime(new Date("2026-08-07T04:00:00.000Z"));
  await afterPage.goto("/today");
  await expect(afterPage.locator(".smart-companion")).toHaveCount(0);
  await expect(afterPage.getByText("旅程已結束", { exact: true })).toBeVisible();
  await afterContext.close();
});

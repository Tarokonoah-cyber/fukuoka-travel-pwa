import { expect, test, type Page } from "@playwright/test";

async function mockLiveFukuokaWeather(page: Page) {
  await page.route("https://api.open-meteo.com/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      current: { time: "2026-07-14T14:00", temperature_2m: 31, apparent_temperature: 35, weather_code: 1, wind_speed_10m: 8 },
      daily: {
        time: ["2026-07-14"], weather_code: [1], temperature_2m_max: [33], temperature_2m_min: [26],
        apparent_temperature_max: [37], precipitation_probability_max: [20], wind_speed_10m_max: [15],
      },
    }),
  }));
}

test("今日頁預設聚焦現在與下一站", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "抵達福岡機場國際線", exact: true })).toBeVisible();
  await expect(page.locator(".day-plan-row")).toHaveCount(0);
  await page.getByRole("button", { name: /展開 5 站/ }).click();
  await expect(page.locator(".day-plan-row")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "收起" })).toBeVisible();
});

test("出發前地圖預設只看日本目的地", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("button", { name: "目的地", pressed: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "福岡機場國際線旅客航廈" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "桃園國際機場 TPE" })).toHaveCount(0);
});

test("長清單預設隱藏剛完成的項目並在有待送資料時提醒", async ({ page }) => {
  await page.goto("/prep");
  await expect(page.getByRole("button", { name: "未完成", pressed: true })).toBeVisible();
  const passport = page.getByRole("checkbox", { name: /護照/ });
  await passport.click({ force: true });
  await expect(passport).toHaveCount(0);
  await expect(page.getByText("1 筆變更尚未同步")).toBeVisible();
});

test("天氣頁標示即時來源且不把範圍外日期當成預報", async ({ page }) => {
  await mockLiveFukuokaWeather(page);
  await page.goto("/weather");
  await expect(page.getByText("福岡即時觀測 · LIVE")).toBeVisible();
  await expect(page.getByText("31°", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /資料來源 Open-Meteo/ })).toBeVisible();
  await expect(page.getByText("旅行日期尚未進入預報範圍")).toBeVisible();
  await expect(page.locator(".forecast-row")).toHaveCount(0);
});

for (const viewport of [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test(`${viewport.width}×${viewport.height} 核心頁面無水平破版或瀏覽器錯誤`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.setViewportSize(viewport);
    await mockLiveFukuokaWeather(page);

    for (const route of ["/", "/today", "/itinerary", "/map", "/transport", "/settings", "/prep", "/weather", "/expenses"]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const overlayText = await page.locator("nextjs-portal").evaluateAll((portals) => portals
        .map((portal) => portal.shadowRoot?.textContent ?? "")
        .join(" "));
      expect(overlayText).not.toMatch(/Unhandled Runtime Error|Build Error|Hydration failed/i);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth, `${route} 不應產生水平 overflow`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    }

    expect(consoleErrors).toEqual([]);
  });
}

test("舊 /budget 永久導向私人旅費頁", async ({ page }) => {
  await page.goto("/budget");
  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByRole("heading", { name: "Owner access" })).toBeVisible();
});

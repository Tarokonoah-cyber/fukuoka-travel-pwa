import { expect, test, type Page } from "@playwright/test";
import { tripDayImages } from "../src/data/tripImages";

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
  await page.route("https://seasonal-api.open-meteo.com/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      daily: {
        time: ["2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"],
        temperature_2m_max: [32, 32, 33, 33, 32], temperature_2m_min: [25, 25, 25, 26, 25],
        apparent_temperature_max: [36, 36, 37, 37, 36], precipitation_sum: [3, 2, 0, 4, 1],
      },
    }),
  }));
}

async function mockCurrencyRate(page: Page) {
  await page.route("https://api.frankfurter.dev/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ date: "2026-07-14", base: "JPY", quote: "TWD", rate: 0.21 }),
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

test("天氣頁同時顯示即時資料、旅行日長期預估與穿搭建議", async ({ page }) => {
  await mockLiveFukuokaWeather(page);
  await page.goto("/weather");
  await expect(page.getByText("福岡即時觀測 · LIVE")).toBeVisible();
  await expect(page.getByText("31°", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /資料來源 Open-Meteo/ })).toBeVisible();
  await expect(page.getByText("依目前預估準備衣服")).toBeVisible();
  await expect(page.getByText("目前先看旅行日長期預估")).toBeVisible();
  await expect(page.locator(".forecast-row.estimate")).toHaveCount(5);
});

test("匯率計算機可加減並即時雙向換算", async ({ page }) => {
  await mockCurrencyRate(page);
  await page.goto("/currency");
  const bottomNav = page.getByRole("navigation", { name: "主要導覽" });
  await expect(bottomNav.getByRole("link", { name: "匯率" })).toHaveAttribute("aria-current", "page");
  await expect(bottomNav.getByRole("link", { name: "行程" })).toHaveCount(0);
  await expect(page.getByLabel("JPY 金額")).toHaveValue("");
  await expect(page.getByText("—", { exact: true })).toBeVisible();
  await expect(page.getByText("輸入或直接按數字鍵，即時計算日幣與台幣。")).toHaveCount(0);
  await expect(page.getByText("匯率提醒")).toHaveCount(0);
  await page.getByRole("button", { name: "輸入 5" }).click();
  await page.getByRole("button", { name: "輸入 000" }).click();
  await page.getByRole("button", { name: "加", exact: true }).click();
  await page.getByRole("button", { name: "輸入 1" }).click();
  await page.getByRole("button", { name: "輸入 000" }).click();
  await page.getByRole("button", { name: "等於", exact: true }).click();
  await expect(page.getByLabel("JPY 金額")).toHaveValue("6000");
  await expect(page.getByText("NT$ 1,260", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "減", exact: true }).click();
  await page.getByRole("button", { name: "輸入 5" }).click();
  await page.getByRole("button", { name: "輸入 00", exact: true }).click();
  await page.getByRole("button", { name: "等於", exact: true }).click();
  await expect(page.getByLabel("JPY 金額")).toHaveValue("5500");
  await expect(page.getByText("NT$ 1,155", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "切換換算方向" }).click();
  await expect(page.getByLabel("TWD 金額")).toHaveValue("1155");
});

test("首頁不重複顯示旅費捷徑", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home-budget-link")).toHaveCount(0);
});

test("大字預設與手機偏好可持久保存並跨分頁同步", async ({ page, context }) => {
  await page.goto("/settings");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).fontSize)).toBe("18px");

  const secondPage = await context.newPage();
  await secondPage.goto("/settings");
  await page.bringToFront();
  await page.getByRole("button", { name: /標準/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "standard");
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).fontSize)).toBe("16px");
  await expect(secondPage.locator("html")).toHaveAttribute("data-text-size", "standard");

  await page.goto("/today");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "standard");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "standard");

  await page.goto("/settings");
  await page.getByRole("button", { name: /大字/ }).click();
  await expect.poll(() => page.locator("body").evaluate((element) => getComputedStyle(element).fontSize)).toBe("18px");
});

test("今日顯示一張當日圖，全部行程可逐日切換完整授權圖", async ({ page }) => {
  await page.goto("/today");
  await expect(page.locator(".trip-day-photo")).toHaveCount(1);
  await expect(page.locator(".trip-day-photo img")).toHaveAttribute("alt", tripDayImages[1].alt);
  await expect(page.getByText(tripDayImages[1].caption, { exact: true })).toBeVisible();

  await page.goto("/itinerary#day-2");
  await expect(page.locator(".trip-day-photo")).toHaveCount(1);
  await expect(page.getByRole("tab", { name: /DAY 2/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(`img[alt="${tripDayImages[2].alt}"]`)).toBeVisible();
  for (const [day, image] of Object.entries(tripDayImages)) {
    await page.getByRole("tab", { name: new RegExp(`DAY ${day}`) }).click();
    await expect(page.locator(".trip-day-photo")).toHaveCount(1);
    await expect(page.locator(`img[alt="${image.alt}"]`)).toBeVisible();
    await expect(page.getByText(image.caption, { exact: true })).toBeVisible();
    await expect(page.locator(`a[href="${image.sourceHref}"]`)).toHaveCount(1);
  }
});

for (const viewport of [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 720, height: 1024 },
]) {
  for (const textSize of ["standard", "large"] as const) {
  test(`${viewport.width}×${viewport.height} ${textSize} 核心頁面無水平破版或瀏覽器錯誤`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.addInitScript((size) => localStorage.setItem("fukuoka-text-size-v1", size), textSize);
    await page.setViewportSize(viewport);
    await mockLiveFukuokaWeather(page);
    await mockCurrencyRate(page);

    for (const route of ["/", "/today", "/itinerary", "/settings"]) {
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
}

test("舊 /budget 永久導向私人旅費頁", async ({ page }) => {
  await page.goto("/budget");
  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByRole("heading", { name: "Owner access" })).toBeVisible();
});

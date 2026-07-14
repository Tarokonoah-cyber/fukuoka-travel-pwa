import { expect, test } from "@playwright/test";

test("今日頁預設聚焦現在與下一站", async ({ page }) => {
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "星宇航空 JX840 起飛", exact: true })).toBeVisible();
  await expect(page.locator(".day-plan-row")).toHaveCount(0);
  await page.getByRole("button", { name: /展開 4 站/ }).click();
  await expect(page.locator(".day-plan-row")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "收起" })).toBeVisible();
});

test("出發前地圖預設只看日本目的地", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("button", { name: "目的地", pressed: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "福岡機場 FUK" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "桃園國際機場 TPE" })).toHaveCount(0);
});

test("長清單預設隱藏剛完成的項目並在有待送資料時提醒", async ({ page }) => {
  await page.goto("/packing");
  await expect(page.getByRole("button", { name: "未完成", pressed: true })).toBeVisible();
  const passport = page.getByRole("checkbox", { name: /護照/ });
  await passport.click({ force: true });
  await expect(passport).toHaveCount(0);
  await expect(page.getByText("1 筆變更尚未同步")).toBeVisible();
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

    for (const route of ["/", "/today", "/map", "/settings", "/packing", "/expenses"]) {
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

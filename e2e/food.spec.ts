import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("美食頁可組合篩選、清除條件並展開完整資訊", async ({ page }) => {
  await page.goto("/food");
  await expect(page.getByRole("heading", { name: "美食候選清單" })).toBeVisible();
  await expect(page.locator(".food-card")).toHaveCount(8);
  await expect(page.locator(".food-tools-row select option")).toHaveCount(8);
  await page.getByRole("button", { name: "篩選" }).click();
  await page.getByLabel("料理類型").selectOption("udon");
  await page.locator("#food-filter-panel select").nth(2).selectOption("博多站");
  await expect(page.locator(".food-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "因幡うどん 博多デイトス店" })).toBeVisible();
  await expect(page.getByText("已套用 2 個條件")).toBeVisible();
  await page.getByRole("button", { name: "清除全部" }).click();
  await expect(page.locator(".food-card")).toHaveCount(8);
  const ooyama = page.locator(".food-card").filter({ hasText: "博多もつ鍋 おおやま" });
  await ooyama.getByText("查看完整資訊").click();
  await expect(ooyama.getByText(/出發前請查看店家最新公告/)).toBeVisible();
});

test("可新增、編輯、淘汰候選，重整後仍保留", async ({ page }) => {
  await page.goto("/food");
  await page.getByRole("button", { name: "＋ 新增候選" }).click();
  await page.getByLabel("店名 *").fill("測試茶屋");
  await page.getByLabel("一句話描述 *").fill("下雨時可坐下休息的測試候選。");
  await page.getByLabel("Google Maps 網址 *").fill("https://www.google.com/maps/search/?api=1&query=test");
  await page.getByRole("button", { name: "儲存候選" }).click();
  const card = page.locator(".food-card").filter({ hasText: "測試茶屋" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "編輯" }).click();
  await page.getByLabel("一句話描述 *").fill("已更新的測試候選。");
  await page.getByRole("button", { name: "儲存候選" }).click();
  await expect(card.getByText("已更新的測試候選。", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator(".food-card").filter({ hasText: "測試茶屋" })).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.locator(".food-card").filter({ hasText: "測試茶屋" }).getByRole("button", { name: "淘汰" }).click();
  await expect(page.locator(".food-card").filter({ hasText: "測試茶屋" })).toHaveCount(0);
  await page.getByRole("button", { name: "篩選" }).click();
  await page.locator("#food-filter-panel select").first().selectOption("removed");
  await expect(page.locator(".food-card").filter({ hasText: "測試茶屋" })).toBeVisible();
});

test("可記錄已吃評分、加入今天並沿用今日共同行程", async ({ page }) => {
  await page.goto("/food");
  const dessert = page.locator(".food-card").filter({ hasText: "かさの家" });
  await dessert.getByRole("button", { name: "標記已吃" }).click();
  await dessert.getByLabel("評分（選填）").selectOption("5");
  await dessert.getByLabel("心得（選填）").fill("休息座位很實用");
  await dessert.getByRole("button", { name: "儲存用餐紀錄" }).click();
  await expect(dessert.getByText(/已吃 · ★★★★★/)).toBeVisible();

  const dinner = page.locator(".food-card").filter({ hasText: "博多もつ鍋 おおやま" });
  await dinner.getByRole("button", { name: "＋ 加入今天" }).click();
  await expect(dinner.getByRole("button", { name: "已加入今天" })).toBeDisabled();
  await page.goto("/today");
  await page.getByRole("button", { name: /展開 6 站/ }).click();
  await expect(page.locator(".day-plan-row").filter({ hasText: "博多もつ鍋 おおやま KITTE博多店" })).toHaveCount(2);
});

for (const viewport of [{ width: 375, height: 812 }, { width: 720, height: 1024 }]) {
  test(`${viewport.width}px 美食頁與今日推薦無水平破版`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.setViewportSize(viewport);
    await page.goto("/food");
    await expect(page.getByRole("navigation", { name: "主要導覽" }).getByRole("link", { name: "美食" })).toHaveAttribute("aria-current", "page");
    await expectNoHorizontalOverflow(page);
    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "今天附近吃什麼" })).toBeVisible();
    const recommendationCount = await page.locator(".today-food-group article").count();
    expect(recommendationCount).toBeGreaterThanOrEqual(2);
    expect(recommendationCount).toBeLessThanOrEqual(3);
    await expectNoHorizontalOverflow(page);
    expect(consoleErrors).toEqual([]);
  });
}

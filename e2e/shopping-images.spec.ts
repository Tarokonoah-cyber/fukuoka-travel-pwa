import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("商品縮圖可獨立放大、查看來源並用 Esc 關閉", async ({ page }) => {
  await page.goto("/shopping");
  const row = page.locator(".check-item-shell").filter({ hasText: "かさの家梅枝餅" });
  const checkbox = row.getByRole("checkbox");

  await expect(row.locator(".shopping-thumb img")).toBeVisible();
  await row.getByRole("button", { name: "放大查看 かさの家梅枝餅 圖片" }).click();
  await expect(checkbox).not.toBeChecked();

  const dialog = page.getByRole("dialog", { name: "かさの家梅枝餅" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByAltText("かさの家梅枝餅禮盒與獨立包裝")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "圖片來源：かさの家官方商店" })).toHaveAttribute("href", "https://kasanoya.raku-uru.jp/item-detail/1877537");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();

  await row.getByRole("button", { name: "放大查看 かさの家梅枝餅 圖片" }).click();
  await dialog.getByRole("button", { name: "關閉商品大圖" }).click();
  await expect(dialog).not.toBeVisible();
});

test("只有左側勾選框會把商品標記為完成", async ({ page }) => {
  await page.goto("/shopping");
  await page.getByRole("button", { name: "全部" }).click();
  const row = page.locator(".check-item-shell").filter({ hasText: "かさの家梅枝餅" });
  const checkbox = row.getByRole("checkbox", { name: "かさの家梅枝餅" });

  await row.locator(".check-copy strong").click();
  await expect(checkbox).not.toBeChecked();
  await row.locator(".check-copy small").last().click();
  await expect(checkbox).not.toBeChecked();

  await row.locator(".check-toggle").click();
  await expect(checkbox).toBeChecked();
});

test("自訂品項先顯示待補官方圖且仍可正常勾選", async ({ page }) => {
  await page.goto("/shopping");
  await page.getByText("＋ 新增自訂項目").click();
  const form = page.locator(".add-form");
  await form.getByLabel("項目名稱").fill("旅行用護唇膏");
  await form.getByLabel("分類").selectOption("生活用品");
  await form.getByRole("button", { name: "新增" }).click();

  const row = page.locator(".check-item-shell").filter({ hasText: "旅行用護唇膏" });
  await expect(row.locator(".shopping-image-status")).toHaveText("待補官方圖");
  await expect(row.locator('button[data-image-kind="pending"] img')).toBeVisible();
  await row.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: "全部" }).click();
  await expect(page.locator(".check-item-shell").filter({ hasText: "旅行用護唇膏" }).getByRole("checkbox")).toBeChecked();
});

for (const viewport of [{ width: 375, height: 812 }, { width: 1024, height: 900 }]) {
  test(`${viewport.width}px 必買圖片清單無水平破版`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/shopping");
    await expect(page.locator(".shopping-thumb").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

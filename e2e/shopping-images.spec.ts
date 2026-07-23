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
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
});

test("自訂品項先顯示待確認官方圖且仍可正常勾選", async ({ page }) => {
  await page.goto("/shopping");
  await page.getByText("＋ 新增自訂項目").click();
  const form = page.locator(".add-form");
  await form.getByLabel("項目名稱").fill("旅行用護唇膏");
  await form.getByLabel("分類").selectOption("生活用品");
  await form.getByRole("button", { name: "新增" }).click();

  const row = page.locator(".check-item-shell").filter({ hasText: "旅行用護唇膏" });
  await expect(row.locator(".shopping-image-status")).toHaveText("待確認官方圖");
  await expect(row.locator('button[data-image-kind="pending"] img')).toBeVisible();
  await row.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: "全部" }).click();
  await expect(page.locator(".check-item-shell").filter({ hasText: "旅行用護唇膏" }).getByRole("checkbox")).toBeChecked();
});

test("網友推薦商品使用本機官方商品圖與官方來源", async ({ page }) => {
  await page.goto("/shopping");
  const products = [
    ["マルちゃん正麺 カップ にんにく塩担々麺", "maruchan-seimen-ninniku-shio-tantan.webp", "maruchan.co.jp"],
    ["7プレミアム わかめたくさん あさりだし塩ラーメン", "seven-wakame-asari-shio.webp", "7premium.jp"],
    ["クリーンデンタル トータルケア", "clean-dental-total-care.webp", "daiichisankyo-hc.co.jp"],
    ["メンソレータム ジンマート", "rohto-jinmart.webp", "jp.rohto.com"],
  ];

  for (const [name, filename, sourceHost] of products) {
    const row = page.locator(".check-item-shell").filter({ hasText: name });
    await expect(row.locator(".shopping-image-status")).toHaveText("官方商品圖");
    await expect(row.locator(".shopping-thumb img")).toHaveAttribute("src", new RegExp(filename));
    await expect(row.getByRole("link", { name: "查看推薦來源（另開視窗）" })).toHaveAttribute("href", new RegExp(sourceHost));
  }
});

test("貼上推薦網址會讀取名稱並保存來源、備註與待確認圖片", async ({ page }) => {
  await page.route("**/api/link-preview", async (route) => route.fulfill({
    json: {
      ok: true,
      data: { url: "https://example.com/noodle", title: "網友推薦限定泡麵", sourceName: "example.com" },
    },
  }));
  await page.goto("/shopping");
  await page.getByText("＋ 貼上推薦網址").click();
  const form = page.locator(".recommendation-form");
  await form.getByLabel("推薦網址").fill("https://example.com/noodle#comments");
  await form.getByRole("button", { name: "讀取網址" }).click();
  await expect(form.getByLabel("商品名稱")).toHaveValue("網友推薦限定泡麵");
  await form.getByLabel("備註（選填）").fill("網友說湯頭很香，看到就買");
  await form.getByRole("button", { name: "加入必買清單" }).click();

  const row = page.locator(".check-item-shell").filter({ hasText: "網友推薦限定泡麵" });
  const checkbox = row.getByRole("checkbox");
  await expect(row.locator(".shopping-image-status")).toHaveText("待確認官方圖");
  await expect(row).toContainText("網友說湯頭很香，看到就買");
  const sourceLink = row.getByRole("link", { name: "查看推薦來源（另開視窗）" });
  await expect(sourceLink).toHaveAttribute("href", "https://example.com/noodle");
  await sourceLink.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), { once: true });
    (element as HTMLAnchorElement).click();
  });
  await expect(checkbox).not.toBeChecked();

  await expect.poll(async () => page.evaluate(async () => {
    const request = indexedDB.open("fukuoka-travel-sync-v1");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const itemRequest = database.transaction("items").objectStore("items").getAll();
    const items = await new Promise<Array<{ name: string; note: string; sourceUrl: string }>>((resolve, reject) => {
      itemRequest.onsuccess = () => resolve(itemRequest.result);
      itemRequest.onerror = () => reject(itemRequest.error);
    });
    return items.find((item) => item.name === "網友推薦限定泡麵") ?? null;
  })).toMatchObject({
    note: "網友說湯頭很香，看到就買",
    sourceUrl: "https://example.com/noodle",
  });
});

for (const viewport of [{ width: 375, height: 812 }, { width: 1024, height: 900 }]) {
  test(`${viewport.width}px 必買圖片清單無水平破版`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/shopping");
    await expect(page.locator(".shopping-thumb").first()).toBeVisible();
    await page.getByText("＋ 貼上推薦網址").click();
    await expectNoHorizontalOverflow(page);
  });
}

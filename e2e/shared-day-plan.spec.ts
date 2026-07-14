import { expect, test, type BrowserContext, type Route } from "@playwright/test";

type ServerItem = {
  date: string;
  itemId: string;
  status: "pending" | "active" | "completed" | "skipped";
  sortOrder: number;
  isCustom: boolean;
  custom: null | { title: string; timeLabel: string; startTime: string | null; location: string; note: string };
  updatedAt: string;
};

test("兩支手機共享完成狀態與臨時行程", async ({ browser }) => {
  const serverItems: ServerItem[] = [];
  let clock = 0;
  const stamp = () => new Date(Date.UTC(2026, 6, 13, 12, 0, clock++)).toISOString();

  async function installApi(context: BrowserContext) {
    await context.route("**/api/travel-auth", async (route) => route.fulfill({ json: { ok: true, data: { authenticated: true } } }));
    await context.route("**/api/travel-state", async (route) => {
      if (route.request().method() === "GET") await route.fulfill({ json: { ok: true, data: { items: [], updatedAt: null } } });
      else await route.fulfill({ json: { ok: true, data: { deleted: true } } });
    });
    await context.route("**/api/day-plan**", async (route: Route) => {
      const request = route.request();
      const method = request.method();
      if (method === "GET") {
        const date = new URL(request.url()).searchParams.get("date") ?? "2026-08-02";
        await route.fulfill({ json: { ok: true, data: { date, items: serverItems.filter((item) => item.date === date), updatedAt: serverItems.at(-1)?.updatedAt ?? null } } });
        return;
      }
      const body = request.postDataJSON() as Record<string, unknown>;
      if (method === "POST") {
        const item: ServerItem = { date: String(body.date), itemId: String(body.itemId), status: "pending", sortOrder: Number(body.sortOrder), isCustom: true, custom: body.custom as ServerItem["custom"], updatedAt: stamp() };
        serverItems.push(item);
        await route.fulfill({ status: 201, json: { ok: true, data: item } });
        return;
      }
      if (method === "PATCH") {
        const index = serverItems.findIndex((item) => item.date === body.date && item.itemId === body.itemId);
        const item: ServerItem = { date: String(body.date), itemId: String(body.itemId), status: body.status as ServerItem["status"], sortOrder: Number(body.sortOrder), isCustom: Boolean(body.isCustom), custom: body.custom as ServerItem["custom"], updatedAt: stamp() };
        if (index >= 0) serverItems[index] = item; else serverItems.push(item);
        await route.fulfill({ json: { ok: true, data: item } });
        return;
      }
      await route.fulfill({ json: { ok: true, data: [] } });
    });
  }

  const phoneA = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const phoneB = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await installApi(phoneA);
  await installApi(phoneB);
  const pageA = await phoneA.newPage();
  const pageB = await phoneB.newPage();

  await pageA.goto("/today");
  await pageA.getByRole("button", { name: /展開 5 站/ }).click();
  const firstRowA = pageA.locator(".day-plan-row").filter({ hasText: "抵達福岡機場國際線" });
  await firstRowA.getByRole("button", { name: "完成" }).click();
  await expect(firstRowA).toContainText("已完成");

  await pageB.goto("/today");
  await pageB.getByRole("button", { name: /展開 5 站/ }).click();
  const firstRowB = pageB.locator(".day-plan-row").filter({ hasText: "抵達福岡機場國際線" });
  await expect(firstRowB).toContainText("已完成");

  await pageA.getByRole("button", { name: "＋ 臨時安排" }).click();
  await pageA.getByLabel("名稱").fill("回飯店休息");
  await pageA.getByLabel("地點").fill("博多西鐵克魯姆飯店");
  await pageA.getByRole("button", { name: "加入今天並同步" }).click();
  await expect(pageA.getByText("回飯店休息")).toBeVisible();

  await pageB.reload();
  await pageB.getByRole("button", { name: /展開 6 站/ }).click();
  await expect(pageB.getByText("回飯店休息")).toBeVisible();

  await pageB.goto("/settings");
  await pageB.getByRole("button", { name: "鎖定" }).click();
  await expect(pageB.getByText("同步尚未解鎖", { exact: true })).toBeVisible();
  await expect.poll(async () => pageB.evaluate(async () => {
    const request = indexedDB.open("fukuoka-travel-sync-v1");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction(["items", "day-items"], "readonly");
    const count = (storeName: string) => new Promise<number>((resolve, reject) => {
      const countRequest = transaction.objectStore(storeName).count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    return (await count("items")) + (await count("day-items"));
  })).toBe(0);

  await phoneA.close();
  await phoneB.close();
});

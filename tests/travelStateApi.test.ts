import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TravelStateItem } from "@/types/travelSync";

const repository = vi.hoisted(() => ({
  listTravelState: vi.fn(),
  upsertTravelState: vi.fn(),
  deleteTravelStateItem: vi.fn(),
  resetTravelState: vi.fn(),
}));
const serverApi = vi.hoisted(() => ({ requireTravelSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/travelStateRepository", () => repository);
vi.mock("@/lib/server/api", () => ({
  requireTravelSession: serverApi.requireTravelSession,
  apiSuccess: <T>(data: T, status = 200) => Response.json({ ok: true, data }, { status }),
  apiError: (code: string, message: string, status: number) => Response.json({ ok: false, error: { code, message } }, { status }),
}));

import { DELETE, GET, PATCH } from "@/app/api/travel-state/route";

const item: TravelStateItem = {
  namespace: "packing",
  itemId: "passport",
  checked: true,
  name: null,
  category: null,
  note: null,
  sourceUrl: null,
  isCustom: false,
  updatedAt: "2026-07-13T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  serverApi.requireTravelSession.mockResolvedValue(null);
});

describe("共用清單 Route Handler", () => {
  it("登入後可取得逐項狀態", async () => {
    repository.listTravelState.mockResolvedValue([item]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { items: [item], updatedAt: item.updatedAt } });
  });

  it("PATCH 只更新一個 namespace/itemId", async () => {
    repository.upsertTravelState.mockResolvedValue({ item, conflict: false });
    const response = await PATCH(new Request("http://localhost/api/travel-state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ namespace: "packing", itemId: "passport", checked: true }),
    }));
    expect(response.status).toBe(200);
    expect(repository.upsertTravelState).toHaveBeenCalledWith({ namespace: "packing", itemId: "passport", checked: true, baseUpdatedAt: null });
  });

  it("拒絕未知 namespace 與不完整自訂資料", async () => {
    const invalidNamespace = await PATCH(new Request("http://localhost/api/travel-state", { method: "PATCH", body: JSON.stringify({ namespace: "other", itemId: "x", checked: true }) }));
    const incompleteCustom = await PATCH(new Request("http://localhost/api/travel-state", { method: "PATCH", body: JSON.stringify({ namespace: "packing", itemId: "x", checked: true, name: "雨傘" }) }));
    expect(invalidNamespace.status).toBe(400);
    expect(incompleteCustom.status).toBe(400);
    expect(repository.upsertTravelState).not.toHaveBeenCalled();
  });

  it("保存推薦來源與備註，並移除網址 fragment", async () => {
    const customItem = {
      ...item,
      namespace: "shopping" as const,
      itemId: "custom-noodle",
      name: "網友推薦泡麵",
      category: "泡麵",
      note: "蒜味很濃",
      sourceUrl: "https://example.com/noodle",
      isCustom: true,
    };
    repository.upsertTravelState.mockResolvedValue({ item: customItem, conflict: false });
    const response = await PATCH(new Request("http://localhost/api/travel-state", {
      method: "PATCH",
      body: JSON.stringify({
        namespace: "shopping",
        itemId: "custom-noodle",
        checked: false,
        name: "網友推薦泡麵",
        category: "泡麵",
        note: "蒜味很濃",
        sourceUrl: "https://example.com/noodle#comments",
      }),
    }));

    expect(response.status).toBe(200);
    expect(repository.upsertTravelState).toHaveBeenCalledWith(expect.objectContaining({
      note: "蒜味很濃",
      sourceUrl: "https://example.com/noodle",
    }));
  });

  it("拒絕帶帳密、內網站名或特殊連接埠的推薦網址", async () => {
    const payload = (sourceUrl: string) => ({
      namespace: "shopping", itemId: "custom-x", checked: false,
      name: "測試商品", category: "泡麵", sourceUrl,
    });
    const responses = await Promise.all([
      PATCH(new Request("http://localhost/api/travel-state", { method: "PATCH", body: JSON.stringify(payload("https://user:pass@example.com/item")) })),
      PATCH(new Request("http://localhost/api/travel-state", { method: "PATCH", body: JSON.stringify(payload("http://localhost/item")) })),
      PATCH(new Request("http://localhost/api/travel-state", { method: "PATCH", body: JSON.stringify(payload("https://example.com:8443/item")) })),
    ]);
    expect(responses.map((response) => response.status)).toEqual([400, 400, 400]);
    expect(repository.upsertTravelState).not.toHaveBeenCalled();
  });

  it("DELETE 可刪單一自訂項目或重設整個清單", async () => {
    repository.deleteTravelStateItem.mockResolvedValue(true);
    repository.resetTravelState.mockResolvedValue(4);
    const one = await DELETE(new Request("http://localhost/api/travel-state", { method: "DELETE", body: JSON.stringify({ namespace: "wishlist", itemId: "custom-1" }) }));
    const all = await DELETE(new Request("http://localhost/api/travel-state", { method: "DELETE", body: JSON.stringify({ namespace: "prep" }) }));
    expect(one.status).toBe(200);
    expect(all.status).toBe(200);
    expect(repository.deleteTravelStateItem).toHaveBeenCalledWith("wishlist", "custom-1");
    expect(repository.resetTravelState).toHaveBeenCalledWith("prep");
  });

  it("未登入時不接觸資料庫", async () => {
    serverApi.requireTravelSession.mockResolvedValueOnce(Response.json({ ok: false }, { status: 401 }));
    const response = await GET();
    expect(response.status).toBe(401);
    expect(repository.listTravelState).not.toHaveBeenCalled();
  });
});

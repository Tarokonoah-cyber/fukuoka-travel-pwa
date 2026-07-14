import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DayPlanItemState } from "@/types/dayPlan";

const repository = vi.hoisted(() => ({
  listDayPlanState: vi.fn(),
  createCustomDayPlanItem: vi.fn(),
  patchDayPlanItem: vi.fn(),
  reorderDayPlan: vi.fn(),
  deleteCustomDayPlanItem: vi.fn(),
  resetDayPlan: vi.fn(),
}));
const serverApi = vi.hoisted(() => ({ requireTravelSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/dayPlanRepository", () => repository);
vi.mock("@/lib/server/api", () => ({
  requireTravelSession: serverApi.requireTravelSession,
  apiSuccess: <T>(data: T, status = 200) => Response.json({ ok: true, data }, { status }),
  apiError: (code: string, message: string, status: number, details?: unknown) => Response.json({ ok: false, error: { code, message, details } }, { status }),
}));

import { DELETE, GET, PATCH, POST, PUT } from "@/app/api/day-plan/route";

const item: DayPlanItemState = {
  date: "2026-08-05", itemId: "d4-game", status: "active", sortOrder: 500,
  isCustom: false, custom: null, updatedAt: "2026-07-13T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  serverApi.requireTravelSession.mockResolvedValue(null);
});

describe("day-plan Route Handler", () => {
  it("依旅程日期取得共享狀態", async () => {
    repository.listDayPlanState.mockResolvedValue([item]);
    const response = await GET(new Request("http://localhost/api/day-plan?date=2026-08-05"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { date: "2026-08-05", items: [item] } });
  });

  it("可新增臨時行程", async () => {
    const custom = { ...item, itemId: "custom-1", isCustom: true, custom: { title: "回飯店", timeLabel: "下午", startTime: null, location: "飯店", note: "休息" } };
    repository.createCustomDayPlanItem.mockResolvedValue(custom);
    const response = await POST(new Request("http://localhost/api/day-plan", { method: "POST", body: JSON.stringify({ date: custom.date, itemId: custom.itemId, sortOrder: 600, custom: custom.custom }) }));
    expect(response.status).toBe(201);
  });

  it("同項目版本衝突回傳伺服器最新狀態", async () => {
    repository.patchDayPlanItem.mockResolvedValue({ item, conflict: true });
    const response = await PATCH(new Request("http://localhost/api/day-plan", { method: "PATCH", body: JSON.stringify({
      date: item.date, itemId: item.itemId, status: "completed", sortOrder: item.sortOrder,
      isCustom: false, custom: null, baseUpdatedAt: "2026-07-13T11:00:00.000Z",
    }) }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "SYNC_CONFLICT", details: item } });
  });

  it("排序拒絕重複 ID", async () => {
    const response = await PUT(new Request("http://localhost/api/day-plan", { method: "PUT", body: JSON.stringify({ date: item.date, orderedItemIds: ["same", "same"] }) }));
    expect(response.status).toBe(400);
    expect(repository.reorderDayPlan).not.toHaveBeenCalled();
  });

  it("可刪臨時項目或重設日期", async () => {
    repository.deleteCustomDayPlanItem.mockResolvedValue(true);
    repository.resetDayPlan.mockResolvedValue(4);
    const one = await DELETE(new Request("http://localhost/api/day-plan", { method: "DELETE", body: JSON.stringify({ date: item.date, itemId: "custom-1" }) }));
    const all = await DELETE(new Request("http://localhost/api/day-plan", { method: "DELETE", body: JSON.stringify({ date: item.date }) }));
    expect(one.status).toBe(200);
    expect(all.status).toBe(200);
  });

  it("未登入時不讀取資料庫", async () => {
    serverApi.requireTravelSession.mockResolvedValueOnce(Response.json({ ok: false }, { status: 401 }));
    const response = await GET(new Request("http://localhost/api/day-plan?date=2026-08-05"));
    expect(response.status).toBe(401);
    expect(repository.listDayPlanState).not.toHaveBeenCalled();
  });
});

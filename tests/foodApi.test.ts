import { beforeEach, describe, expect, it, vi } from "vitest";
import { foodCandidatesSeed } from "@/data/food";

const repository = vi.hoisted(() => ({
  listFoodCandidates: vi.fn(),
  upsertFoodCandidate: vi.fn(),
}));
const serverApi = vi.hoisted(() => ({ requireTravelSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/foodRepository", () => repository);
vi.mock("@/lib/server/api", () => ({
  requireTravelSession: serverApi.requireTravelSession,
  apiSuccess: <T>(data: T, status = 200) => Response.json({ ok: true, data }, { status }),
  apiError: (code: string, message: string, status: number, details?: unknown) => Response.json({ ok: false, error: { code, message, details } }, { status }),
}));

import { GET, PATCH } from "@/app/api/food-candidates/route";

beforeEach(() => {
  vi.clearAllMocks();
  serverApi.requireTravelSession.mockResolvedValue(null);
});

describe("美食候選 Route Handler", () => {
  it("登入後取得共享候選", async () => {
    repository.listFoodCandidates.mockResolvedValue(foodCandidatesSeed.slice(0, 2));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { items: foodCandidatesSeed.slice(0, 2) } });
  });

  it("PATCH 驗證完整資料並傳遞 optimistic lock", async () => {
    const item = foodCandidatesSeed[0];
    repository.upsertFoodCandidate.mockResolvedValue({ item, conflict: false });
    const response = await PATCH(new Request("http://localhost/api/food-candidates", {
      method: "PATCH",
      body: JSON.stringify({ item, baseUpdatedAt: item.updatedAt }),
    }));
    expect(response.status).toBe(200);
    expect(repository.upsertFoodCandidate).toHaveBeenCalledWith(item, item.updatedAt);
  });

  it("拒絕無效網址與未造訪卻有心得的資料", async () => {
    const invalid = { ...foodCandidatesSeed[0], googleMapsUrl: "not-a-url", review: "不該存在" };
    const response = await PATCH(new Request("http://localhost/api/food-candidates", { method: "PATCH", body: JSON.stringify({ item: invalid, baseUpdatedAt: null }) }));
    expect(response.status).toBe(400);
    expect(repository.upsertFoodCandidate).not.toHaveBeenCalled();
  });

  it("版本衝突回傳伺服器最新候選", async () => {
    const item = foodCandidatesSeed[0];
    repository.upsertFoodCandidate.mockResolvedValue({ item, conflict: true });
    const response = await PATCH(new Request("http://localhost/api/food-candidates", { method: "PATCH", body: JSON.stringify({ item, baseUpdatedAt: item.updatedAt }) }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "SYNC_CONFLICT", details: item } });
  });

  it("未登入不接觸資料庫", async () => {
    serverApi.requireTravelSession.mockResolvedValueOnce(Response.json({ ok: false }, { status: 401 }));
    const response = await GET();
    expect(response.status).toBe(401);
    expect(repository.listFoodCandidates).not.toHaveBeenCalled();
  });
});

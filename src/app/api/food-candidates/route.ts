import { apiError, apiSuccess, requireTravelSession } from "@/lib/server/api";
import { listFoodCandidates, upsertFoodCandidate } from "@/lib/server/foodRepository";
import { foodCandidatePatchSchema } from "@/lib/foodSchema";

async function readJson(request: Request) {
  try { return await request.json() as unknown; } catch { return null; }
}

function databaseError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "DATABASE_NOT_CONFIGURED") return apiError("DATABASE_NOT_CONFIGURED", "美食同步資料庫尚未完成設定。", 503);
  return apiError("DATABASE_UNAVAILABLE", "美食清單暫時無法連線，變更會保留在手機。", 503);
}

export async function GET() {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  try {
    const items = await listFoodCandidates();
    return apiSuccess({
      items,
      updatedAt: items.reduce<string | null>((latest, item) => !latest || item.updatedAt > latest ? item.updatedAt : latest, null),
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const parsed = foodCandidatePatchSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "美食候選資料格式不正確。", 400, parsed.error.flatten());
  try {
    const result = await upsertFoodCandidate(parsed.data.item, parsed.data.baseUpdatedAt);
    if (result.conflict) return apiError("SYNC_CONFLICT", "另一支手機已更新這家候選。", 409, result.item);
    return apiSuccess(result.item);
  } catch (error) {
    return databaseError(error);
  }
}

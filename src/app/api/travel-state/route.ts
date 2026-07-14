import { z } from "zod";
import { apiError, apiSuccess, requireTravelSession } from "@/lib/server/api";
import {
  deleteTravelStateItem,
  listTravelState,
  resetTravelState,
  upsertTravelState,
} from "@/lib/server/travelStateRepository";
import { travelNamespaces } from "@/types/travelSync";

const namespaceSchema = z.enum(travelNamespaces);
const itemIdSchema = z.string().trim().min(1).max(160);
const patchSchema = z.object({
  namespace: namespaceSchema,
  itemId: itemIdSchema,
  checked: z.boolean(),
  name: z.string().trim().min(1).max(160).nullable().optional(),
  category: z.string().trim().min(1).max(80).nullable().optional(),
  baseUpdatedAt: z.string().datetime().nullable().default(null),
}).superRefine((value, context) => {
  if ((value.name != null) !== (value.category != null)) {
    context.addIssue({ code: "custom", message: "自訂項目的名稱與分類必須同時提供。" });
  }
});
const deleteSchema = z.object({ namespace: namespaceSchema, itemId: itemIdSchema.optional() });

function databaseError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "DATABASE_NOT_CONFIGURED") {
    return apiError("DATABASE_NOT_CONFIGURED", "同步資料庫尚未完成設定。", 503);
  }
  return apiError("DATABASE_UNAVAILABLE", "同步資料庫暫時無法連線，已保留本機變更。", 503);
}

async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    return null;
  }
}

export async function GET() {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  try {
    const items = await listTravelState();
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
  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "同步項目格式不正確。", 400);
  try {
    const result = await upsertTravelState(parsed.data);
    if (result.conflict) return apiError("SYNC_CONFLICT", "另一支手機已更新這個項目。", 409, result.item);
    return apiSuccess(result.item);
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const parsed = deleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "重設範圍格式不正確。", 400);
  try {
    if (parsed.data.itemId) {
      return apiSuccess({ deleted: await deleteTravelStateItem(parsed.data.namespace, parsed.data.itemId) });
    }
    return apiSuccess({ deleted: await resetTravelState(parsed.data.namespace) });
  } catch (error) {
    return databaseError(error);
  }
}

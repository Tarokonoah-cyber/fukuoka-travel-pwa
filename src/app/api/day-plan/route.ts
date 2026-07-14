import { z } from "zod";
import { itinerary } from "@/data/itinerary";
import { apiError, apiSuccess, requireTravelSession } from "@/lib/server/api";
import {
  createCustomDayPlanItem,
  deleteCustomDayPlanItem,
  listDayPlanState,
  patchDayPlanItem,
  reorderDayPlan,
  resetDayPlan,
} from "@/lib/server/dayPlanRepository";
import { dayPlanStatuses } from "@/types/dayPlan";

const tripDates = new Set(itinerary.map((day) => day.date));
const dateSchema = z.string().refine((date) => tripDates.has(date), "日期不在旅程範圍內");
const itemIdSchema = z.string().trim().min(1).max(160);
const startTimeSchema = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).nullable();
const customSchema = z.object({
  title: z.string().trim().min(1).max(160),
  timeLabel: z.string().trim().max(40).default("彈性"),
  startTime: startTimeSchema.default(null),
  location: z.string().trim().max(200).default(""),
  note: z.string().trim().max(500).default(""),
});
const createSchema = z.object({
  date: dateSchema,
  itemId: itemIdSchema,
  sortOrder: z.number().int().min(0).max(100000),
  custom: customSchema,
});
const patchSchema = z.object({
  date: dateSchema,
  itemId: itemIdSchema,
  status: z.enum(dayPlanStatuses),
  sortOrder: z.number().int().min(0).max(100000),
  isCustom: z.boolean(),
  custom: customSchema.nullable(),
  baseUpdatedAt: z.string().datetime().nullable().default(null),
}).superRefine((value, context) => {
  if (value.isCustom !== Boolean(value.custom)) context.addIssue({ code: "custom", message: "臨時項目內容不完整。" });
});
const reorderSchema = z.object({ date: dateSchema, orderedItemIds: z.array(itemIdSchema).min(1).max(100) });
const deleteSchema = z.object({ date: dateSchema, itemId: itemIdSchema.optional() });

async function readJson(request: Request) {
  try { return await request.json() as unknown; } catch { return null; }
}

function databaseError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "DATABASE_NOT_CONFIGURED") return apiError("DATABASE_NOT_CONFIGURED", "旅途控制台資料庫尚未完成設定。", 503);
  return apiError("DATABASE_UNAVAILABLE", "旅途控制台暫時無法連線，變更會保留在手機。", 503);
}

export async function GET(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const parsed = dateSchema.safeParse(new URL(request.url).searchParams.get("date"));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "請指定有效的旅程日期。", 400);
  try {
    const items = await listDayPlanState(parsed.data);
    const updatedAt = items.reduce<string | null>((latest, item) => !latest || item.updatedAt > latest ? item.updatedAt : latest, null);
    return apiSuccess({ date: parsed.data, items, updatedAt });
  } catch (error) { return databaseError(error); }
}

export async function POST(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "臨時行程內容不完整。", 400);
  try {
    const item = await createCustomDayPlanItem(parsed.data);
    return item ? apiSuccess(item, 201) : apiError("ITEM_EXISTS", "這個臨時項目已存在。", 409);
  } catch (error) { return databaseError(error); }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "行程狀態格式不正確。", 400);
  try {
    const result = await patchDayPlanItem(parsed.data);
    if (result.conflict) return apiError("SYNC_CONFLICT", "另一支手機已更新這個項目。", 409, result.item);
    return apiSuccess(result.item);
  } catch (error) { return databaseError(error); }
}

export async function PUT(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const parsed = reorderSchema.safeParse(await readJson(request));
  if (!parsed.success || new Set(parsed.data.orderedItemIds).size !== parsed.data.orderedItemIds.length) return apiError("VALIDATION_ERROR", "行程排序格式不正確。", 400);
  try { return apiSuccess(await reorderDayPlan(parsed.data.date, parsed.data.orderedItemIds)); }
  catch (error) { return databaseError(error); }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const parsed = deleteSchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "刪除範圍格式不正確。", 400);
  try {
    const deleted = parsed.data.itemId
      ? await deleteCustomDayPlanItem(parsed.data.date, parsed.data.itemId)
      : await resetDayPlan(parsed.data.date);
    return apiSuccess({ deleted });
  } catch (error) { return databaseError(error); }
}

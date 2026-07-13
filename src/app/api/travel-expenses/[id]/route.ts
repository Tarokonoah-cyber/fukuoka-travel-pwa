import { z } from "zod";
import { updateExpenseSchema } from "@/lib/expenses";
import { apiError, apiSuccess, requireTravelSession } from "@/lib/server/api";
import { deleteTravelExpense, updateTravelExpense } from "@/lib/server/expenseRepository";

const idSchema = z.string().uuid();

function databaseError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "DATABASE_NOT_CONFIGURED") return apiError("DATABASE_NOT_CONFIGURED", "旅費資料庫尚未完成設定。", 503);
  return apiError("DATABASE_UNAVAILABLE", "旅費資料庫暫時無法連線，請稍後再試。", 503);
}

export async function PATCH(request: Request, context: RouteContext<"/api/travel-expenses/[id]">) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return apiError("INVALID_ID", "旅費紀錄編號不正確。", 400);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "旅費資料格式不正確。", 400);
  }
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "請檢查日期、金額、分類、付款方式與匯率。", 400);
  try {
    const expense = await updateTravelExpense(id, parsed.data);
    return expense ? apiSuccess(expense) : apiError("NOT_FOUND", "找不到這筆旅費紀錄。", 404);
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/travel-expenses/[id]">) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return apiError("INVALID_ID", "旅費紀錄編號不正確。", 400);
  try {
    return await deleteTravelExpense(id) ? apiSuccess({ id }) : apiError("NOT_FOUND", "找不到這筆旅費紀錄。", 404);
  } catch (error) {
    return databaseError(error);
  }
}

import { createExpenseSchema } from "@/lib/expenses";
import { apiError, apiSuccess, requireTravelSession } from "@/lib/server/api";
import { createTravelExpense, findExpenseDuplicates, listTravelExpenses } from "@/lib/server/expenseRepository";

function databaseError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "DATABASE_NOT_CONFIGURED") return apiError("DATABASE_NOT_CONFIGURED", "旅費資料庫尚未完成設定。", 503);
  return apiError("DATABASE_UNAVAILABLE", "旅費資料庫暫時無法連線，請稍後再試。", 503);
}

export async function GET() {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  try {
    return apiSuccess(await listTravelExpenses());
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireTravelSession();
  if (unauthorized) return unauthorized;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "旅費資料格式不正確。", 400);
  }
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "請檢查日期、金額、分類、付款方式與匯率。", 400);

  try {
    const { forceSave, ...input } = parsed.data;
    const duplicates = await findExpenseDuplicates(input);
    if (duplicates.length && !forceSave) return apiError("DUPLICATE_SUSPECTED", "這筆旅費可能已經儲存過。", 409, duplicates);
    return apiSuccess(await createTravelExpense(input), 201);
  } catch (error) {
    return databaseError(error);
  }
}

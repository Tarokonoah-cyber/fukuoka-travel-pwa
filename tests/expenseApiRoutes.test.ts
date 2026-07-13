import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TravelExpense } from "@/types/expenses";

const repository = vi.hoisted(() => ({
  createTravelExpense: vi.fn(),
  findExpenseDuplicates: vi.fn(),
  listTravelExpenses: vi.fn(),
  updateTravelExpense: vi.fn(),
  deleteTravelExpense: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/expenseRepository", () => repository);
vi.mock("@/lib/server/api", () => ({
  requireTravelSession: vi.fn().mockResolvedValue(null),
  apiSuccess: <T>(data: T, status = 200) => Response.json({ ok: true, data }, { status }),
  apiError: (code: string, message: string, status: number, details?: unknown) => Response.json({ ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } }, { status }),
}));

import { POST } from "@/app/api/travel-expenses/route";
import { DELETE, PATCH } from "@/app/api/travel-expenses/[id]/route";

const id = "f2bea58b-c88c-458b-a006-21c526197752";
const expense: TravelExpense = {
  id,
  expenseDate: "2026-08-03",
  storeName: "測試店",
  storeNameJa: null,
  amountJPY: 500,
  exchangeRate: 0.22,
  amountTWD: 110,
  category: "餐飲",
  paymentMethod: "現金",
  note: null,
  inputMethod: "manual",
  receiptHash: null,
  aiConfidence: null,
  aiRawResult: null,
  createdAt: "2026-08-03T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:00.000Z",
};

const fields = {
  expenseDate: expense.expenseDate,
  storeName: expense.storeName,
  storeNameJa: expense.storeNameJa,
  amountJPY: expense.amountJPY,
  exchangeRate: expense.exchangeRate,
  category: expense.category,
  paymentMethod: expense.paymentMethod,
  note: expense.note,
};

beforeEach(() => {
  vi.clearAllMocks();
  repository.findExpenseDuplicates.mockResolvedValue([]);
});

describe("旅費 CRUD Route Handlers", () => {
  it("手動新增會以 manual 寫入 repository", async () => {
    repository.createTravelExpense.mockResolvedValue(expense);
    const response = await POST(new Request("http://localhost/api/travel-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, inputMethod: "manual" }),
    }));
    expect(response.status).toBe(201);
    expect(repository.createTravelExpense).toHaveBeenCalledWith(expect.objectContaining({ inputMethod: "manual", amountJPY: 500 }));
  });

  it("編輯存在的旅費會回傳更新資料", async () => {
    repository.updateTravelExpense.mockResolvedValue({ ...expense, amountJPY: 800, amountTWD: 176 });
    const response = await PATCH(new Request(`http://localhost/api/travel-expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, amountJPY: 800 }),
    }), { params: Promise.resolve({ id }) } as RouteContext<"/api/travel-expenses/[id]">);
    expect(response.status).toBe(200);
    expect(repository.updateTravelExpense).toHaveBeenCalledWith(id, expect.objectContaining({ amountJPY: 800 }));
  });

  it("刪除存在的旅費正常，找不到時回 404", async () => {
    repository.deleteTravelExpense.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const context = { params: Promise.resolve({ id }) } as RouteContext<"/api/travel-expenses/[id]">;
    expect((await DELETE(new Request(`http://localhost/api/travel-expenses/${id}`, { method: "DELETE" }), context)).status).toBe(200);
    expect((await DELETE(new Request(`http://localhost/api/travel-expenses/${id}`, { method: "DELETE" }), context)).status).toBe(404);
  });
});

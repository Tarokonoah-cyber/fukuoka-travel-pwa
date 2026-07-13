import { describe, expect, it } from "vitest";
import {
  calculateAmountTWD,
  createExpenseSchema,
  findDuplicateMatches,
  getAnalysisWarnings,
  storeNamesAreSimilar,
  summarizeExpenses,
  updateExpenseSchema,
} from "@/lib/expenses";
import type { ReceiptAnalysis, TravelExpense } from "@/types/expenses";

const baseExpense: TravelExpense = {
  id: "f2bea58b-c88c-458b-a006-21c526197752",
  expenseDate: "2026-08-03",
  storeName: "博多阪急",
  storeNameJa: "博多阪急店",
  amountJPY: 1280,
  exchangeRate: 0.22,
  amountTWD: 282,
  category: "購物",
  paymentMethod: "信用卡",
  note: null,
  inputMethod: "scan",
  receiptHash: "a".repeat(64),
  aiConfidence: 0.88,
  aiRawResult: null,
  createdAt: "2026-08-03T01:00:00.000Z",
  updatedAt: "2026-08-03T01:00:00.000Z",
};

const validCreate = {
  expenseDate: "2026-08-03",
  storeName: "博多阪急",
  storeNameJa: null,
  amountJPY: 1280,
  exchangeRate: 0.22,
  category: "購物",
  paymentMethod: "信用卡",
  note: null,
  inputMethod: "manual",
};

describe("旅費金額與驗證", () => {
  it("amount_twd 以日圓乘匯率四捨五入", () => {
    expect(calculateAmountTWD(1280, 0.22)).toBe(282);
    expect(calculateAmountTWD(101, 0.215)).toBe(22);
  });

  it("拒絕負數日圓", () => {
    expect(createExpenseSchema.safeParse({ ...validCreate, amountJPY: -1 }).success).toBe(false);
  });

  it("拒絕未知分類", () => {
    expect(createExpenseSchema.safeParse({ ...validCreate, category: "娛樂" }).success).toBe(false);
  });

  it("拒絕未知付款方式", () => {
    expect(createExpenseSchema.safeParse({ ...validCreate, paymentMethod: "行動支付" }).success).toBe(false);
  });

  it("手動新增可通過且禁止夾帶 AI 欄位", () => {
    expect(createExpenseSchema.safeParse(validCreate).success).toBe(true);
    expect(createExpenseSchema.safeParse({ ...validCreate, aiConfidence: 0.8 }).success).toBe(false);
  });

  it("編輯欄位可驗證", () => {
    const fields = {
      expenseDate: validCreate.expenseDate,
      storeName: validCreate.storeName,
      storeNameJa: validCreate.storeNameJa,
      amountJPY: validCreate.amountJPY,
      exchangeRate: validCreate.exchangeRate,
      category: validCreate.category,
      paymentMethod: validCreate.paymentMethod,
      note: validCreate.note,
    };
    expect(updateExpenseSchema.safeParse({ ...fields, amountJPY: 500 }).success).toBe(true);
  });
});

describe("AI 結果與警告", () => {
  it("Gemini null 欄位可以安全顯示", () => {
    const analysis: ReceiptAnalysis = { storeName: null, storeNameJa: null, expenseDate: null, amountJPY: null, category: "其他", paymentMethod: "其他", note: null, confidence: 0.8, warnings: [] };
    expect(getAnalysisWarnings(analysis)).toEqual([]);
  });

  it("低 confidence 與旅行期間外日期會警告", () => {
    const analysis: ReceiptAnalysis = { storeName: null, storeNameJa: null, expenseDate: "2026-08-08", amountJPY: 100, category: "其他", paymentMethod: "現金", note: null, confidence: 0.4, warnings: [] };
    const warnings = getAnalysisWarnings(analysis).join(" ");
    expect(warnings).toContain("信心偏低");
    expect(warnings).toContain("旅程期間");
  });
});

describe("重複偵測與 Dashboard", () => {
  it("相同 receipt hash 會提醒", () => {
    const matches = findDuplicateMatches([baseExpense], {
      expenseDate: baseExpense.expenseDate,
      amountJPY: baseExpense.amountJPY,
      storeName: baseExpense.storeName,
      storeNameJa: baseExpense.storeNameJa,
      receiptHash: baseExpense.receiptHash,
    });
    expect(matches[0]?.reason).toBe("receipt_hash");
  });

  it("相同日期、金額與相似店名會提醒", () => {
    expect(storeNamesAreSimilar("博多 阪急店", "博多阪急")).toBe(true);
    const matches = findDuplicateMatches([baseExpense], { expenseDate: "2026-08-03", amountJPY: 1280, storeName: "博多 阪急店", storeNameJa: null, receiptHash: null });
    expect(matches[0]?.reason).toBe("same_details");
  });

  it("空資料 Dashboard 統計為零", () => {
    expect(summarizeExpenses([], "2026-08-03")).toEqual({ todayJPY: 0, todayTWD: 0, tripJPY: 0, tripTWD: 0, count: 0 });
  });
});

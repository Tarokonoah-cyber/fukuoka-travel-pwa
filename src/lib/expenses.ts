import { z } from "zod";
import { expenseCategories, expensePaymentMethods, type DuplicateMatch, type ReceiptAnalysis, type TravelExpense } from "@/types/expenses";
import { trip } from "@/data/trip";
import { getTokyoDateKey } from "@/lib/date";

export const TRIP_START = trip.startDate;
export const TRIP_END = trip.endDate;
export const EXPENSE_SETTINGS_KEY = "fukuoka-expense-settings-v1";
export const DEFAULT_EXCHANGE_RATE = 0.22;

const nullableTrimmedString = z.string().trim().max(120).nullable();
const exchangeRateSchema = z.number().positive().max(100).refine(
  (value) => Math.abs(value * 1_000_000 - Math.round(value * 1_000_000)) < 1e-6,
  "匯率最多只能有 6 位小數。",
);

export const receiptAnalysisSchema = z.object({
  storeName: nullableTrimmedString,
  storeNameJa: nullableTrimmedString,
  expenseDate: z.string().date().nullable(),
  amountJPY: z.number().int().nonnegative().nullable(),
  category: z.enum(expenseCategories),
  paymentMethod: z.enum(expensePaymentMethods),
  note: z.string().trim().max(500).nullable(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string().trim().min(1).max(200)).max(12),
});

const expenseFieldsSchema = z.object({
  expenseDate: z.string().date(),
  storeName: z.string().trim().max(120).nullable().optional(),
  storeNameJa: z.string().trim().max(120).nullable().optional(),
  amountJPY: z.number().int().nonnegative().max(10_000_000),
  exchangeRate: exchangeRateSchema,
  category: z.enum(expenseCategories),
  paymentMethod: z.enum(expensePaymentMethods),
  note: z.string().trim().max(500).nullable().optional(),
});

export const createExpenseSchema = expenseFieldsSchema.extend({
  inputMethod: z.enum(["scan", "manual"]),
  receiptHash: z.string().regex(/^[a-f0-9]{64}$/).nullable().optional(),
  aiConfidence: z.number().min(0).max(1).nullable().optional(),
  aiRawResult: receiptAnalysisSchema.nullable().optional(),
  forceSave: z.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  if (value.inputMethod === "manual" && (value.receiptHash || value.aiConfidence !== null && value.aiConfidence !== undefined || value.aiRawResult)) {
    ctx.addIssue({ code: "custom", message: "手動新增不可包含 AI 或收據欄位。" });
  }
});

export const updateExpenseSchema = expenseFieldsSchema;

export function calculateAmountTWD(amountJPY: number, exchangeRate: number) {
  return Math.round(amountJPY * exchangeRate);
}

export function normalizeExpenseDate(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export function isOutsideTrip(date: string | null | undefined) {
  return Boolean(date && (date < TRIP_START || date > TRIP_END));
}

export function getAnalysisWarnings(analysis: ReceiptAnalysis | null) {
  if (!analysis) return [];
  const warnings = [...analysis.warnings];
  if (analysis.confidence < 0.65) warnings.unshift("AI 辨識信心偏低，請逐欄核對收據。");
  if (analysis.expenseDate && isOutsideTrip(analysis.expenseDate)) warnings.push("辨識日期不在 2026/08/02–08/06 旅程期間，仍可確認後儲存。");
  return [...new Set(warnings)];
}

export function normalizeStoreName(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

export function storeNamesAreSimilar(left: string | null | undefined, right: string | null | undefined) {
  const a = normalizeStoreName(left);
  const b = normalizeStoreName(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const maxLength = Math.max(a.length, b.length);
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous.splice(0, previous.length, ...current);
  }
  return 1 - previous[b.length] / maxLength >= 0.72;
}

export function findDuplicateMatches(expenses: TravelExpense[], candidate: Pick<TravelExpense, "expenseDate" | "amountJPY" | "storeName" | "storeNameJa" | "receiptHash">, excludeId?: string) {
  const matches: DuplicateMatch[] = [];
  for (const expense of expenses) {
    if (expense.id === excludeId) continue;
    if (candidate.receiptHash && expense.receiptHash === candidate.receiptHash) {
      matches.push({ id: expense.id, reason: "receipt_hash", expenseDate: expense.expenseDate, storeName: expense.storeName, amountJPY: expense.amountJPY });
      continue;
    }
    const sameDetails = expense.expenseDate === candidate.expenseDate
      && expense.amountJPY === candidate.amountJPY
      && (storeNamesAreSimilar(expense.storeName, candidate.storeName) || storeNamesAreSimilar(expense.storeNameJa, candidate.storeNameJa));
    if (sameDetails) matches.push({ id: expense.id, reason: "same_details", expenseDate: expense.expenseDate, storeName: expense.storeName, amountJPY: expense.amountJPY });
  }
  return matches;
}

export function getTokyoDate(now = new Date()) {
  return getTokyoDateKey(now);
}

export function getDefaultExpenseDate(now = new Date()) {
  const today = getTokyoDate(now);
  return today >= TRIP_START && today <= TRIP_END ? today : TRIP_START;
}

export function summarizeExpenses(expenses: TravelExpense[], today = getTokyoDate()) {
  const tripExpenses = expenses.filter((expense) => expense.expenseDate >= TRIP_START && expense.expenseDate <= TRIP_END);
  const todayExpenses = expenses.filter((expense) => expense.expenseDate === today);
  const total = (items: TravelExpense[], key: "amountJPY" | "amountTWD") => items.reduce((sum, expense) => sum + expense[key], 0);
  return {
    todayJPY: total(todayExpenses, "amountJPY"),
    todayTWD: total(todayExpenses, "amountTWD"),
    tripJPY: total(tripExpenses, "amountJPY"),
    tripTWD: total(tripExpenses, "amountTWD"),
    count: expenses.length,
  };
}

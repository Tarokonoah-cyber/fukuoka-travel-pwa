import "server-only";
import { calculateAmountTWD, findDuplicateMatches } from "@/lib/expenses";
import { getExpenseSql } from "@/lib/server/db";
import type { DuplicateMatch, ReceiptAnalysis, TravelExpense } from "@/types/expenses";

interface ExpenseRow {
  id: string;
  expense_date: string;
  store_name: string | null;
  store_name_ja: string | null;
  amount_jpy: number;
  exchange_rate: string | number;
  amount_twd: number;
  category: TravelExpense["category"];
  payment_method: TravelExpense["paymentMethod"];
  note: string | null;
  input_method: TravelExpense["inputMethod"];
  receipt_hash: string | null;
  ai_confidence: string | number | null;
  ai_raw_result: ReceiptAnalysis | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ExpenseWriteInput {
  expenseDate: string;
  storeName?: string | null;
  storeNameJa?: string | null;
  amountJPY: number;
  exchangeRate: number;
  category: TravelExpense["category"];
  paymentMethod: TravelExpense["paymentMethod"];
  note?: string | null;
}

export interface ExpenseCreateInput extends ExpenseWriteInput {
  inputMethod: TravelExpense["inputMethod"];
  receiptHash?: string | null;
  aiConfidence?: number | null;
  aiRawResult?: ReceiptAnalysis | null;
}

function asIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapExpense(row: ExpenseRow): TravelExpense {
  return {
    id: row.id,
    expenseDate: String(row.expense_date).slice(0, 10),
    storeName: row.store_name,
    storeNameJa: row.store_name_ja,
    amountJPY: Number(row.amount_jpy),
    exchangeRate: Number(row.exchange_rate),
    amountTWD: Number(row.amount_twd),
    category: row.category,
    paymentMethod: row.payment_method,
    note: row.note,
    inputMethod: row.input_method,
    receiptHash: row.receipt_hash,
    aiConfidence: row.ai_confidence === null ? null : Number(row.ai_confidence),
    aiRawResult: row.ai_raw_result,
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

export async function listTravelExpenses() {
  const sql = getExpenseSql();
  const rows = await sql`select * from travel_expenses order by expense_date desc, created_at desc`;
  return (rows as ExpenseRow[]).map(mapExpense);
}

export async function findExpenseDuplicates(input: ExpenseCreateInput): Promise<DuplicateMatch[]> {
  const sql = getExpenseSql();
  const rows = await sql`
    select * from travel_expenses
    where (${input.receiptHash ?? null}::text is not null and receipt_hash = ${input.receiptHash ?? null})
       or (expense_date = ${input.expenseDate}::date and amount_jpy = ${input.amountJPY})
    order by created_at desc
    limit 20
  `;
  const expenses = (rows as ExpenseRow[]).map(mapExpense);
  return findDuplicateMatches(expenses, {
    expenseDate: input.expenseDate,
    amountJPY: input.amountJPY,
    storeName: input.storeName ?? null,
    storeNameJa: input.storeNameJa ?? null,
    receiptHash: input.receiptHash ?? null,
  });
}

export async function createTravelExpense(input: ExpenseCreateInput) {
  const sql = getExpenseSql();
  const amountTWD = calculateAmountTWD(input.amountJPY, input.exchangeRate);
  const rows = await sql`
    insert into travel_expenses (
      expense_date, store_name, store_name_ja, amount_jpy, exchange_rate, amount_twd,
      category, payment_method, note, input_method, receipt_hash, ai_confidence, ai_raw_result
    ) values (
      ${input.expenseDate}::date, ${input.storeName ?? null}, ${input.storeNameJa ?? null},
      ${input.amountJPY}, ${input.exchangeRate}, ${amountTWD}, ${input.category},
      ${input.paymentMethod}, ${input.note ?? null}, ${input.inputMethod},
      ${input.receiptHash ?? null}, ${input.aiConfidence ?? null}, ${input.aiRawResult ? JSON.stringify(input.aiRawResult) : null}::jsonb
    ) returning *
  `;
  return mapExpense((rows as ExpenseRow[])[0]);
}

export async function updateTravelExpense(id: string, input: ExpenseWriteInput) {
  const sql = getExpenseSql();
  const amountTWD = calculateAmountTWD(input.amountJPY, input.exchangeRate);
  const rows = await sql`
    update travel_expenses set
      expense_date = ${input.expenseDate}::date,
      store_name = ${input.storeName ?? null},
      store_name_ja = ${input.storeNameJa ?? null},
      amount_jpy = ${input.amountJPY},
      exchange_rate = ${input.exchangeRate},
      amount_twd = ${amountTWD},
      category = ${input.category},
      payment_method = ${input.paymentMethod},
      note = ${input.note ?? null}
    where id = ${id}::uuid
    returning *
  `;
  return rows.length ? mapExpense((rows as ExpenseRow[])[0]) : null;
}

export async function deleteTravelExpense(id: string) {
  const sql = getExpenseSql();
  const rows = await sql`delete from travel_expenses where id = ${id}::uuid returning id`;
  return rows.length > 0;
}

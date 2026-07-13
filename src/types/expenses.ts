export const expenseCategories = ["餐飲", "交通", "購物", "伴手禮", "門票", "住宿", "藥妝", "其他"] as const;
export const expensePaymentMethods = ["現金", "信用卡", "交通卡", "其他"] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];
export type ExpensePaymentMethod = (typeof expensePaymentMethods)[number];
export type ExpenseInputMethod = "scan" | "manual";

export interface ReceiptAnalysis {
  storeName: string | null;
  storeNameJa: string | null;
  expenseDate: string | null;
  amountJPY: number | null;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  note: string | null;
  confidence: number;
  warnings: string[];
}

export interface TravelExpense {
  id: string;
  expenseDate: string;
  storeName: string | null;
  storeNameJa: string | null;
  amountJPY: number;
  exchangeRate: number;
  amountTWD: number;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  note: string | null;
  inputMethod: ExpenseInputMethod;
  receiptHash: string | null;
  aiConfidence: number | null;
  aiRawResult: ReceiptAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseDraft {
  expenseDate: string;
  storeName: string;
  storeNameJa: string;
  amountJPY: string;
  exchangeRate: string;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  note: string;
}

export interface DuplicateMatch {
  id: string;
  reason: "receipt_hash" | "same_details";
  expenseDate: string;
  storeName: string | null;
  amountJPY: number;
}

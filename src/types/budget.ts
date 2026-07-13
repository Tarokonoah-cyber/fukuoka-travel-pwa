export type ExpensePaymentMethod = "cash" | "card" | "ic" | "other";

export type ExpenseCategory =
  | "meal"
  | "transport"
  | "shopping"
  | "souvenir"
  | "drugstore"
  | "baseball"
  | "hotel"
  | "ticket"
  | "coffee"
  | "other";

export type Expense = {
  id: string;
  date: string;
  title: string;
  amountJpy: number;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  note?: string;
  createdAt: string;
  updatedAt?: string;
};

export type DailyBudget = {
  date: string;
  label: string;
  amountJpy: number;
  note?: string;
};

export type CategoryBudget = {
  category: ExpenseCategory;
  label: string;
  amountJpy: number;
  note?: string;
};

export type PaymentMethodOption = {
  method: ExpensePaymentMethod;
  label: string;
  note?: string;
};

export type BudgetPlan = {
  totalBudgetJpy: number;
  dailyBudgets: DailyBudget[];
  categoryBudgets: CategoryBudget[];
  paymentMethods: PaymentMethodOption[];
  reserveJpy: number;
  note: string;
};

export type BudgetTotals = {
  totalSpentJpy: number;
  remainingJpy: number;
  todaySpentJpy: number;
  todayRemainingJpy: number;
};

export type DailyExpenseSummary = DailyBudget & {
  spentJpy: number;
  remainingJpy: number;
  overBudget: boolean;
  topCategoryLabel: string;
};

export type CategoryExpenseSummary = CategoryBudget & {
  spentJpy: number;
  remainingJpy: number;
  overBudget: boolean;
  percent: number;
};

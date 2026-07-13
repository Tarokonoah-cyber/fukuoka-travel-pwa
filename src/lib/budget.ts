import { budgetPlan, expenseCategoryLabels, expensePaymentMethodLabels } from "@/data/budget";
import { TRIP_END_DATE, TRIP_START_DATE } from "@/lib/date";
import type {
  BudgetTotals,
  CategoryExpenseSummary,
  DailyExpenseSummary,
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
} from "@/types/budget";

export const jpyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export const twdFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export function formatJpy(amount: number) {
  return jpyFormatter.format(Math.max(0, Math.round(amount)));
}

export function formatTwd(amount: number) {
  return twdFormatter.format(Math.max(0, Math.round(amount)));
}

export function getExpenseCategoryLabel(category: ExpenseCategory) {
  return expenseCategoryLabels[category] ?? "其他";
}

export function getExpensePaymentMethodLabel(method: ExpensePaymentMethod) {
  return expensePaymentMethodLabels[method] ?? "其他";
}

export function getBudgetDateOptions() {
  return budgetPlan.dailyBudgets.map((day) => ({ value: day.date, label: day.label }));
}

export function clampExpenseDate(date: string) {
  if (date < TRIP_START_DATE) return TRIP_START_DATE;
  if (date > TRIP_END_DATE) return TRIP_END_DATE;
  return date;
}

export function getDailyBudget(date: string) {
  return budgetPlan.dailyBudgets.find((day) => day.date === date)?.amountJpy ?? 0;
}

export function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((sum, expense) => sum + expense.amountJpy, 0);
}

export function getBudgetTotals(expenses: Expense[], activeDate: string): BudgetTotals {
  const todayBudget = getDailyBudget(activeDate);
  const totalSpentJpy = sumExpenses(expenses);
  const todaySpentJpy = sumExpenses(expenses.filter((expense) => expense.date === activeDate));

  return {
    totalSpentJpy,
    remainingJpy: budgetPlan.totalBudgetJpy - totalSpentJpy,
    todaySpentJpy,
    todayRemainingJpy: todayBudget - todaySpentJpy,
  };
}

export function getDailyExpenseSummaries(expenses: Expense[]): DailyExpenseSummary[] {
  return budgetPlan.dailyBudgets.map((day) => {
    const dayExpenses = expenses.filter((expense) => expense.date === day.date);
    const spentJpy = sumExpenses(dayExpenses);
    const categoryTotals = new Map<ExpenseCategory, number>();

    dayExpenses.forEach((expense) => {
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amountJpy);
    });

    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      ...day,
      spentJpy,
      remainingJpy: day.amountJpy - spentJpy,
      overBudget: spentJpy > day.amountJpy,
      topCategoryLabel: topCategory ? getExpenseCategoryLabel(topCategory) : "尚未記錄",
    };
  });
}

export function getCategoryExpenseSummaries(expenses: Expense[]): CategoryExpenseSummary[] {
  return budgetPlan.categoryBudgets.map((categoryBudget) => {
    const spentJpy = sumExpenses(expenses.filter((expense) => expense.category === categoryBudget.category));
    const percent = categoryBudget.amountJpy > 0 ? Math.min(100, Math.round((spentJpy / categoryBudget.amountJpy) * 100)) : 0;

    return {
      ...categoryBudget,
      spentJpy,
      remainingJpy: categoryBudget.amountJpy - spentJpy,
      overBudget: categoryBudget.amountJpy > 0 && spentJpy > categoryBudget.amountJpy,
      percent,
    };
  });
}

export function sortExpensesByNewest(expenses: Expense[]) {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function convertJpyToTwd(amountJpy: number, rate?: number) {
  if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
  return amountJpy * rate;
}

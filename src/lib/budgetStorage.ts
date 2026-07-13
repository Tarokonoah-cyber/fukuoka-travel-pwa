import type { Expense } from "@/types/budget";
import { BUDGET_EXPENSES_KEY } from "./storage";

const BUDGET_EVENT = "fukuoka-budget-change";

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== "object") return false;
  const expense = value as Partial<Expense>;
  return (
    typeof expense.id === "string" &&
    typeof expense.date === "string" &&
    typeof expense.title === "string" &&
    typeof expense.amountJpy === "number" &&
    Number.isFinite(expense.amountJpy) &&
    expense.amountJpy > 0 &&
    typeof expense.category === "string" &&
    typeof expense.paymentMethod === "string" &&
    typeof expense.createdAt === "string"
  );
}

export function parseExpensesSnapshot(value: string): Expense[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isExpense) : [];
  } catch {
    return [];
  }
}

export function getExpensesSnapshot() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BUDGET_EXPENSES_KEY) ?? "";
}

export function getServerExpensesSnapshot() {
  return "";
}

export function readExpenses() {
  if (typeof window === "undefined") return [];
  return parseExpensesSnapshot(getExpensesSnapshot());
}

export function writeExpenses(expenses: Expense[]) {
  localStorage.setItem(BUDGET_EXPENSES_KEY, JSON.stringify(expenses));
  window.dispatchEvent(new Event(BUDGET_EVENT));
}

export function addExpense(expense: Expense) {
  writeExpenses([expense, ...readExpenses()]);
}

export function deleteExpense(id: string) {
  writeExpenses(readExpenses().filter((expense) => expense.id !== id));
}

export function clearExpenses() {
  localStorage.removeItem(BUDGET_EXPENSES_KEY);
  window.dispatchEvent(new Event(BUDGET_EVENT));
}

export function subscribeToBudget(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(BUDGET_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(BUDGET_EVENT, callback);
  };
}

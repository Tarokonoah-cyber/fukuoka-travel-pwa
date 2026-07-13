"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { budgetPlan } from "@/data/budget";
import { formatJpy, getBudgetTotals } from "@/lib/budget";
import { getExpensesSnapshot, getServerExpensesSnapshot, parseExpensesSnapshot, subscribeToBudget } from "@/lib/budgetStorage";
import { TRIP_START_DATE } from "@/lib/date";
import { useTripStatus } from "@/lib/useTripStatus";

export function HomeBudgetSummary() {
  const status = useTripStatus();
  const snapshot = useSyncExternalStore(subscribeToBudget, getExpensesSnapshot, getServerExpensesSnapshot);
  const expenses = useMemo(() => parseExpensesSnapshot(snapshot), [snapshot]);
  const activeDate = status.phase === "pending" ? TRIP_START_DATE : status.activeDate;
  const totals = useMemo(() => getBudgetTotals(expenses, activeDate), [expenses, activeDate]);

  return (
    <Link className="home-budget-link" href="/budget" aria-label="查看旅行花費">
      <span>BUDGET</span>
      <strong>{expenses.length === 0 ? "尚未記錄花費" : `今日 ${formatJpy(totals.todaySpentJpy)}`}</strong>
      <p>
        總花費 {formatJpy(totals.totalSpentJpy)} · 剩餘 {formatJpy(Math.max(0, budgetPlan.totalBudgetJpy - totals.totalSpentJpy))}
      </p>
      <b aria-hidden>→</b>
    </Link>
  );
}

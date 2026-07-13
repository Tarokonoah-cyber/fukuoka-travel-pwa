"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { convertJpyToTwd, formatJpy, formatTwd, getBudgetTotals } from "@/lib/budget";
import { getExpensesSnapshot, getServerExpensesSnapshot, parseExpensesSnapshot, subscribeToBudget } from "@/lib/budgetStorage";
import { useCurrency } from "@/lib/useCurrency";

export function TodayBudgetSummary({ activeDate }: { activeDate: string }) {
  const currency = useCurrency();
  const snapshot = useSyncExternalStore(subscribeToBudget, getExpensesSnapshot, getServerExpensesSnapshot);
  const expenses = useMemo(() => parseExpensesSnapshot(snapshot), [snapshot]);
  const totals = useMemo(() => getBudgetTotals(expenses, activeDate), [expenses, activeDate]);
  const todayTwd = convertJpyToTwd(totals.todaySpentJpy, currency.status === "success" ? currency.data.rate : undefined);

  return (
    <Link className="today-budget-link" href="/budget">
      <span>TRAVEL BUDGET</span>
      <strong>今日已花費 {formatJpy(totals.todaySpentJpy)}</strong>
      <p>
        {todayTwd === null ? "暫時無法換算台幣" : `約 ${formatTwd(todayTwd)}`} · 今日剩餘 {formatJpy(totals.todayRemainingJpy)}
      </p>
      <b aria-hidden>→</b>
    </Link>
  );
}

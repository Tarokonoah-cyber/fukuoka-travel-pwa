"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { EmptyState } from "@/components/EmptyState";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { budgetPlan, expenseCategoryLabels, expensePaymentMethodLabels, quickExpenseAmounts } from "@/data/budget";
import {
  clampExpenseDate,
  convertJpyToTwd,
  formatJpy,
  formatTwd,
  getBudgetTotals,
  getCategoryExpenseSummaries,
  getDailyExpenseSummaries,
  getExpenseCategoryLabel,
  getExpensePaymentMethodLabel,
  sortExpensesByNewest,
} from "@/lib/budget";
import {
  addExpense,
  deleteExpense,
  getExpensesSnapshot,
  getServerExpensesSnapshot,
  parseExpensesSnapshot,
  subscribeToBudget,
} from "@/lib/budgetStorage";
import { TRIP_END_DATE, TRIP_START_DATE } from "@/lib/date";
import { useCurrency } from "@/lib/useCurrency";
import { useTripStatus } from "@/lib/useTripStatus";
import type { Expense, ExpenseCategory, ExpensePaymentMethod } from "@/types/budget";

const initialForm = {
  title: "",
  amountJpy: "",
  date: "",
  category: "meal" as ExpenseCategory,
  paymentMethod: "cash" as ExpensePaymentMethod,
  note: "",
};

function createExpenseId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function useBudgetExpenses() {
  const snapshot = useSyncExternalStore(subscribeToBudget, getExpensesSnapshot, getServerExpensesSnapshot);
  return useMemo(() => parseExpensesSnapshot(snapshot), [snapshot]);
}

export function BudgetPageClient() {
  const tripStatus = useTripStatus();
  const currency = useCurrency();
  const expenses = useBudgetExpenses();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeDate = tripStatus.phase === "pending" ? TRIP_START_DATE : tripStatus.activeDate;
  const formDate = form.date || activeDate;
  const totals = useMemo(() => getBudgetTotals(expenses, activeDate), [expenses, activeDate]);
  const dailySummaries = useMemo(() => getDailyExpenseSummaries(expenses), [expenses]);
  const categorySummaries = useMemo(() => getCategoryExpenseSummaries(expenses), [expenses]);
  const sortedExpenses = useMemo(() => sortExpensesByNewest(expenses), [expenses]);
  const rate = currency.status === "success" ? currency.data.rate : undefined;
  const hasBudget = budgetPlan.totalBudgetJpy > 0;

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const amountJpy = Number(form.amountJpy);

    if (!title) {
      setError("請先輸入花費名稱。");
      return;
    }
    if (!Number.isFinite(amountJpy) || amountJpy <= 0) {
      setError("金額請輸入大於 0 的日幣正數。");
      return;
    }

    const now = new Date().toISOString();
    const expense: Expense = {
      id: createExpenseId(),
      date: clampExpenseDate(formDate),
      title,
      amountJpy: Math.round(amountJpy),
      category: form.category,
      paymentMethod: form.paymentMethod,
      note: form.note.trim() || undefined,
      createdAt: now,
    };

    addExpense(expense);
    setForm((current) => ({ ...initialForm, date: current.date }));
    setError("");
    setMessage(`已記錄 ${title} · ${formatJpy(expense.amountJpy)}`);
  }

  function removeExpense(expense: Expense) {
    if (!window.confirm(`刪除「${expense.title}」這筆花費？`)) return;
    deleteExpense(expense.id);
    setMessage(`已刪除 ${expense.title}`);
  }

  function formatTwdFromJpy(amountJpy: number) {
    const twd = convertJpyToTwd(amountJpy, rate);
    return twd === null ? "暫時無法換算台幣" : `約 ${formatTwd(twd)}`;
  }

  return (
    <div className="budget-page page-enter">
      <PageHeader eyebrow="TRAVEL LEDGER" title="旅行花費" description="用手機快速記錄日幣花費；預算可之後再設定。" />

      <NoticeBox tone="plain" title="預算仍可調整">
        {budgetPlan.note} 台幣換算為參考值，實際刷卡與換匯依銀行為準。
      </NoticeBox>
      {currency.status === "error" && <NoticeBox title="暫時無法換算台幣">匯率服務或快取暫時不可用，日幣記帳仍可離線使用。</NoticeBox>}
      {currency.status === "success" && currency.data.stale && <NoticeBox tone="blue" title="使用上次匯率">目前使用最近一次成功取得的 JPY / TWD 參考匯率。</NoticeBox>}
      {message && <p className="success-message" role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="budget-summary-grid" aria-label="預算摘要">
        <div className="budget-total-card">
          <span>總預算</span>
          <strong>{hasBudget ? formatJpy(budgetPlan.totalBudgetJpy) : "尚未設定預算"}</strong>
          <p>{hasBudget ? formatTwdFromJpy(budgetPlan.totalBudgetJpy) : "目前只記錄實際花費"}</p>
        </div>
        <div className="budget-total-card accent">
          <span>已花費</span>
          <strong>{formatJpy(totals.totalSpentJpy)}</strong>
          <p>{formatTwdFromJpy(totals.totalSpentJpy)}</p>
        </div>
        <div className="budget-total-card">
          <span>剩餘預算</span>
          <strong>{hasBudget ? formatJpy(totals.remainingJpy) : "尚未設定"}</strong>
          <p>{hasBudget ? formatTwdFromJpy(Math.max(0, totals.remainingJpy)) : "設定預算後再顯示"}</p>
        </div>
        <div className="budget-total-card">
          <span>今日花費</span>
          <strong>{formatJpy(totals.todaySpentJpy)}</strong>
          <p>{hasBudget ? `今日剩餘 ${formatJpy(totals.todayRemainingJpy)}` : "今日預算尚未設定"}</p>
        </div>
      </section>

      <section className="budget-form-card" aria-labelledby="budget-form-title">
        <div className="section-header">
          <h2 id="budget-form-title">快速記帳</h2>
          <span>localStorage</span>
        </div>
        <form className="budget-form" onSubmit={submitExpense}>
          <label>
            <span>名稱</span>
            <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="例如：午餐、藥妝、球場飲料" />
          </label>
          <label>
            <span>金額 JPY</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={form.amountJpy}
              onChange={(event) => updateForm("amountJpy", event.target.value)}
              placeholder="0"
            />
          </label>
          <div className="budget-quick-amounts" aria-label="快速金額">
            {quickExpenseAmounts.map((amount) => (
              <button type="button" key={amount} onClick={() => updateForm("amountJpy", String(amount))}>
                {formatJpy(amount)}
              </button>
            ))}
          </div>
          <label>
            <span>日期</span>
            <input type="date" min={TRIP_START_DATE} max={TRIP_END_DATE} value={formDate} onChange={(event) => updateForm("date", event.target.value)} />
          </label>
          <label>
            <span>分類</span>
            <select value={form.category} onChange={(event) => updateForm("category", event.target.value as ExpenseCategory)}>
              {Object.entries(expenseCategoryLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>支付方式</span>
            <select value={form.paymentMethod} onChange={(event) => updateForm("paymentMethod", event.target.value as ExpensePaymentMethod)}>
              {Object.entries(expensePaymentMethodLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="budget-note-field">
            <span>備註</span>
            <textarea value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder="可記錄店名、誰付款或待確認事項；不要輸入信用卡號。" />
          </label>
          <button type="submit" className="budget-submit">
            儲存花費
          </button>
        </form>
      </section>

      <section aria-labelledby="expense-list-title">
        <div className="section-header">
          <h2 id="expense-list-title">花費列表</h2>
          <span>{expenses.length} 筆</span>
        </div>
        {sortedExpenses.length === 0 ? (
          <EmptyState title="尚未記錄花費" description="旅行中可以從這裡快速新增日幣支出。" />
        ) : (
          <div className="expense-list">
            {sortedExpenses.map((expense) => (
              <article className="expense-row" key={expense.id}>
                <div>
                  <span>{expense.date}</span>
                  <h3>{expense.title}</h3>
                  <p>
                    {getExpenseCategoryLabel(expense.category)} · {getExpensePaymentMethodLabel(expense.paymentMethod)}
                    {expense.note ? ` · ${expense.note}` : ""}
                  </p>
                </div>
                <div className="expense-amount">
                  <strong>{formatJpy(expense.amountJpy)}</strong>
                  <small>{formatTwdFromJpy(expense.amountJpy)}</small>
                  <button type="button" onClick={() => removeExpense(expense)}>
                    刪除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="daily-budget-title">
        <div className="section-header">
          <h2 id="daily-budget-title">每日統計</h2>
          <span>2026.08.02–08.06</span>
        </div>
        <div className="budget-stat-list">
          {dailySummaries.map((day) => (
            <article className={day.overBudget ? "budget-stat-row over" : "budget-stat-row"} key={day.date}>
              <div>
                <span>{day.date}</span>
                <strong>{day.label}</strong>
                <p>主要分類：{day.topCategoryLabel}</p>
              </div>
              <div>
                <b>{formatJpy(day.spentJpy)}</b>
                <small>
                  {day.amountJpy > 0 ? `預算 ${formatJpy(day.amountJpy)} · ${day.overBudget ? "已超支" : `剩餘 ${formatJpy(day.remainingJpy)}`}` : "尚未設定預算"}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="category-budget-title">
        <div className="section-header">
          <h2 id="category-budget-title">分類統計</h2>
          <span>簡易小結</span>
        </div>
        <div className="category-budget-list">
          {categorySummaries.map((category) => (
            <article className="category-budget-row" key={category.category}>
              <div className="category-budget-head">
                <strong>{category.label}</strong>
                <span>
                  {formatJpy(category.spentJpy)} / {category.amountJpy > 0 ? formatJpy(category.amountJpy) : "未設定"}
                </span>
              </div>
              <div className="mini-progress" aria-hidden>
                <span style={{ width: `${category.percent}%` }} />
              </div>
              <p>{category.overBudget ? "已超過目前設定預算" : category.note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

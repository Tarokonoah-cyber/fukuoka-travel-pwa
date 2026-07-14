"use client";

import Link from "next/link";
import { useTravelSync } from "./TravelSyncProvider";

export function TodayExpenseSummary() {
  const sync = useTravelSync();
  return (
    <Link className="today-budget-link" href="/expenses">
      <span>PRIVATE TRAVEL LEDGER</span>
      <strong>{sync.authenticated ? "掃描今日收據或查看旅費" : "輸入 PIN 查看旅費"}</strong>
      <p>AI 辨識需連線；沒有收據時可手動新增到同一帳本</p>
      <b aria-hidden>→</b>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useTravelSync } from "./TravelSyncProvider";

export function HomeExpenseSummary() {
  const sync = useTravelSync();
  return (
    <Link className="home-budget-link" href="/expenses" aria-label="查看 AI 旅費紀錄">
      <span>PRIVATE TRAVEL LEDGER</span>
      <strong>{sync.authenticated ? "AI 收據與共用旅費" : "輸入 PIN 查看旅費"}</strong>
      <p>{sync.authenticated ? "掃描收據、人工確認並同步到雲端" : "私人帳本不會寫入離線頁面快取"}</p>
      <b aria-hidden>→</b>
    </Link>
  );
}

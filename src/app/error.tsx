"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application route error", error); }, [error]);
  return <div className="page-enter app-error-page" role="alert">
    <span>RECOVERY</span><h1>這一頁暫時無法顯示</h1>
    <p>本機清單與待同步變更不會因為這個錯誤消失。可以先重試，或回到今日控制台。</p>
    <div><button type="button" onClick={reset}>重新嘗試</button><Link href="/today">回今日</Link><Link href="/">回首頁</Link></div>
  </div>;
}

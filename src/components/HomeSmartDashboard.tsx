"use client";

import Link from "next/link";
import { itinerary } from "@/data/itinerary";
import { trip } from "@/data/trip";
import { useTripStatus } from "@/lib/useTripStatus";
import { DayPlanController } from "./DayPlanController";

function TravelCover({ compact = false }: { compact?: boolean }) {
  return (
    <header className={compact ? "travel-cover travel-cover-compact" : "travel-cover"}>
      <div className="cover-kicker"><span>TRAVEL HANDBOOK</span><span>FUK 2026</span></div>
      <div className="cover-title">
        <div>
          <h1>福岡</h1>
          <strong>{trip.startDate.replaceAll("-", ".")} – {trip.endDate.slice(5).replace("-", ".")}</strong>
        </div>
        <div className="trip-seal"><span>5 DAYS</span><strong>05</strong><small>4 NIGHTS</small></div>
      </div>
    </header>
  );
}

export function HomeSmartDashboard() {
  const status = useTripStatus();

  if (status.phase === "pending") {
    return <><TravelCover /><section className="home-phase-panel"><span>DATE CHECK</span><h2>正在確認福岡日期</h2><p>稍後會自動切換成出發準備或旅途控制台。</p></section></>;
  }

  if (status.phase === "active") {
    const day = itinerary[status.day - 1];
    return <>
      <TravelCover compact />
      <DayPlanController day={day} variant="home" />
      <nav className="home-live-actions" aria-label="旅途中快捷操作">
        <Link href={{ pathname: "/map", query: { scope: "today" } }}><span>圖</span><strong>今日地圖</strong></Link>
        <Link href="/expenses"><span>¥</span><strong>記錄旅費</strong></Link>
      </nav>
    </>;
  }

  if (status.phase === "after") {
    return <>
      <TravelCover compact />
      <section className="home-phase-panel home-archive-panel">
        <span>TRIP ARCHIVE</span><h2>福岡旅程已結束</h2><p>行程、旅費與重要文件仍保留在這本旅行手冊。</p>
        <div><Link href="/itinerary">查看完整行程</Link><Link href="/expenses">整理旅費</Link><Link href="/documents">查看文件</Link></div>
      </section>
    </>;
  }

  const dayOne = itinerary[0];

  return <>
    <TravelCover />
    <section className="home-countdown-summary" aria-label="距離出發天數"><span>距離出發</span><strong>{status.countdown} 天</strong><small>依福岡日期計算</small></section>
    <Link className="home-day-preview" href="/today">
      <span>FIRST DAY PREVIEW</span><strong>{dayOne.highlight}</strong><small>查看 DAY 1 航班、抵達與雨天備案 →</small>
    </Link>
  </>;
}

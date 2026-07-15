"use client";

import Link from "next/link";
import { DayPlanController } from "@/components/DayPlanController";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { TodaySummaryCard } from "@/components/TodaySummaryCard";
import { TodayToolsSummary } from "@/components/TodayToolsSummary";
import { TripDayPhoto } from "@/components/TripDayPhoto";
import { itinerary } from "@/data/itinerary";
import { buildComfortReport } from "@/lib/comfort";
import { useTripStatus } from "@/lib/useTripStatus";

export default function TodayPage() {
  const status = useTripStatus();

  if (status.phase === "pending") {
    return (
      <div className="page-enter">
        <PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅途中快速查看重點、交通、休息與備案。" />
        <NoticeBox tone="blue" title="日期確認中">正在依福岡時間確認旅程狀態，避免跨日時顯示錯誤行程。</NoticeBox>
      </div>
    );
  }

  if (status.phase === "after") {
    return (
      <div className="page-enter">
        <PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅途中快速查看重點、交通、休息與備案。" />
        <NoticeBox tone="plain" title="旅程已結束">
          福岡 5 天 4 夜已結束，可以回到 <Link href="/itinerary">完整行程</Link> 查看旅程紀錄。
        </NoticeBox>
      </div>
    );
  }

  const day = itinerary[status.day - 1];
  const comfort = buildComfortReport(day);

  return (
    <div className="page-enter">
      <PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅途中快速查看重點、交通、休息與備案。" />
      {status.phase === "before" && (
        <NoticeBox title="出發前預覽">目前尚未出發，這裡先顯示 DAY 1 預覽；真正旅行中才會依日期切換當日行程。</NoticeBox>
      )}
      {status.phase === "before" && <TodaySummaryCard day={day} mode="preview" />}
      <TripDayPhoto image={day.image} eager />
      <DayPlanController day={day} timeAware={status.phase === "active"} />

      <details className="today-reminders">
        <summary><span>今日提醒</span><strong>{comfort.label}</strong><b aria-hidden>＋</b></summary>
        <div>
          <section><span>雨天備案</span><p>{day.rainPlan}</p></section>
          <section><span>休息點</span><p>{day.restStops.join(" · ")}</p></section>
          <section><span>媽媽友善</span><p>{day.momFriendlyNote}</p><div><b>步行 {day.walkingLevel}</b><b>室內 {day.indoorRatio}%</b></div></section>
          <Link href="/comfort">查看完整舒適度建議 →</Link>
        </div>
      </details>

      <nav className="today-action-grid" aria-label="今日快捷操作">
        <Link href={{ pathname: "/map", query: { scope: "today" } }}><span>圖</span><strong>今日地圖</strong></Link>
        <Link href="/expenses"><span>¥</span><strong>記錄旅費</strong></Link>
        <Link href="/itinerary"><span>行</span><strong>原始行程</strong></Link>
      </nav>

      <TodayToolsSummary phase={status.phase} activeDate={status.activeDate} />
    </div>
  );
}

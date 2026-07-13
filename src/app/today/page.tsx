"use client";

import Link from "next/link";
import { DayTimeline } from "@/components/DayTimeline";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { TodayBudgetSummary } from "@/components/TodayBudgetSummary";
import { TodaySummaryCard } from "@/components/TodaySummaryCard";
import { TodayToolsSummary } from "@/components/TodayToolsSummary";
import { itinerary } from "@/data/itinerary";
import { buildComfortReport } from "@/lib/comfort";
import { useTripStatus } from "@/lib/useTripStatus";

export default function TodayPage() {
  const status = useTripStatus();

  if (status.phase === "pending") {
    return (
      <div className="page-enter">
        <PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅途中快速查看重點、交通、休息與備案。" />
        <NoticeBox tone="blue" title="日期確認中">正在依台北時區確認旅程狀態，避免出發前誤判為旅行中。</NoticeBox>
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
  const nextTransport = day.items[0];
  const comfort = buildComfortReport(day);

  return (
    <div className="page-enter">
      <PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅途中快速查看重點、交通、休息與備案。" />
      {status.phase === "before" && (
        <NoticeBox title="出發前預覽">目前尚未出發，這裡先顯示 DAY 1 預覽；真正旅行中才會依日期切換當日行程。</NoticeBox>
      )}
      <TodaySummaryCard day={day} mode={status.phase === "before" ? "preview" : "today"} />

      <section className="today-quick-grid" aria-label="今日快速重點">
        <div>
          <span>下一段安排</span>
          <strong>
            {nextTransport.time} · {nextTransport.title}
          </strong>
          <p>{nextTransport.location}</p>
        </div>
        <div>
          <span>雨天備案</span>
          <p>{day.rainPlan}</p>
        </div>
        <div>
          <span>休息點</span>
          <p>{day.restStops.join(" · ")}</p>
        </div>
      </section>

      <aside className="today-memo">
        <span>媽媽友善 MEMO</span>
        <p>{day.momFriendlyNote}</p>
        <div>
          <b>步行 {day.walkingLevel}</b>
          <b>室內 {day.indoorRatio}%</b>
        </div>
      </aside>

      <Link className="comfort-entry-link" href="/comfort">
        <span>今日決策</span>
        <strong>今日建議：{comfort.label}</strong>
        <p>{comfort.reason}</p>
        <b aria-hidden>→</b>
      </Link>

      <TodayBudgetSummary activeDate={status.activeDate} />
      <TodayToolsSummary phase={status.phase} activeDate={status.activeDate} />
      <Link className="map-entry-link" href="/map">
        <span>旅程地圖</span>
        <strong>查看今日與主要點位</strong>
        <b aria-hidden>→</b>
      </Link>

      <section>
        <div className="section-header">
          <h2>{day.title}</h2>
          <span>{day.items.length} 段安排</span>
        </div>
        <DayTimeline day={day} />
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { itinerary } from "@/data/itinerary";
import { buildComfortReport } from "@/lib/comfort";
import { formatTripDate } from "@/lib/date";
import { useTripStatus } from "@/lib/useTripStatus";
import { useWeather } from "@/lib/useWeather";

export function ComfortPageClient() {
  const status = useTripStatus();
  const weather = useWeather();

  if (status.phase === "pending") {
    return (
      <div className="page-enter">
        <PageHeader eyebrow="COMFORT CHECK" title="今日舒適度" description="依照天氣、步行量、室內比例與休息點，快速判斷今天怎麼走。" />
        <NoticeBox tone="blue" title="日期確認中">正在以福岡時間確認旅程狀態，避免出發前誤判為今天。</NoticeBox>
      </div>
    );
  }

  if (status.phase === "after") {
    return (
      <div className="page-enter">
        <PageHeader eyebrow="COMFORT CHECK" title="今日舒適度" description="依照天氣、步行量、室內比例與休息點，快速判斷今天怎麼走。" />
        <NoticeBox tone="plain" title="旅程已結束">
          福岡旅程已結束，今日決策不再更新。可以回到 <Link href="/itinerary">完整行程</Link> 查看紀錄。
        </NoticeBox>
      </div>
    );
  }

  const day = itinerary[status.day - 1];
  const forecast = weather.status === "success" ? weather.data.daily.find((item) => item.date === status.activeDate) : undefined;
  const report = buildComfortReport(day, forecast, weather.status === "success" ? weather.data.stale : false);
  const isPreview = status.phase === "before";
  const weatherFallback = weather.status === "error" || !forecast;

  return (
    <div className="comfort-page page-enter">
      <PageHeader eyebrow="COMFORT CHECK" title="今日舒適度" description="依照天氣、步行量、室內比例與休息點，快速判斷今天怎麼走。" />

      {isPreview && <NoticeBox title="出發前預覽">目前尚未出發，這裡先用 DAY 1 行程做舒適度預覽，不會誤判為真正的今天。</NoticeBox>}
      {weatherFallback && (
        <NoticeBox tone="blue" title="天氣資料待確認">
          目前可能離線、或旅行日期尚未進入預報範圍；先依行程的雨天備案、室內比例與休息點產生建議。
        </NoticeBox>
      )}
      {report.weatherStale && <NoticeBox tone="blue" title="使用上次天氣資料">天氣可能不是最新，出門前再確認一次降雨與高溫。</NoticeBox>}

      <section className={`comfort-decision-card decision-${report.decision}`} aria-label="今日建議">
        <div className="comfort-stamp">
          <span>{isPreview ? "DAY 1 PREVIEW" : `DAY ${day.day}`}</span>
          <strong>{formatTripDate(day.date)}</strong>
        </div>
        <div className="comfort-decision-copy">
          <span>今日建議</span>
          <h2>{report.label}</h2>
          <p>{report.reason}</p>
        </div>
        <div className="comfort-signals">
          {report.signals.map((signal) => (
            <div className={signal.tone ? `comfort-signal ${signal.tone}` : "comfort-signal"} key={signal.label}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
            </div>
          ))}
        </div>
        <aside className="comfort-mom-note">
          <span>媽媽友善提醒</span>
          <p>{day.momFriendlyNote}</p>
        </aside>
      </section>

      <section aria-labelledby="comfort-risks">
        <div className="section-header">
          <h2 id="comfort-risks">今日風險提示</h2>
          <span>{report.riskTips.length} 則</span>
        </div>
        <div className="comfort-note-list">
          {report.riskTips.map((tip) => (
            <p key={tip}>{tip}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="comfort-adjustments">
        <div className="section-header">
          <h2 id="comfort-adjustments">建議調整</h2>
          <span>{report.label}</span>
        </div>
        <div className="comfort-action-list">
          {report.adjustments.map((adjustment) => (
            <p key={adjustment}>{adjustment}</p>
          ))}
        </div>
      </section>

      <section className="comfort-paper-block" aria-labelledby="comfort-rain">
        <div className="section-header">
          <h2 id="comfort-rain">雨天備案</h2>
          <Link href="/map">查看地圖 →</Link>
        </div>
        <p>{report.rainNote || "待補雨天備案。"}</p>
      </section>

      <section className="comfort-paper-block" aria-labelledby="comfort-rest">
        <div className="section-header">
          <h2 id="comfort-rest">休息點</h2>
          <span>坐下 / 廁所 / 室內</span>
        </div>
        <div className="comfort-rest-list">
          {report.restStops.map((restStop) => (
            <span key={restStop}>{restStop}</span>
          ))}
        </div>
      </section>

      <section aria-labelledby="comfort-mom-check">
        <div className="section-header">
          <h2 id="comfort-mom-check">媽媽友善檢查</h2>
          <span>不儲存</span>
        </div>
        <div className="comfort-check-list">
          {report.momChecklist.map((item) => (
            <div className={item.ok ? "comfort-check ok" : "comfort-check watch"} key={item.label}>
              <b aria-hidden>{item.ok ? "✓" : "!"}</b>
              <div>
                <strong>{item.label}</strong>
                <p>{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

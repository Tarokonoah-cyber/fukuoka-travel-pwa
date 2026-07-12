import type { TripDay } from "@/types/trip";
import { formatTripDate } from "@/lib/date";
export function TodaySummaryCard({day}:{day:TripDay}){return <section className="today-summary">
  <div className="date-stamp"><span>DAY {day.day}</span><strong>{formatTripDate(day.date)}</strong></div>
  <div className="today-copy"><span className="eyebrow">今日重點</span><h2>{day.highlight}</h2><p>住宿｜{day.hotel}</p></div>
  <div className="metric-row"><span><small>步行量</small><strong>{day.walkingLevel}</strong></span><span><small>室內比例</small><strong>{day.indoorRatio}%</strong></span><span><small>休息點</small><strong>{day.restStops.length} 處</strong></span></div>
  <div className="summary-notes"><p><b>雨天備案</b>{day.rainPlan}</p><p><b>媽媽友善提醒</b>{day.momFriendlyNote}</p></div>
  </section>}

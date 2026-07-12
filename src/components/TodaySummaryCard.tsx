import type { TripDay } from "@/types/trip";
import { formatTripDate } from "@/lib/date";
export function TodaySummaryCard({day,mode="today"}:{day:TripDay;mode?:"today"|"preview"}){return <section className="today-summary">
  <div className="date-stamp"><span>{mode==="preview"?"PREVIEW ":""}DAY {String(day.day).padStart(2,"0")}</span><strong>{formatTripDate(day.date)}</strong></div>
  <div className="today-copy"><span>{mode==="preview"?"預覽主題":"今日主題"}</span><h2>{day.highlight}</h2></div>
  <div className="today-stay"><span>STAY</span><strong>{day.hotel}</strong></div>
  </section>}

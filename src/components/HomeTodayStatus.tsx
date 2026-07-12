"use client";
import { itinerary } from "@/data/itinerary";
import { useTripStatus } from "@/lib/useTripStatus";
export function HomeTodayStatus(){const status=useTripStatus();const day=itinerary[status.day-1];return <section className="home-today">
  <div className="home-today-head"><span>{status.phase==="before"?"FIRST DAY PREVIEW":status.phase==="after"?"TRIP ARCHIVE":`DAY ${day.day} · TODAY`}</span><strong>今日重點</strong></div>
  <h2>{day.highlight}</h2>
  <div className="home-today-tags"><span>步行 {day.walkingLevel}</span><span>室內 {day.indoorRatio}%</span><span>雨備已記</span></div>
  <p><b>雨天</b>{day.rainPlan}</p>
  </section>}

"use client";
import { itinerary } from "@/data/itinerary";
import { useTripStatus } from "@/lib/useTripStatus";
export function HomeTodayStatus(){const status=useTripStatus();if(status.phase==="loading")return <section className="home-today home-today-loading"><div className="home-today-head"><span>DATE CHECK</span><strong>日期確認中</strong></div><h2>正在以台北時間確認旅程狀態</h2><p>載入後會顯示出發前預覽或真正的今日重點。</p></section>;const day=itinerary[status.day-1];return <section className="home-today">
  <div className="home-today-head"><span>{status.phase==="before"?"FIRST DAY PREVIEW":status.phase==="after"?"TRIP ARCHIVE":`DAY ${day.day} · TODAY`}</span><strong>{status.phase==="before"?"出發前預覽":"今日重點"}</strong></div>
  <h2>{day.highlight}</h2>
  <div className="home-today-tags"><span>步行 {day.walkingLevel}</span><span>室內 {day.indoorRatio}%</span><span>雨備已記</span></div>
  <p><b>雨天</b>{day.rainPlan}</p>
  </section>}

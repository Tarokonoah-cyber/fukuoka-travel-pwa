"use client";
import { itinerary } from "@/data/itinerary";
import { useTripStatus } from "@/lib/useTripStatus";
import { TodaySummaryCard } from "./TodaySummaryCard";
export function HomeTodayStatus(){const status=useTripStatus();return <section className="home-today"><div className="section-header"><h2>今日狀態</h2><span>{status.phase==="before"?"出發前預覽":status.phase==="after"?"旅程回顧":"旅行中"}</span></div><TodaySummaryCard day={itinerary[status.day-1]}/></section>}

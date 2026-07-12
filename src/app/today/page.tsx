"use client";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TodaySummaryCard } from "@/components/TodaySummaryCard";
import { DayTimeline } from "@/components/DayTimeline";
import { NoticeBox } from "@/components/NoticeBox";
import { TodayToolsSummary } from "@/components/TodayToolsSummary";
import { itinerary } from "@/data/itinerary";
import { useTripStatus } from "@/lib/useTripStatus";

export default function TodayPage(){
  const status=useTripStatus();
  if(status.phase==="pending")return <div className="page-enter"><PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅行中最常看的這一頁"/><NoticeBox tone="blue" title="日期確認中">正在以台北時間確認今日旅程狀態。</NoticeBox></div>;
  if(status.phase==="after")return <div className="page-enter"><PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅行中最常看的這一頁"/><NoticeBox title="旅程已結束" tone="plain">辛苦了，完整的五天行程仍可隨時查看。 <Link href="/itinerary">前往全部行程 →</Link></NoticeBox></div>;
  const day=itinerary[status.day-1];
  const nextTransport=day.items.find(item=>item.type==="交通")??day.items[0];
  return <div className="page-enter"><PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅行中最常看的這一頁"/>
    {status.phase==="before"&&<NoticeBox title="出發前預覽">旅程尚未開始。先預覽 DAY 1，出發後才會切換成真正的今日行程。</NoticeBox>}
    <TodaySummaryCard day={day} mode={status.phase==="before"?"preview":"today"}/>
    <section className="today-quick-grid" aria-label="今日快速摘要">
      <div><span>下一段交通</span><strong>{nextTransport.time} · {nextTransport.title}</strong><p>{nextTransport.location}</p></div>
      <div><span>雨天備案</span><p>{day.rainPlan}</p></div>
      <div><span>休息點</span><p>{day.restStops.join(" · ")}</p></div>
    </section>
    <aside className="today-memo"><span>媽媽友善 MEMO</span><p>{day.momFriendlyNote}</p><div><b>步行 {day.walkingLevel}</b><b>室內 {day.indoorRatio}%</b></div></aside>
    <TodayToolsSummary phase={status.phase} activeDate={status.activeDate}/>
    <Link className="map-entry-link" href="/map"><span>旅程點位</span><strong>查看旅程地圖</strong><b aria-hidden>→</b></Link>
    <section><div className="section-header"><h2>{day.title}</h2><span>{day.items.length} 段安排</span></div><DayTimeline day={day}/></section>
  </div>;
}

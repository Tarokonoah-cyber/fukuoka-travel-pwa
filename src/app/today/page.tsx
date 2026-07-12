"use client";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TodaySummaryCard } from "@/components/TodaySummaryCard";
import { DayTimeline } from "@/components/DayTimeline";
import { NoticeBox } from "@/components/NoticeBox";
import { itinerary } from "@/data/itinerary";
import { useTripStatus } from "@/lib/useTripStatus";

export default function TodayPage(){
  const status=useTripStatus();
  if(status.phase==="loading")return <div className="page-enter"><PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅行中最常看的這一頁"/><NoticeBox tone="blue" title="正在確認日期">正在以台北時間確認今日旅程狀態。</NoticeBox></div>;
  const day=itinerary[status.day-1];
  const nextTransport=day.items.find(item=>item.type==="交通")??day.items[0];
  return <div className="page-enter"><PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅行中最常看的這一頁"/>
    {status.phase==="before"&&<NoticeBox title="還沒出發">先預覽第一天。出發後，這裡會自動切換成當天行程。</NoticeBox>}
    {status.phase==="after"&&<NoticeBox title="旅程已結束" tone="plain">辛苦了，完整的五天行程仍可隨時查看。 <Link href="/itinerary">前往全部行程 →</Link></NoticeBox>}
    <TodaySummaryCard day={day}/>
    <section className="today-quick-grid" aria-label="今日快速摘要">
      <div><span>下一段交通</span><strong>{nextTransport.time} · {nextTransport.title}</strong><p>{nextTransport.location}</p></div>
      <div><span>雨天備案</span><p>{day.rainPlan}</p></div>
      <div><span>休息點</span><p>{day.restStops.join(" · ")}</p></div>
    </section>
    <aside className="today-memo"><span>媽媽友善 MEMO</span><p>{day.momFriendlyNote}</p><div><b>步行 {day.walkingLevel}</b><b>室內 {day.indoorRatio}%</b></div></aside>
    <Link className="map-entry-link" href="/map"><span>旅程點位</span><strong>查看旅程地圖</strong><b aria-hidden>→</b></Link>
    <section><div className="section-header"><h2>{day.title}</h2><span>{day.items.length} 段安排</span></div><DayTimeline day={day}/></section>
  </div>;
}

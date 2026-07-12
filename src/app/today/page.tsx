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
  const day=itinerary[status.day-1];
  return <div className="page-enter"><PageHeader eyebrow="QUICK VIEW" title="今日行程" description="旅行中最常看的這一頁"/>
    {status.phase==="before"&&<NoticeBox title="還沒出發">先預覽第一天。出發後，這裡會自動切換成當天行程。</NoticeBox>}
    {status.phase==="after"&&<NoticeBox title="旅程已結束" tone="plain">辛苦了，完整的五天行程仍可隨時查看。 <Link href="/itinerary">前往全部行程 →</Link></NoticeBox>}
    <TodaySummaryCard day={day}/><div className="rest-strip"><b>可休息點</b><span>{day.restStops.join(" · ")}</span></div>
    <section><div className="section-header"><h2>{day.title}</h2><span>{day.items.length} 段安排</span></div><DayTimeline day={day}/></section>
  </div>;
}

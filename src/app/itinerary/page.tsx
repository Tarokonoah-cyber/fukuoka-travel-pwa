"use client";
import { PageHeader } from "@/components/PageHeader";
import { DayTimeline } from "@/components/DayTimeline";
import { itinerary } from "@/data/itinerary";
import { formatTripDate } from "@/lib/date";
import { useTripStatus } from "@/lib/useTripStatus";

export default function ItineraryPage(){const status=useTripStatus();return <div className="page-enter"><PageHeader eyebrow="5 DAYS / 4 NIGHTS" title="全部行程" description="每天留一點空白，走累了就休息。"/>
  <div className="day-jump" aria-label="快速跳到日期">{itinerary.map(d=><a href={`#day-${d.day}`} key={d.day}><small>DAY {d.day}</small>{d.date.slice(5).replace("-","/")}</a>)}</div>
  <div className="all-days">{itinerary.map(day=><section id={`day-${day.day}`} key={day.day} className={status.phase==="active"&&status.day===day.day?"day-section current":"day-section"}>
    <header className="day-heading"><div><span>DAY {day.day} · {formatTripDate(day.date)}</span><h2>{day.title}</h2></div>{status.phase==="active"&&status.day===day.day&&<b>今天</b>}</header>
    <div className="hotel-band"><span>今晚住宿</span><strong>{day.hotel}</strong></div>
    <div className="day-brief"><span>步行量 <b>{day.walkingLevel}</b></span><span>室內 <b>{day.indoorRatio}%</b></span><span>休息點 <b>{day.restStops.length}</b></span></div>
    <p className="mom-note"><b>媽媽友善提醒</b>{day.momFriendlyNote}</p><DayTimeline day={day}/>
  </section>)}</div></div>}

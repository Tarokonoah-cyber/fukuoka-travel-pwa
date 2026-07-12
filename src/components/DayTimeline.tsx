import type { TripDay } from "@/types/trip";
import { TimelineItemCard } from "./TimelineItemCard";
export function DayTimeline({day}:{day:TripDay}){return <div className="timeline">{day.items.map(item=><TimelineItemCard key={item.id} item={item}/>)}</div>}

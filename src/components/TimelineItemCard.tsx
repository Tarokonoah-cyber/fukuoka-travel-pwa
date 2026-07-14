import type { TimelineItem } from "@/types/trip";
export function TimelineItemCard({item}:{item:TimelineItem}){return <article className="timeline-item">
  <div className="timeline-time">{item.time}</div><div className="timeline-dot" />
  <div className="timeline-card"><div className="timeline-title"><h3>{item.title}</h3><span>{item.type}</span></div><p className="location">{item.location}</p><p>{item.note}</p>
  <div className="mini-tags"><span>步行 {item.walkingLevel}</span><span>{item.environment}</span></div>
  <a className="timeline-map-link" href={item.mapHref} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
  <details><summary>休息與備案</summary><p><b>休息點：</b>{item.restStops}</p><p><b>媽媽提醒：</b>{item.momFriendlyNote}</p><p><b>高溫時：</b>{item.heatPlan}</p><p><b>下雨時：</b>{item.rainPlan}</p></details></div>
  </article>}

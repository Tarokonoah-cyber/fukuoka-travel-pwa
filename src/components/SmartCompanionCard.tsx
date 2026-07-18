"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildCompanionSnapshot, requestTravelPosition, TravelLocationError } from "@/lib/smartCompanion";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps";
import { useWeather } from "@/lib/useWeather";
import type { ResolvedDayPlanItem } from "@/lib/dayPlan";
import type { CompanionRiskLevel, TravelPosition } from "@/types/companion";
import type { TripDay } from "@/types/trip";

const riskLabels: Record<CompanionRiskLevel, string> = {
  safe: "節奏正常",
  watch: "注意時間",
  urgent: "時間緊迫",
  overdue: "立即處理",
};

const locationErrors: Record<TravelLocationError["code"], string> = {
  unsupported: "這個瀏覽器不支援定位，時間提醒仍可正常使用。",
  denied: "定位權限未開啟；可以到瀏覽器設定允許後再試一次。",
  unavailable: "目前無法取得位置，請到較開闊處後再試一次。",
  timeout: "定位逾時，請確認定位功能已開啟後再試一次。",
};

function formatDistance(distanceKm: number) {
  if (distanceKm < 0.01) return "少於 10 公尺";
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000 / 10) * 10} 公尺` : `${distanceKm.toFixed(1)} 公里`;
}

export function SmartCompanionCard({
  day,
  items,
  tokyoTime,
  compact = false,
  onComplete,
  onRevealAdjustments,
}: {
  day: TripDay;
  items: ResolvedDayPlanItem[];
  tokyoTime: string;
  compact?: boolean;
  onComplete: (item: ResolvedDayPlanItem) => void;
  onRevealAdjustments: (itemIds: string[]) => void;
}) {
  const weather = useWeather();
  const [position, setPosition] = useState<TravelPosition | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("位置只會留在這個畫面，不會上傳或儲存。");
  const forecast = weather.status === "success" ? weather.data.daily.find((entry) => entry.date === day.date) : undefined;
  const snapshot = useMemo(() => buildCompanionSnapshot({ day, items, tokyoTime, weather: forecast, position }), [day, forecast, items, position, tokyoTime]);
  const current = snapshot.current;
  const targetWalkingUrl = snapshot.distanceTarget ? getGoogleMapsDirectionsUrl(snapshot.distanceTarget, "walking") : null;
  const targetTaxiUrl = snapshot.distanceTarget ? getGoogleMapsDirectionsUrl(snapshot.distanceTarget, "driving") : null;

  async function locate() {
    setLocationStatus("loading");
    setLocationMessage("正在取得這支手機目前的位置…");
    try {
      const nextPosition = await requestTravelPosition(typeof navigator === "undefined" ? null : navigator.geolocation);
      setPosition(nextPosition);
      setLocationStatus("success");
      setLocationMessage("位置已更新；只用來計算這個畫面的約略直線距離。");
    } catch (error) {
      const code = error instanceof TravelLocationError ? error.code : "unavailable";
      setPosition(null);
      setLocationStatus("error");
      setLocationMessage(locationErrors[code]);
    }
  }

  if (compact) {
    return <div className={`smart-companion smart-companion-compact risk-${snapshot.riskLevel}`}>
      <div className="smart-companion-top"><span>SMART COMPANION · DAY {day.day}</span><b>{riskLabels[snapshot.riskLevel]}</b></div>
      <div className="smart-companion-now">
        <span>NOW · 現在</span>
        <h2>{snapshot.current?.title ?? "今天的行程已完成"}</h2>
        <p>{snapshot.current ? `${snapshot.current.time} · ${snapshot.current.location}` : "辛苦了，接下來舒服回飯店休息。"}</p>
        {current && <div className="smart-companion-actions"><button type="button" onClick={() => onComplete(current)}>完成這站</button>{targetWalkingUrl && <a href={targetWalkingUrl} target="_blank" rel="noopener noreferrer">開始導航 ↗</a>}</div>}
      </div>
      {snapshot.next && <div className="smart-companion-next"><span>NEXT</span><strong>{snapshot.next.time} · {snapshot.next.title}</strong></div>}
      {snapshot.upcomingFixed && snapshot.riskMinutes !== null && snapshot.riskMinutes <= 90 && <div className="smart-companion-mini-alert" role="status"><span>{snapshot.riskMinutes > 0 ? `${snapshot.riskMinutes} 分鐘後` : "時間已到"}</span><strong>{snapshot.upcomingFixed.title}</strong></div>}
    </div>;
  }

  return <div className={`smart-companion risk-${snapshot.riskLevel}`} aria-labelledby="smart-companion-title">
    <div className="smart-companion-top"><span>SMART COMPANION · DAY {day.day}</span><b>{riskLabels[snapshot.riskLevel]}</b><strong>福岡時間 {tokyoTime}</strong></div>
    <div className="smart-companion-radar">
      <div className="smart-companion-now"><span id="smart-companion-title">NOW · 現在</span><h2>{snapshot.current?.title ?? "今天的行程已完成"}</h2><p>{snapshot.current ? `${snapshot.current.time} · ${snapshot.current.location}` : "可以回飯店休息，或新增一個臨時安排。"}</p></div>
      {snapshot.next && <div className="smart-companion-next"><span>NEXT · 下一站</span><strong>{snapshot.next.time} · {snapshot.next.title}</strong><p>{snapshot.next.location}</p></div>}
      {snapshot.upcomingFixed && <div className="smart-companion-fixed" role="status" aria-live="polite"><span>FIXED · 固定活動</span><strong>{snapshot.upcomingFixed.startTime} · {snapshot.upcomingFixed.title}</strong><b>{snapshot.riskMinutes !== null && snapshot.riskMinutes > 0 ? `還有 ${snapshot.riskMinutes} 分鐘` : "時間已到或已超過"}</b></div>}
    </div>

    <div className="smart-companion-advice" aria-label="智慧建議">
      {snapshot.advice.map((advice) => <article key={advice.id} className={`tone-${advice.tone}`}><span>{advice.id === "schedule" ? "TIME" : "COMFORT"}</span><strong>{advice.title}</strong><p>{advice.detail}</p></article>)}
    </div>

    <div className="smart-companion-actions">
      {current && <button type="button" onClick={() => onComplete(current)}>完成目前行程</button>}
      {targetWalkingUrl && <a href={targetWalkingUrl} target="_blank" rel="noopener noreferrer">步行導航 ↗</a>}
      {targetTaxiUrl && <a className="quiet" href={targetTaxiUrl} target="_blank" rel="noopener noreferrer">計程車路線 ↗</a>}
      {current?.placeId && <Link className="quiet" href={{ pathname: "/map", query: { place: current.placeId, scope: "today" } }}>旅程地圖</Link>}
      {snapshot.adjustableItems.length > 0 && <button type="button" className="quiet" onClick={() => onRevealAdjustments(snapshot.adjustableItems.map((item) => item.id))}>查看可調整行程（{snapshot.adjustableItems.length}）</button>}
    </div>

    <section className="smart-companion-location" aria-labelledby="location-title">
      <div><span>LOCATION · 按需定位</span><h3 id="location-title">距離與附近室內休息</h3></div>
      <button type="button" disabled={locationStatus === "loading"} onClick={() => void locate()}>{locationStatus === "loading" ? "定位中…" : position ? "更新我的位置" : "取得我的位置"}</button>
      <p className={`location-status status-${locationStatus}`} role="status">{locationMessage}</p>
      {position && <div className="smart-companion-distance">
        {snapshot.distanceTarget && snapshot.distanceToTargetKm !== null && <article><span>目前目標 · 約略直線距離</span><strong>{snapshot.distanceTarget.name}</strong><b>{formatDistance(snapshot.distanceToTargetKm)}</b></article>}
        {snapshot.nearbyPlaces.length > 0 && <div className="nearby-place-list"><span>最近的室內休息點 · 約略直線距離</span>{snapshot.nearbyPlaces.map((entry) => <article key={entry.place.id}><div><strong>{entry.place.name}</strong><small>{formatDistance(entry.distanceKm)} · {entry.place.area}</small></div><div><a href={entry.walkingUrl} target="_blank" rel="noopener noreferrer">步行</a><a href={entry.taxiUrl} target="_blank" rel="noopener noreferrer">計程車</a></div></article>)}</div>}
      </div>}
    </section>
  </div>;
}

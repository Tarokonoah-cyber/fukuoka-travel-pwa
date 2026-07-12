"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { EmptyState } from "./EmptyState";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { placeCategoryLabels, places } from "@/data/places";
import { getGoogleMapsUrl } from "@/lib/maps";
import { useTripStatus } from "@/lib/useTripStatus";
import type { PlaceCategory } from "@/types/place";

const DynamicTripMap = dynamic(() => import("./TripMap").then((module) => module.TripMap), {
  ssr: false,
  loading: () => <div className="map-loading" role="status"><span />正在載入旅程地圖…</div>,
});

const filters: Array<{ value: "all" | PlaceCategory; label: string }> = [
  { value: "all", label: "全部" },
  ...Object.entries(placeCategoryLabels).map(([value, label]) => ({ value: value as PlaceCategory, label })),
];

export function MapPageClient() {
  const status = useTripStatus();
  const [category, setCategory] = useState<"all" | PlaceCategory>("all");
  const filteredPlaces = useMemo(() => category === "all" ? places : places.filter((place) => place.category === category), [category]);
  const activeCount = places.filter((place) => place.day === status.activeDate).length;
  const statusLabel = status.phase === "loading" ? "正在以台北時間確認日期" : status.phase === "before" ? `出發前預覽 · DAY 1 有 ${activeCount} 個相關點位` : status.phase === "during" ? `今天是 DAY ${status.day} · ${activeCount} 個相關點位` : "旅程已結束 · 地圖保留完整點位";

  return <>
    <div className="map-day-note"><span>DATE NOTE</span><strong>{statusLabel}</strong></div>
    {filteredPlaces.length ? <MapErrorBoundary key={category}><DynamicTripMap places={filteredPlaces} /></MapErrorBoundary> : <EmptyState>這個分類目前沒有點位</EmptyState>}
    <div className="map-filters" role="group" aria-label="地圖分類篩選">{filters.map((filter) => <button key={filter.value} type="button" className={category === filter.value ? "active" : ""} aria-pressed={category === filter.value} onClick={() => setCategory(filter.value)}>{filter.label}</button>)}</div>
    <section className="map-place-list" aria-labelledby="map-list-title"><div className="section-header"><h2 id="map-list-title">{category === "all" ? "全部點位" : placeCategoryLabels[category]}</h2><span>{filteredPlaces.length} 個</span></div>{filteredPlaces.map((place) => <article className="map-place-row" key={place.id}><div><span>{placeCategoryLabels[place.category]} · {place.area}</span><h3>{place.name}</h3>{place.note&&<p>{place.note}</p>}</div><a href={getGoogleMapsUrl(place)} target="_blank" rel="noopener noreferrer" aria-label={`在 Google Maps 開啟 ${place.name}`}>導航 ↗</a></article>)}</section>
  </>;
}

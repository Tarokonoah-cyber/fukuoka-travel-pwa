"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { placeCategoryLabels, places } from "@/data/places";
import { defaultMapScope, filterMapPlaces, type MapScope } from "@/lib/experience";
import { getGoogleMapsUrl } from "@/lib/maps";
import { useTripStatus } from "@/lib/useTripStatus";
import type { PlaceCategory } from "@/types/place";
import { EmptyState } from "./EmptyState";
import { MapErrorBoundary } from "./MapErrorBoundary";

const DynamicTripMap = dynamic(() => import("./TripMap").then((module) => module.TripMap), {
  ssr: false,
  loading: () => <div className="map-loading" role="status"><span />正在載入旅程地圖…</div>,
});

const filters: Array<{ value: "all" | PlaceCategory; label: string }> = [
  { value: "all", label: "全部" },
  ...Object.entries(placeCategoryLabels).map(([value, label]) => ({ value: value as PlaceCategory, label })),
];
const scopes: Array<{ value: MapScope; label: string }> = [
  { value: "destination", label: "目的地" },
  { value: "today", label: "今日" },
  { value: "all", label: "全部" },
];

function isMapScope(value: string | null): value is MapScope {
  return value === "destination" || value === "today" || value === "all";
}

export function MapPageClient() {
  const searchParams = useSearchParams();
  const status = useTripStatus();
  const explicitScope = searchParams.get("scope");
  const [scopeOverride, setScopeOverride] = useState<MapScope | null>(() => isMapScope(explicitScope) ? explicitScope : null);
  const scope = scopeOverride ?? defaultMapScope(status.phase);
  const [category, setCategory] = useState<"all" | PlaceCategory>("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(() => searchParams.get("place"));

  const filteredPlaces = useMemo(() => filterMapPlaces(places, scope, status.activeDate, category), [category, scope, status.activeDate]);
  const activeCount = places.filter((place) => place.day === status.activeDate).length;
  const effectiveSelectedPlaceId = selectedPlaceId && filteredPlaces.some((place) => place.id === selectedPlaceId) ? selectedPlaceId : null;

  const statusLabel = status.phase === "pending" ? "正在以福岡時間確認日期" : status.phase === "before" ? `出發前預覽 · 先看日本目的地` : status.phase === "active" ? `今天是 DAY ${status.day} · ${activeCount} 個相關點位` : "旅程已結束 · 保留完整點位";
  const listTitle = scope === "destination" ? "日本目的地" : scope === "today" ? "今日點位" : "全部點位";

  function chooseScope(nextScope: MapScope) {
    setScopeOverride(nextScope);
    setSelectedPlaceId(null);
  }

  function focusPlace(placeId: string) {
    setSelectedPlaceId(placeId);
    document.getElementById("trip-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <>
    <div className="map-day-note"><span>DATE NOTE</span><strong>{statusLabel}</strong></div>
    <div className="map-scope-switch" role="group" aria-label="地圖範圍">{scopes.map((option) => <button key={option.value} type="button" className={scope === option.value ? "active" : ""} aria-pressed={scope === option.value} onClick={() => chooseScope(option.value)}>{option.label}</button>)}</div>
    <div id="trip-map" className="map-scroll-target">
      {filteredPlaces.length ? <MapErrorBoundary key={`${scope}-${category}`}><DynamicTripMap places={filteredPlaces} selectedPlaceId={effectiveSelectedPlaceId} onSelectPlace={setSelectedPlaceId} /></MapErrorBoundary> : <EmptyState>這個範圍目前沒有點位</EmptyState>}
    </div>
    <div className="map-filters" role="group" aria-label="地圖分類篩選">{filters.map((filter) => <button key={filter.value} type="button" className={category === filter.value ? "active" : ""} aria-pressed={category === filter.value} onClick={() => { setCategory(filter.value); setSelectedPlaceId(null); }}>{filter.label}</button>)}</div>
    <section className="map-place-list" aria-labelledby="map-list-title"><div className="section-header"><h2 id="map-list-title">{category === "all" ? listTitle : placeCategoryLabels[category]}</h2><span>{filteredPlaces.length} 個</span></div>{filteredPlaces.map((place) => <article className={effectiveSelectedPlaceId === place.id ? "map-place-row selected" : "map-place-row"} key={place.id}>
      <div className="map-place-main"><span>{placeCategoryLabels[place.category]} · {place.area}</span><h3>{place.name}</h3></div>
      <div className="map-place-actions"><button type="button" onClick={() => focusPlace(place.id)}>地圖查看</button><a href={getGoogleMapsUrl(place)} target="_blank" rel="noopener noreferrer" aria-label={`在 Google Maps 開啟 ${place.name}`}>導航 ↗</a></div>
      {(place.note || place.momFriendlyNote) && <details><summary>查看備註</summary>{place.note && <p>{place.note}</p>}{place.momFriendlyNote && <p><b>媽媽友善：</b>{place.momFriendlyNote}</p>}</details>}
    </article>)}</section>
  </>;
}

"use client";

import { useMemo, useRef, useState } from "react";
import { FoodCandidateCard } from "@/components/FoodCandidateCard";
import { FoodCandidateForm } from "@/components/FoodCandidateForm";
import { useFoodCandidates } from "@/components/FoodProvider";
import { PageHeader } from "@/components/PageHeader";
import { useTravelSync } from "@/components/TravelSyncProvider";
import { itinerary } from "@/data/itinerary";
import {
  countActiveFoodFilters,
  emptyFoodFilters,
  filterFoodCandidates,
  foodCategoryLabels,
  foodMomLabels,
  foodPriorityLabels,
  foodQueueLabels,
  foodReservationLabels,
  sortFoodCandidates,
} from "@/lib/food";
import { useTripStatus } from "@/lib/useTripStatus";
import {
  foodAreas,
  foodCategories,
  foodMomStatuses,
  foodPriorities,
  foodQueueLevels,
  foodReservationStatuses,
  type FoodCandidate,
  type FoodFilters,
  type FoodSortOption,
} from "@/types/food";

export function FoodPageClient() {
  const food = useFoodCandidates();
  const travel = useTravelSync();
  const tripStatus = useTripStatus();
  const [filters, setFilters] = useState<FoodFilters>(emptyFoodFilters);
  const [sort, setSort] = useState<FoodSortOption>("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<FoodCandidate | "new" | null>(null);
  const formAnchor = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => sortFoodCandidates(filterFoodCandidates(food.items, filters), sort), [filters, food.items, sort]);
  const activeFilterCount = countActiveFoodFilters(filters);
  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.keyword.trim()) labels.push(`關鍵字：${filters.keyword.trim()}`);
    if (filters.priority !== "active") labels.push(`優先度：${foodPriorityLabels[filters.priority]}`);
    if (filters.category !== "all") labels.push(`料理：${foodCategoryLabels[filters.category]}`);
    if (filters.area !== "all") labels.push(`區域：${filters.area}`);
    if (filters.motherFriendly !== "all") labels.push(`媽媽：${foodMomLabels[filters.motherFriendly]}`);
    if (filters.reservation !== "all") labels.push(`訂位：${foodReservationLabels[filters.reservation]}`);
    if (filters.queueLevel !== "all") labels.push(`候位：${foodQueueLabels[filters.queueLevel]}`);
    if (filters.visited !== "all") labels.push(filters.visited === "visited" ? "已吃" : "還沒吃");
    return labels;
  }, [filters]);
  const activeDate = tripStatus.activeDate;
  const canAddToToday = tripStatus.phase !== "pending" && tripStatus.phase !== "after";
  const todayItems = useMemo(() => travel.dayItems.filter((item) => item.date === activeDate), [activeDate, travel.dayItems]);
  const addedFoodIds = useMemo(() => new Set(todayItems.flatMap((item) => {
    const match = item.custom?.note.match(/\[food:([^\]]+)\]/);
    return match ? [match[1]] : [];
  })), [todayItems]);

  function updateFilter<K extends keyof FoodFilters>(key: K, value: FoodFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function openForm(candidate: FoodCandidate | "new") {
    setEditing(candidate);
    window.setTimeout(() => formAnchor.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function saveCandidate(candidate: FoodCandidate) {
    food.saveCandidate(candidate);
    setEditing(null);
  }

  function addToToday(candidate: FoodCandidate) {
    const day = itinerary.find((item) => item.date === activeDate) ?? itinerary[0];
    const sortOrder = Math.max(day.items.length * 100, ...todayItems.map((item) => item.sortOrder), 0) + 100;
    travel.addDayPlanItem(activeDate, {
      title: candidate.name,
      timeLabel: candidate.suitableTime[0] || "彈性美食",
      startTime: null,
      location: candidate.name,
      note: `[food:${candidate.id}] ${candidate.description}`,
    }, sortOrder);
  }

  const summary = {
    active: food.items.filter((item) => item.priority !== "removed").length,
    must: food.items.filter((item) => item.priority === "must").length,
    visited: food.items.filter((item) => item.visited).length,
  };

  return (
    <div className="food-page page-enter">
      <PageHeader eyebrow="FOOD SHORTLIST" title="美食候選清單" description="先收藏、到附近再決定；所有店家資訊仍以出發前與當日公告為準。" />

      <section className="food-overview" aria-label="美食清單摘要">
        <div><span>候選</span><strong>{summary.active}</strong></div>
        <div><span>必吃</span><strong>{summary.must}</strong></div>
        <div><span>已吃</span><strong>{summary.visited}</strong></div>
        <button type="button" onClick={() => openForm("new")}>＋ 新增候選</button>
      </section>

      <div className={`food-sync-note status-${food.status}`} role="status">
        <span>{food.status === "synced" ? "已與兩支手機同步" : food.status === "pending" ? `同步中 · ${food.pendingCount} 筆待送` : food.status === "offline" ? "離線中 · 變更已留在手機" : food.status === "error" ? food.error : "目前保存在這支手機；登入旅行 PIN 後會同步"}</span>
        {(food.status === "offline" || food.status === "error") && <button type="button" onClick={() => void food.syncNow()}>重試</button>}
      </div>
      {food.conflictMessage && <p className="food-conflict-note">{food.conflictMessage}</p>}

      <div ref={formAnchor}>{editing && <FoodCandidateForm key={editing === "new" ? "new" : editing.id} candidate={editing === "new" ? null : editing} onSave={saveCandidate} onCancel={() => setEditing(null)} />}</div>

      <section className="food-tools" aria-label="搜尋、篩選與排序">
        <label className="food-search"><span>搜尋店名、區域或備註</span><input type="search" value={filters.keyword} placeholder="例如：博多、烏龍麵" onChange={(event) => updateFilter("keyword", event.target.value)} /></label>
        <div className="food-tools-row">
          <button type="button" aria-expanded={filtersOpen} aria-controls="food-filter-panel" onClick={() => setFiltersOpen((open) => !open)}>篩選{activeFilterCount ? `（${activeFilterCount}）` : ""}</button>
          <label><span>排序</span><select value={sort} onChange={(event) => setSort(event.target.value as FoodSortOption)}><option value="default">優先度・區域・店名</option><option value="area">區域</option><option value="category">餐點類型</option><option value="queue">排隊程度</option><option value="mom">媽媽友善程度</option><option value="created">最近新增</option><option value="name">店名</option><option value="visited">未吃／已吃</option></select></label>
        </div>
        {filtersOpen && <div id="food-filter-panel" className="food-filter-panel">
          <label><span>優先度</span><select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value as FoodFilters["priority"])}><option value="active">使用中（不含已淘汰）</option>{foodPriorities.map((item) => <option key={item} value={item}>{foodPriorityLabels[item]}</option>)}</select></label>
          <label><span>料理類型</span><select value={filters.category} onChange={(event) => updateFilter("category", event.target.value as FoodFilters["category"])}><option value="all">全部</option>{foodCategories.map((item) => <option key={item} value={item}>{foodCategoryLabels[item]}</option>)}</select></label>
          <label><span>區域</span><select value={filters.area} onChange={(event) => updateFilter("area", event.target.value as FoodFilters["area"])}><option value="all">全部</option>{foodAreas.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>媽媽友善</span><select value={filters.motherFriendly} onChange={(event) => updateFilter("motherFriendly", event.target.value as FoodFilters["motherFriendly"])}><option value="all">全部</option>{foodMomStatuses.map((item) => <option key={item} value={item}>{foodMomLabels[item]}</option>)}</select></label>
          <label><span>訂位</span><select value={filters.reservation} onChange={(event) => updateFilter("reservation", event.target.value as FoodFilters["reservation"])}><option value="all">全部</option>{foodReservationStatuses.map((item) => <option key={item} value={item}>{foodReservationLabels[item]}</option>)}</select></label>
          <label><span>候位</span><select value={filters.queueLevel} onChange={(event) => updateFilter("queueLevel", event.target.value as FoodFilters["queueLevel"])}><option value="all">全部</option>{foodQueueLevels.map((item) => <option key={item} value={item}>{foodQueueLabels[item]}</option>)}</select></label>
          <label><span>造訪狀態</span><select value={filters.visited} onChange={(event) => updateFilter("visited", event.target.value as FoodFilters["visited"])}><option value="all">全部</option><option value="unvisited">還沒吃</option><option value="visited">已吃</option></select></label>
        </div>}
        {activeFilterCount > 0 && <div className="food-active-filters"><div><strong>已套用 {activeFilterCount} 個條件</strong><div className="food-filter-chips">{activeFilterLabels.map((label) => <span key={label}>{label}</span>)}</div></div><button type="button" onClick={() => setFilters(emptyFoodFilters)}>清除全部</button></div>}
      </section>

      <div className="food-results-heading"><span>RESULTS</span><strong>{filtered.length} 家</strong></div>
      {filtered.length ? <div className="food-card-grid">{filtered.map((item) => <FoodCandidateCard
        key={item.id}
        item={item}
        activeDate={activeDate}
        canAddToToday={canAddToToday}
        addedToToday={addedFoodIds.has(item.id)}
        onEdit={() => openForm(item)}
        onSave={food.saveCandidate}
        onAddToToday={() => addToToday(item)}
      />)}</div> : <div className="food-empty"><strong>找不到符合條件的候選</strong><p>清除部分篩選，或新增一個新的美食選項。</p><button type="button" onClick={() => setFilters(emptyFoodFilters)}>清除全部篩選</button></div>}
    </div>
  );
}

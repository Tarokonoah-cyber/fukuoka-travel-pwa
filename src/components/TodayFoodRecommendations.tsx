"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useFoodCandidates } from "@/components/FoodProvider";
import { useTravelSync } from "@/components/TravelSyncProvider";
import { itinerary } from "@/data/itinerary";
import { buildTodayFoodRecommendations, foodCategoryLabels, foodPriorityLabels } from "@/lib/food";

export function TodayFoodRecommendations({ activeDate }: { activeDate: string }) {
  const food = useFoodCandidates();
  const travel = useTravelSync();
  const groups = useMemo(() => buildTodayFoodRecommendations(food.items, activeDate), [activeDate, food.items]);
  const dayItems = useMemo(() => travel.dayItems.filter((item) => item.date === activeDate), [activeDate, travel.dayItems]);
  const addedIds = useMemo(() => new Set(dayItems.flatMap((item) => {
    const match = item.custom?.note.match(/\[food:([^\]]+)\]/);
    return match ? [match[1]] : [];
  })), [dayItems]);
  const day = itinerary.find((item) => item.date === activeDate) ?? itinerary[0];

  function addToToday(item: (typeof food.items)[number]) {
    const sortOrder = Math.max(day.items.length * 100, ...dayItems.map((state) => state.sortOrder), 0) + 100;
    travel.addDayPlanItem(activeDate, {
      title: item.name,
      timeLabel: item.suitableTime[0] || "彈性美食",
      startTime: null,
      location: item.name,
      note: `[food:${item.id}] ${item.description}`,
    }, sortOrder);
  }

  return (
    <section className="today-food" aria-labelledby="today-food-title">
      <div className="today-food-heading"><div><span>FOOD SHORTLIST</span><h2 id="today-food-title">今天附近吃什麼</h2></div><Link href="/food">完整清單 →</Link></div>
      <div className="today-food-groups">{groups.map((group) => <div key={group.id} className="today-food-group"><h3>{group.label}</h3>{group.items.map((item) => <article key={item.id}>
        <div><span>{foodPriorityLabels[item.priority]} · {item.area}</span><strong>{item.name}</strong><p>{item.category.map((category) => foodCategoryLabels[category]).join("／")} · {item.suitableTime[0] || "彈性"}</p></div>
        <div><a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer">地圖 ↗</a><button type="button" disabled={addedIds.has(item.id)} onClick={() => addToToday(item)}>{addedIds.has(item.id) ? "已加入" : "加入今天"}</button></div>
      </article>)}{group.items.length === 0 && <p className="today-food-empty">今天沒有對應候選</p>}</div>)}</div>
    </section>
  );
}

import type { PrepCategory, PrepFilter, PrepItem, PrepPriority } from "@/types/prep";

export const prepPriorityLabels: Record<PrepPriority, string> = {
  critical: "必補",
  important: "重要",
  nice_to_have: "可再補",
};

export const prepPriorityDescriptions: Record<PrepPriority, string> = {
  critical: "出發前建議優先確認，會影響航班、交通或球賽安排。",
  important: "補齊後旅途中會更順，尤其是雨天與媽媽友善動線。",
  nice_to_have: "有空再整理，讓行程更舒服但不影響基本出發。",
};

export const prepCategoryLabels: Record<PrepCategory, string> = {
  flight: "航班",
  hotel: "住宿",
  baseball: "棒球",
  transport: "交通",
  map: "地圖",
  budget: "預算",
  shopping: "購物",
  restaurant: "餐廳",
  packing: "行李",
  other: "其他",
};

export const prepCategoryOrder: PrepCategory[] = [
  "flight",
  "hotel",
  "baseball",
  "transport",
  "map",
  "budget",
  "shopping",
  "restaurant",
  "packing",
  "other",
];

const priorityOrder: PrepPriority[] = ["critical", "important", "nice_to_have"];

export function filterPrepItems(items: PrepItem[], filter: PrepFilter) {
  if (filter === "all") return items;
  return items.filter((item) => item.category === filter);
}

export function groupPrepItemsByPriority(items: PrepItem[]) {
  return priorityOrder.map((priority) => ({
    priority,
    label: prepPriorityLabels[priority],
    description: prepPriorityDescriptions[priority],
    items: items.filter((item) => item.priority === priority),
  }));
}

export function getPrepCategories(items: PrepItem[]) {
  const present = new Set(items.map((item) => item.category));
  return prepCategoryOrder.filter((category) => present.has(category));
}

export function getPrepSummary(items: PrepItem[], checkedIds: Set<string>) {
  const total = items.length;
  const done = items.filter((item) => checkedIds.has(item.id)).length;
  const remaining = total - done;
  const countOpen = (priority: PrepPriority) =>
    items.filter((item) => item.priority === priority && !checkedIds.has(item.id)).length;

  return {
    total,
    done,
    remaining,
    percent: total ? Math.round((done / total) * 100) : 0,
    openCritical: countOpen("critical"),
    openImportant: countOpen("important"),
    openNiceToHave: countOpen("nice_to_have"),
  };
}

export function getCategoryCompletion(items: PrepItem[], checkedIds: Set<string>, category: PrepCategory) {
  const categoryItems = items.filter((item) => item.category === category);
  const done = categoryItems.filter((item) => checkedIds.has(item.id)).length;
  return { total: categoryItems.length, done };
}

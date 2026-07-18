import { foodCandidateSchema } from "@/lib/foodSchema";
import type {
  FoodCandidate,
  FoodFilters,
  FoodPriority,
  FoodRecommendationGroup,
  FoodSortOption,
} from "@/types/food";

export const emptyFoodFilters: FoodFilters = {
  keyword: "",
  priority: "active",
  category: "all",
  area: "all",
  motherFriendly: "all",
  reservation: "all",
  queueLevel: "all",
  visited: "all",
};

export const foodPriorityLabels: Record<FoodPriority, string> = {
  must: "必吃",
  nearby: "順路可吃",
  backup: "備選",
  removed: "已淘汰",
};

export const foodCategoryLabels = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  ramen: "拉麵",
  udon: "烏龍麵",
  yakiniku: "燒肉",
  hotpot: "鍋物",
  seafood: "海鮮",
  izakaya: "居酒屋",
  unagi: "鰻魚",
  wagyu: "和牛／赤牛",
  cafe: "咖啡",
  dessert: "甜點",
  "street-food": "路邊小吃",
  "late-night": "宵夜",
  souvenir: "伴手禮",
  other: "其他",
} as const;

export const foodReservationLabels = {
  required: "必須預約",
  available: "可預約",
  not_available: "不可預約／現場候位",
  unknown: "預約待確認",
} as const;

export const foodQueueLabels = {
  low: "排隊低",
  medium: "排隊中",
  high: "排隊高",
  unknown: "候位待確認",
} as const;

export const foodMomLabels = {
  good: "媽媽友善",
  normal: "媽媽友善：普通",
  poor: "媽媽友善：不友善",
} as const;

const priorityRank: Record<FoodPriority, number> = { must: 0, nearby: 1, backup: 2, removed: 3 };
const queueRank = { low: 0, medium: 1, high: 2, unknown: 3 } as const;
const momRank = { good: 0, normal: 1, poor: 2 } as const;

export function parseFoodCandidates(value: unknown): FoodCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = foodCandidateSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function mergeFoodCandidates(...collections: FoodCandidate[][]) {
  const byId = new Map<string, FoodCandidate>();
  for (const collection of collections) {
    for (const item of collection) {
      const current = byId.get(item.id);
      if (!current || item.updatedAt > current.updatedAt) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

export function filterFoodCandidates(items: FoodCandidate[], filters: FoodFilters) {
  const keyword = filters.keyword.trim().toLocaleLowerCase("zh-Hant");
  return items.filter((item) => {
    if (filters.priority === "active" ? item.priority === "removed" : item.priority !== filters.priority) return false;
    if (filters.category !== "all" && !item.category.includes(filters.category)) return false;
    if (filters.area !== "all" && item.area !== filters.area) return false;
    if (filters.motherFriendly !== "all" && item.motherFriendly !== filters.motherFriendly) return false;
    if (filters.reservation !== "all" && item.reservation !== filters.reservation) return false;
    if (filters.queueLevel !== "all" && item.queueLevel !== filters.queueLevel) return false;
    if (filters.visited === "visited" && !item.visited) return false;
    if (filters.visited === "unvisited" && item.visited) return false;
    if (!keyword) return true;
    return [item.name, item.japaneseName, item.description, item.area, item.motherFriendlyNote, item.transportNote, item.notes, ...item.recommendedItems]
      .some((field) => field.toLocaleLowerCase("zh-Hant").includes(keyword));
  });
}

export function sortFoodCandidates(items: FoodCandidate[], sort: FoodSortOption) {
  return [...items].sort((left, right) => {
    if (sort === "created") return right.createdAt.localeCompare(left.createdAt) || left.name.localeCompare(right.name, "zh-Hant");
    if (sort === "name") return left.name.localeCompare(right.name, "zh-Hant");
    if (sort === "area") return left.area.localeCompare(right.area, "zh-Hant") || left.name.localeCompare(right.name, "zh-Hant");
    if (sort === "category") return foodCategoryLabels[left.category[0]].localeCompare(foodCategoryLabels[right.category[0]], "zh-Hant") || left.name.localeCompare(right.name, "zh-Hant");
    if (sort === "queue") return queueRank[left.queueLevel] - queueRank[right.queueLevel] || left.name.localeCompare(right.name, "zh-Hant");
    if (sort === "mom") return momRank[left.motherFriendly] - momRank[right.motherFriendly] || left.name.localeCompare(right.name, "zh-Hant");
    if (sort === "visited") return Number(left.visited) - Number(right.visited) || priorityRank[left.priority] - priorityRank[right.priority] || left.name.localeCompare(right.name, "zh-Hant");
    return priorityRank[left.priority] - priorityRank[right.priority]
      || left.area.localeCompare(right.area, "zh-Hant")
      || left.name.localeCompare(right.name, "zh-Hant");
  });
}

export function countActiveFoodFilters(filters: FoodFilters) {
  return Number(Boolean(filters.keyword.trim()))
    + Number(filters.priority !== "active")
    + Number(filters.category !== "all")
    + Number(filters.area !== "all")
    + Number(filters.motherFriendly !== "all")
    + Number(filters.reservation !== "all")
    + Number(filters.queueLevel !== "all")
    + Number(filters.visited !== "all");
}

export function buildTodayFoodRecommendations(items: FoodCandidate[], date: string): FoodRecommendationGroup[] {
  const eligible = sortFoodCandidates(items.filter((item) => (
    item.priority !== "removed" && !item.visited && item.relatedDay.includes(date)
  )), "default");
  const used = new Set<string>();
  const take = (predicate: (item: FoodCandidate) => boolean, limit: number) => {
    const picked: FoodCandidate[] = [];
    for (const item of eligible) {
      if (used.has(item.id) || !predicate(item)) continue;
      used.add(item.id);
      picked.push(item);
      if (picked.length === limit) break;
    }
    return picked;
  };

  const groups: FoodRecommendationGroup[] = [
    { id: "must", label: "今天附近必吃", items: take((item) => item.priority === "must" || item.priority === "nearby", 2) },
    { id: "backup", label: "臨時備案", items: take((item) => item.priority === "backup" && item.reservation !== "required" && (item.queueLevel === "low" || item.queueLevel === "medium") && (item.motherFriendly === "good" || item.motherFriendly === "normal"), 2) },
    { id: "snack", label: "下午點心", items: take((item) => item.category.includes("cafe") || item.category.includes("dessert") || item.category.includes("street-food"), 2) },
  ];
  return groups;
}

export function foodMapsDirectionUrl(item: Pick<FoodCandidate, "name">, mode: "walking" | "driving" = "walking") {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.name)}&travelmode=${mode}`;
}

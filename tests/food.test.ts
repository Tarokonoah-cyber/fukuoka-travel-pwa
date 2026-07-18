import { describe, expect, it } from "vitest";
import { foodCandidatesSeed } from "@/data/food";
import {
  buildTodayFoodRecommendations,
  emptyFoodFilters,
  filterFoodCandidates,
  mergeFoodCandidates,
  parseFoodCandidates,
  sortFoodCandidates,
} from "@/lib/food";
import { foodCandidateSchema } from "@/lib/foodSchema";
import { foodAreas, foodCategories, foodSortOptions } from "@/types/food";

describe("美食候選純函式", () => {
  it("8 筆示範資料都符合完整 schema，且未虛構營業時間", () => {
    expect(foodCandidatesSeed).toHaveLength(8);
    for (const item of foodCandidatesSeed) {
      expect(foodCandidateSchema.safeParse(item).success, item.name).toBe(true);
      expect(item.openingHours).toContain("待確認");
    }
    const areas = new Set(foodCandidatesSeed.map((item) => item.area));
    for (const area of ["博多站", "天神", "中洲／川端", "太宰府", "熊本"] as const) expect(areas.has(area)).toBe(true);
    expect(foodCategories).toEqual(expect.arrayContaining(["breakfast", "lunch", "dinner", "ramen", "udon", "yakiniku", "hotpot", "seafood", "izakaya", "cafe", "dessert", "street-food", "late-night", "souvenir", "other"]));
    expect(foodAreas).toEqual(expect.arrayContaining(["祇園／櫛田神社", "大濠公園", "唐人町／福岡巨蛋", "福岡機場"]));
  });

  it("會忽略損壞的離線資料，保留有效候選", () => {
    expect(parseFoodCandidates([foodCandidatesSeed[0], { id: "broken" }])).toEqual([foodCandidatesSeed[0]]);
    expect(parseFoodCandidates(null)).toEqual([]);
  });

  it("關鍵字、區域、類型、媽媽友善與未造訪可組合篩選", () => {
    const result = filterFoodCandidates(foodCandidatesSeed, {
      ...emptyFoodFilters,
      keyword: "參道",
      area: "太宰府",
      category: "dessert",
      motherFriendly: "good",
      visited: "unvisited",
    });
    expect(result.map((item) => item.id)).toEqual(["food-kasanoya"]);
  });

  it("預設不顯示已淘汰，明確切換後才顯示", () => {
    const removed = { ...foodCandidatesSeed[0], id: "removed", priority: "removed" as const };
    expect(filterFoodCandidates([...foodCandidatesSeed, removed], emptyFoodFilters)).not.toContainEqual(removed);
    expect(filterFoodCandidates([...foodCandidatesSeed, removed], { ...emptyFoodFilters, priority: "removed" })).toEqual([removed]);
  });

  it("預設依優先度、區域、店名排序，並支援全部排序選項", () => {
    const sorted = sortFoodCandidates(foodCandidatesSeed, "default");
    const mustCount = foodCandidatesSeed.filter((item) => item.priority === "must").length;
    expect(sorted.slice(0, mustCount).every((item) => item.priority === "must")).toBe(true);
    expect(sorted[mustCount].priority).not.toBe("must");
    const newer = { ...foodCandidatesSeed[0], id: "newer", createdAt: "2026-07-19T00:00:00.000Z", updatedAt: "2026-07-19T00:00:00.000Z" };
    expect(sortFoodCandidates([...foodCandidatesSeed, newer], "created")[0].id).toBe("newer");
    for (const option of foodSortOptions) expect(sortFoodCandidates(foodCandidatesSeed, option)).toHaveLength(foodCandidatesSeed.length);
  });

  it("今日三組推薦只取關聯日期、排除已吃與已淘汰，每組最多 2 家", () => {
    const items = foodCandidatesSeed.map((item) => item.id === "food-kasanoya" ? { ...item, visited: true, visitedAt: "2026-08-03", rating: 5 } : item);
    const groups = buildTodayFoodRecommendations(items, "2026-08-03");
    const recommendations = groups.flatMap((group) => group.items);
    expect(groups.map((group) => group.id)).toEqual(["must", "backup", "snack"]);
    expect(groups.every((group) => group.items.length <= 2)).toBe(true);
    expect(recommendations.every((item) => item.relatedDay.includes("2026-08-03") && !item.visited && item.priority !== "removed")).toBe(true);
    expect(recommendations.map((item) => item.id)).not.toContain("food-kasanoya");
    expect(groups.find((group) => group.id === "backup")?.items.every((item) => item.reservation !== "required" && ["low", "medium"].includes(item.queueLevel) && ["good", "normal"].includes(item.motherFriendly))).toBe(true);
  });

  it("合併兩支手機快照時保留 updatedAt 較新的版本", () => {
    const oldItem = foodCandidatesSeed[0];
    const newItem = { ...oldItem, description: "另一支手機的新內容", updatedAt: "2026-07-19T00:00:00.000Z" };
    expect(mergeFoodCandidates([oldItem], [newItem])).toEqual([newItem]);
  });
});

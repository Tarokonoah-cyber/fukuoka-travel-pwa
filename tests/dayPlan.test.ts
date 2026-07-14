import { describe, expect, it } from "vitest";
import { getNowNextItems, minutesUntil, resolveDayPlanItems } from "@/lib/dayPlan";
import type { TimelineItem } from "@/types/trip";
import type { DayPlanItemState } from "@/types/dayPlan";

const base = (id: string, title: string, startTime?: string): TimelineItem => ({
  id, title, time: startTime ?? "彈性", startTime, fixedTime: Boolean(startTime), location: title,
  type: "景點", note: "", walkingLevel: "低", environment: "室內", momFriendlyNote: "", rainPlan: "", restStops: "",
});

describe("Now / Next control", () => {
  it("手動進行中的項目優先於時間推進", () => {
    const states: DayPlanItemState[] = [{ date: "2026-08-05", itemId: "rest", status: "active", sortOrder: 200, isCustom: false, custom: null, updatedAt: "2026-07-13T00:00:00.000Z" }];
    const items = resolveDayPlanItems([base("shop", "購物", "10:00"), base("rest", "休息"), base("game", "球賽", "18:00")], states);
    const result = getNowNextItems(items, "18:10");
    expect(result.current?.id).toBe("rest");
    expect(result.next?.id).toBe("game");
  });

  it("沒有手動項目時採用最近已到時間的固定事件", () => {
    const items = resolveDayPlanItems([base("airport", "機場", "09:00"), base("flight", "航班", "14:15")], []);
    expect(getNowNextItems(items, "14:20").current?.id).toBe("flight");
    expect(minutesUntil("18:00", "16:35")).toBe(85);
  });

  it("完成與跳過的項目不會再成為 Now / Next", () => {
    const states: DayPlanItemState[] = [
      { date: "2026-08-05", itemId: "a", status: "completed", sortOrder: 100, isCustom: false, custom: null, updatedAt: "2026-07-13T00:00:00.000Z" },
      { date: "2026-08-05", itemId: "b", status: "skipped", sortOrder: 200, isCustom: false, custom: null, updatedAt: "2026-07-13T00:00:00.000Z" },
    ];
    expect(getNowNextItems(resolveDayPlanItems([base("a", "A"), base("b", "B")], states), "12:00").current).toBeNull();
  });
});

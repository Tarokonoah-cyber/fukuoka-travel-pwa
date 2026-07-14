import type { TimelineItem } from "@/types/trip";
import type { DayPlanItemState, DayPlanStatus } from "@/types/dayPlan";

export type ResolvedDayPlanItem = TimelineItem & {
  status: DayPlanStatus;
  sortOrder: number;
  isCustom: boolean;
  updatedAt: string | null;
};

const itineraryPlaceIds: Record<string, string> = {
  "d1-tpe-flight": "taoyuan-airport",
  "d1-arrive-fuk": "fukuoka-airport",
  "d1-hotel": "croom-hakata",
  "d1-hakata-evening": "hakata-shopping",
  "d2-dazaifu": "dazaifu",
  "d2-transfer-yanagawa": "yanagawa-station",
  "d2-yanagawa-boat": "yanagawa-boat-pier",
  "d2-yanagawa-walk": "yanagawa-okinohata",
  "d3-shinkansen": "kumamoto-station",
  "d4-tenjin-underground": "tenjin-underground",
  "d4-rest": "croom-hakata",
  "d4-dome-transfer": "paypay-dome",
  "d4-game": "paypay-dome",
  "d5-checkout": "croom-hakata",
  "d5-airport": "fukuoka-airport",
  "d5-flight-home": "fukuoka-airport",
};

export function resolveDayPlanItems(baseItems: TimelineItem[], stateItems: DayPlanItemState[]) {
  const stateById = new Map(stateItems.map((item) => [item.itemId, item]));
  const resolved: ResolvedDayPlanItem[] = baseItems.map((item, index) => {
    const state = stateById.get(item.id);
    return {
      ...item,
      placeId: item.placeId ?? itineraryPlaceIds[item.id],
      status: state?.status ?? "pending",
      sortOrder: state?.sortOrder ?? (index + 1) * 100,
      isCustom: false,
      updatedAt: state?.updatedAt ?? null,
    };
  });

  for (const state of stateItems) {
    if (!state.isCustom || !state.custom) continue;
    resolved.push({
      id: state.itemId,
      time: state.custom.timeLabel || "彈性",
      startTime: state.custom.startTime ?? undefined,
      fixedTime: Boolean(state.custom.startTime),
      title: state.custom.title,
      location: state.custom.location,
      type: "休息",
      note: state.custom.note,
      walkingLevel: "低",
      environment: "室內／室外",
      momFriendlyNote: "依當下體力彈性安排。",
      heatPlan: "高溫時縮短停留，優先進入室內。",
      rainPlan: "可視天氣延後、跳過或改為室內行程。",
      restStops: state.custom.location || "就近找座位休息",
      mapHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(state.custom.location)}`,
      status: state.status,
      sortOrder: state.sortOrder,
      isCustom: true,
      updatedAt: state.updatedAt,
    });
  }

  return resolved.sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
}

export function getNowNextItems(items: ResolvedDayPlanItem[], tokyoTime: string) {
  const pending = items.filter((item) => item.status === "pending" || item.status === "active");
  const manualActive = pending.find((item) => item.status === "active");
  const dueFixed = [...pending]
    .filter((item) => item.fixedTime && item.startTime && item.startTime <= tokyoTime)
    .sort((left, right) => (right.startTime ?? "").localeCompare(left.startTime ?? ""))[0];
  const current = manualActive ?? dueFixed ?? pending[0] ?? null;
  const currentIndex = current ? pending.findIndex((item) => item.id === current.id) : -1;
  const next = pending.find((item, index) => index > currentIndex && item.id !== current?.id) ?? null;
  const upcomingFixed = pending
    .filter((item) => item.fixedTime && item.startTime && item.startTime > tokyoTime)
    .sort((left, right) => (left.startTime ?? "").localeCompare(right.startTime ?? ""))[0] ?? null;
  return { current, next, upcomingFixed };
}

export function minutesUntil(time: string, tokyoTime: string) {
  const [targetHour, targetMinute] = time.split(":").map(Number);
  const [hour, minute] = tokyoTime.split(":").map(Number);
  return targetHour * 60 + targetMinute - (hour * 60 + minute);
}

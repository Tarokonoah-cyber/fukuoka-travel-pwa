import { places as defaultPlaces } from "@/data/places";
import { buildComfortReport } from "@/lib/comfort";
import { getNowNextItems, minutesUntil, type ResolvedDayPlanItem } from "@/lib/dayPlan";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps";
import type { CompanionAdvice, CompanionRiskLevel, CompanionSnapshot, NearbyPlace, TravelPosition } from "@/types/companion";
import type { Place } from "@/types/place";
import type { TripDay } from "@/types/trip";
import type { DailyWeather } from "@/types/weather";

const EARTH_RADIUS_KM = 6371;
const indoorRestCategories = new Set<Place["category"]>(["hotel", "rest", "shopping", "restaurant"]);

export type TravelLocationErrorCode = "unsupported" | "denied" | "unavailable" | "timeout";

export class TravelLocationError extends Error {
  constructor(public code: TravelLocationErrorCode) {
    super(code);
  }
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}

export function haversineDistanceKm(from: TravelPosition, to: Pick<Place, "latitude" | "longitude">) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function requestTravelPosition(geolocation?: Pick<Geolocation, "getCurrentPosition"> | null) {
  if (!geolocation) return Promise.reject(new TravelLocationError("unsupported"));
  return new Promise<TravelPosition>((resolve, reject) => {
    geolocation.getCurrentPosition(
      (result) => resolve({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        timestamp: result.timestamp,
      }),
      (error) => {
        const code: TravelLocationErrorCode = error.code === 1 ? "denied" : error.code === 3 ? "timeout" : "unavailable";
        reject(new TravelLocationError(code));
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 },
    );
  });
}

export function findNearbyIndoorPlaces(position: TravelPosition, activeDate: string, sourcePlaces: Place[] = defaultPlaces, limit = 2): NearbyPlace[] {
  return sourcePlaces
    .filter((place) => place.journeySide === "destination"
      && place.indoor
      && indoorRestCategories.has(place.category)
      && (place.day === activeDate || place.category === "hotel"))
    .map((place) => ({
      place,
      distanceKm: haversineDistanceKm(position, place),
      walkingUrl: getGoogleMapsDirectionsUrl(place, "walking"),
      taxiUrl: getGoogleMapsDirectionsUrl(place, "driving"),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm || left.place.name.localeCompare(right.place.name))
    .slice(0, limit);
}

function unresolved(items: ResolvedDayPlanItem[]) {
  return items.filter((item) => item.status === "pending" || item.status === "active");
}

function findFixedTarget(items: ResolvedDayPlanItem[], tokyoTime: string) {
  const fixedItems = unresolved(items)
    .filter((item) => item.fixedTime && item.startTime)
    .map((item) => ({ item, minutes: minutesUntil(item.startTime!, tokyoTime) }));
  return fixedItems.sort((left, right) => {
    const distance = Math.abs(left.minutes) - Math.abs(right.minutes);
    return distance || left.minutes - right.minutes;
  })[0] ?? null;
}

function getRiskLevel(minutes: number | null, adjustableCount: number): CompanionRiskLevel {
  if (minutes === null || minutes > 90) return "safe";
  if (minutes <= 20) return "overdue";
  if (minutes <= 45) return "urgent";
  if (adjustableCount > 0) return "watch";
  return "safe";
}

function scheduleAdvice(level: CompanionRiskLevel, minutes: number | null, target: ResolvedDayPlanItem | null, adjustableCount: number): CompanionAdvice {
  if (!target || minutes === null) {
    return { id: "schedule", tone: "plain", title: "節奏正常", detail: "目前沒有逼近的固定活動，照現在的順序前進即可。" };
  }
  if (level === "overdue") {
    return minutes < 0
      ? { id: "schedule", tone: "urgent", title: "固定行程時間已到", detail: `${target.title} 已超過 ${Math.abs(minutes)} 分鐘，請先確認是否直接前往。` }
      : { id: "schedule", tone: "urgent", title: "先處理固定行程", detail: `${target.title} 只剩 ${minutes} 分鐘，建議直接前往或立即調整前面的安排。` };
  }
  if (level === "urgent") {
    return { id: "schedule", tone: "urgent", title: "時間開始緊迫", detail: `${target.title} 還有 ${minutes} 分鐘；固定活動前仍有 ${adjustableCount} 站可以檢視。` };
  }
  if (level === "watch") {
    return { id: "schedule", tone: "watch", title: "留意下一個固定時間", detail: `${target.title} 還有 ${minutes} 分鐘，前面仍有 ${adjustableCount} 站尚未完成。` };
  }
  return { id: "schedule", tone: "plain", title: "節奏正常", detail: `${target.title} 還有 ${minutes} 分鐘，目前不需要調整。` };
}

function weatherAdvice(day: TripDay, weather?: DailyWeather): CompanionAdvice | null {
  const comfort = buildComfortReport(day, weather);
  if (comfort.decision === "go_as_planned") return null;
  const urgent = comfort.decision === "shorten_day" || comfort.decision === "rest_first";
  return { id: "weather", tone: urgent ? "urgent" : "watch", title: comfort.label, detail: comfort.reason };
}

export function buildCompanionSnapshot({
  day,
  items,
  tokyoTime,
  weather,
  position,
  sourcePlaces = defaultPlaces,
}: {
  day: TripDay;
  items: ResolvedDayPlanItem[];
  tokyoTime: string;
  weather?: DailyWeather;
  position?: TravelPosition | null;
  sourcePlaces?: Place[];
}): CompanionSnapshot {
  const nowNext = getNowNextItems(items, tokyoTime);
  const fixedTarget = findFixedTarget(items, tokyoTime);
  const upcomingFixed = fixedTarget?.item ?? null;
  const adjustableItems = upcomingFixed
    ? unresolved(items).filter((item) => !item.fixedTime && item.sortOrder < upcomingFixed.sortOrder)
    : [];
  const riskMinutes = fixedTarget?.minutes ?? null;
  const riskLevel = getRiskLevel(riskMinutes, adjustableItems.length);
  const targetItem = nowNext.current?.status === "active" ? nowNext.next ?? nowNext.current : nowNext.current ?? nowNext.next;
  const distanceTarget = targetItem?.placeId ? sourcePlaces.find((place) => place.id === targetItem.placeId) ?? null : null;
  const distanceToTargetKm = position && distanceTarget ? haversineDistanceKm(position, distanceTarget) : null;
  const advice = [scheduleAdvice(riskLevel, riskMinutes, upcomingFixed, adjustableItems.length)];
  const comfortAdvice = weatherAdvice(day, weather);
  if (comfortAdvice) advice.push(comfortAdvice);

  return {
    current: nowNext.current,
    next: nowNext.next,
    upcomingFixed,
    riskLevel,
    riskMinutes,
    adjustableItems,
    advice,
    distanceTarget,
    distanceToTargetKm,
    nearbyPlaces: position ? findNearbyIndoorPlaces(position, day.date, sourcePlaces) : [],
  };
}

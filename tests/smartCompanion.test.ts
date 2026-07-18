import { describe, expect, it } from "vitest";
import { buildCompanionSnapshot, findNearbyIndoorPlaces, haversineDistanceKm, requestTravelPosition, TravelLocationError } from "@/lib/smartCompanion";
import { resolveDayPlanItems } from "@/lib/dayPlan";
import type { Place } from "@/types/place";
import type { TimelineItem, TripDay } from "@/types/trip";

const item = (id: string, startTime: string | undefined, fixedTime = false): TimelineItem => ({
  id, title: id, time: startTime ?? "彈性", startTime, fixedTime, placeId: id,
  location: id, type: "景點", note: "", walkingLevel: "低", environment: "室內",
  momFriendlyNote: "", heatPlan: "", rainPlan: "", restStops: "", mapHref: "https://www.google.com/maps",
});

const day: TripDay = {
  day: 4, date: "2026-08-05", weekday: "三", title: "測試", highlight: "測試",
  image: { src: "/test.webp", alt: "", caption: "", author: "", sourceHref: "", licenseName: "", licenseHref: "" },
  hotel: "飯店", walkingLevel: "低", indoorRatio: 80, restStops: ["飯店"], rainPlan: "室內", momFriendlyNote: "慢慢走",
  items: [],
};

const places: Place[] = [
  { id: "current", name: "目前目標", journeySide: "destination", category: "attraction", area: "福岡", latitude: 33.59, longitude: 130.4, day: day.date, indoor: false },
  { id: "cafe", name: "室內咖啡", journeySide: "destination", category: "restaurant", area: "福岡", latitude: 33.591, longitude: 130.4, day: day.date, indoor: true },
  { id: "hotel", name: "旅館", journeySide: "destination", category: "hotel", area: "福岡", latitude: 33.6, longitude: 130.4, day: "2026-08-02", indoor: true },
  { id: "other", name: "隔日百貨", journeySide: "destination", category: "shopping", area: "福岡", latitude: 33.5905, longitude: 130.4, day: "2026-08-04", indoor: true },
];

function snapshot(time: string, fixedTime: string, states: Parameters<typeof resolveDayPlanItems>[1] = [], position = false) {
  const items = resolveDayPlanItems([item("current", "12:00"), item("anchor", fixedTime, true)], states);
  return buildCompanionSnapshot({
    day: { ...day, items }, items, tokyoTime: time, sourcePlaces: places,
    position: position ? { latitude: 33.59, longitude: 130.4 } : null,
  });
}

describe("智慧旅伴", () => {
  it("使用 Haversine 計算約略直線距離", () => {
    expect(haversineDistanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111.2, 0);
  });

  it("只選當日室內休息點並永遠納入飯店", () => {
    const nearby = findNearbyIndoorPlaces({ latitude: 33.59, longitude: 130.4 }, day.date, places, 5);
    expect(nearby.map((entry) => entry.place.id)).toEqual(["cafe", "hotel"]);
    expect(nearby[0].walkingUrl).toContain("travelmode=walking");
    expect(nearby[0].taxiUrl).toContain("travelmode=driving");
  });

  it("依固定活動倒數產生四個風險層級", () => {
    expect(snapshot("12:00", "14:00").riskLevel).toBe("safe");
    expect(snapshot("12:45", "14:00").riskLevel).toBe("watch");
    expect(snapshot("13:20", "14:00").riskLevel).toBe("urgent");
    expect(snapshot("13:45", "14:00").riskLevel).toBe("overdue");
    expect(snapshot("14:05", "14:00").riskLevel).toBe("overdue");
  });

  it("完成或跳過的項目不列為可調整候選，固定活動也不列入", () => {
    const states = [
      { date: day.date, itemId: "current", status: "completed" as const, sortOrder: 100, isCustom: false, custom: null, updatedAt: "2026-07-13T00:00:00.000Z" },
    ];
    const result = snapshot("13:20", "14:00", states);
    expect(result.adjustableItems).toEqual([]);
    expect(result.upcomingFixed?.id).toBe("anchor");
  });

  it("沒有定位時維持時間建議並隱藏距離，定位後才提供附近點", () => {
    expect(snapshot("12:45", "14:00").distanceToTargetKm).toBeNull();
    expect(snapshot("12:45", "14:00").nearbyPlaces).toEqual([]);
    expect(snapshot("12:45", "14:00", [], true).nearbyPlaces).toHaveLength(2);
  });

  it("定位使用按需低耗電設定並回傳記憶體座標", async () => {
    let options: PositionOptions | undefined;
    const geolocation = {
      getCurrentPosition(success: PositionCallback, _error?: PositionErrorCallback | null, nextOptions?: PositionOptions) {
        options = nextOptions;
        success({ coords: { latitude: 33.59, longitude: 130.4, accuracy: 25 } as GeolocationCoordinates, timestamp: 123 } as GeolocationPosition);
      },
    };
    await expect(requestTravelPosition(geolocation)).resolves.toMatchObject({ latitude: 33.59, longitude: 130.4, accuracy: 25, timestamp: 123 });
    expect(options).toEqual({ enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 });
  });

  it("區分定位不支援、拒絕、不可用與逾時", async () => {
    await expect(requestTravelPosition(null)).rejects.toMatchObject({ code: "unsupported" });
    for (const [browserCode, expected] of [[1, "denied"], [2, "unavailable"], [3, "timeout"]] as const) {
      const geolocation = { getCurrentPosition(_success: PositionCallback, error?: PositionErrorCallback | null) { error?.({ code: browserCode } as GeolocationPositionError); } };
      await expect(requestTravelPosition(geolocation)).rejects.toEqual(new TravelLocationError(expected));
    }
  });
});

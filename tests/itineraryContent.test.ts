import { describe, expect, it } from "vitest";
import { itinerary, ITINERARY_DATA_VERSION } from "@/data/itinerary";
import { places } from "@/data/places";
import { prepItems } from "@/data/prep";
import { transportRoutes } from "@/data/transport";
import { getNowNextItems, resolveDayPlanItems } from "@/lib/dayPlan";
import type { DayPlanItemState } from "@/types/dayPlan";

describe("2026 正式行程內容", () => {
  it("五天主題與棒球日期正確", () => {
    expect(itinerary.map((day) => day.date)).toEqual(["2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"]);
    expect(itinerary[1].title).toBe("太宰府天滿宮・柳川水鄉");
    expect(itinerary[2].title).toBe("熊本城・熊本熊一日遊");
    expect(itinerary[3].title).toBe("博多舊市街・軟銀鷹棒球");
    expect(itinerary[2].items.some((item) => item.type === "棒球" || item.title.includes("軟銀"))).toBe(false);
  });

  it("8/5 官方球賽資訊完整", () => {
    const baseballDay = itinerary[3];
    const gate = baseballDay.items.find((item) => item.id === "v2-d4-gates");
    const game = baseballDay.items.find((item) => item.id === "v2-d4-game");
    expect(gate?.startTime).toBe("16:00");
    expect(game).toMatchObject({ startTime: "18:00", fixedTime: true });
    expect(game?.title).toContain("北海道日本火腿鬥士");
    expect(game?.note).toContain("不論勝負皆有煙火");
  });

  it("每個節點都有行動所需欄位與地圖", () => {
    for (const item of itinerary.flatMap((day) => day.items)) {
      expect(item.time).toBeTruthy();
      expect(item.location).toBeTruthy();
      expect(item.note).toBeTruthy();
      expect(item.restStops).toBeTruthy();
      expect(item.momFriendlyNote).toBeTruthy();
      expect(item.heatPlan).toBeTruthy();
      expect(item.rainPlan).toBeTruthy();
      expect(item.mapHref).toMatch(/^https:\/\/www\.google\.com\/maps\//);
    }
  });

  it("Now & Next 直接使用修正後的 8/5 資料", () => {
    const items = resolveDayPlanItems(itinerary[3].items, []);
    expect(getNowNextItems(items, "16:10").current?.id).toBe("v2-d4-gates");
    expect(getNowNextItems(items, "18:10").current?.id).toBe("v2-d4-game");
  });
});

describe("行程 v2 狀態相容", () => {
  it("忽略已不存在的舊固定 ID，但保留使用者臨時行程", () => {
    expect(ITINERARY_DATA_VERSION).toBe(2);
    const states: DayPlanItemState[] = [
      { date: "2026-08-05", itemId: "d4-game", status: "completed", sortOrder: 100, isCustom: false, custom: null, updatedAt: "2026-07-13T00:00:00.000Z" },
      { date: "2026-08-05", itemId: "custom-keep-me", status: "pending", sortOrder: 150, isCustom: true, custom: { title: "臨時休息", timeLabel: "下午", startTime: null, location: "飯店", note: "使用者建立" }, updatedAt: "2026-07-13T00:00:00.000Z" },
    ];
    const resolved = resolveDayPlanItems(itinerary[3].items, states);
    expect(resolved.some((item) => item.id === "d4-game")).toBe(false);
    expect(resolved.find((item) => item.id === "custom-keep-me")).toMatchObject({ isCustom: true, title: "臨時休息" });
    expect(resolved.find((item) => item.id === "v2-d4-game")?.status).toBe("pending");
  });
});

describe("地圖、交通與準備清單", () => {
  it("正式點位齊全、座標不重複且連結指向 Google Maps", () => {
    const required = [
      "croom-hakata", "fukuoka-airport-international", "jr-hakata-city", "kitte-hakata", "hakata-hankyu", "ooyama-kitte", "inaba-udon",
      "nishitetsu-tenjin", "dazaifu-station", "dazaifu-tenmangu", "kasanoya", "yanagawa-station", "wakamatsuya", "okinohata-short-boat", "ohana",
      "hakata-shinkansen", "kumamoto-station", "josai-en", "kumamoto-castle-south", "kumamoto-castle", "yokayoka", "kumamon-square", "tsuruya",
      "kushida-shrine", "hakata-machiya", "kawabata-arcade", "karonouron", "paypay-dome", "mark-is",
    ];
    expect(required.every((id) => places.some((place) => place.id === id))).toBe(true);
    const coordinates = places.map((place) => `${place.latitude.toFixed(6)},${place.longitude.toFixed(6)}`);
    expect(new Set(coordinates).size).toBe(coordinates.length);
    for (const place of places) {
      expect(Number.isFinite(place.latitude) && Number.isFinite(place.longitude)).toBe(true);
      expect(place.googleMapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps\//);
    }
  });

  it("交通頁只有指定十條完整路線，不承諾 2026 西鐵套票", () => {
    expect(transportRoutes).toHaveLength(10);
    for (const route of transportRoutes) {
      expect(route.duration).toBeTruthy();
      expect(route.transferCount).toBeTruthy();
      expect(route.momFriendlyNote).toBeTruthy();
      expect(route.rainPlan).toBeTruthy();
      expect(route.heatPlan).toBeTruthy();
    }
    const ticketText = transportRoutes.filter((route) => route.id.includes("dazaifu")).map((route) => route.note).join(" ");
    expect(ticketText).toContain("出發前再次確認西鐵當年度優惠票券");
    expect(ticketText).not.toMatch(/一定販售|保證販售/);
  });

  it("九項新行前確認均已加入", () => {
    const ids = new Set(prepItems.map((item) => item.id));
    expect([
      "v2-kumamoto-reserved-seats", "v2-wakamatsuya-call", "v2-yanagawa-operation-heat", "v2-baseball-qr",
      "v2-baseball-seat-gate", "v2-baseball-power-bank", "v2-summer-protection", "v2-mom-walking-shoes", "v2-return-three-hours",
    ].every((id) => ids.has(id))).toBe(true);
  });
});

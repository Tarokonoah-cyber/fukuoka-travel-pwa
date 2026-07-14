import { describe, expect, it } from "vitest";
import { defaultMapScope, filterChecklistItems, filterMapPlaces } from "@/lib/experience";
import type { Place } from "@/types/place";

const samplePlaces: Place[] = [
  { id: "tpe", name: "TPE", journeySide: "origin", category: "transport", area: "桃園", latitude: 0, longitude: 0, day: "2026-08-02" },
  { id: "fuk", name: "FUK", journeySide: "destination", category: "transport", area: "福岡", latitude: 1, longitude: 1, day: "2026-08-02" },
  { id: "dome", name: "Dome", journeySide: "destination", category: "baseball", area: "百道", latitude: 2, longitude: 2, day: "2026-08-05" },
];

describe("experience selectors", () => {
  it("chooses the map scope from the trip phase", () => {
    expect(defaultMapScope("before")).toBe("destination");
    expect(defaultMapScope("active")).toBe("today");
    expect(defaultMapScope("after")).toBe("all");
  });

  it("filters map places by scope, date, and category", () => {
    expect(filterMapPlaces(samplePlaces, "destination", "2026-08-02", "all").map((place) => place.id)).toEqual(["fuk", "dome"]);
    expect(filterMapPlaces(samplePlaces, "today", "2026-08-02", "transport").map((place) => place.id)).toEqual(["tpe", "fuk"]);
  });

  it("defaults long checklists to unfinished items", () => {
    const items = [
      { id: "passport", name: "護照", category: "證件", important: true },
      { id: "shirt", name: "上衣", category: "衣物" },
    ];
    const checked = new Set(["passport"]);
    expect(filterChecklistItems(items, checked, "incomplete", "all").map((item) => item.id)).toEqual(["shirt"]);
    expect(filterChecklistItems(items, checked, "important", "all").map((item) => item.id)).toEqual(["passport"]);
  });
});

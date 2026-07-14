import { describe, expect, it, vi } from "vitest";
import { getTokyoDateKey, getTripStatus, TRIP_TIME_ZONE } from "@/lib/date";
import { fetchFukuokaWeather } from "@/lib/weather";

describe("福岡／東京時區", () => {
  it("日本已過午夜而台灣仍是前一天時，切換到日本日期", () => {
    const instant = new Date("2026-08-01T15:00:00.000Z");
    expect(TRIP_TIME_ZONE).toBe("Asia/Tokyo");
    expect(getTokyoDateKey(instant)).toBe("2026-08-02");
    expect(getTripStatus(instant)).toMatchObject({ phase: "active", day: 1, activeDate: "2026-08-02" });
  });

  it("旅程最後一天依日本午夜切換", () => {
    const instant = new Date("2026-08-05T15:00:00.000Z");
    expect(getTokyoDateKey(instant)).toBe("2026-08-06");
    expect(getTripStatus(instant)).toMatchObject({ phase: "active", day: 5, activeDate: "2026-08-06" });
  });

  it("Open-Meteo 請求使用東京時區", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("seasonal-api")) return new Response(JSON.stringify({
        daily: {
          time: ["2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"],
          temperature_2m_max: [33, 33, 33, 33, 33], temperature_2m_min: [26, 26, 26, 26, 26],
          apparent_temperature_max: [37, 37, 37, 37, 37], precipitation_sum: [1, 0, 1, 0, 1],
        },
      }), { status: 200 });
      return new Response(JSON.stringify({
        current: { time: "2026-08-02T00:00", temperature_2m: 30, apparent_temperature: 32, weather_code: 0, wind_speed_10m: 5 },
        daily: {
          time: ["2026-08-02"], weather_code: [0], temperature_2m_max: [33], temperature_2m_min: [26],
          apparent_temperature_max: [36], precipitation_probability_max: [10], wind_speed_10m_max: [12],
        },
      }), { status: 200 });
    });
    try {
      const data = await fetchFukuokaWeather();
      const urls = fetchMock.mock.calls.map((call) => String(call[0]));
      expect(urls.every((url) => url.includes("timezone=Asia%2FTokyo"))).toBe(true);
      expect(urls.some((url) => url.includes("seasonal-api.open-meteo.com"))).toBe(true);
      expect(data.tripEstimates).toHaveLength(5);
      expect(data.tripEstimates[0]).toMatchObject({ date: "2026-08-02", source: "ecmwf-ec46", rainyMemberPercent: 100 });
    } finally {
      fetchMock.mockRestore();
    }
  });
});

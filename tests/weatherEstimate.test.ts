import { describe, expect, it } from "vitest";
import { buildJmaNormalEstimates, parseTripWeatherEstimates } from "@/lib/weather";

describe("旅行日長期天氣預估", () => {
  it("整合集合成員為溫度區間與有雨比例", () => {
    const [estimate] = parseTripWeatherEstimates({ daily: {
      time: ["2026-08-02"],
      temperature_2m_max: [31], temperature_2m_max_member01: [33], temperature_2m_max_member02: [35],
      temperature_2m_min: [24], temperature_2m_min_member01: [25], temperature_2m_min_member02: [26],
      apparent_temperature_max: [36], apparent_temperature_max_member01: [38], apparent_temperature_max_member02: [40],
      precipitation_sum: [0], precipitation_sum_member01: [2], precipitation_sum_member02: [4],
    } }, ["2026-08-02"]);

    expect(estimate).toMatchObject({
      date: "2026-08-02",
      maxTemperature: 33,
      minTemperature: 25,
      apparentTemperature: 38,
      rainyMemberPercent: 67,
      source: "ecmwf-ec46",
    });
    expect(estimate.maxTemperatureRange).toEqual([31, 35]);
  });

  it("EC46 無資料時可用 JMA 八月常態作明確標示的備援", () => {
    expect(buildJmaNormalEstimates(["2026-08-02"])[0]).toMatchObject({
      maxTemperature: 32.5,
      minTemperature: 25.4,
      rainyMemberPercent: null,
      source: "jma-normal",
    });
  });
});

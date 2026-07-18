import { itinerary } from "@/data/itinerary";
import type { DailyWeather, TripWeatherEstimate, WeatherData } from "@/types/weather";
import { WEATHER_CACHE_KEY } from "./storage";

export const FUKUOKA_LATITUDE = 33.5902;
export const FUKUOKA_LONGITUDE = 130.4017;
const WEATHER_CACHE_MS = 30 * 60 * 1000;

type OpenMeteoResponse = {
  current?: { time?: string; temperature_2m?: number; apparent_temperature?: number; weather_code?: number; wind_speed_10m?: number };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    apparent_temperature_max?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
};

type OpenMeteoSeasonalResponse = {
  daily?: Record<string, unknown> & { time?: string[] };
};

const JMA_AUGUST_NORMAL = { maxTemperature: 32.5, minTemperature: 25.4 };

function readWeatherCache() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) ?? "") as WeatherData;
    return value?.updatedAt && value.current && Array.isArray(value.daily) && Array.isArray(value.tripEstimates) ? value : null;
  } catch { return null; }
}

function saveWeatherCache(data: WeatherData) {
  if (typeof window !== "undefined") localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
}

function requiredNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Invalid weather field: ${field}`);
  return value;
}

function parseDaily(data: NonNullable<OpenMeteoResponse["daily"]>): DailyWeather[] {
  const dates = data.time ?? [];
  return dates.map((date, index) => ({
    date,
    weatherCode: requiredNumber(data.weather_code?.[index], "weather_code"),
    maxTemperature: requiredNumber(data.temperature_2m_max?.[index], "temperature_2m_max"),
    minTemperature: requiredNumber(data.temperature_2m_min?.[index], "temperature_2m_min"),
    maxApparentTemperature: requiredNumber(data.apparent_temperature_max?.[index], "apparent_temperature_max"),
    precipitationProbability: requiredNumber(data.precipitation_probability_max?.[index], "precipitation_probability_max"),
    maxWindSpeed: requiredNumber(data.wind_speed_10m_max?.[index], "wind_speed_10m_max"),
  }));
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], ratio: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)));
  return sorted[index];
}

function ensembleValues(daily: Record<string, unknown>, variable: string, index: number) {
  return Object.entries(daily).flatMap(([key, series]) => {
    if (key !== variable && !key.startsWith(`${variable}_member`)) return [];
    if (!Array.isArray(series)) return [];
    const value = series[index];
    return typeof value === "number" && Number.isFinite(value) ? [value] : [];
  });
}

export function buildJmaNormalEstimates(dates = itinerary.map((day) => day.date)): TripWeatherEstimate[] {
  return dates.map((date) => ({
    date,
    ...JMA_AUGUST_NORMAL,
    maxTemperatureRange: [31, 35],
    rainyMemberPercent: null,
    source: "jma-normal",
  }));
}

export function parseTripWeatherEstimates(payload: OpenMeteoSeasonalResponse, dates = itinerary.map((day) => day.date)): TripWeatherEstimate[] {
  const daily = payload.daily;
  const times = daily?.time;
  if (!daily || !Array.isArray(times)) return [];

  return dates.flatMap((date) => {
    const index = times.indexOf(date);
    if (index < 0) return [];
    const highs = ensembleValues(daily, "temperature_2m_max", index);
    const lows = ensembleValues(daily, "temperature_2m_min", index);
    const apparent = ensembleValues(daily, "apparent_temperature_max", index);
    const rain = ensembleValues(daily, "precipitation_sum", index);
    if (!highs.length || !lows.length) return [];
    return [{
      date,
      maxTemperature: average(highs),
      minTemperature: average(lows),
      apparentTemperature: apparent.length ? average(apparent) : undefined,
      maxTemperatureRange: [percentile(highs, 0.2), percentile(highs, 0.8)] as [number, number],
      rainyMemberPercent: rain.length ? Math.round((rain.filter((value) => value >= 1).length / rain.length) * 100) : null,
      source: "ecmwf-ec46" as const,
    }];
  });
}

async function fetchTripWeatherEstimates() {
  const params = new URLSearchParams({
    latitude: String(FUKUOKA_LATITUDE),
    longitude: String(FUKUOKA_LONGITUDE),
    timezone: "Asia/Tokyo",
    forecast_days: "30",
    daily: "temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum",
  });
  try {
    const response = await fetch(`https://seasonal-api.open-meteo.com/v1/seasonal?${params}`);
    if (!response.ok) throw new Error(`Seasonal weather request failed: ${response.status}`);
    const estimates = parseTripWeatherEstimates(await response.json() as OpenMeteoSeasonalResponse);
    return estimates.length === itinerary.length ? estimates : buildJmaNormalEstimates();
  } catch {
    return buildJmaNormalEstimates();
  }
}

let pendingWeatherRequest: Promise<WeatherData> | null = null;

async function loadFukuokaWeather(): Promise<WeatherData> {
  const cached = readWeatherCache();
  if (cached && Date.now() - Date.parse(cached.updatedAt) < WEATHER_CACHE_MS) return { ...cached, stale: false };
  if (cached && typeof navigator !== "undefined" && !navigator.onLine) return { ...cached, stale: true };

  const params = new URLSearchParams({
    latitude: String(FUKUOKA_LATITUDE), longitude: String(FUKUOKA_LONGITUDE), timezone: "Asia/Tokyo", forecast_days: "16",
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max",
  });

  try {
    const [response, tripEstimates] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?${params}`),
      fetchTripWeatherEstimates(),
    ]);
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    const payload = await response.json() as OpenMeteoResponse;
    if (!payload.current || !payload.daily) throw new Error("Weather response is incomplete");
    const data: WeatherData = {
      current: {
        time: payload.current.time ?? "",
        temperature: requiredNumber(payload.current.temperature_2m, "current temperature"),
        apparentTemperature: requiredNumber(payload.current.apparent_temperature, "current apparent temperature"),
        weatherCode: requiredNumber(payload.current.weather_code, "current weather code"),
        windSpeed: requiredNumber(payload.current.wind_speed_10m, "current wind speed"),
      },
      daily: parseDaily(payload.daily), tripEstimates, updatedAt: new Date().toISOString(), stale: false,
    };
    saveWeatherCache(data);
    return data;
  } catch (error) {
    if (cached) return { ...cached, stale: true };
    throw error;
  }
}

export function fetchFukuokaWeather(): Promise<WeatherData> {
  if (!pendingWeatherRequest) {
    pendingWeatherRequest = loadFukuokaWeather().finally(() => { pendingWeatherRequest = null; });
  }
  return pendingWeatherRequest;
}

export function getWeatherLabel(code: number) {
  if (code === 0) return "晴朗";
  if ([1, 2].includes(code)) return "晴時多雲";
  if (code === 3) return "陰天";
  if ([45, 48].includes(code)) return "有霧";
  if ([51, 53, 55, 56, 57].includes(code)) return "毛毛雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "有雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "降雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天氣變化";
}

export function getWeatherAdvice(weather: Pick<DailyWeather, "maxTemperature" | "maxApparentTemperature" | "precipitationProbability" | "maxWindSpeed">) {
  if (weather.precipitationProbability >= 50) return "可能有雨，雨傘放在外層好拿的位置。";
  if (weather.maxApparentTemperature >= 33 || weather.maxTemperature >= 31) return "高溫，記得補水並安排室內休息。";
  if (weather.maxWindSpeed >= 30) return "風勢較強，移動時放慢腳步。";
  return "適合外出，仍要補水並保留休息時間。";
}

export function formatWeatherUpdate(iso: string) {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

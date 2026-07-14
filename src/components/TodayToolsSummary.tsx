"use client";
import Link from "next/link";
import { getWeatherAdvice, getWeatherLabel } from "@/lib/weather";
import { useWeather } from "@/lib/useWeather";
import { useCurrency } from "@/lib/useCurrency";
import type { TripPhase } from "@/lib/date";

export function TodayToolsSummary({ phase, activeDate }: { phase: Exclude<TripPhase, "pending" | "after">; activeDate: string }) {
  const weather = useWeather();
  const currency = useCurrency();
  const forecast = weather.status === "success" ? weather.data.daily.find((item) => item.date === activeDate) : undefined;
  const estimate = weather.status === "success" ? weather.data.tripEstimates.find((item) => item.date === activeDate) : undefined;
  const current = weather.status === "success" ? weather.data.current : undefined;
  const weatherTitle = weather.status === "loading" ? "天氣載入中" : weather.status === "error" ? "天氣暫時無法取得" : forecast ? `${getWeatherLabel(forecast.weatherCode)} · ${Math.round(forecast.maxTemperature)}° / ${Math.round(forecast.minTemperature)}°` : estimate ? `旅行日預估 · ${Math.round(estimate.maxTemperature)}° / ${Math.round(estimate.minTemperature)}°` : current ? `${getWeatherLabel(current.weatherCode)} · 福岡現在 ${Math.round(current.temperature)}°` : "天氣暫時無資料";
  const weatherNote = forecast ? `降雨 ${Math.round(forecast.precipitationProbability)}% · ${getWeatherAdvice(forecast)}` : estimate ? `EC46 長期集合預估 · 建議短袖、薄外套與摺疊傘` : current ? `體感 ${Math.round(current.apparentTemperature)}° · 稍後再更新旅行日預報` : phase === "before" ? "接近出發日後再更新。" : "稍後再更新即可。";
  const currencyTitle = currency.status === "loading" ? "匯率載入中" : currency.status === "error" ? "匯率暫時無法取得" : `¥1,000 ≈ NT$${Math.round(currency.data.rate * 1000)}`;
  const currencyNote = currency.status === "success" ? `參考日 ${currency.data.date}${currency.data.stale?" · 上次資料":""}` : "換算頁仍可稍後重新載入。";

  return <section className="today-tools" aria-label="天氣與匯率"><Link href="/weather"><span>WEATHER</span><strong>{weatherTitle}</strong><p>{weatherNote}</p><b aria-hidden>→</b></Link><Link href="/currency"><span>JPY / TWD</span><strong>{currencyTitle}</strong><p>{currencyNote}</p><b aria-hidden>→</b></Link></section>;
}

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
  const weatherTitle = weather.status === "loading" ? "天氣載入中" : weather.status === "error" ? "天氣暫時無法取得" : forecast ? `${getWeatherLabel(forecast.weatherCode)} · ${Math.round(forecast.maxTemperature)}° / ${Math.round(forecast.minTemperature)}°` : phase === "before" ? "接近出發日後再確認天氣" : "今日預報尚未提供";
  const weatherNote = forecast ? `降雨 ${Math.round(forecast.precipitationProbability)}% · ${getWeatherAdvice(forecast)}` : "行程不受影響，稍後再更新即可。";
  const currencyTitle = currency.status === "loading" ? "匯率載入中" : currency.status === "error" ? "匯率暫時無法取得" : `¥1,000 ≈ NT$${Math.round(currency.data.rate * 1000)}`;
  const currencyNote = currency.status === "success" ? `參考日 ${currency.data.date}${currency.data.stale?" · 上次資料":""}` : "換算頁仍可稍後重新載入。";

  return <section className="today-tools" aria-label="天氣與匯率"><Link href="/weather"><span>WEATHER</span><strong>{weatherTitle}</strong><p>{weatherNote}</p><b aria-hidden>→</b></Link><Link href="/currency"><span>JPY / TWD</span><strong>{currencyTitle}</strong><p>{currencyNote}</p><b aria-hidden>→</b></Link></section>;
}

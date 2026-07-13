"use client";
import { EmptyState } from "./EmptyState";
import { NoticeBox } from "./NoticeBox";
import { itinerary } from "@/data/itinerary";
import { formatTripDate } from "@/lib/date";
import { formatWeatherUpdate, getWeatherAdvice, getWeatherLabel } from "@/lib/weather";
import { useWeather } from "@/lib/useWeather";
import type { DailyWeather } from "@/types/weather";

function ForecastRow({ date, weather }: { date: string; weather?: DailyWeather }) {
  return <article className="forecast-row"><div className="forecast-date"><span>{formatTripDate(date)}</span><strong>{weather ? getWeatherLabel(weather.weatherCode) : "尚無預報"}</strong></div>{weather ? <><div className="forecast-temp"><strong>{Math.round(weather.maxTemperature)}°</strong><span>{Math.round(weather.minTemperature)}°</span></div><div className="forecast-detail"><span>降雨 {Math.round(weather.precipitationProbability)}%</span><span>風速 {Math.round(weather.maxWindSpeed)} km/h</span></div><p>{getWeatherAdvice(weather)}</p></> : <p className="forecast-wait">目前尚未進入 16 日預報範圍，接近出發日後再確認。</p>}</article>;
}

export function WeatherPageClient() {
  const weather = useWeather();
  if (weather.status === "loading") return <div className="weather-loading" role="status"><span>取得福岡天氣中…</span><div /><div /><div /></div>;
  if (weather.status === "error") return <><NoticeBox title="天氣暫時無法載入">{weather.error}。頁面其他旅程資料仍可使用。</NoticeBox><EmptyState>目前沒有可顯示的天氣資料</EmptyState></>;

  const { data } = weather;
  const todayForecast = data.daily[0];
  const tripForecasts = itinerary.map((day) => ({ date: day.date, weather: data.daily.find((item) => item.date === day.date) }));
  const availableTripDays = tripForecasts.filter((item) => item.weather).length;
  return <>
    {data.stale&&<NoticeBox tone="blue" title="使用上次天氣資料">即時服務暫時無法連線，以下為最近一次成功取得的資料。</NoticeBox>}
    <section className="weather-current"><div><span>FUKUOKA · NOW</span><h2>{getWeatherLabel(data.current.weatherCode)}</h2><p>體感 {Math.round(data.current.apparentTemperature)}° · 風速 {Math.round(data.current.windSpeed)} km/h</p></div><strong>{Math.round(data.current.temperature)}°</strong></section>
    {todayForecast&&<p className="weather-advice"><b>今日提醒</b>{getWeatherAdvice(todayForecast)}</p>}
    <div className="weather-updated">更新時間｜{formatWeatherUpdate(data.updatedAt)}</div>
    <section aria-labelledby="trip-weather-title"><div className="section-header"><h2 id="trip-weather-title">旅行期間預報</h2><span>{availableTripDays} / 5 天可用</span></div>{availableTripDays===0&&<NoticeBox tone="plain" title="還沒進入預報範圍">Open-Meteo 最長提供 16 日預報，接近出發日後這裡會自動出現資料。</NoticeBox>}<div className="forecast-list">{tripForecasts.map((item)=><ForecastRow key={item.date} date={item.date} weather={item.weather}/>)}</div></section>
  </>;
}

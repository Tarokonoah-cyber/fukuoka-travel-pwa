"use client";
import { NoticeBox } from "./NoticeBox";
import { itinerary } from "@/data/itinerary";
import { formatTripDate } from "@/lib/date";
import { formatWeatherUpdate, getWeatherAdvice, getWeatherLabel } from "@/lib/weather";
import { useWeather } from "@/lib/useWeather";
import type { DailyWeather } from "@/types/weather";

function ForecastRow({ date, weather }: { date: string; weather: DailyWeather }) {
  return <article className="forecast-row"><div className="forecast-date"><span>{formatTripDate(date)}</span><strong>{getWeatherLabel(weather.weatherCode)}</strong></div><div className="forecast-temp"><strong>{Math.round(weather.maxTemperature)}°</strong><span>{Math.round(weather.minTemperature)}°</span></div><div className="forecast-detail"><span>降雨 {Math.round(weather.precipitationProbability)}%</span><span>風速 {Math.round(weather.maxWindSpeed)} km/h</span></div><p>{getWeatherAdvice(weather)}</p></article>;
}

export function WeatherPageClient() {
  const weather = useWeather();
  if (weather.status === "loading") return <div className="weather-loading" role="status"><span>取得福岡天氣中…</span><div /><div /><div /></div>;
  if (weather.status === "error") return <NoticeBox title="即時天氣暫時無法載入">目前無法連上天氣資料服務，請稍後重新整理，或直接查看 <a href="https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=400000" target="_blank" rel="noreferrer">日本氣象廳福岡預報 ↗</a>。</NoticeBox>;

  const { data } = weather;
  const todayForecast = data.daily[0];
  const tripForecasts = itinerary.flatMap((day) => {
    const forecast = data.daily.find((item) => item.date === day.date);
    return forecast ? [{ date: day.date, weather: forecast }] : [];
  });
  const availableTripDays = tripForecasts.length;
  return <>
    {data.stale&&<NoticeBox tone="blue" title="使用上次天氣資料">即時服務暫時無法連線，以下為最近一次成功取得的資料。</NoticeBox>}
    <section className="weather-current"><div><span>福岡即時觀測 · LIVE</span><h2>{getWeatherLabel(data.current.weatherCode)}</h2><p>體感 {Math.round(data.current.apparentTemperature)}° · 風速 {Math.round(data.current.windSpeed)} km/h</p></div><strong>{Math.round(data.current.temperature)}°</strong></section>
    {todayForecast&&<p className="weather-advice"><b>今日提醒</b>{getWeatherAdvice(todayForecast)}</p>}
    <div className="weather-updated">資料取得時間（日本）｜{formatWeatherUpdate(data.updatedAt)} · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">資料來源 Open-Meteo ↗</a></div>
    <section aria-labelledby="trip-weather-title"><div className="section-header"><h2 id="trip-weather-title">旅行期間預報</h2><span>{availableTripDays} / 5 天可用</span></div>{availableTripDays===0?<NoticeBox tone="plain" title="旅行日期尚未進入預報範圍">上方是目前福岡的即時天氣。8/2–8/6 預報進入 16 日範圍後，這裡會自動顯示實際資料。</NoticeBox>:<div className="forecast-list">{tripForecasts.map((item)=><ForecastRow key={item.date} date={item.date} weather={item.weather}/>)}</div>}</section>
  </>;
}

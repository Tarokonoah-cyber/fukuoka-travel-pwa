"use client";
import { NoticeBox } from "./NoticeBox";
import { itinerary } from "@/data/itinerary";
import { formatTripDate } from "@/lib/date";
import { formatWeatherUpdate, getWeatherAdvice, getWeatherLabel } from "@/lib/weather";
import { useWeather } from "@/lib/useWeather";
import type { DailyWeather, TripWeatherEstimate } from "@/types/weather";

function ForecastRow({ date, weather }: { date: string; weather: DailyWeather }) {
  return <article className="forecast-row actual"><div className="forecast-date"><span>{formatTripDate(date)}</span><strong>{getWeatherLabel(weather.weatherCode)}</strong><small>16 日內實際預報</small></div><div className="forecast-temp"><strong>{Math.round(weather.maxTemperature)}°</strong><span>{Math.round(weather.minTemperature)}°</span></div><div className="forecast-detail"><span>降雨 {Math.round(weather.precipitationProbability)}%</span><span>風速 {Math.round(weather.maxWindSpeed)} km/h</span></div><p>{getWeatherAdvice(weather)}</p></article>;
}

function EstimateRow({ estimate }: { estimate: TripWeatherEstimate }) {
  const rain = estimate.rainyMemberPercent === null ? "逐日機率待確認" : `${estimate.rainyMemberPercent}% 成員有雨`;
  const sourceLabel = estimate.source === "ecmwf-ec46" ? "EC46 長期集合預估" : "JMA 8 月氣候常態";
  return <article className="forecast-row estimate"><div className="forecast-date"><span>{formatTripDate(estimate.date)}</span><strong>高溫炎熱</strong><small>{sourceLabel}</small></div><div className="forecast-temp"><strong>{Math.round(estimate.maxTemperature)}°</strong><span>{Math.round(estimate.minTemperature)}°</span></div><div className="forecast-detail"><span>降雨 {rain}</span><span>高溫區間 {Math.round(estimate.maxTemperatureRange[0])}–{Math.round(estimate.maxTemperatureRange[1])}°</span></div><p>穿透氣短袖、帶薄外套進冷氣房；遮陽與摺疊傘都要放隨身包。</p></article>;
}

function ClothingPlan({ estimates }: { estimates: TripWeatherEstimate[] }) {
  const averageHigh = estimates.length ? Math.round(estimates.reduce((sum, item) => sum + item.maxTemperature, 0) / estimates.length) : 33;
  return <section className="clothing-plan" aria-labelledby="clothing-plan-title"><div><span>PACKING FORECAST</span><h2 id="clothing-plan-title">依目前預估準備衣服</h2><p>旅行五天白天約 {averageHigh}°，濕熱且室內冷氣強。</p></div><ul><li>透氣快乾短袖 4–5 件</li><li>薄長袖外套 1 件</li><li>快乾下身與好走的鞋</li><li>遮陽帽、防曬與摺疊傘</li></ul></section>;
}

export function WeatherPageClient() {
  const weather = useWeather();
  if (weather.status === "loading") return <div className="weather-loading" role="status"><span>取得福岡天氣中…</span><div /><div /><div /></div>;
  if (weather.status === "error") return <NoticeBox title="即時天氣暫時無法載入">目前無法連上天氣資料服務，請稍後重新整理，或直接查看 <a href="https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=400000" target="_blank" rel="noreferrer">日本氣象廳福岡預報 ↗</a>。</NoticeBox>;

  const { data } = weather;
  const todayForecast = data.daily[0];
  const tripForecasts = itinerary.map((day) => ({
    date: day.date,
    forecast: data.daily.find((item) => item.date === day.date),
    estimate: data.tripEstimates.find((item) => item.date === day.date),
  }));
  const availableTripDays = tripForecasts.filter((item) => item.forecast).length;
  const usingEcmwfEstimate = data.tripEstimates.some((item) => item.source === "ecmwf-ec46");
  return <>
    {data.stale&&<NoticeBox tone="blue" title="使用上次天氣資料">即時服務暫時無法連線，以下為最近一次成功取得的資料。</NoticeBox>}
    <section className="weather-current"><div><span>福岡即時觀測 · LIVE</span><h2>{getWeatherLabel(data.current.weatherCode)}</h2><p>體感 {Math.round(data.current.apparentTemperature)}° · 風速 {Math.round(data.current.windSpeed)} km/h</p></div><strong>{Math.round(data.current.temperature)}°</strong></section>
    {todayForecast&&<p className="weather-advice"><b>今日提醒</b>{getWeatherAdvice(todayForecast)}</p>}
    <div className="weather-updated">資料取得時間（日本）｜{formatWeatherUpdate(data.updatedAt)} · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">資料來源 Open-Meteo ↗</a></div>
    <ClothingPlan estimates={data.tripEstimates} />
    <section aria-labelledby="trip-weather-title"><div className="section-header"><h2 id="trip-weather-title">8/2–8/6 天氣</h2><span>{availableTripDays} / 5 天進入短期預報</span></div><NoticeBox tone="plain" title={availableTripDays === 5 ? "已切換為 16 日內實際預報" : "目前先看旅行日長期預估"}>{availableTripDays === 5 ? "五天皆已進入較精細的短期預報，出門前仍請再確認降雨。" : usingEcmwfEstimate ? "使用 ECMWF EC46 的 51 組集合模型估計溫度與有雨成員比例；它是 36 公里區域預估，進入 16 日範圍後會逐日自動替換成實際預報。" : "暫時依日本氣象廳福岡 1991–2020 年 8 月氣候常態顯示；連線恢復後會改用 EC46 長期集合預估。"}</NoticeBox><div className="forecast-list">{tripForecasts.map((item) => item.forecast ? <ForecastRow key={item.date} date={item.date} weather={item.forecast}/> : item.estimate ? <EstimateRow key={item.date} estimate={item.estimate}/> : null)}</div><p className="weather-model-note">長期模型適合準備衣物，不適合決定單日戶外行程。模型說明：<a href="https://open-meteo.com/en/docs/seasonal-forecast-api" target="_blank" rel="noreferrer">Open-Meteo / ECMWF EC46 ↗</a>；氣候備援：<a href="https://www.data.jma.go.jp/stats/data/en/normal/normal.html" target="_blank" rel="noreferrer">日本氣象廳 ↗</a>。</p></section>
  </>;
}

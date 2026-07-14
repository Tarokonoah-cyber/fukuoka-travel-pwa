import { PageHeader } from "@/components/PageHeader";
import { WeatherPageClient } from "@/components/WeatherPageClient";

export default function WeatherPage() {
  return <div className="weather-page page-enter"><PageHeader eyebrow="FUKUOKA WEATHER" title="福岡天氣" description="即時資料與近 16 日實際預報"/><WeatherPageClient /></div>;
}

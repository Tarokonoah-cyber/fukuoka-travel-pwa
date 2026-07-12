import { PageHeader } from "@/components/PageHeader";
import { WeatherPageClient } from "@/components/WeatherPageClient";

export default function WeatherPage() {
  return <div className="weather-page page-enter"><PageHeader eyebrow="FUKUOKA WEATHER" title="福岡天氣" description="今日摘要與旅行期間預報"/><WeatherPageClient /></div>;
}

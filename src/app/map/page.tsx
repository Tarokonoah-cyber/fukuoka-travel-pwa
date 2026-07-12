import { MapPageClient } from "@/components/MapPageClient";
import { PageHeader } from "@/components/PageHeader";

export default function MapPage() {
  return <div className="map-page page-enter"><PageHeader eyebrow="FUKUOKA PLACES" title="旅程地圖" description="飯店、景點、餐廳、購物與交通點位"/><MapPageClient /></div>;
}

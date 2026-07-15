import type { TripDayImage } from "@/types/trip";

export const tripDayImages: Record<number, TripDayImage> = {
  1: {
    src: "/images/itinerary/day-1-hakata.webp",
    alt: "博多站外觀與站前街景",
    caption: "DAY 1｜抵達後以博多站與飯店為中心，放慢腳步適應福岡。",
    author: "Tanuki",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Hakata_Station.JPG",
    licenseName: "Public Domain",
    licenseHref: "https://commons.wikimedia.org/wiki/File:Hakata_Station.JPG#Licensing",
  },
  2: {
    src: "/images/itinerary/day-2-dazaifu.webp",
    alt: "太宰府天滿宮 2023 至 2027 年使用的仮本殿",
    caption: "DAY 2｜太宰府天滿宮仮本殿，以屋頂綠意辨認當日主要景點。",
    author: "水だらけのプール",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Dazaifu_tenmangu_shrine_temporary_main_hall.jpg",
    licenseName: "CC0 1.0",
    licenseHref: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  3: {
    src: "/images/itinerary/day-3-kumamoto.webp",
    alt: "2024 年熊本城大天守與石垣外觀",
    caption: "DAY 3｜熊本城大天守，當天只走主要公開路線並分段休息。",
    author: "ノボホショコロトソ",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Kumamoto_Castle_Keep_Tower_20240314-3.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  4: {
    src: "/images/itinerary/day-4-dome.webp",
    alt: "2025 年 Mizuho PayPay Dome Fukuoka 外觀",
    caption: "DAY 4｜Mizuho PayPay Dome 外觀，球賽日依此辨認入口區域。",
    author: "Keeteria",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Mizuho_PayPay_dome_Fukuoka_2025.jpg",
    licenseName: "CC BY-SA 4.0",
    licenseHref: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  5: {
    src: "/images/itinerary/day-5-airport.webp",
    alt: "2025 年福岡機場國際線出境報到區",
    caption: "DAY 5｜福岡機場國際線出境區，最後一天預留報到與休息時間。",
    author: "ERIC SALARD",
    sourceHref: "https://commons.wikimedia.org/wiki/File:Fukuoka_Airport_FUK_international_departures_2025-03-30.jpg",
    licenseName: "CC BY-SA 2.0",
    licenseHref: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
};

export const tripImagePaths = Object.values(tripDayImages).map((image) => image.src);

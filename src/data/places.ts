import type { Place, PlaceCategory } from "@/types/place";

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  hotel: "住宿",
  transport: "交通",
  attraction: "景點",
  restaurant: "餐廳",
  shopping: "購物",
  baseball: "棒球",
  rest: "休息",
  wishlist: "願望",
};

// 第一階段地圖使用示範座標；已接近實際地點，正式行程確認後仍可逐點微調。
export const places: Place[] = [
  { id: "croom-hakata", name: "Nishitetsu Croom Hakata", category: "hotel", area: "博多站", latitude: 33.5921, longitude: 130.4184, address: "福岡市博多區博多站前 1-17-6", note: "四晚住宿；座標為飯店周邊示範點。", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Nishitetsu%20Croom%20Hakata", momFriendlyNote: "靠近博多站，回飯店休息方便。", indoor: true, priority: "must" },
  { id: "fukuoka-airport", name: "福岡機場", category: "transport", area: "博多區", latitude: 33.5859, longitude: 130.4507, note: "國際線航廈與地鐵站之間需搭接駁車。", day: "2026-08-02", momFriendlyNote: "行李多時直接搭計程車到飯店。", indoor: true, priority: "must" },
  { id: "hakata-station", name: "博多站", category: "transport", area: "博多", latitude: 33.5898, longitude: 130.4207, note: "JR、地鐵與巴士主要轉乘點。", day: "2026-08-02", momFriendlyNote: "站內很大，優先利用電梯與休息區。", indoor: true, priority: "must" },
  { id: "tenjin-station", name: "天神站", category: "transport", area: "天神", latitude: 33.5903, longitude: 130.3989, note: "天神地下街與百貨主要入口。", day: "2026-08-03", momFriendlyNote: "先確認出口編號，避免繞路。", indoor: true, priority: "must" },
  { id: "paypay-dome", name: "MIZUHO PayPay Dome", category: "baseball", area: "百道", latitude: 33.5953, longitude: 130.3621, note: "棒球比賽場地；開賽時間以正式票券為準。", day: "2026-08-04", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=MIZUHO%20PayPay%20Dome", momFriendlyNote: "提早入場，先找洗手間與最近出口。", indoor: true, priority: "must" },
  { id: "jr-hakata-city", name: "JR 博多 City", category: "shopping", area: "博多站", latitude: 33.5898, longitude: 130.4203, note: "博多阪急、AMU Plaza 與站內餐廳集中區。", day: "2026-08-02", momFriendlyNote: "全程室內，餐廳與座位選擇多。", indoor: true, priority: "must" },
  { id: "tenjin-shopping", name: "天神商圈", category: "shopping", area: "天神", latitude: 33.5894, longitude: 130.3994, note: "地下街、岩田屋、三越與 PARCO 周邊示範中心點。", day: "2026-08-03", momFriendlyNote: "利用地下街移動，每 60–90 分鐘休息。", indoor: true, priority: "must" },
  { id: "canal-city", name: "Canal City Hakata", category: "shopping", area: "博多舊市街", latitude: 33.5898, longitude: 130.4111, note: "最後採買與雨天室內備案。", day: "2026-08-05", momFriendlyNote: "利用電梯，餐廳樓層可坐下休息。", indoor: true, priority: "backup" },
  { id: "mark-is", name: "MARK IS 福岡百道", category: "shopping", area: "百道", latitude: 33.5948, longitude: 130.3628, note: "球賽前後可休息、用餐的室內商場。", day: "2026-08-04", momFriendlyNote: "球場旁的主要室內休息點。", indoor: true, priority: "optional" },
  { id: "kushida-shrine", name: "櫛田神社", category: "attraction", area: "博多舊市街", latitude: 33.5930, longitude: 130.4106, note: "早上短程參拜；座標為主要入口附近。", day: "2026-08-05", momFriendlyNote: "炎熱或下雨時縮短停留。", indoor: false, priority: "optional" },
  { id: "ohori-park", name: "大濠公園", category: "attraction", area: "中央區", latitude: 33.5862, longitude: 130.3764, note: "想去清單示範點；天氣舒適時再安排。", momFriendlyNote: "步行距離較長，可只走湖畔短段。", indoor: false, priority: "optional" },
  { id: "fukuoka-tower", name: "福岡塔", category: "attraction", area: "百道", latitude: 33.5932, longitude: 130.3515, note: "百道地區代表景點，座標可在正式安排後微調。", momFriendlyNote: "室內展望台有電梯。", indoor: true, priority: "optional" },
  { id: "hakata-restaurant", name: "博多站餐廳街", category: "restaurant", area: "博多站", latitude: 33.5900, longitude: 130.4205, note: "依排隊與當天體力選店的代表點位。", day: "2026-08-02", momFriendlyNote: "選有座位、候位較短的餐廳。", indoor: true, priority: "must" },
  { id: "city-museum", name: "福岡市博物館", category: "rest", area: "百道", latitude: 33.5955, longitude: 130.3530, note: "雨天備案；示範座標為館舍附近。", momFriendlyNote: "室內、有座位與洗手間。", indoor: true, priority: "backup" },
  { id: "asian-art-museum", name: "福岡亞洲美術館", category: "rest", area: "中洲川端", latitude: 33.5951, longitude: 130.4064, note: "市中心雨天與休息備案。", momFriendlyNote: "地鐵直達，館內可慢慢休息。", indoor: true, priority: "backup" },
  { id: "dazaifu", name: "太宰府天滿宮", category: "wishlist", area: "太宰府", latitude: 33.5214, longitude: 130.5349, note: "距市區較遠的願望清單點位，第一版不排入正式行程。", momFriendlyNote: "移動與步行較多，視體力決定。", indoor: false, priority: "optional" },
  { id: "teamlab-forest", name: "teamLab Forest 福岡", category: "wishlist", area: "百道", latitude: 33.5958, longitude: 130.3613, note: "雨天室內願望點位；座標為 BOSS E・ZO FUKUOKA 周邊。", momFriendlyNote: "部分展區互動較多，先確認媽媽體力。", indoor: true, priority: "backup" },
];

import type { Place, PlaceCategory } from "@/types/place";

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  hotel: "住宿", transport: "交通", attraction: "景點", restaurant: "餐廳",
  shopping: "購物", baseball: "棒球", rest: "休息", wishlist: "想去",
};

const maps = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const places: Place[] = [
  { id: "taipei-kaifeng-hotel", name: "天雲旅棧台北開封", journeySide: "origin", category: "hotel", area: "台北車站", latitude: 25.0461, longitude: 121.5139, day: "2026-08-01", googleMapsUrl: maps("天雲旅棧台北開封"), indoor: true, priority: "must" },
  { id: "taipei-main-a1", name: "桃園機場捷運 A1 台北車站", journeySide: "origin", category: "transport", area: "台北車站", latitude: 25.0478, longitude: 121.517, day: "2026-08-02", googleMapsUrl: maps("桃園機場捷運 A1 台北車站"), indoor: true, priority: "must" },
  { id: "taoyuan-airport", name: "桃園國際機場 TPE", journeySide: "origin", category: "transport", area: "桃園", latitude: 25.0797, longitude: 121.2342, day: "2026-08-02", googleMapsUrl: maps("Taiwan Taoyuan International Airport"), indoor: true, priority: "must" },

  { id: "croom-hakata", name: "Nishitetsu Croom Hakata", journeySide: "destination", category: "hotel", area: "博多站", latitude: 33.5924812, longitude: 130.4198108, note: "五晚行程的休息基地；每日保留回房休息。", day: "2026-08-02", googleMapsUrl: maps("Nishitetsu Croom Hakata"), momFriendlyNote: "鄰近博多站，疲累時直接回飯店。", indoor: true, priority: "must" },
  { id: "fukuoka-airport-international", name: "福岡機場國際線旅客航廈", journeySide: "destination", category: "transport", area: "福岡機場", latitude: 33.585548, longitude: 130.443826, note: "8/2 抵達、8/6 回程皆使用國際線；不是國內線航廈。", day: "2026-08-02", googleMapsUrl: maps("福岡空港 国際線旅客ターミナル"), momFriendlyNote: "行李多時由飯店直接搭計程車。", indoor: true, priority: "must" },
  { id: "jr-hakata-city", name: "JR 博多 City", journeySide: "destination", category: "shopping", area: "博多站", latitude: 33.5895057, longitude: 130.4203666, note: "抵達日用餐與回程前最後採買的室內據點。", day: "2026-08-02", googleMapsUrl: maps("JR博多シティ"), indoor: true, priority: "must" },
  { id: "kitte-hakata", name: "KITTE 博多", journeySide: "destination", category: "shopping", area: "博多站", latitude: 33.5888887, longitude: 130.4194425, note: "8/2 晚餐主選所在建築。", day: "2026-08-02", googleMapsUrl: maps("KITTE博多"), indoor: true, priority: "must" },
  { id: "hakata-hankyu", name: "博多阪急", journeySide: "destination", category: "shopping", area: "博多站", latitude: 33.5892954, longitude: 130.4205241, note: "8/2 地下食品街初步採買，不買大量重物。", day: "2026-08-02", googleMapsUrl: maps("博多阪急"), indoor: true, priority: "must" },
  { id: "ooyama-kitte", name: "博多もつ鍋 おおやま KITTE博多店", journeySide: "destination", category: "restaurant", area: "KITTE 博多", latitude: 33.588956, longitude: 130.419565, note: "8/2 晚餐主選；候位太久就換有座位的備選。", day: "2026-08-02", googleMapsUrl: maps("博多もつ鍋 おおやま KITTE博多店"), indoor: true, priority: "must" },
  { id: "inaba-udon", name: "因幡うどん 博多デイトス店", journeySide: "destination", category: "restaurant", area: "博多站", latitude: 33.590214, longitude: 130.421412, note: "8/2 晚餐備選，以現場候位與座位為準。", day: "2026-08-02", googleMapsUrl: maps("因幡うどん 博多デイトス店"), indoor: true, priority: "backup" },

  { id: "nishitetsu-tenjin", name: "西鐵福岡（天神）站", journeySide: "destination", category: "transport", area: "天神", latitude: 33.5892548, longitude: 130.3994222, note: "8/3 前往太宰府與柳川的西鐵起點。", day: "2026-08-03", googleMapsUrl: maps("西鉄福岡（天神）駅"), indoor: true, priority: "must" },
  { id: "dazaifu-station", name: "西鐵太宰府站", journeySide: "destination", category: "transport", area: "太宰府", latitude: 33.5184903, longitude: 130.5311595, note: "參道入口的精確車站點位。", day: "2026-08-03", googleMapsUrl: maps("太宰府駅"), indoor: true, priority: "must" },
  { id: "dazaifu-tenmangu", name: "太宰府天滿宮", journeySide: "destination", category: "attraction", area: "太宰府", latitude: 33.5213084, longitude: 130.5352564, note: "只走參道、太鼓橋與主要境內。", day: "2026-08-03", googleMapsUrl: maps("太宰府天満宮"), momFriendlyNote: "上午完成戶外段，不走遍所有區域。", indoor: false, priority: "must" },
  { id: "kasanoya", name: "かさの家", journeySide: "destination", category: "restaurant", area: "太宰府參道", latitude: 33.5193953, longitude: 130.5334852, note: "梅枝餅與坐下休息點。", day: "2026-08-03", googleMapsUrl: maps("かさの家 太宰府"), indoor: true, priority: "must" },
  { id: "yanagawa-station", name: "西鐵柳川站", journeySide: "destination", category: "transport", area: "柳川", latitude: 33.1651756, longitude: 130.4192323, note: "抵達後直接搭計程車前往沖端。", day: "2026-08-03", googleMapsUrl: maps("西鉄柳川駅"), indoor: true, priority: "must" },
  { id: "wakamatsuya", name: "うなぎ料理 若松屋", journeySide: "destination", category: "restaurant", area: "柳川沖端", latitude: 33.1584411, longitude: 130.3960646, note: "鰻せいろ蒸し主選；建議事前電話確認平日預約。", day: "2026-08-03", googleMapsUrl: maps("うなぎ料理 若松屋 柳川"), momFriendlyNote: "官方標示無障礙；完整坐下用餐。", indoor: true, priority: "must" },
  { id: "okinohata-short-boat", name: "沖端短程遊船乘船區", journeySide: "destination", category: "attraction", area: "柳川沖端", latitude: 33.159671, longitude: 130.398562, note: "柳川官方旅遊頁連結的約 30 分鐘周遊短程乘船點。", day: "2026-08-03", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=33.159671%2C130.398562", momFriendlyNote: "有高溫警報、雷雨或精神不佳就取消。", indoor: false, priority: "must" },
  { id: "ohana", name: "柳川藩主立花邸 御花", journeySide: "destination", category: "attraction", area: "柳川沖端", latitude: 33.158012, longitude: 130.3982454, note: "遊船後的伴手禮與咖啡休息區。", day: "2026-08-03", googleMapsUrl: maps("柳川藩主立花邸 御花"), indoor: true, priority: "must" },

  { id: "hakata-shinkansen", name: "博多站新幹線中央改札", journeySide: "destination", category: "transport", area: "博多站筑紫口側", latitude: 33.59007, longitude: 130.42154, note: "8/4 九州新幹線集合入口；實際月台以 JR 當日資訊為準。", day: "2026-08-04", googleMapsUrl: maps("博多駅 新幹線中央改札口"), indoor: true, priority: "must" },
  { id: "kumamoto-station", name: "熊本站", journeySide: "destination", category: "transport", area: "熊本", latitude: 32.7903174, longitude: 130.6889738, note: "抵達後主選計程車前往城彩苑。", day: "2026-08-04", googleMapsUrl: maps("熊本駅"), indoor: true, priority: "must" },
  { id: "josai-en", name: "櫻之馬場 城彩苑", journeySide: "destination", category: "attraction", area: "熊本城南側", latitude: 32.8033338, longitude: 130.7037621, note: "洗手間、飲水、午餐與免費接駁車起點。", day: "2026-08-04", googleMapsUrl: maps("桜の馬場 城彩苑"), indoor: true, priority: "must" },
  { id: "kumamoto-castle-south", name: "熊本城南口", journeySide: "destination", category: "transport", area: "熊本城", latitude: 32.803952, longitude: 130.704815, note: "官方提醒天守閣應由南口進入；免費接駁車停靠南口前。", day: "2026-08-04", googleMapsUrl: maps("熊本城 南口券売所"), indoor: false, priority: "must" },
  { id: "kumamoto-castle", name: "熊本城", journeySide: "destination", category: "attraction", area: "熊本城", latitude: 32.8052691, longitude: 130.7054642, note: "只走主要公開路線與天守閣。", day: "2026-08-04", googleMapsUrl: maps("熊本城"), momFriendlyNote: "分段休息，雨天防滑，高溫時縮短。", indoor: false, priority: "must" },
  { id: "yokayoka", name: "あか牛Dining yoka-yoka 櫻之小路店", journeySide: "destination", category: "restaurant", area: "城彩苑", latitude: 32.803472, longitude: 130.703918, note: "赤牛午餐主選；候位長就換城彩苑內有座位的店。", day: "2026-08-04", googleMapsUrl: maps("あか牛Dining yoka-yoka 桜の小路店"), indoor: true, priority: "must" },
  { id: "kumamon-square", name: "熊本熊廣場", journeySide: "destination", category: "attraction", area: "熊本市中心", latitude: 32.8018509, longitude: 130.7124401, note: "活動時間看當日官方公告，不保證有表演。", day: "2026-08-04", googleMapsUrl: maps("くまモンスクエア"), indoor: true, priority: "must" },
  { id: "tsuruya", name: "鶴屋百貨", journeySide: "destination", category: "shopping", area: "熊本市中心", latitude: 32.8023556, longitude: 130.7110447, note: "下午冷氣休息與少量伴手禮採買。", day: "2026-08-04", googleMapsUrl: maps("鶴屋百貨店"), indoor: true, priority: "must" },

  { id: "kushida-shrine", name: "櫛田神社", journeySide: "destination", category: "attraction", area: "博多舊市街", latitude: 33.59307, longitude: 130.4106837, note: "8/5 早上短程參拜。", day: "2026-08-05", googleMapsUrl: maps("櫛田神社 福岡"), indoor: false, priority: "must" },
  { id: "hakata-machiya", name: "博多町家文化館", journeySide: "destination", category: "attraction", area: "博多舊市街", latitude: 33.592826, longitude: 130.411401, note: "室內文化展示與休息點。", day: "2026-08-05", googleMapsUrl: maps("博多町家ふるさと館"), indoor: true, priority: "must" },
  { id: "kawabata-arcade", name: "川端通商店街", journeySide: "destination", category: "shopping", area: "博多舊市街", latitude: 33.5936172, longitude: 130.408279, note: "有遮棚，只走往午餐方向的短段。", day: "2026-08-05", googleMapsUrl: maps("博多川端商店街"), indoor: true, priority: "must" },
  { id: "karonouron", name: "かろのうろん", journeySide: "destination", category: "restaurant", area: "博多舊市街", latitude: 33.5924605, longitude: 130.4110124, note: "博多柔軟烏龍麵午餐主選；候位長就換店。", day: "2026-08-05", googleMapsUrl: maps("かろのうろん"), indoor: true, priority: "must" },
  { id: "paypay-dome", name: "MIZUHO PayPay Dome", journeySide: "destination", category: "baseball", area: "百道", latitude: 33.5953, longitude: 130.3621, note: "2026-08-05 16:00 開場、18:00 對北海道日本火腿；賽後不論勝負皆有煙火。", day: "2026-08-05", googleMapsUrl: maps("みずほPayPayドーム福岡"), momFriendlyNote: "飯店直搭計程車，避開唐人町站長走路。", indoor: true, priority: "must" },
  { id: "mark-is", name: "MARK IS 福岡百道", journeySide: "destination", category: "rest", area: "百道", latitude: 33.592341, longitude: 130.3638929, note: "抵達太早、炎熱或雨天時的室內候場點。", day: "2026-08-05", googleMapsUrl: maps("MARK IS 福岡ももち"), indoor: true, priority: "backup" },
];

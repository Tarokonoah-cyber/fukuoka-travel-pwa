import type { TripDay } from "@/types/trip";

const hotel = "Nishitetsu Croom Hakata";

export const itinerary: TripDay[] = [
  {
    day: 1, date: "2026-08-02", weekday: "日", title: "抵達福岡・博多散步", highlight: "抵達、入住、慢慢熟悉博多站",
    hotel, walkingLevel: "低", indoorRatio: 75, restStops: ["福岡機場抵達大廳", "飯店大廳", "博多阪急咖啡店"],
    rainPlan: "抵達後直接搭計程車或地鐵到博多站，行程留在站內商場。", momFriendlyNote: "第一天不排遠程移動，抵達後先休息再出門。",
    items: [
      { id:"d1-1", time:"14:00", title:"抵達福岡機場", location:"福岡機場國際線", type:"交通", note:"入境、領行李與交通卡確認。", walkingLevel:"低", environment:"室內", momFriendlyNote:"先坐下整理隨身物品。", rainPlan:"不受天氣影響。", restStops:"抵達大廳座椅" },
      { id:"d1-2", time:"16:00", title:"飯店入住與休息", location:hotel, type:"住宿", note:"寄放行李、確認早餐與退房時間。", walkingLevel:"低", environment:"室內", momFriendlyNote:"預留至少一小時休息。", rainPlan:"原行程。", restStops:"房間、飯店大廳" },
      { id:"d1-3", time:"18:00", title:"博多站晚餐", location:"JR 博多 City", type:"餐廳", note:"依當天體力挑選站內餐廳。", walkingLevel:"低", environment:"室內", momFriendlyNote:"避開排隊太久的店。", rainPlan:"全程室內。", restStops:"博多阪急、AMU Plaza" },
    ],
  },
  {
    day: 2, date: "2026-08-03", weekday: "一", title: "天神・室內購物日", highlight: "天神地下街、百貨與早一點回飯店",
    hotel, walkingLevel: "中", indoorRatio: 90, restStops: ["天神地下街", "岩田屋", "PARCO 咖啡店"],
    rainPlan: "以地下街串連百貨，全程可避雨。", momFriendlyNote: "每 60–90 分鐘安排一次坐下休息。",
    items: [
      { id:"d2-1", time:"10:00", title:"前往天神", location:"博多站 → 天神站", type:"交通", note:"地鐵空港線直達。", walkingLevel:"低", environment:"室內", momFriendlyNote:"避開通勤尖峰。", rainPlan:"原行程。", restStops:"車站月台座椅" },
      { id:"d2-2", time:"10:30", title:"天神地下街散步", location:"天神地下街", type:"購物", note:"先看伴手禮與生活雜貨。", walkingLevel:"中", environment:"室內", momFriendlyNote:"分段逛，不走回頭路。", rainPlan:"最佳雨天行程。", restStops:"地下街休息區" },
      { id:"d2-3", time:"12:30", title:"午餐與午休", location:"岩田屋／三越周邊", type:"休息", note:"選有座位、候位短的餐廳。", walkingLevel:"低", environment:"室內", momFriendlyNote:"午餐後多留 30 分鐘休息。", rainPlan:"原行程。", restStops:"百貨餐廳樓層" },
      { id:"d2-4", time:"15:00", title:"百貨採買", location:"天神商圈", type:"購物", note:"藥妝與媽媽想買清單。", walkingLevel:"中", environment:"室內", momFriendlyNote:"重物最後買，必要時寄物。", rainPlan:"原行程。", restStops:"百貨咖啡店" },
    ],
  },
  {
    day: 3, date: "2026-08-04", weekday: "二", title: "PayPay Dome・棒球日", highlight: "保留體力，傍晚看球",
    hotel, walkingLevel: "中", indoorRatio: 70, restStops: ["MARK IS 福岡百道", "球場座位區"],
    rainPlan: "提早搭地鐵到唐人町，移動時使用計程車縮短戶外步行。", momFriendlyNote: "球場周邊距離較長，穿好走的鞋並提早入場。",
    items: [
      { id:"d3-1", time:"10:30", title:"博多站周邊輕鬆逛", location:"KITTE 博多", type:"購物", note:"上午不排遠程景點。", walkingLevel:"低", environment:"室內", momFriendlyNote:"中午回飯店休息。", rainPlan:"全程室內。", restStops:"KITTE 各樓層" },
      { id:"d3-2", time:"14:30", title:"前往球場", location:"博多 → 唐人町／PayPay Dome", type:"交通", note:"預留轉乘與入場時間。", walkingLevel:"中", environment:"室內／室外", momFriendlyNote:"唐人町站到球場可改搭計程車。", rainPlan:"博多站直接搭計程車。", restStops:"MARK IS 福岡百道" },
      { id:"d3-3", time:"18:00", title:"福岡軟銀鷹棒球比賽", location:"MIZUHO PayPay Dome", type:"棒球", note:"比賽時間與票券以正式公告為準。", walkingLevel:"低", environment:"室內", momFriendlyNote:"先找洗手間與最近出口。", rainPlan:"巨蛋內不受雨影響。", restStops:"球場座位" },
    ],
  },
  {
    day: 4, date: "2026-08-05", weekday: "三", title: "博多文化・最後採買", highlight: "櫛田神社、川端通與伴手禮補貨",
    hotel, walkingLevel: "中", indoorRatio: 60, restStops: ["川端通商店街", "博多町家咖啡店", "Canal City"],
    rainPlan: "取消戶外神社散步，改在 Canal City 與川端通商店街活動。", momFriendlyNote: "戶外段安排在早上，下午以室內為主。",
    items: [
      { id:"d4-1", time:"09:30", title:"櫛田神社", location:"博多舊市街", type:"景點", note:"早上較涼，短程參拜。", walkingLevel:"中", environment:"室外", momFriendlyNote:"視氣溫縮短停留。", rainPlan:"改至博多町家文化館或 Canal City。", restStops:"神社休息區" },
      { id:"d4-2", time:"11:00", title:"川端通商店街", location:"上川端町", type:"購物", note:"有遮棚，慢慢逛老店。", walkingLevel:"中", environment:"室內／室外", momFriendlyNote:"商店街中段安排茶點。", rainPlan:"原行程。", restStops:"咖啡店、川端善哉廣場" },
      { id:"d4-3", time:"14:00", title:"Canal City 午餐與補貨", location:"博多運河城", type:"購物", note:"最後確認伴手禮清單。", walkingLevel:"中", environment:"室內", momFriendlyNote:"利用電梯，避開長時間站立。", rainPlan:"原行程。", restStops:"餐廳樓層" },
    ],
  },
  {
    day: 5, date: "2026-08-06", weekday: "四", title: "退房・平安回家", highlight: "確認行李、提早前往機場",
    hotel: "—", walkingLevel: "低", indoorRatio: 85, restStops: ["飯店大廳", "福岡機場候機區"],
    rainPlan: "飯店至機場改搭計程車。", momFriendlyNote: "至少提前三小時到機場，不安排其他景點。",
    items: [
      { id:"d5-1", time:"09:00", title:"早餐與整理行李", location:hotel, type:"住宿", note:"檢查護照、票券與充電器。", walkingLevel:"低", environment:"室內", momFriendlyNote:"重物平均分裝。", rainPlan:"原行程。", restStops:"房間、大廳" },
      { id:"d5-2", time:"11:00", title:"退房前往機場", location:"博多 → 福岡機場", type:"交通", note:"依航班時間調整出發。", walkingLevel:"低", environment:"室內／室外", momFriendlyNote:"行李多時直接搭計程車。", rainPlan:"搭計程車。", restStops:"機場候機區" },
    ],
  },
];

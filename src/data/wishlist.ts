import type { ChecklistItemData } from "@/types/trip";

export const wishlistCategories = ["景點", "餐廳", "咖啡", "購物", "雨天備案", "媽媽友善", "棒球相關"];

export const wishlistItems: ChecklistItemData[] = [
  { id:"ohori", name:"大濠公園短段散步", category:"景點", area:"中央區", reason:"天氣好時看水景，行程感比較完整", suitability:"中", momFriendly:"中", note:"只走短段，不繞湖一圈；炎熱時取消" },
  { id:"kushida", name:"櫛田神社", category:"景點", area:"博多舊市街", reason:"博多代表性景點，離市區近", suitability:"中", momFriendly:"中", note:"早上短停留；下雨或太熱改室內" },
  { id:"dazaifu", name:"太宰府", category:"景點", area:"太宰府", reason:"正式必去地點", suitability:"中", momFriendly:"中", note:"2026-08-03 安排，雨天縮短戶外段" },
  { id:"kumamoto", name:"熊本一日遊", category:"景點", area:"熊本", reason:"正式必去地點", suitability:"中", momFriendly:"中", note:"2026-08-04 從博多搭新幹線往返，不安排阿蘇" },

  { id:"yoshizuka", name:"吉塚鰻魚屋候補", category:"餐廳", area:"中洲川端", reason:"名店候補", suitability:"中", momFriendly:"中", note:"不訂位不硬排；排隊太久就換店" },
  { id:"hakata-food", name:"博多站餐廳街", category:"餐廳", area:"博多站", reason:"離飯店近、選擇多", suitability:"高", momFriendly:"高", note:"抵達日與晚餐首選" },
  { id:"dome-food", name:"球場或 MARK IS 賽前用餐", category:"餐廳", area:"百道", reason:"8/5 看球前不用趕路", suitability:"高", momFriendly:"高", note:"不指定餐廳，現場以好坐、等待短為主" },

  { id:"rec-coffee", name:"REC COFFEE 候補", category:"咖啡", area:"博多／天神", reason:"安排坐下休息", suitability:"高", momFriendly:"高", note:"找最近分店，不為咖啡繞遠路" },
  { id:"department-cafe", name:"百貨咖啡店", category:"咖啡", area:"天神／博多", reason:"購物中段休息", suitability:"高", momFriendly:"高", note:"有座位比名氣重要" },

  { id:"tenjin-underground", name:"天神地下街", category:"購物", area:"天神", reason:"雨天可走、百貨相連", suitability:"高", momFriendly:"中～高", note:"距離長，分段逛" },
  { id:"hakata-hankyu", name:"Hakata Hankyu 食品樓層", category:"購物", area:"博多站", reason:"伴手禮好買，離飯店近", suitability:"高", momFriendly:"高", note:"最後兩天補買" },
  { id:"canal", name:"Canal City Hakata", category:"購物", area:"博多", reason:"室內備案與補買", suitability:"中～高", momFriendly:"中", note:"樓層多，注意不要來回走" },

  { id:"asian-art", name:"福岡亞洲美術館", category:"雨天備案", area:"中洲川端", reason:"室內、地鐵可到", suitability:"高", momFriendly:"高", note:"雨天或高溫替代戶外" },
  { id:"fukuoka-art", name:"福岡市美術館", category:"雨天備案", area:"大濠公園", reason:"可替代大濠公園戶外段", suitability:"中～高", momFriendly:"高", note:"有座位與洗手間" },
  { id:"hotel-rest", name:"飯店大浴場／房間休息", category:"媽媽友善", area:"博多", reason:"旅行中段恢復體力", suitability:"高", momFriendly:"高", note:"休息是正式行程，不算浪費" },
  { id:"taxi-day", name:"短程計程車日", category:"媽媽友善", area:"全市區", reason:"下雨、炎熱、腳痠時保留體力", suitability:"高", momFriendly:"高", note:"兩人同行時很實用" },

  { id:"paypay-dome", name:"Mizuho PayPay Dome Fukuoka", category:"棒球相關", area:"百道", reason:"8/5 確定看比賽", suitability:"高", momFriendly:"中～高", note:"18:00 福岡軟銀鷹 VS 北海道日本火腿鬥士；座位區域與票券形式待確認" },
  { id:"mark-is", name:"MARK IS 福岡百道", category:"棒球相關", area:"百道", reason:"賽前休息與用餐", suitability:"高", momFriendly:"高", note:"避免太早在球場外站著等" },
  { id:"teamlab", name:"teamLab Forest 福岡", category:"棒球相關", area:"百道", reason:"球場旁室內候補", suitability:"中", momFriendly:"中", note:"互動展較耗體力，先問媽媽想不想去" },
];

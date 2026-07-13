import type { ChecklistItemData } from "@/types/trip";

export const packingCategories = ["證件", "現金 / 支付", "衣物", "藥品", "電子用品", "盥洗用品", "旅行小物", "媽媽用品", "棒球觀賽用品", "雨具 / 防曬"];

export const packingItems: ChecklistItemData[] = [
  { id:"passport", name:"護照", category:"證件", important:true, note:"確認效期、姓名與入境資料" },
  { id:"flight-summary", name:"航班資訊摘要", category:"證件", important:true, note:"航空公司、航班編號、時間、航廈與行李額度待填；截圖存在手機安全位置" },
  { id:"hotel-summary", name:"住宿摘要", category:"證件", important:true, note:"訂房編號不要放公開頁，另存在安全位置" },
  { id:"insurance", name:"旅遊保險摘要", category:"證件", note:"保險公司、海外緊急電話與理賠聯絡方式待填；保單號碼不放公開頁" },
  { id:"emergency-card", name:"緊急聯絡小卡", category:"證件", important:true, note:"紙本一份放隨身包" },

  { id:"jpy-cash", name:"日幣現金", category:"現金 / 支付", important:true, note:"小額紙鈔與零錢包" },
  { id:"credit-card", name:"信用卡", category:"現金 / 支付", important:true, note:"海外刷卡與掛失電話另存" },
  { id:"ic-card", name:"交通 IC 卡或手機支付", category:"現金 / 支付", note:"餘額出發前確認" },
  { id:"coin-purse", name:"零錢包", category:"現金 / 支付", note:"日本現金與零錢使用頻率高" },

  { id:"tops", name:"薄上衣 5 件", category:"衣物", note:"8 月福岡炎熱，排汗好洗為主" },
  { id:"bottoms", name:"下身 3–4 件", category:"衣物" },
  { id:"shoes", name:"好走的鞋", category:"衣物", important:true, note:"球場與車站都需要走路" },
  { id:"jacket", name:"薄外套", category:"衣物", note:"百貨、地鐵、球場冷氣使用" },
  { id:"sleepwear", name:"睡衣／居家服", category:"衣物" },

  { id:"daily-meds", name:"每日用藥", category:"藥品", important:true, note:"媽媽與自己的份量分開放" },
  { id:"mom-meds", name:"媽媽常備藥", category:"藥品", important:true, note:"用藥名稱與吃法另備紙本" },
  { id:"stomach", name:"腸胃藥與止痛藥", category:"藥品" },
  { id:"motion", name:"暈車／暈機藥", category:"藥品", note:"若平常會暈車再帶" },
  { id:"bandage", name:"OK 繃與防磨貼", category:"藥品", note:"腳跟與小傷口備用" },

  { id:"phone", name:"手機", category:"電子用品", important:true },
  { id:"charger", name:"充電器與充電線", category:"電子用品", important:true },
  { id:"powerbank", name:"行動電源", category:"電子用品", important:true, note:"球賽日必帶" },
  { id:"earphones", name:"耳機", category:"電子用品" },
  { id:"adapter", name:"備用插頭／延長線", category:"電子用品", note:"日本插座通常可用台灣兩扁腳，仍帶備用" },

  { id:"toothbrush", name:"牙刷與牙膏", category:"盥洗用品", note:"飯店備品仍可自備習慣款" },
  { id:"skincare", name:"保養品小瓶", category:"盥洗用品" },
  { id:"wet-tissue", name:"濕紙巾／酒精棉片", category:"盥洗用品" },
  { id:"mask", name:"口罩", category:"盥洗用品", important:true, note:"機場、車廂或人多處備用" },
  { id:"towel", name:"小毛巾", category:"盥洗用品", note:"夏天擦汗用" },

  { id:"umbrella-small", name:"折疊雨傘", category:"旅行小物", important:true },
  { id:"bottle", name:"水壺", category:"旅行小物", note:"夏天補水" },
  { id:"shopping-bag", name:"折疊購物袋", category:"旅行小物" },
  { id:"zip-bag", name:"夾鏈袋", category:"旅行小物", note:"收納票券、藥品、小物" },
  { id:"luggage-scale", name:"行李秤", category:"旅行小物", note:"伴手禮買多時使用" },

  { id:"mom-shoes", name:"媽媽好走鞋／替換襪", category:"媽媽用品", important:true },
  { id:"mom-knee", name:"護膝或輕便坐墊", category:"媽媽用品", note:"視平常習慣攜帶" },
  { id:"mom-memo", name:"媽媽用藥與過敏備忘", category:"媽媽用品", important:true, note:"紙本與手機各一份" },
  { id:"cooling", name:"涼感小物", category:"媽媽用品", note:"涼感巾或小扇子，避免中暑" },

  { id:"baseball-ticket", name:"棒球票券提醒", category:"棒球觀賽用品", important:true, note:"8/6 Mizuho PayPay Dome；對戰組合、開賽時間、座位、票券形式與取票方式待填" },
  { id:"baseball-battery", name:"球賽日行動電源", category:"棒球觀賽用品", important:true },
  { id:"baseball-towel", name:"應援毛巾／外套", category:"棒球觀賽用品", note:"球場冷氣與紀念照用" },
  { id:"baseball-bag", name:"輕便隨身包", category:"棒球觀賽用品", note:"只帶必要物品進場" },

  { id:"sunscreen", name:"防曬乳", category:"雨具 / 防曬", important:true },
  { id:"hat", name:"帽子", category:"雨具 / 防曬", note:"戶外短段散步用" },
  { id:"uv", name:"陽傘或防曬外套", category:"雨具 / 防曬" },
  { id:"rain-cover", name:"行李雨罩／塑膠袋", category:"雨具 / 防曬", note:"雨天移動備用" },
];

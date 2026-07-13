import type { ChecklistItemData } from "@/types/trip";

export const shoppingCategories = ["伴手禮", "藥妝", "零食", "生活用品", "棒球周邊", "媽媽想買"];

export const shoppingItems: ChecklistItemData[] = [
  { id:"fukutaro-mentai-senbei", name:"福太郎めんべい／明太子仙貝", category:"伴手禮", important:true, price:"待確認", location:"博多站或福岡市區門市，實際地點待確認", note:"必買；保留福太郎品牌，不與やまや明太子仙貝合併" },
  { id:"torimon", name:"明月堂博多通りもん", category:"伴手禮", important:true, price:"待確認", location:"博多站周邊，實際門市待確認", note:"必買" },
  { id:"amanberry", name:"AMANBERRY／アマンベリー", category:"伴手禮", important:true, price:"待確認", location:"博多站周邊／博多阪急，實際庫存待確認", note:"必買；福岡甘王草莓甜點，圖片中白色紅條紋盒裝商品" },
  { id:"yamaya-mentai-senbei", name:"やまや明太子仙貝", category:"伴手禮", important:true, price:"待確認", location:"博多站或福岡市區，實際門市待確認", note:"必買；明太子米果，這不是福太郎めんべい，兩項都保留" },
  { id:"ito-king-hakata-paiou", name:"伊都きんぐ 博多ぱいおう", category:"伴手禮", important:true, price:"待確認", location:"博多站或福岡機場，實際門市待確認", note:"必買；甘王草莓派點心，圖片中綠色草莓盒裝商品" },
  { id:"red-white-round-senbei", name:"紅白圓形仙貝（正式品名待確認）", category:"伴手禮", price:"待確認", location:"待確認", note:"想買；目前圖片文字不清楚，之後確認商品名稱再更新" },
  { id:"mentaiko", name:"明太子相關伴手禮候補", category:"伴手禮", price:"待確認", location:"博多站／福岡機場", note:"常溫保存與液體限制現場確認" },
  { id:"amaou", name:"福岡草莓系點心", category:"伴手禮", price:"約 ¥800–1,800", location:"博多站", note:"福岡感明顯，適合送人" },
  { id:"station-gift", name:"博多站限定禮盒候補", category:"伴手禮", price:"待確認", location:"博多站", note:"依保存期限與重量決定" },

  { id:"patch", name:"休足時間／痠痛貼布", category:"藥妝", price:"約 ¥600–1,200", location:"天神藥妝／博多站", note:"媽媽與自己都可用" },
  { id:"eye-drops", name:"眼藥水候補", category:"藥妝", price:"待確認", location:"天神藥妝", note:"品牌與款式現場確認" },
  { id:"stomach-meds", name:"腸胃藥候補", category:"藥妝", price:"待確認", location:"藥妝店", note:"注意成分與平常用藥衝突" },
  { id:"cooling-sheets", name:"退熱貼／涼感貼", category:"藥妝", price:"約 ¥400–900", location:"藥妝店", note:"8 月旅行備用" },

  { id:"kyushu-snacks", name:"福岡／九州限定零食", category:"零食", price:"約 ¥500–1,500", location:"博多站", note:"看包裝大小與保存期限" },
  { id:"ramen-pack", name:"博多拉麵包裝食品", category:"零食", price:"約 ¥800–2,000", location:"博多站／機場", note:"重量較重，最後再決定" },
  { id:"senbei", name:"其他仙貝候補", category:"零食", price:"待確認", location:"博多站", note:"福太郎明太子仙貝已列為必買，其他款式現場再看" },

  { id:"towel", name:"日本製小毛巾", category:"生活用品", price:"約 ¥700–1,500", location:"天神百貨／博多站", note:"自用或送媽媽" },
  { id:"stationery", name:"文具／收納小物", category:"生活用品", price:"待確認", location:"天神／博多", note:"不特地繞路，有看到再買" },
  { id:"eco-bag", name:"折疊購物袋", category:"生活用品", price:"約 ¥500–1,500", location:"雜貨店", note:"旅行中也能立刻用" },

  { id:"hawks-towel", name:"軟銀鷹紀念毛巾", category:"棒球周邊", price:"待確認", location:"Mizuho PayPay Dome", note:"8/5 到球場再看款式" },
  { id:"hawks-keychain", name:"球隊鑰匙圈／小物", category:"棒球周邊", price:"待確認", location:"Mizuho PayPay Dome", note:"小件好帶，不佔行李" },
  { id:"baseball-photo", name:"球場紀念照／票根保存", category:"棒球周邊", price:"待確認", location:"Mizuho PayPay Dome", note:"票根與照片比大型周邊更實用" },

  { id:"mom-request", name:"媽媽想買項目待補", category:"媽媽想買", price:"待確認", location:"天神／博多", note:"出發前請媽媽先列 3 個最想買的" },
  { id:"mom-tea", name:"茶點／甜點候補", category:"媽媽想買", price:"待確認", location:"百貨食品樓層", note:"看保存期限與重量" },
  { id:"mom-daily", name:"媽媽生活用品候補", category:"媽媽想買", price:"待確認", location:"百貨／藥妝", note:"不要為了找單一物品走太遠" },
];

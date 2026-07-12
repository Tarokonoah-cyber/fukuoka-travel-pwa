import type { ChecklistItemData } from "@/types/trip";
export const wishlistCategories=["景點","餐廳","咖啡","購物","雨天備案","媽媽友善"];
export const wishlistItems: ChecklistItemData[]=[
  {id:"ohori",name:"大濠公園",category:"景點",area:"中央區",reason:"早晨散步景色好",suitability:"視氣溫決定",note:"炎熱時取消"},
  {id:"yoshizuka",name:"吉塚鰻魚屋",category:"餐廳",area:"中洲",reason:"福岡老店",suitability:"中",note:"排隊過長就換店"},
  {id:"rec-coffee",name:"REC COFFEE",category:"咖啡",area:"博多／天神",reason:"安排一段坐下休息",suitability:"高"},
  {id:"loft",name:"天神雜貨店巡禮",category:"購物",area:"天神",reason:"文具與生活用品",suitability:"高"},
  {id:"museum",name:"福岡市博物館",category:"雨天備案",area:"百道",reason:"室內且有座位",suitability:"高"},
  {id:"spa",name:"飯店大浴場休息",category:"媽媽友善",area:"博多",reason:"旅行中段恢復體力",suitability:"高"},
];

import type { ChecklistItemData } from "@/types/trip";
export const packingCategories = ["證件", "衣物", "藥品", "電子用品", "盥洗用品", "旅行小物", "媽媽用品"];
export const packingItems: ChecklistItemData[] = [
  {id:"passport",name:"護照",category:"證件",important:true,note:"確認效期與姓名"},{id:"ticket",name:"電子機票摘要",category:"證件",important:true},{id:"insurance",name:"旅遊保險資料",category:"證件"},
  {id:"tops",name:"薄上衣 5 件",category:"衣物"},{id:"shoes",name:"好走的鞋",category:"衣物",important:true},{id:"jacket",name:"薄外套",category:"衣物",note:"室內冷氣使用"},
  {id:"daily-meds",name:"每日用藥",category:"藥品",important:true},{id:"stomach",name:"腸胃藥與止痛藥",category:"藥品"},{id:"bandage",name:"OK 繃",category:"藥品"},
  {id:"phone",name:"手機與充電線",category:"電子用品",important:true},{id:"powerbank",name:"行動電源",category:"電子用品"},{id:"adapter",name:"充電插頭",category:"電子用品"},
  {id:"toothbrush",name:"牙刷與牙膏",category:"盥洗用品"},{id:"sunscreen",name:"防曬用品",category:"盥洗用品"},{id:"towel",name:"小毛巾",category:"盥洗用品"},
  {id:"umbrella",name:"輕便雨傘",category:"旅行小物"},{id:"bottle",name:"水壺",category:"旅行小物"},{id:"bag",name:"折疊購物袋",category:"旅行小物"},
  {id:"mom-meds",name:"媽媽備用藥",category:"媽媽用品",important:true},{id:"mom-card",name:"緊急聯絡小卡",category:"媽媽用品",important:true},{id:"cushion",name:"輕便坐墊／護膝",category:"媽媽用品"},
];

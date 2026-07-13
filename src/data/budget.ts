import type { BudgetPlan, ExpenseCategory, ExpensePaymentMethod } from "@/types/budget";

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  meal: "餐飲",
  transport: "交通",
  shopping: "購物",
  souvenir: "伴手禮",
  drugstore: "藥妝",
  baseball: "棒球",
  hotel: "住宿",
  ticket: "門票",
  coffee: "咖啡",
  other: "其他",
};

export const expensePaymentMethodLabels: Record<ExpensePaymentMethod, string> = {
  cash: "現金",
  card: "信用卡",
  ic: "交通 IC",
  other: "其他",
};

export const quickExpenseAmounts = [500, 1000, 1500, 3000, 5000, 10000];

export const budgetPlan: BudgetPlan = {
  totalBudgetJpy: 160000,
  reserveJpy: 20000,
  note: "目前沿用第 3B 階段示範預算；本次未提供正式預算金額，旅行總預算、每日預算與各分類預算仍待填／待調整。",
  dailyBudgets: [
    { date: "2026-08-02", label: "DAY 1 抵達與博多", amountJpy: 22000, note: "示範值沿用；正式每日預算待填／待調整。" },
    { date: "2026-08-03", label: "DAY 2 博多 / 天神購物", amountJpy: 38000, note: "示範值沿用；正式每日預算待填／待調整。" },
    { date: "2026-08-04", label: "DAY 3 半日景點", amountJpy: 26000, note: "示範值沿用；正式每日預算待填／待調整。" },
    { date: "2026-08-05", label: "DAY 4 彈性補買", amountJpy: 36000, note: "示範值沿用；正式每日預算待填／待調整。" },
    { date: "2026-08-06", label: "DAY 5 Mizuho PayPay Dome", amountJpy: 38000, note: "示範值沿用；球賽與周邊正式預算待填／待調整。" },
  ],
  categoryBudgets: [
    { category: "meal", label: "餐飲", amountJpy: 36000, note: "示範值沿用；正式餐飲預算待填／待調整。" },
    { category: "transport", label: "交通", amountJpy: 15000, note: "示範值沿用；正式交通預算待填／待調整。" },
    { category: "shopping", label: "購物", amountJpy: 30000, note: "示範值沿用；正式購物預算待填／待調整。" },
    { category: "souvenir", label: "伴手禮", amountJpy: 25000, note: "示範值沿用；正式伴手禮預算待填／待調整。" },
    { category: "drugstore", label: "藥妝", amountJpy: 20000, note: "示範值沿用；正式藥妝預算待填／待調整。" },
    { category: "baseball", label: "棒球", amountJpy: 18000, note: "示範值沿用；棒球與周邊正式預算待填／待調整。" },
    { category: "hotel", label: "住宿", amountJpy: 0, note: "住宿是否列入旅行現地花費待填／待確認。" },
    { category: "ticket", label: "門票", amountJpy: 6000, note: "示範值沿用；正式門票預算待填／待調整。" },
    { category: "coffee", label: "咖啡", amountJpy: 6000, note: "示範值沿用；正式咖啡休息預算待填／待調整。" },
    { category: "other", label: "其他 / 備用", amountJpy: 4000, note: "示範值沿用；備用金與其他支出待填／待調整。" },
  ],
  paymentMethods: [
    { method: "cash", label: "現金", note: "小店、餐券機與零錢支出。" },
    { method: "card", label: "信用卡", note: "百貨、藥妝與大額購物；不記錄卡號。" },
    { method: "ic", label: "交通 IC", note: "地鐵、公車、便利商店小額支付。" },
    { method: "other", label: "其他", note: "待分類或臨時支付方式。" },
  ],
};

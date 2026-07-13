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
  note: "示範預算，待調整；可依實際換匯、球賽周邊與購物需求調整。",
  dailyBudgets: [
    { date: "2026-08-02", label: "DAY 1 抵達與博多", amountJpy: 22000, note: "含抵達交通、晚餐、便利商店與小額採買，待調整。" },
    { date: "2026-08-03", label: "DAY 2 博多 / 天神購物", amountJpy: 38000, note: "購物與伴手禮可能偏高，待調整。" },
    { date: "2026-08-04", label: "DAY 3 半日景點", amountJpy: 26000, note: "含餐飲、交通、咖啡休息與少量門票。" },
    { date: "2026-08-05", label: "DAY 4 彈性補買", amountJpy: 36000, note: "預留藥妝、伴手禮與媽媽想逛的店。" },
    { date: "2026-08-06", label: "DAY 5 PayPay Dome", amountJpy: 38000, note: "含球場餐飲、交通、周邊商品；票券金額待確認。" },
  ],
  categoryBudgets: [
    { category: "meal", label: "餐飲", amountJpy: 36000, note: "正餐、便利商店與點心，待調整。" },
    { category: "transport", label: "交通", amountJpy: 15000, note: "地鐵、公車、計程車備案與機場移動。" },
    { category: "shopping", label: "購物", amountJpy: 30000, note: "服飾、生活雜貨與臨時想買的東西。" },
    { category: "souvenir", label: "伴手禮", amountJpy: 25000, note: "博多通りもん、明太子、九州限定零食等。" },
    { category: "drugstore", label: "藥妝", amountJpy: 20000, note: "貼布、保養、常備用品；依實際需求調整。" },
    { category: "baseball", label: "棒球", amountJpy: 18000, note: "PayPay Dome 餐飲與周邊；票券另待確認。" },
    { category: "hotel", label: "住宿", amountJpy: 0, note: "住宿若已預付，可不列入旅行現地花費。" },
    { category: "ticket", label: "門票", amountJpy: 6000, note: "美術館、室內景點或臨時門票。" },
    { category: "coffee", label: "咖啡", amountJpy: 6000, note: "休息點、咖啡與甜點。" },
    { category: "other", label: "其他 / 備用", amountJpy: 4000, note: "不可預期小支出；另有備用金。" },
  ],
  paymentMethods: [
    { method: "cash", label: "現金", note: "小店、餐券機與零錢支出。" },
    { method: "card", label: "信用卡", note: "百貨、藥妝與大額購物；不記錄卡號。" },
    { method: "ic", label: "交通 IC", note: "地鐵、公車、便利商店小額支付。" },
    { method: "other", label: "其他", note: "待分類或臨時支付方式。" },
  ],
};

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
  totalBudgetJpy: 0,
  reserveJpy: 0,
  note: "尚未設定預算；目前只使用花費紀錄功能，不把未確認金額顯示為正式預算。",
  dailyBudgets: [
    { date: "2026-08-02", label: "DAY 1 抵達與博多", amountJpy: 0, note: "尚未設定每日預算。" },
    { date: "2026-08-03", label: "DAY 2 太宰府 / 柳川", amountJpy: 0, note: "尚未設定每日預算。" },
    { date: "2026-08-04", label: "DAY 3 熊本一日遊", amountJpy: 0, note: "尚未設定每日預算。" },
    { date: "2026-08-05", label: "DAY 4 天神地下街 / Mizuho PayPay Dome", amountJpy: 0, note: "尚未設定每日預算。" },
    { date: "2026-08-06", label: "DAY 5 回程", amountJpy: 0, note: "尚未設定每日預算。" },
  ],
  categoryBudgets: [
    { category: "meal", label: "餐飲", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "transport", label: "交通", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "shopping", label: "購物", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "souvenir", label: "伴手禮", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "drugstore", label: "藥妝", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "baseball", label: "棒球", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "hotel", label: "住宿", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "ticket", label: "門票", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "coffee", label: "咖啡", amountJpy: 0, note: "尚未設定分類預算。" },
    { category: "other", label: "其他 / 備用", amountJpy: 0, note: "尚未設定分類預算。" },
  ],
  paymentMethods: [
    { method: "cash", label: "現金", note: "小店、餐券機與零錢支出。" },
    { method: "card", label: "信用卡", note: "百貨、藥妝與大額購物；不記錄卡號。" },
    { method: "ic", label: "交通 IC", note: "地鐵、公車、便利商店小額支付。" },
    { method: "other", label: "其他", note: "待分類或臨時支付方式。" },
  ],
};

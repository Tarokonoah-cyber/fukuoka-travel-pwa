import type { CurrencyRate } from "@/types/currency";
import { CURRENCY_CACHE_KEY } from "./storage";

const CURRENCY_CACHE_MS = 12 * 60 * 60 * 1000;

type FrankfurterRate = { date?: string; base?: string; quote?: string; rate?: number };

function readCurrencyCache() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(CURRENCY_CACHE_KEY) ?? "") as CurrencyRate;
    return value?.base === "JPY" && value.quote === "TWD" && value.rate > 0 && value.fetchedAt ? value : null;
  } catch { return null; }
}

function saveCurrencyCache(data: CurrencyRate) {
  if (typeof window !== "undefined") localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(data));
}

export async function fetchJpyTwdRate(): Promise<CurrencyRate> {
  const cached = readCurrencyCache();
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < CURRENCY_CACHE_MS) return { ...cached, stale: false };
  if (cached && typeof navigator !== "undefined" && !navigator.onLine) return { ...cached, stale: true };
  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rate/JPY/TWD");
    if (!response.ok) throw new Error(`Currency request failed: ${response.status}`);
    const payload = await response.json() as FrankfurterRate;
    if (payload.base !== "JPY" || payload.quote !== "TWD" || typeof payload.rate !== "number" || payload.rate <= 0 || !payload.date) throw new Error("Currency response is incomplete");
    const data: CurrencyRate = { base: "JPY", quote: "TWD", rate: payload.rate, date: payload.date, fetchedAt: new Date().toISOString(), stale: false };
    saveCurrencyCache(data);
    return data;
  } catch (error) {
    if (cached) return { ...cached, stale: true };
    throw error;
  }
}

export function convertCurrency(amount: number, rate: number, direction: "JPY_TWD" | "TWD_JPY") {
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) return 0;
  return direction === "JPY_TWD" ? amount * rate : amount / rate;
}

export type CurrencyOperator = "+" | "-";

export function calculateCurrencyAmount(left: number, right: number, operator: CurrencyOperator) {
  return operator === "+" ? left + right : left - right;
}

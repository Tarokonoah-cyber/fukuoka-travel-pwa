export type CurrencyRate = {
  base: "JPY";
  quote: "TWD";
  rate: number;
  date: string;
  fetchedAt: string;
  stale: boolean;
};

export type CurrencyState =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: CurrencyRate; error: null }
  | { status: "error"; data: null; error: string };

export type CurrencyDirection = "JPY_TWD" | "TWD_JPY";

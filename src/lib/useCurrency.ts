"use client";
import { useEffect, useState } from "react";
import { fetchJpyTwdRate } from "./currency";
import type { CurrencyState } from "@/types/currency";

const initialState: CurrencyState = { status: "loading", data: null, error: null };

export function useCurrency() {
  const [state, setState] = useState<CurrencyState>(initialState);
  useEffect(() => {
    let subscribed = true;
    fetchJpyTwdRate().then((data) => { if (subscribed) setState({ status: "success", data, error: null }); })
      .catch(() => { if (subscribed) setState({ status: "error", data: null, error: "暫時無法取得最新匯率" }); });
    return () => { subscribed = false; };
  }, []);
  return state;
}

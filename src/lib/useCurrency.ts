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
      .catch(() => {
        if (subscribed) {
          const message = navigator.onLine ? "暫時無法取得最新匯率" : "離線中，且沒有已儲存的匯率資料";
          setState({ status: "error", data: null, error: message });
        }
      });
    return () => { subscribed = false; };
  }, []);
  return state;
}

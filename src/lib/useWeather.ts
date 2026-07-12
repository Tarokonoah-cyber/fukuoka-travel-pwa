"use client";
import { useEffect, useState } from "react";
import { fetchFukuokaWeather } from "./weather";
import type { WeatherState } from "@/types/weather";

const initialState: WeatherState = { status: "loading", data: null, error: null };

export function useWeather() {
  const [state, setState] = useState<WeatherState>(initialState);
  useEffect(() => {
    let subscribed = true;
    fetchFukuokaWeather().then((data) => { if (subscribed) setState({ status: "success", data, error: null }); })
      .catch(() => { if (subscribed) setState({ status: "error", data: null, error: "暫時無法取得福岡天氣" }); });
    return () => { subscribed = false; };
  }, []);
  return state;
}

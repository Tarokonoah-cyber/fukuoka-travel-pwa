"use client";
import { useSyncExternalStore } from "react";
import { getTaipeiDateKey, getTripStatusForDateKey, TRIP_START_DATE, type TripStatus } from "./date";

export type TripStatusView = TripStatus | {
  phase: "loading";
  countdown: 0;
  day: 1;
  activeDate: typeof TRIP_START_DATE;
};

const loadingStatus: TripStatusView = { phase: "loading", countdown: 0, day: 1, activeDate: TRIP_START_DATE };
const getServerSnapshot = () => "";
const getClientSnapshot = () => getTaipeiDateKey();

function subscribe(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}

export function useTripStatus(): TripStatusView {
  const dateKey = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return dateKey ? getTripStatusForDateKey(dateKey) : loadingStatus;
}

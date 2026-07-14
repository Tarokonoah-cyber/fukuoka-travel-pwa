"use client";

import { itinerary } from "@/data/itinerary";
import { useTripStatus } from "@/lib/useTripStatus";
import { DayPlanController } from "./DayPlanController";

export function HomeTripController() {
  const status = useTripStatus();
  if (status.phase !== "active") return null;
  return <DayPlanController day={itinerary[status.day - 1]} variant="home" />;
}

import type { ResolvedDayPlanItem } from "@/lib/dayPlan";
import type { Place } from "@/types/place";

export type TravelPosition = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
};

export type CompanionRiskLevel = "safe" | "watch" | "urgent" | "overdue";

export type CompanionAdvice = {
  id: "schedule" | "weather";
  tone: "plain" | "watch" | "urgent";
  title: string;
  detail: string;
};

export type NearbyPlace = {
  place: Place;
  distanceKm: number;
  walkingUrl: string;
  taxiUrl: string;
};

export type CompanionSnapshot = {
  current: ResolvedDayPlanItem | null;
  next: ResolvedDayPlanItem | null;
  upcomingFixed: ResolvedDayPlanItem | null;
  riskLevel: CompanionRiskLevel;
  riskMinutes: number | null;
  adjustableItems: ResolvedDayPlanItem[];
  advice: CompanionAdvice[];
  distanceTarget: Place | null;
  distanceToTargetKm: number | null;
  nearbyPlaces: NearbyPlace[];
};

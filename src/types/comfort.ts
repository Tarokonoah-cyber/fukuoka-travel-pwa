export type ComfortDecision =
  | "go_as_planned"
  | "slow_down"
  | "switch_to_indoor"
  | "shorten_day"
  | "rest_first";

export type ComfortSignal = {
  label: string;
  value: string;
  tone?: "plain" | "blue" | "warm";
};

export type ComfortReport = {
  decision: ComfortDecision;
  label: string;
  reason: string;
  signals: ComfortSignal[];
  riskTips: string[];
  adjustments: string[];
  momChecklist: { label: string; ok: boolean; note: string }[];
  rainNote: string;
  restStops: string[];
  weatherAvailable: boolean;
  weatherStale: boolean;
};

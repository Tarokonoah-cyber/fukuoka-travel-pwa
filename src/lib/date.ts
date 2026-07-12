export const TRIP_START_DATE = "2026-08-02";
export const TRIP_END_DATE = "2026-08-06";
export const TRIP_TIME_ZONE = "Asia/Taipei";

export type TripStatus = {
  phase: "before" | "during" | "after";
  countdown: number;
  day: number;
  activeDate: string;
};

const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TRIP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateKeyToUtcMs(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error(`Invalid date key: ${dateKey}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function getTaipeiDateKey(now = new Date()) {
  const parts = taipeiDateFormatter.formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getTripStatusForDateKey(dateKey: string): TripStatus {
  const today = dateKeyToUtcMs(dateKey);
  const start = dateKeyToUtcMs(TRIP_START_DATE);
  const end = dateKeyToUtcMs(TRIP_END_DATE);
  const dayMs = 86_400_000;

  if (today < start) {
    return { phase: "before", countdown: Math.ceil((start - today) / dayMs), day: 1, activeDate: TRIP_START_DATE };
  }
  if (today > end) {
    return { phase: "after", countdown: 0, day: 5, activeDate: TRIP_END_DATE };
  }

  const day = Math.floor((today - start) / dayMs) + 1;
  return { phase: "during", countdown: 0, day, activeDate: dateKey };
}

export function getTripStatus(now = new Date()) {
  return getTripStatusForDateKey(getTaipeiDateKey(now));
}

function dateKeyToNoonUtc(dateKey: string) {
  return new Date(dateKeyToUtcMs(dateKey) + 12 * 60 * 60 * 1000);
}

export function formatTripDate(iso: string) {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: TRIP_TIME_ZONE, month: "numeric", day: "numeric", weekday: "short" }).format(dateKeyToNoonUtc(iso));
}

export function formatToday(now = new Date()) {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: TRIP_TIME_ZONE, year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(now);
}

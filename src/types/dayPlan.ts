export const dayPlanStatuses = ["pending", "active", "completed", "skipped"] as const;

export type DayPlanStatus = (typeof dayPlanStatuses)[number];

export type DayPlanCustomFields = {
  title: string;
  timeLabel: string;
  startTime: string | null;
  location: string;
  note: string;
};
export type DayPlanItemState = {
  date: string;
  itemId: string;
  status: DayPlanStatus;
  sortOrder: number;
  isCustom: boolean;
  custom: DayPlanCustomFields | null;
  updatedAt: string;
};

export type DayPlanResponse = {
  date: string;
  items: DayPlanItemState[];
  updatedAt: string | null;
};

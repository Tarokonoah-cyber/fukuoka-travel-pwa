export type PrepPriority = "critical" | "important" | "nice_to_have";

export type PrepCategory =
  | "flight"
  | "hotel"
  | "baseball"
  | "transport"
  | "map"
  | "shopping"
  | "restaurant"
  | "packing"
  | "other";

export type PrepItem = {
  id: string;
  title: string;
  category: PrepCategory;
  priority: PrepPriority;
  source: string;
  note?: string;
  dueHint?: string;
};

export type PrepFilter = PrepCategory | "all";

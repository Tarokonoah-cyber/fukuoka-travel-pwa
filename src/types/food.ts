export const foodPriorities = ["must", "nearby", "backup", "removed"] as const;
export type FoodPriority = (typeof foodPriorities)[number];

export const foodCategories = [
  "breakfast", "lunch", "dinner", "ramen", "udon", "yakiniku", "hotpot", "seafood", "izakaya",
  "cafe", "dessert", "street-food", "late-night", "souvenir", "unagi", "wagyu", "other",
] as const;
export type FoodCategory = (typeof foodCategories)[number];

export const foodAreas = [
  "博多站", "祇園／櫛田神社", "中洲／川端", "天神", "大濠公園", "唐人町／福岡巨蛋",
  "太宰府", "柳川", "熊本", "福岡機場", "其他",
] as const;
export type FoodArea = (typeof foodAreas)[number];

export const foodReservationStatuses = ["required", "available", "not_available", "unknown"] as const;
export type FoodReservationStatus = (typeof foodReservationStatuses)[number];

export const foodQueueLevels = ["low", "medium", "high", "unknown"] as const;
export type FoodQueueLevel = (typeof foodQueueLevels)[number];

export const foodMomStatuses = ["good", "normal", "poor"] as const;
export type FoodMomStatus = (typeof foodMomStatuses)[number];

export const foodSortOptions = ["default", "area", "category", "queue", "mom", "created", "name", "visited"] as const;
export type FoodSortOption = (typeof foodSortOptions)[number];

export type FoodCandidate = {
  id: string;
  name: string;
  japaneseName: string;
  description: string;
  priority: FoodPriority;
  category: FoodCategory[];
  area: FoodArea;
  recommendedItems: string[];
  googleMapsUrl: string;
  tabelogUrl: string;
  officialUrl: string;
  reservationUrl: string;
  reservation: FoodReservationStatus;
  queueLevel: FoodQueueLevel;
  motherFriendly: FoodMomStatus;
  motherFriendlyNote: string;
  openingHours: string;
  lastOrder: string;
  closedDays: string;
  suitableTime: string[];
  walkingMinutes: number | null;
  transportNote: string;
  budget: string;
  relatedDay: string[];
  visited: boolean;
  visitedAt: string | null;
  rating: number | null;
  review: string;
  demo: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type FoodFilters = {
  keyword: string;
  priority: "active" | FoodPriority;
  category: "all" | FoodCategory;
  area: "all" | FoodArea;
  motherFriendly: "all" | FoodMomStatus;
  reservation: "all" | FoodReservationStatus;
  queueLevel: "all" | FoodQueueLevel;
  visited: "all" | "visited" | "unvisited";
};

export type FoodRecommendationGroup = {
  id: "must" | "backup" | "snack";
  label: string;
  items: FoodCandidate[];
};

export type FoodCandidatesResponse = {
  items: FoodCandidate[];
  updatedAt: string | null;
};

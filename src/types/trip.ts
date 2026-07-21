export type WalkingLevel = "低" | "中" | "中高" | "高";
export type PlaceType = "交通" | "景點" | "餐廳" | "購物" | "休息" | "住宿" | "棒球";

export interface TimelineItem {
  id: string; time: string; title: string; location: string; type: PlaceType;
  startTime?: string; fixedTime?: boolean; placeId?: string;
  note: string; walkingLevel: WalkingLevel; environment: "室內" | "室外" | "室內／室外";
  momFriendlyNote: string; heatPlan: string; rainPlan: string; restStops: string; mapHref: string;
}

export interface TripDayImage {
  src: string;
  alt: string;
  caption: string;
  author: string;
  sourceHref: string;
  licenseName: string;
  licenseHref: string;
}

export interface TripDay {
  day: number; date: string; weekday: string; title: string; highlight: string;
  image: TripDayImage;
  hotel: string; walkingLevel: WalkingLevel; indoorRatio: number;
  restStops: string[]; rainPlan: string; momFriendlyNote: string; items: TimelineItem[];
}

export interface ChecklistItemData {
  id: string; name: string; category: string; important?: boolean; note?: string;
  imageId?: string;
  price?: number | string; location?: string; area?: string; reason?: string; suitability?: string; momFriendly?: string;
}

export interface TransportRoute {
  id: string; from: string; to: string; method: string; duration: string;
  transfer: string; transferCount: string; note: string; momFriendlyNote: string;
  rainPlan: string; heatPlan: string; walkingLevel?: WalkingLevel; accessibilityNote?: string; mapHref?: string;
}

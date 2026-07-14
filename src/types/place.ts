export type PlaceCategory =
  | "hotel"
  | "transport"
  | "attraction"
  | "restaurant"
  | "shopping"
  | "baseball"
  | "rest"
  | "wishlist";

export type Place = {
  id: string;
  name: string;
  journeySide: "origin" | "destination";
  category: PlaceCategory;
  area: string;
  latitude: number;
  longitude: number;
  address?: string;
  note?: string;
  day?: string;
  googleMapsUrl?: string;
  momFriendlyNote?: string;
  indoor?: boolean;
  priority?: "must" | "optional" | "backup";
};

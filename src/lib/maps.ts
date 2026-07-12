import type { Place } from "@/types/place";

export function getGoogleMapsUrl(place: Place) {
  if (place.googleMapsUrl) return place.googleMapsUrl;
  const query = encodeURIComponent(`${place.latitude},${place.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

import type { Place } from "@/types/place";

export function getGoogleMapsUrl(place: Place) {
  if (place.googleMapsUrl) return place.googleMapsUrl;
  const query = encodeURIComponent(`${place.latitude},${place.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getGoogleMapsDirectionsUrl(place: Pick<Place, "latitude" | "longitude">, travelMode: "walking" | "driving") {
  const destination = encodeURIComponent(`${place.latitude},${place.longitude}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${travelMode}`;
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { divIcon, latLngBounds } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { placeCategoryLabels } from "@/data/places";
import { getGoogleMapsUrl } from "@/lib/maps";
import type { Place, PlaceCategory } from "@/types/place";

const markerLabels: Record<PlaceCategory, string> = {
  hotel: "宿", transport: "站", attraction: "景", restaurant: "食", shopping: "買", baseball: "球", rest: "休", wishlist: "願",
};

function FitMapToPlaces({ places, selectedPlaceId }: { places: Place[]; selectedPlaceId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPlaceId) return;
    if (!places.length) return;
    if (places.length === 1) map.setView([places[0].latitude, places[0].longitude], 14);
    else map.fitBounds(latLngBounds(places.map((place) => [place.latitude, place.longitude])), { padding: [28, 28], maxZoom: 14 });
  }, [map, places, selectedPlaceId]);
  return null;
}

function FocusSelectedPlace({ places, selectedPlaceId }: { places: Place[]; selectedPlaceId: string | null }) {
  const map = useMap();
  useEffect(() => {
    const selected = places.find((place) => place.id === selectedPlaceId);
    if (selected) map.setView([selected.latitude, selected.longitude], 15, { animate: true });
  }, [map, places, selectedPlaceId]);
  return null;
}

export function TripMap({ places, selectedPlaceId, onSelectPlace }: { places: Place[]; selectedPlaceId: string | null; onSelectPlace: (placeId: string) => void }) {
  const [tileFailed, setTileFailed] = useState(false);
  const tileEvents = useMemo(() => ({ tileerror: () => setTileFailed(true) }), []);
  const icons = useMemo(() => Object.fromEntries(Object.keys(markerLabels).map((category) => [category, divIcon({
    className: `trip-marker marker-${category}`,
    html: `<span>${markerLabels[category as PlaceCategory]}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  })])) as Record<PlaceCategory, ReturnType<typeof divIcon>>, []);

  return <div className="map-canvas-wrap">
    <MapContainer center={[33.5902, 130.4017]} zoom={12} scrollWheelZoom={false} className="trip-map" zoomControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        eventHandlers={tileEvents}
      />
      <FitMapToPlaces places={places} selectedPlaceId={selectedPlaceId} />
      <FocusSelectedPlace places={places} selectedPlaceId={selectedPlaceId} />
      {places.map((place) => <Marker key={place.id} position={[place.latitude, place.longitude]} icon={icons[place.category]} title={place.name} alt={place.name} eventHandlers={{ click: () => onSelectPlace(place.id) }}>
        <Popup maxWidth={250} minWidth={190}>
          <div className="map-popup"><span>{placeCategoryLabels[place.category]} · {place.area}</span><strong>{place.name}</strong>{place.note&&<p>{place.note}</p>}{place.momFriendlyNote&&<p className="map-popup-memo"><b>媽媽友善</b>{place.momFriendlyNote}</p>}<a href={getGoogleMapsUrl(place)} target="_blank" rel="noopener noreferrer">開啟 Google Maps ↗</a></div>
        </Popup>
      </Marker>)}
    </MapContainer>
    {tileFailed&&<div className="tile-fallback" role="status">底圖暫時無法載入，仍可使用下方點位連結。</div>}
  </div>;
}

import type { TripPhase } from "@/lib/date";
import type { Place, PlaceCategory } from "@/types/place";
import type { ChecklistItemData } from "@/types/trip";

export type ChecklistView = "incomplete" | "important" | "all";
export type MapScope = "destination" | "today" | "all";

export function defaultMapScope(phase: TripPhase): MapScope {
  if (phase === "active") return "today";
  if (phase === "after") return "all";
  return "destination";
}

export function filterChecklistItems(
  items: ChecklistItemData[],
  checkedIds: ReadonlySet<string>,
  view: ChecklistView,
  category: string,
) {
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (view === "incomplete") return !checkedIds.has(item.id);
    if (view === "important") return Boolean(item.important);
    return true;
  });
}

export function filterMapPlaces(
  allPlaces: Place[],
  scope: MapScope,
  activeDate: string,
  category: "all" | PlaceCategory,
) {
  return allPlaces.filter((place) => {
    const inScope = scope === "all"
      || (scope === "destination" && place.journeySide === "destination")
      || (scope === "today" && place.day === activeDate);
    return inScope && (category === "all" || place.category === category);
  });
}

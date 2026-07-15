"use client";

import { useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DayTimeline } from "@/components/DayTimeline";
import { TripDayPhoto } from "@/components/TripDayPhoto";
import { itinerary } from "@/data/itinerary";
import { formatTripDate } from "@/lib/date";
import { useTripStatus } from "@/lib/useTripStatus";

function subscribeToHashChange(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashDay() {
  const dayNumber = Number(window.location.hash.match(/^#day-(\d+)$/)?.[1]);
  return itinerary.some((day) => day.day === dayNumber) ? dayNumber : null;
}

export default function ItineraryPage() {
  const status = useTripStatus();
  const [chosenDay, setChosenDay] = useState<number | null>(null);
  const hashDay = useSyncExternalStore(subscribeToHashChange, getHashDay, () => null);
  const activeDayNumber = chosenDay ?? hashDay ?? (status.phase === "active" ? status.day : 1);
  const activeDay = itinerary.find((day) => day.day === activeDayNumber) ?? itinerary[0];

  const selectDay = (dayNumber: number) => {
    setChosenDay(dayNumber);
    window.history.replaceState(null, "", `#day-${dayNumber}`);
    requestAnimationFrame(() => {
      document.getElementById("itinerary-day-panel")?.scrollIntoView({ block: "start" });
    });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % itinerary.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + itinerary.length) % itinerary.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = itinerary.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    selectDay(itinerary[nextIndex].day);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>("[role='tab']")
      [nextIndex]?.focus();
  };

  const isToday = status.phase === "active" && status.day === activeDay.day;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="5 DAYS / 4 NIGHTS"
        title="全部行程"
        description="選擇日期查看當天行程，走累了就休息。"
      />

      <div className="day-jump" role="tablist" aria-label="選擇行程日期">
        {itinerary.map((day, index) => {
          const isActive = day.day === activeDay.day;
          const shortDate = day.date.slice(5).replace("-", "/");

          return (
            <button
              type="button"
              role="tab"
              id={`day-tab-${day.day}`}
              aria-controls="itinerary-day-panel"
              aria-selected={isActive}
              aria-label={`DAY ${day.day}，${shortDate}`}
              tabIndex={isActive ? 0 : -1}
              className={isActive ? "active" : undefined}
              key={day.day}
              onClick={() => selectDay(day.day)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <small>DAY {day.day}</small>
              {shortDate}
            </button>
          );
        })}
      </div>

      <div className="all-days">
        <section
          id="itinerary-day-panel"
          role="tabpanel"
          aria-labelledby={`day-tab-${activeDay.day}`}
          className={isToday ? "day-section current" : "day-section"}
        >
          <header className="day-heading">
            <div>
              <span>DAY {activeDay.day} · {formatTripDate(activeDay.date)}</span>
              <h2>{activeDay.title}</h2>
            </div>
            {isToday && <b>今天</b>}
          </header>
          <TripDayPhoto image={activeDay.image} eager />
          <div className="hotel-band">
            <span>今晚住宿</span>
            <strong>{activeDay.hotel}</strong>
          </div>
          <div className="day-brief">
            <span>步行量 <b>{activeDay.walkingLevel}</b></span>
            <span>室內 <b>{activeDay.indoorRatio}%</b></span>
            <span>休息點 <b>{activeDay.restStops.length}</b></span>
          </div>
          <p className="mom-note">
            <b>媽媽友善提醒</b>
            {activeDay.momFriendlyNote}
          </p>
          <DayTimeline day={activeDay} />
        </section>
      </div>
    </div>
  );
}

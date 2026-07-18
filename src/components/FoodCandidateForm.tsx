"use client";

import { useEffect, useRef, useState } from "react";
import { foodCategoryLabels } from "@/lib/food";
import { foodCandidateSchema } from "@/lib/foodSchema";
import {
  foodAreas,
  foodCategories,
  foodMomStatuses,
  foodPriorities,
  foodQueueLevels,
  foodReservationStatuses,
  type FoodCandidate,
} from "@/types/food";

const tripDays = [
  ["2026-08-02", "DAY 1 · 8/2"],
  ["2026-08-03", "DAY 2 · 8/3"],
  ["2026-08-04", "DAY 3 · 8/4"],
  ["2026-08-05", "DAY 4 · 8/5"],
  ["2026-08-06", "DAY 5 · 8/6"],
] as const;

const labels = {
  priority: { must: "必吃", nearby: "順路可吃", backup: "備選", removed: "已淘汰" },
  reservation: { required: "必須預約", available: "可預約", not_available: "不可預約／現場候位", unknown: "待確認" },
  queue: { low: "低", medium: "中", high: "高", unknown: "待確認" },
  mom: { good: "友善", normal: "普通", poor: "不友善" },
} as const;

function emptyCandidate(): FoodCandidate {
  const now = new Date().toISOString();
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? `food-${crypto.randomUUID()}` : `food-${Date.now()}`,
    name: "",
    japaneseName: "",
    description: "",
    priority: "backup",
    category: ["other"],
    area: "博多站",
    recommendedItems: [],
    googleMapsUrl: "",
    tabelogUrl: "",
    officialUrl: "",
    reservationUrl: "",
    reservation: "unknown",
    queueLevel: "unknown",
    motherFriendly: "normal",
    motherFriendlyNote: "",
    openingHours: "待確認",
    lastOrder: "待確認",
    closedDays: "待確認",
    suitableTime: [],
    walkingMinutes: null,
    transportNote: "",
    budget: "預算待確認",
    relatedDay: [],
    visited: false,
    visitedAt: null,
    rating: null,
    review: "",
    demo: false,
    notes: "自行新增；資訊請於出發前再次確認。",
    createdAt: now,
    updatedAt: now,
  };
}

export function FoodCandidateForm({ candidate, onSave, onCancel }: {
  candidate: FoodCandidate | null;
  onSave: (candidate: FoodCandidate) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<FoodCandidate>(() => candidate ?? emptyCandidate());
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function update<K extends keyof FoodCandidate>(key: K, value: FoodCandidate[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleCategory(category: FoodCandidate["category"][number]) {
    setDraft((current) => {
      const hasCategory = current.category.includes(category);
      const categories = hasCategory
        ? current.category.filter((item) => item !== category)
        : [...current.category.filter((item) => item !== "other"), category];
      return { ...current, category: categories.length ? categories : ["other"] };
    });
  }

  function toggleDay(date: string) {
    update("relatedDay", draft.relatedDay.includes(date)
      ? draft.relatedDay.filter((item) => item !== date)
      : [...draft.relatedDay, date].sort());
  }

  function splitList(value: string) {
    return value.split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = foodCandidateSchema.safeParse(draft);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue?.path[0] === "googleMapsUrl" ? "請填入有效的 Google Maps 網址。" : issue?.message ?? "請檢查必填欄位。");
      return;
    }
    setError("");
    onSave(parsed.data);
  }

  return (
    <section className="food-form-panel" aria-labelledby="food-form-title">
      <div className="food-form-heading">
        <div><span>EDITOR</span><h2 id="food-form-title">{candidate ? "編輯美食候選" : "新增美食候選"}</h2></div>
        <button type="button" onClick={onCancel} aria-label="關閉美食表單">×</button>
      </div>
      <form className="food-form" onSubmit={submit} noValidate>
        {error && <p className="food-form-error" role="alert">{error}</p>}
        <label className="food-form-wide"><span>店名 *</span><input ref={nameRef} value={draft.name} maxLength={160} onChange={(event) => update("name", event.target.value)} required /></label>
        <label className="food-form-wide"><span>日文店名</span><input value={draft.japaneseName} maxLength={160} onChange={(event) => update("japaneseName", event.target.value)} /></label>
        <label className="food-form-wide"><span>一句話描述 *</span><textarea value={draft.description} maxLength={500} rows={2} onChange={(event) => update("description", event.target.value)} required /></label>
        <label><span>優先度</span><select value={draft.priority} onChange={(event) => update("priority", event.target.value as FoodCandidate["priority"])}>{foodPriorities.map((item) => <option key={item} value={item}>{labels.priority[item]}</option>)}</select></label>
        <label><span>區域</span><select value={draft.area} onChange={(event) => update("area", event.target.value as FoodCandidate["area"])}>{foodAreas.map((item) => <option key={item}>{item}</option>)}</select></label>
        <fieldset className="food-form-wide food-choice-field"><legend>料理類型</legend><div>{foodCategories.map((item) => <label key={item}><input type="checkbox" checked={draft.category.includes(item)} onChange={() => toggleCategory(item)} /><span>{foodCategoryLabels[item]}</span></label>)}</div></fieldset>
        <label className="food-form-wide"><span>推薦餐點（以逗號分隔）</span><input value={draft.recommendedItems.join("、")} maxLength={600} onChange={(event) => update("recommendedItems", splitList(event.target.value))} /></label>
        <label className="food-form-wide"><span>Google Maps 網址 *</span><input type="url" inputMode="url" value={draft.googleMapsUrl} maxLength={600} placeholder="https://www.google.com/maps/..." onChange={(event) => update("googleMapsUrl", event.target.value)} required /></label>
        <label><span>Tabelog 網址</span><input type="url" inputMode="url" value={draft.tabelogUrl} maxLength={600} onChange={(event) => update("tabelogUrl", event.target.value)} /></label>
        <label><span>官方網站</span><input type="url" inputMode="url" value={draft.officialUrl} maxLength={600} onChange={(event) => update("officialUrl", event.target.value)} /></label>
        <label><span>訂位網址</span><input type="url" inputMode="url" value={draft.reservationUrl} maxLength={600} onChange={(event) => update("reservationUrl", event.target.value)} /></label>
        <label><span>訂位</span><select value={draft.reservation} onChange={(event) => update("reservation", event.target.value as FoodCandidate["reservation"])}>{foodReservationStatuses.map((item) => <option key={item} value={item}>{labels.reservation[item]}</option>)}</select></label>
        <label><span>候位</span><select value={draft.queueLevel} onChange={(event) => update("queueLevel", event.target.value as FoodCandidate["queueLevel"])}>{foodQueueLevels.map((item) => <option key={item} value={item}>{labels.queue[item]}</option>)}</select></label>
        <label><span>媽媽友善</span><select value={draft.motherFriendly} onChange={(event) => update("motherFriendly", event.target.value as FoodCandidate["motherFriendly"])}>{foodMomStatuses.map((item) => <option key={item} value={item}>{labels.mom[item]}</option>)}</select></label>
        <label><span>適合前往時段</span><input value={draft.suitableTime.join("、")} maxLength={600} placeholder="例如：DAY 3 午餐" onChange={(event) => update("suitableTime", splitList(event.target.value))} /></label>
        <label><span>營業時間</span><input value={draft.openingHours} maxLength={160} onChange={(event) => update("openingHours", event.target.value)} /></label>
        <label><span>最後點餐</span><input value={draft.lastOrder} maxLength={160} onChange={(event) => update("lastOrder", event.target.value)} /></label>
        <label><span>公休日</span><input value={draft.closedDays} maxLength={160} onChange={(event) => update("closedDays", event.target.value)} /></label>
        <label><span>預算提示</span><input value={draft.budget} maxLength={160} onChange={(event) => update("budget", event.target.value)} /></label>
        <label><span>步行分鐘（選填）</span><input type="number" min="0" max="300" value={draft.walkingMinutes ?? ""} onChange={(event) => update("walkingMinutes", event.target.value === "" ? null : Number(event.target.value))} /></label>
        <label className="food-form-wide"><span>媽媽友善備註</span><textarea value={draft.motherFriendlyNote} maxLength={500} rows={2} onChange={(event) => update("motherFriendlyNote", event.target.value)} /></label>
        <label className="food-form-wide"><span>交通／順路提示</span><textarea value={draft.transportNote} maxLength={500} rows={2} onChange={(event) => update("transportNote", event.target.value)} /></label>
        <label className="food-form-wide"><span>資料備註</span><textarea value={draft.notes} maxLength={1000} rows={2} onChange={(event) => update("notes", event.target.value)} /></label>
        <fieldset className="food-form-wide food-choice-field"><legend>適合哪一天</legend><div>{tripDays.map(([date, label]) => <label key={date}><input type="checkbox" checked={draft.relatedDay.includes(date)} onChange={() => toggleDay(date)} /><span>{label}</span></label>)}</div></fieldset>
        <div className="food-form-actions food-form-wide"><button type="button" className="food-button-secondary" onClick={onCancel}>取消</button><button type="submit" className="food-button-primary">儲存候選</button></div>
      </form>
    </section>
  );
}

"use client";

import { useState } from "react";
import {
  foodCategoryLabels,
  foodMapsDirectionUrl,
  foodMomLabels,
  foodPriorityLabels,
  foodQueueLabels,
  foodReservationLabels,
} from "@/lib/food";
import type { FoodCandidate } from "@/types/food";

export function FoodCandidateCard({ item, activeDate, canAddToToday, addedToToday, onEdit, onSave, onAddToToday }: {
  item: FoodCandidate;
  activeDate: string;
  canAddToToday: boolean;
  addedToToday: boolean;
  onEdit: () => void;
  onSave: (item: FoodCandidate) => void;
  onAddToToday: () => void;
}) {
  const [showReview, setShowReview] = useState(false);
  const [visitedAt, setVisitedAt] = useState(item.visitedAt ?? activeDate);
  const [rating, setRating] = useState(item.rating?.toString() ?? "");
  const [review, setReview] = useState(item.review);

  function saveVisit() {
    if (!/^2026-08-0[2-6]$/.test(visitedAt)) return;
    onSave({ ...item, visited: true, visitedAt, rating: rating ? Number(rating) : null, review: review.trim() });
    setShowReview(false);
  }

  function clearVisit() {
    onSave({ ...item, visited: false, visitedAt: null, rating: null, review: "" });
  }

  function beginReview() {
    setVisitedAt(item.visitedAt ?? activeDate);
    setRating(item.rating?.toString() ?? "");
    setReview(item.review);
    setShowReview(true);
  }

  return (
    <article className={`food-card priority-${item.priority}${item.visited ? " visited" : ""}`}>
      <div className="food-card-topline">
        <span className="food-priority-badge">{foodPriorityLabels[item.priority]}</span>
        <span>{item.area}</span>
        {item.demo && <em>示範資料</em>}
        {item.visited && <strong>已吃 {item.rating ? `· ${"★".repeat(item.rating)}` : ""}</strong>}
      </div>
      <h2>{item.name}</h2>
      {item.japaneseName && item.japaneseName !== item.name && <p className="food-card-japanese" lang="ja">{item.japaneseName}</p>}
      <p className="food-card-description">{item.description}</p>
      <div className="food-tag-row">
        {item.category.map((category) => <span key={category}>{foodCategoryLabels[category]}</span>)}
        <span>{item.budget || "預算待確認"}</span>
        <span>{foodMomLabels[item.motherFriendly]}</span>
        <span>{foodQueueLabels[item.queueLevel]}</span>
      </div>

      <div className="food-card-main-actions">
        <a className="food-button-primary" href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
        {canAddToToday && <button type="button" className="food-button-secondary" disabled={addedToToday} onClick={onAddToToday}>{addedToToday ? "已加入今天" : "＋ 加入今天"}</button>}
      </div>

      <details className="food-card-details">
        <summary>查看完整資訊 <span aria-hidden>＋</span></summary>
        <dl>
          <div><dt>推薦餐點</dt><dd>{item.recommendedItems.length ? item.recommendedItems.join("、") : "待確認"}</dd></div>
          <div><dt>建議時段</dt><dd>{item.suitableTime.length ? item.suitableTime.join("、") : "彈性"}</dd></div>
          <div><dt>營業時間</dt><dd>{item.openingHours}</dd></div>
          <div><dt>最後點餐</dt><dd>{item.lastOrder}</dd></div>
          <div><dt>公休日</dt><dd>{item.closedDays}</dd></div>
          <div><dt>訂位</dt><dd>{foodReservationLabels[item.reservation]}</dd></div>
          <div><dt>預算</dt><dd>{item.budget || "待確認"}</dd></div>
          <div><dt>步行</dt><dd>{item.walkingMinutes === null ? "待確認" : `約 ${item.walkingMinutes} 分鐘`}</dd></div>
          <div><dt>媽媽同行</dt><dd>{item.motherFriendlyNote || foodMomLabels[item.motherFriendly]}</dd></div>
          <div><dt>交通／順路</dt><dd>{item.transportNote || "待確認"}</dd></div>
          <div><dt>適合日期</dt><dd>{item.relatedDay.length ? item.relatedDay.map((date) => `${Number(date.slice(-2)) === 2 ? "DAY 1" : `DAY ${Number(date.slice(-2)) - 1}`} · ${Number(date.slice(5, 7))}/${Number(date.slice(-2))}`).join("、") : "未指定"}</dd></div>
          <div><dt>注意事項</dt><dd>{item.notes || "自行新增"}</dd></div>
          {item.visited && <div><dt>用餐紀錄</dt><dd>{item.visitedAt} {item.rating ? `· ${"★".repeat(item.rating)}` : ""}{item.review ? ` · ${item.review}` : ""}</dd></div>}
        </dl>
        <div className="food-link-row">
          <a href={foodMapsDirectionUrl(item, "walking")} target="_blank" rel="noopener noreferrer">步行路線 ↗</a>
          <a href={foodMapsDirectionUrl(item, "driving")} target="_blank" rel="noopener noreferrer">計程車路線 ↗</a>
          {item.tabelogUrl && <a href={item.tabelogUrl} target="_blank" rel="noopener noreferrer">Tabelog ↗</a>}
          {item.officialUrl && <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">官方網站 ↗</a>}
          {item.reservationUrl && <a href={item.reservationUrl} target="_blank" rel="noopener noreferrer">前往訂位 ↗</a>}
        </div>
      </details>

      {showReview && <div className="food-review-form">
        <strong>記下這次用餐</strong>
        <label>日期<input type="date" min="2026-08-02" max="2026-08-06" value={visitedAt} onChange={(event) => setVisitedAt(event.target.value)} required /></label>
        <label>評分（選填）<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="">不評分</option>{[5, 4, 3, 2, 1].map((score) => <option key={score} value={score}>{score} 星</option>)}</select></label>
        <label>心得（選填）<textarea maxLength={1000} rows={2} value={review} onChange={(event) => setReview(event.target.value)} /></label>
        <div><button type="button" className="food-button-secondary" onClick={() => setShowReview(false)}>取消</button><button type="button" className="food-button-primary" disabled={!/^2026-08-0[2-6]$/.test(visitedAt)} onClick={saveVisit}>儲存用餐紀錄</button></div>
      </div>}

      <div className="food-card-edit-actions">
        {item.visited ? <button type="button" onClick={clearVisit}>改為未吃</button> : <button type="button" onClick={beginReview}>標記已吃</button>}
        <button type="button" onClick={onEdit}>編輯</button>
        {item.priority !== "backup" && item.priority !== "removed" && <button type="button" onClick={() => onSave({ ...item, priority: "backup" })}>移至備選</button>}
        {item.priority !== "removed" ? <button type="button" className="danger" onClick={() => { if (window.confirm(`將「${item.name}」移至已淘汰？`)) onSave({ ...item, priority: "removed" }); }}>淘汰</button> : <button type="button" onClick={() => onSave({ ...item, priority: "backup" })}>恢復為備選</button>}
      </div>
    </article>
  );
}

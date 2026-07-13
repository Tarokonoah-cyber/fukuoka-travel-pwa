"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  filterPrepItems,
  getCategoryCompletion,
  getPrepCategories,
  getPrepSummary,
  groupPrepItemsByPriority,
  prepCategoryLabels,
  prepPriorityLabels,
} from "@/lib/prep";
import {
  getPrepChecksSnapshot,
  getServerPrepChecksSnapshot,
  parsePrepChecksSnapshot,
  subscribeToPrepChecks,
  togglePrepCheck,
} from "@/lib/prepStorage";
import type { PrepFilter, PrepItem } from "@/types/prep";

type PrepPageClientProps = {
  items: PrepItem[];
};

export function PrepPageClient({ items }: PrepPageClientProps) {
  const [filter, setFilter] = useState<PrepFilter>("all");
  const snapshot = useSyncExternalStore(subscribeToPrepChecks, getPrepChecksSnapshot, getServerPrepChecksSnapshot);
  const checkedIds = useMemo(() => new Set(parsePrepChecksSnapshot(snapshot).checked), [snapshot]);
  const summary = getPrepSummary(items, checkedIds);
  const visibleItems = filterPrepItems(items, filter);
  const groups = groupPrepItemsByPriority(visibleItems).filter((group) => group.items.length > 0);
  const categories = getPrepCategories(items);

  return (
    <>
      <section className="prep-summary" aria-labelledby="prep-summary-title">
        <div className="prep-summary-main">
          <span>PRE-TRIP CHECK</span>
          <h2 id="prep-summary-title">
            {summary.done} / {summary.total} 已確認
          </h2>
          <div className="mini-progress" aria-label={`完成度 ${summary.percent}%`}>
            <span style={{ width: `${summary.percent}%` }} />
          </div>
          <p>{summary.remaining ? `還有 ${summary.remaining} 項待處理。` : "行前待補資料已全部確認。"}</p>
        </div>
        <div className="prep-summary-counts">
          <PrepCount label="必補" value={summary.openCritical} tone="critical" />
          <PrepCount label="重要" value={summary.openImportant} />
          <PrepCount label="可再補" value={summary.openNiceToHave} />
        </div>
      </section>

      {summary.openCritical > 0 && (
        <div className="prep-warning" role="status">
          <strong>核心資料未補齊</strong>
          <p>航班、保險、緊急聯絡與球賽票券建議出發前優先確認。</p>
        </div>
      )}

      <section aria-labelledby="prep-filter-title">
        <div className="section-header">
          <h2 id="prep-filter-title">分類查看</h2>
          <span>filter</span>
        </div>
        <div className="prep-filter-chips" role="list" aria-label="行前檢查分類">
          <button className={filter === "all" ? "active" : ""} type="button" onClick={() => setFilter("all")}>
            全部
            <small>{items.length}</small>
          </button>
          {categories.map((category) => {
            const completion = getCategoryCompletion(items, checkedIds, category);
            return (
              <button
                className={filter === category ? "active" : ""}
                key={category}
                type="button"
                onClick={() => setFilter(category)}
              >
                {prepCategoryLabels[category]}
                <small>
                  {completion.done}/{completion.total}
                </small>
              </button>
            );
          })}
        </div>
      </section>

      {groups.map((group) => (
        <section className="prep-group" aria-labelledby={`prep-${group.priority}`} key={group.priority}>
          <div className="section-header">
            <h2 id={`prep-${group.priority}`}>{group.label}</h2>
            <span>{group.items.length} items</span>
          </div>
          <p className="prep-group-note">{group.description}</p>
          <div className="prep-list">
            {group.items.map((item) => {
              const checked = checkedIds.has(item.id);
              return (
                <label className={checked ? "prep-item checked" : "prep-item"} key={item.id}>
                  <input
                    checked={checked}
                    type="checkbox"
                    onChange={() => togglePrepCheck(item.id)}
                    aria-label={`確認${item.title}`}
                  />
                  <span className="prep-check-box" aria-hidden="true">
                    {checked ? "✓" : ""}
                  </span>
                  <span className="prep-copy">
                    <span className="prep-item-meta">
                      <b>{prepCategoryLabels[item.category]}</b>
                      <b className={`priority-${item.priority}`}>{prepPriorityLabels[item.priority]}</b>
                      {item.dueHint && <small>{item.dueHint}</small>}
                    </span>
                    <strong>{item.title}</strong>
                    {item.note && <span>{item.note}</span>}
                    <em>來源：{item.source}</em>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function PrepCount({ label, value, tone }: { label: string; value: number; tone?: "critical" }) {
  return (
    <div className={tone === "critical" && value > 0 ? "prep-count critical" : "prep-count"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

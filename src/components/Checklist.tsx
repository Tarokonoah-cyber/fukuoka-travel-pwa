"use client";

import { useMemo, useState } from "react";
import { filterChecklistItems, type ChecklistView } from "@/lib/experience";
import { resolveShoppingItemImage } from "@/lib/shoppingImages";
import type { ShoppingImageAsset } from "@/types/shopping";
import type { ChecklistItemData } from "@/types/trip";
import type { TravelNamespace } from "@/types/travelSync";
import { ChecklistItem } from "./ChecklistItem";
import { EmptyState } from "./EmptyState";
import { ProgressBar } from "./ProgressBar";
import { SectionHeader } from "./SectionHeader";
import { useTravelSync } from "./TravelSyncProvider";

type ChecklistNamespace = Exclude<TravelNamespace, "prep">;

type ChecklistProps = {
  items: ChecklistItemData[];
  categories: string[];
  namespace: ChecklistNamespace;
  customPlaceholder?: string;
  shoppingImageAssets?: readonly ShoppingImageAsset[];
};

const views: Array<{ value: ChecklistView; label: string }> = [
  { value: "incomplete", label: "未完成" },
  { value: "important", label: "重要" },
  { value: "all", label: "全部" },
];

export function Checklist({
  items,
  categories,
  namespace,
  customPlaceholder = "新增項目",
  shoppingImageAssets,
}: ChecklistProps) {
  const sync = useTravelSync();
  const stateItems = sync.items.filter((item) => item.namespace === namespace);
  const checked = useMemo(
    () => new Set(stateItems.filter((item) => item.checked).map((item) => item.itemId)),
    [stateItems],
  );
  const custom = useMemo<ChecklistItemData[]>(
    () => stateItems
      .filter((item) => item.isCustom && item.name && item.category)
      .map((item) => ({
        id: item.itemId,
        name: item.name!,
        category: item.category!,
        note: item.note ?? undefined,
        sourceUrl: item.sourceUrl ?? undefined,
      })),
    [stateItems],
  );
  const [name, setName] = useState("");
  const [addCategory, setAddCategory] = useState(categories[0]);
  const [view, setView] = useState<ChecklistView>("incomplete");
  const [filterCategory, setFilterCategory] = useState("all");
  const all = useMemo(() => [...items, ...custom], [items, custom]);
  const itemImages = useMemo(() => {
    if (!shoppingImageAssets) return new Map();
    return new Map(all.map((item) => [
      item.id,
      resolveShoppingItemImage(item, shoppingImageAssets, { isCustom: item.id.startsWith("custom-") }),
    ]));
  }, [all, shoppingImageAssets]);
  const filtered = useMemo(
    () => filterChecklistItems(all, checked, view, filterCategory),
    [all, checked, filterCategory, view],
  );
  const visibleCategories = categories.filter((category) => filtered.some((item) => item.category === category));

  function add() {
    const clean = name.trim();
    if (!clean) return;
    sync.addCustomItem(namespace, clean, addCategory);
    setName("");
  }

  return (
    <div className="checklist-wrap">
      <ProgressBar value={all.filter((item) => checked.has(item.id)).length} total={all.length} />
      <div className="checklist-toolbar">
        <div className="checklist-view-tabs" role="group" aria-label="清單顯示方式">
          {views.map((option) => (
            <button
              key={option.value}
              type="button"
              className={view === option.value ? "active" : ""}
              aria-pressed={view === option.value}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label>
          <span>分類</span>
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
            <option value="all">所有分類</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
      </div>
      <p className="checklist-filter-count" role="status">顯示 {filtered.length} 項 · 已完成 {checked.size} 項</p>
      <details className="add-panel">
        <summary>＋ 新增自訂項目</summary>
        <form className="add-form" onSubmit={(event) => { event.preventDefault(); add(); }}>
          <label>
            <span>項目名稱</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={customPlaceholder} />
          </label>
          <label>
            <span>分類</span>
            <select value={addCategory} onChange={(event) => setAddCategory(event.target.value)}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <button type="submit">新增</button>
        </form>
      </details>
      {visibleCategories.length === 0 ? (
        <EmptyState>
          <p>{view === "incomplete" ? "這個範圍已全部完成。" : "這個範圍沒有項目。"}</p>
          <button type="button" className="empty-state-action" onClick={() => { setView("all"); setFilterCategory("all"); }}>查看全部</button>
        </EmptyState>
      ) : visibleCategories.map((category) => {
        const list = filtered.filter((item) => item.category === category);
        const totalInCategory = all.filter((item) => item.category === category).length;
        const doneInCategory = all.filter((item) => item.category === category && checked.has(item.id)).length;
        return (
          <section className="check-group" key={category}>
            <SectionHeader title={category} note={`${doneInCategory} / ${totalInCategory}`} />
            <div>
              {list.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  image={itemImages.get(item.id)}
                  checked={checked.has(item.id)}
                  disabled={sync.status === "loading"}
                  onToggle={() => sync.toggleItem(namespace, item.id)}
                  onDelete={item.id.startsWith("custom-") ? () => sync.deleteCustomItem(namespace, item.id) : undefined}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

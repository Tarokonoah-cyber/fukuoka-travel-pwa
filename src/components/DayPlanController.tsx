"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getNowNextItems, resolveDayPlanItems, type ResolvedDayPlanItem } from "@/lib/dayPlan";
import { getTokyoTimeKey } from "@/lib/date";
import type { DayPlanCustomFields, DayPlanStatus } from "@/types/dayPlan";
import type { TripDay } from "@/types/trip";
import { SmartCompanionCard } from "./SmartCompanionCard";
import { useTravelSync } from "./TravelSyncProvider";

function navigationUrl(location: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
}

function toSeed(date: string, item: ResolvedDayPlanItem) {
  return {
    date,
    itemId: item.id,
    sortOrder: item.sortOrder,
    isCustom: item.isCustom,
    custom: item.isCustom ? {
      title: item.title,
      timeLabel: item.time,
      startTime: item.startTime ?? null,
      location: item.location,
      note: item.note,
    } : null,
    updatedAt: item.updatedAt,
  };
}

function statusLabel(status: DayPlanStatus) {
  return { pending: "待前往", active: "進行中", completed: "已完成", skipped: "已跳過" }[status];
}

export function DayPlanController({ day, variant = "today", timeAware = true }: { day: TripDay; variant?: "home" | "today"; timeAware?: boolean }) {
  const sync = useTravelSync();
  const ensureDayPlan = sync.ensureDayPlan;
  const [tokyoTime, setTokyoTime] = useState(() => getTokyoTimeKey());
  const [showAdd, setShowAdd] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [adjustmentCandidateIds, setAdjustmentCandidateIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [timeLabel, setTimeLabel] = useState("彈性");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    void ensureDayPlan(day.date);
    const timer = window.setInterval(() => setTokyoTime(getTokyoTimeKey()), 30_000);
    return () => window.clearInterval(timer);
  }, [day.date, ensureDayPlan]);

  const stateItems = useMemo(() => sync.dayItems.filter((item) => item.date === day.date), [day.date, sync.dayItems]);
  const items = useMemo(() => resolveDayPlanItems(day.items, stateItems), [day.items, stateItems]);
  const effectiveTime = timeAware ? tokyoTime : "00:00";
  const nowNext = useMemo(() => getNowNextItems(items, effectiveTime), [effectiveTime, items]);

  function changeStatus(item: ResolvedDayPlanItem, status: DayPlanStatus) {
    sync.setDayItemStatus(toSeed(day.date, item), status);
  }

  function move(itemIndex: number, direction: -1 | 1) {
    const nextIndex = itemIndex + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const reordered = [...items];
    [reordered[itemIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[itemIndex]];
    sync.reorderDayPlanItems(day.date, reordered.map((item) => toSeed(day.date, item)));
  }

  function addItem() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const custom: DayPlanCustomFields = {
      title: trimmedTitle,
      timeLabel: timeLabel.trim() || "彈性",
      startTime: startTime || null,
      location: location.trim(),
      note: note.trim(),
    };
    sync.addDayPlanItem(day.date, custom, (items.at(-1)?.sortOrder ?? 0) + 100);
    setTitle(""); setTimeLabel("彈性"); setStartTime(""); setLocation(""); setNote(""); setShowAdd(false);
  }

  function revealAdjustments(itemIds: string[]) {
    setAdjustmentCandidateIds(itemIds);
    setShowPlan(true);
    setShowAdd(false);
    window.setTimeout(() => document.getElementById(`day-plan-${itemIds[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  if (variant === "home") {
    return (
      <section className="day-control day-control-compact" aria-label="智慧旅伴摘要">
        <SmartCompanionCard day={day} items={items} tokyoTime={tokyoTime} compact onComplete={(item) => changeStatus(item, "completed")} onRevealAdjustments={revealAdjustments} />
        <Link className="day-control-more" href="/today">開啟完整旅途控制台 →</Link>
      </section>
    );
  }

  return (
    <section className="day-control" aria-label={timeAware ? "智慧旅伴與今日完整行程" : "今日行程預覽"}>
      {sync.conflictMessage && <p className="sync-conflict-note" role="status">{sync.conflictMessage}</p>}
      {timeAware ? <SmartCompanionCard day={day} items={items} tokyoTime={tokyoTime} onComplete={(item) => changeStatus(item, "completed")} onRevealAdjustments={revealAdjustments} /> : <>
        <div className="day-control-heading"><span>DAY 1 PREVIEW</span><strong>出發後啟用智慧旅伴</strong></div>
        <div className="day-control-now">
          <span id="day-control-title">FIRST · 第一站</span>
          <h2>{nowNext.current?.title ?? "行程準備完成"}</h2>
          <p>{nowNext.current ? `${nowNext.current.time} · ${nowNext.current.location}` : "出發後會依福岡時間顯示現在與下一站。"}</p>
          {nowNext.current?.location && <div className="day-control-actions"><a href={navigationUrl(nowNext.current.location)} target="_blank" rel="noopener noreferrer">預覽導航 ↗</a></div>}
        </div>
        {nowNext.next && <div className="day-control-next"><span>NEXT · 下一站</span><strong>{nowNext.next.time} · {nowNext.next.title}</strong><p>{nowNext.next.location}</p></div>}
      </>}

      <div className="day-plan-list-heading"><div><span>SHARED PLAN</span><h3>今日完整行程</h3></div><button type="button" aria-expanded={showPlan} aria-controls="shared-day-plan" onClick={() => { setShowPlan((visible) => !visible); setShowAdd(false); }}>{showPlan ? "收起" : `展開 ${items.length} 站`}</button></div>
      {showPlan && <div id="shared-day-plan">
      <div className="day-plan-edit-bar"><p>完成、排序與臨時安排會同步到兩支手機。</p><button type="button" onClick={() => setShowAdd((visible) => !visible)}>{showAdd ? "取消新增" : "＋ 臨時安排"}</button></div>
      {showAdd && <div className="day-plan-add-form">
        <label>名稱<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="例如：回飯店休息" /></label>
        <div><label>顯示時間<input value={timeLabel} maxLength={40} onChange={(event) => setTimeLabel(event.target.value)} placeholder="彈性／下午" /></label><label>固定時間（選填）<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label></div>
        <label>地點<input value={location} maxLength={200} onChange={(event) => setLocation(event.target.value)} placeholder="可直接拿來導航" /></label>
        <label>備註<textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} rows={2} /></label>
        <button type="button" disabled={!title.trim()} onClick={addItem}>加入今天並同步</button>
      </div>}
      <div className="day-plan-list">
        {items.map((item, index) => {
          const adjustmentCandidate = adjustmentCandidateIds.includes(item.id) && (item.status === "pending" || item.status === "active");
          return <article id={`day-plan-${item.id}`} key={item.id} className={`day-plan-row status-${item.status}${adjustmentCandidate ? " adjustment-candidate" : ""}`}>
          <div className="day-plan-order"><button type="button" disabled={index === 0} aria-label={`將 ${item.title} 往上移`} onClick={() => move(index, -1)}>↑</button><button type="button" disabled={index === items.length - 1} aria-label={`將 ${item.title} 往下移`} onClick={() => move(index, 1)}>↓</button></div>
          <div className="day-plan-copy"><span>{item.time} · {statusLabel(item.status)}</span>{adjustmentCandidate && <em>智慧旅伴建議檢視</em>}<h4>{item.title}</h4><p>{item.location || item.note}</p><div>
            {item.status === "pending" && <button type="button" onClick={() => changeStatus(item, "active")}>現在</button>}
            {(item.status === "pending" || item.status === "active") && <button type="button" onClick={() => changeStatus(item, "completed")}>完成</button>}
            {(item.status === "pending" || item.status === "active") && <button type="button" onClick={() => { if (window.confirm(`確定跳過「${item.title}」？`)) changeStatus(item, "skipped"); }}>跳過</button>}
            {(item.status === "completed" || item.status === "skipped") && <button type="button" onClick={() => changeStatus(item, "pending")}>復原</button>}
            {item.isCustom && <button type="button" className="danger" onClick={() => { if (window.confirm(`刪除「${item.title}」？`)) sync.deleteDayPlanItem(day.date, item.id); }}>刪除</button>}
          </div></div>
        </article>;})}
      </div>
      </div>}
    </section>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { PwaInstallSection } from "@/components/PwaInstallSection";
import { useTravelSync } from "@/components/TravelSyncProvider";
import { clearCurrencyCache, clearWeatherCache } from "@/lib/storage";
import { getTokyoDateKey, getTripStatusForDateKey } from "@/lib/date";
import type { TravelNamespace } from "@/types/travelSync";

const resetActions: Array<[TravelNamespace, string, string]> = [
  ["packing", "重設行李清單", "清除兩支手機上的行李勾選與自訂項目。"],
  ["shopping", "重設必買清單", "清除兩支手機上的必買勾選與自訂項目。"],
  ["wishlist", "重設願望清單", "清除兩支手機上的願望勾選與自訂項目。"],
  ["prep", "重設行前檢查", "清除兩支手機上的行前檢查勾選。"],
];

function formatSyncTime(value: string | null) {
  if (!value) return "尚未完成同步";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

function syncStatusLabel(status: ReturnType<typeof useTravelSync>["status"]) {
  return { loading: "讀取中", synced: "已同步", pending: "同步中", offline: "離線保留", locked: "尚未解鎖", error: "需要處理" }[status];
}

export default function SettingsPage() {
  const sync = useTravelSync();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pin) return;
    setBusy(true);
    setFormError("");
    try {
      await sync.login(pin);
      setPin("");
      setMessage("已解鎖共用同步。");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "PIN 驗證失敗。");
    } finally {
      setBusy(false);
    }
  }

  async function reset(namespace: TravelNamespace, label: string) {
    if (!window.confirm(`確定要${label}嗎？這個動作會同步到兩支手機。`)) return;
    await sync.resetNamespace(namespace);
    setMessage(`已完成：${label}`);
  }

  async function logout() {
    setBusy(true);
    setFormError("");
    try {
      await sync.logout();
      setMessage("已鎖定共用同步，並清除這支手機的共享快照。");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "目前無法安全鎖定，請確認網路後再試。");
    } finally {
      setBusy(false);
    }
  }

  async function resetTodayPlan() {
    const date = getTripStatusForDateKey(getTokyoDateKey()).activeDate;
    if (!window.confirm("確定要清除當日進度、排序與臨時項目嗎？這個動作會同步到兩支手機。")) return;
    await sync.resetDayPlan(date);
    setMessage(`已重設 ${date} 的旅途控制台。`);
  }

  function clearToolCache(label: string, clearCache: () => void) {
    if (!window.confirm(`確定要${label}嗎？`)) return;
    clearCache();
    setMessage(`已完成：${label}`);
  }

  async function clearPwaCaches() {
    if (!window.confirm("確定要清除 PWA cache 嗎？下次開啟時會重新取得主要頁面。")) return;
    if (!("caches" in window)) {
      setMessage("這個瀏覽器不支援清除 PWA cache。");
      return;
    }
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    setMessage(keys.length ? "已清除 PWA cache。重新整理後會再次建立。" : "目前沒有可清除的 PWA cache。");
  }

  return (
    <div className="page-enter settings-page">
      <PageHeader eyebrow="ON BOTH PHONES" title="設定與同步" description="管理共用清單、安裝狀態與這支手機的離線快取。" />
      <NoticeBox tone="blue" title="兩支手機共用">
        行李、必買、願望、行前檢查與今日實際進度會使用旅行 PIN 同步；離線變更會保留在手機，恢復連線後補送。
      </NoticeBox>

      {message && <p className="success-message" role="status">{message}</p>}
      {(formError || sync.error) && <p className="error-message" role="alert">{formError || sync.error}</p>}

      <section aria-labelledby="sync-title">
        <div className="section-header">
          <h2 id="sync-title">共用資料同步</h2>
          <span>{syncStatusLabel(sync.status)}</span>
        </div>
        <div className="sync-settings-card">
          <div className="sync-settings-summary">
            <strong>{sync.authenticated ? "共用同步已解鎖" : "同步尚未解鎖"}</strong>
            <p>最後同步：{formatSyncTime(sync.lastSyncedAt)} · 待送出 {sync.pendingCount} 筆</p>
          </div>
          {sync.authenticated ? (
            <div className="sync-settings-actions">
              <button type="button" onClick={() => void sync.syncNow()} disabled={busy || sync.status === "pending"}>立即同步</button>
              <button type="button" className="secondary" onClick={() => void logout()} disabled={busy}>鎖定</button>
            </div>
          ) : (
            <form className="sync-login-form" onSubmit={login}>
              <label htmlFor="sync-pin">旅行共用 PIN</label>
              <div><input id="sync-pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} /><button type="submit" disabled={busy || !pin}>{busy ? "驗證中…" : "解鎖同步"}</button></div>
            </form>
          )}
        </div>
      </section>

      <section aria-labelledby="shared-data-title">
        <div className="section-header"><h2 id="shared-data-title">共用清單資料</h2><span>Neon + IndexedDB</span></div>
        <div className="settings-list">
          <div className="setting-row"><div><strong>重設當日旅途控制台</strong><p>清除今天的完成狀態、排序與臨時項目，恢復原始行程。</p></div><button type="button" onClick={() => void resetTodayPlan()}>重設</button></div>
          {resetActions.map(([namespace, label, detail]) => <div className="setting-row" key={namespace}><div><strong>{label}</strong><p>{detail}</p></div><button type="button" onClick={() => void reset(namespace, label)}>重設</button></div>)}
        </div>
      </section>

      <PwaInstallSection />

      <section aria-labelledby="pwa-data-title">
        <div className="section-header"><h2 id="pwa-data-title">這支手機的快取</h2><span>PWA cache</span></div>
        <div className="settings-list">
          <div className="setting-row"><div><strong>清除天氣快取</strong><p>下次會重新取得福岡天氣；不影響兩支手機的共用清單。</p></div><button type="button" onClick={() => clearToolCache("清除天氣快取", clearWeatherCache)}>清除</button></div>
          <div className="setting-row"><div><strong>清除匯率快取</strong><p>下次會重新取得 JPY / TWD 參考匯率。</p></div><button type="button" onClick={() => clearToolCache("清除匯率快取", clearCurrencyCache)}>清除</button></div>
          <div className="setting-row"><div><strong>清除離線頁面</strong><p>清除已下載頁面與資源；重新整理後會再次建立。</p></div><button type="button" onClick={() => void clearPwaCaches()}>清除</button></div>
        </div>
      </section>
    </div>
  );
}

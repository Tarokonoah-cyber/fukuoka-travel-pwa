"use client";

import { useState } from "react";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import {
  STORAGE_KEYS,
  clearAllTripData,
  clearCurrencyCache,
  clearStoredChecklist,
  clearWeatherCache,
  type StorageKey,
} from "@/lib/storage";

const checklistActions: [string, string, StorageKey | null][] = [
  ["清除行李清單", "行李清單的勾選與自訂項目", STORAGE_KEYS.packing],
  ["清除必買清單", "必買清單的勾選與自訂項目", STORAGE_KEYS.shopping],
  ["清除願望清單", "願望清單的勾選與自訂項目", STORAGE_KEYS.wishlist],
  ["清除全部本機資料", "三份清單與天氣、匯率暫存資料", null],
];

export default function SettingsPage() {
  const [message, setMessage] = useState("");

  function clearChecklistData(label: string, key: StorageKey | null) {
    if (!window.confirm(`確定要${label}嗎？這個動作無法復原。`)) return;
    if (key) clearStoredChecklist(key);
    else clearAllTripData();
    setMessage(`已完成：${label}`);
  }

  function clearToolCache(label: string, clearCache: () => void) {
    if (!window.confirm(`確定要${label}嗎？`)) return;
    clearCache();
    setMessage(`已完成：${label}`);
  }

  async function clearPwaCaches() {
    if (!window.confirm("確定要清除 PWA 離線頁面與資源快取嗎？清單勾選資料不會被刪除。")) return;
    if (!("caches" in window)) {
      setMessage("這個瀏覽器不支援手動清除 PWA cache。");
      return;
    }

    const keys = await caches.keys();
    const pwaKeys = keys.filter((key) => key.startsWith("fukuoka-pwa-"));
    await Promise.all(pwaKeys.map((key) => caches.delete(key)));
    setMessage(pwaKeys.length ? "已清除 PWA 離線頁面與資源快取。" : "目前沒有可清除的 PWA cache。");
  }

  return (
    <div className="page-enter">
      <PageHeader eyebrow="ON THIS PHONE" title="設定" description="管理保存在這支手機上的清單與離線資料。" />
      <NoticeBox tone="blue" title="PWA 離線模式">
        可加入手機主畫面；主要旅程頁會保存在此裝置。離線時仍可查看行程、交通、文件、緊急資訊與清單。
      </NoticeBox>
      <NoticeBox tone="plain" title="天氣與匯率暫存">
        天氣與匯率會使用最近一次成功取得的資料作為離線備援；實際出發前仍建議連網更新一次。
      </NoticeBox>

      {message && <p className="success-message" role="status">{message}</p>}

      <section aria-labelledby="local-data-title">
        <div className="section-header">
          <h2 id="local-data-title">本機清單資料</h2>
          <span>localStorage</span>
        </div>
        <div className="settings-list">
          {checklistActions.map(([label, detail, key], index) => (
            <div className={index === 3 ? "setting-row danger" : "setting-row"} key={label}>
              <div>
                <strong>{label}</strong>
                <p>{detail}</p>
              </div>
              <button type="button" onClick={() => clearChecklistData(label, key)}>
                清除
              </button>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="pwa-data-title">
        <div className="section-header">
          <h2 id="pwa-data-title">離線與工具快取</h2>
          <span>PWA cache</span>
        </div>
        <div className="settings-list">
          <div className="setting-row">
            <div>
              <strong>清除天氣快取</strong>
              <p>只清除上次成功取得的福岡天氣，不會刪除清單。</p>
            </div>
            <button type="button" onClick={() => clearToolCache("清除天氣快取", clearWeatherCache)}>
              清除
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>清除匯率快取</strong>
              <p>只清除上次成功取得的日幣匯率，不會刪除清單。</p>
            </div>
            <button type="button" onClick={() => clearToolCache("清除匯率快取", clearCurrencyCache)}>
              清除
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>清除 PWA cache</strong>
              <p>清除離線頁面、靜態資源與已看過的地圖 tile；重新連網後會再建立。</p>
            </div>
            <button type="button" onClick={clearPwaCaches}>
              清除
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

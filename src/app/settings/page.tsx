"use client";

import { useState } from "react";
import { NoticeBox } from "@/components/NoticeBox";
import { PageHeader } from "@/components/PageHeader";
import { clearExpenses } from "@/lib/budgetStorage";
import { clearPrepChecks } from "@/lib/prepStorage";
import {
  STORAGE_KEYS,
  clearAllTripData,
  clearCurrencyCache,
  clearStoredChecklist,
  clearWeatherCache,
  type StorageKey,
} from "@/lib/storage";

const checklistActions: [string, string, StorageKey | null][] = [
  ["清除行李清單", "只清除行李清單的勾選與自訂項目。", STORAGE_KEYS.packing],
  ["清除必買清單", "只清除必買清單的勾選與自訂項目。", STORAGE_KEYS.shopping],
  ["清除願望清單", "只清除願望清單的勾選與自訂項目。", STORAGE_KEYS.wishlist],
  ["清除全部本機資料", "包含清單、行前檢查、天氣快取、匯率快取與花費紀錄。", null],
];

export default function SettingsPage() {
  const [message, setMessage] = useState("");

  function clearChecklistData(label: string, key: StorageKey | null) {
    if (!window.confirm(`確定要${label}嗎？這個動作只會影響本機資料。`)) return;
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
    if (!window.confirm("確定要清除 PWA cache 嗎？下次開啟時會重新取得主要頁面。")) return;
    if (!("caches" in window)) {
      setMessage("這個瀏覽器不支援清除 PWA cache。");
      return;
    }

    const keys = await caches.keys();
    const pwaKeys = keys.filter((key) => key.startsWith("fukuoka-pwa-"));
    await Promise.all(pwaKeys.map((key) => caches.delete(key)));
    setMessage(pwaKeys.length ? "已清除 PWA cache。" : "目前沒有可清除的 PWA cache。");
  }

  return (
    <div className="page-enter">
      <PageHeader eyebrow="ON THIS PHONE" title="設定" description="管理這支手機上的清單、快取、花費紀錄、行前檢查與離線資料。" />
      <NoticeBox tone="blue" title="PWA 離線資料">
        主要行程、交通、文件與緊急資訊會透過 PWA cache 保留在手機上；清單與花費紀錄則存在 localStorage。
      </NoticeBox>
      <NoticeBox tone="plain" title="天氣 / 匯率 / 花費">
        天氣與匯率會保留最近一次成功資料；花費與行前檢查只存在這支手機，不會同步到雲端。
      </NoticeBox>

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}

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

      <section aria-labelledby="prep-data-title">
        <div className="section-header">
          <h2 id="prep-data-title">行前檢查</h2>
          <span>prep</span>
        </div>
        <div className="settings-list">
          <div className="setting-row">
            <div>
              <strong>清除行前檢查勾選</strong>
              <p>只清除待補資料的完成狀態，不會刪除行李、必買、願望清單或花費紀錄。</p>
            </div>
            <button type="button" onClick={() => clearToolCache("清除行前檢查勾選", clearPrepChecks)}>
              清除
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="budget-data-title">
        <div className="section-header">
          <h2 id="budget-data-title">花費紀錄</h2>
          <span>budget</span>
        </div>
        <div className="settings-list">
          <div className="setting-row">
            <div>
              <strong>清除花費紀錄</strong>
              <p>只清除旅行花費 localStorage，不會刪除行李、必買或願望清單。</p>
            </div>
            <button type="button" onClick={() => clearToolCache("清除花費紀錄", clearExpenses)}>
              清除
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="pwa-data-title">
        <div className="section-header">
          <h2 id="pwa-data-title">快取與離線資料</h2>
          <span>PWA cache</span>
        </div>
        <div className="settings-list">
          <div className="setting-row">
            <div>
              <strong>清除天氣快取</strong>
              <p>下次開啟天氣頁時會重新取得福岡天氣；離線時可能暫時沒有資料。</p>
            </div>
            <button type="button" onClick={() => clearToolCache("清除天氣快取", clearWeatherCache)}>
              清除
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>清除匯率快取</strong>
              <p>下次開啟匯率或花費頁時會重新取得 JPY / TWD 參考匯率。</p>
            </div>
            <button type="button" onClick={() => clearToolCache("清除匯率快取", clearCurrencyCache)}>
              清除
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>清除 PWA cache</strong>
              <p>清除已快取頁面與資源；重新整理後會再由 Service Worker 建立新的離線資料。</p>
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

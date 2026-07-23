"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeRecommendationUrl } from "@/lib/recommendationUrl";
import type { ShoppingLinkPreview } from "@/types/shopping";
import { useTravelSync } from "./TravelSyncProvider";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

export function ShoppingRecommendationForm({ categories }: { categories: string[] }) {
  const sync = useTravelSync();
  const [sourceUrl, setSourceUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories.includes("泡麵") ? "泡麵" : categories[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previewControllerRef = useRef<AbortController | null>(null);
  const previewRequestRef = useRef(0);

  useEffect(() => () => previewControllerRef.current?.abort(), []);

  function updateSourceUrl(value: string) {
    previewRequestRef.current += 1;
    previewControllerRef.current?.abort();
    previewControllerRef.current = null;
    setBusy(false);
    setSourceUrl(value);
  }

  async function loadPreview() {
    const normalizedUrl = normalizeRecommendationUrl(sourceUrl);
    if (!normalizedUrl) {
      setError("請貼上完整的 http:// 或 https:// 網址。");
      setMessage("");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("正在讀取網頁標題…");
    previewControllerRef.current?.abort();
    const controller = new AbortController();
    previewControllerRef.current = controller;
    const requestId = ++previewRequestRef.current;
    try {
      const response = await fetch("/api/link-preview", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
        signal: controller.signal,
      });
      const envelope = await response.json().catch(() => null) as ApiEnvelope<ShoppingLinkPreview> | null;
      if (requestId !== previewRequestRef.current) return;
      if (!response.ok || !envelope?.ok || !envelope.data) {
        const fallback = response.status === 401
          ? "請先到設定輸入旅行共用 PIN，或直接手動填寫商品名稱。"
          : "網址讀取失敗；仍可手動填寫商品名稱後加入。";
        throw new Error(envelope?.error?.message || fallback);
      }
      setSourceUrl(envelope.data.url);
      if (!name.trim()) setName(envelope.data.title);
      setMessage(`已讀取 ${envelope.data.sourceName}，請確認名稱與備註。`);
    } catch (previewError) {
      if (requestId !== previewRequestRef.current || controller.signal.aborted) return;
      setMessage("");
      setError(previewError instanceof Error ? previewError.message : "網址讀取失敗；請手動填寫商品名稱。");
    } finally {
      if (requestId === previewRequestRef.current) {
        previewControllerRef.current = null;
        setBusy(false);
      }
    }
  }

  function addRecommendation() {
    const normalizedUrl = normalizeRecommendationUrl(sourceUrl);
    const cleanName = name.trim();
    if (!normalizedUrl || !cleanName) {
      setMessage("");
      setError("請填寫推薦網址與商品名稱。");
      return;
    }
    sync.addCustomItem("shopping", cleanName, category, {
      note: note.trim() || null,
      sourceUrl: normalizedUrl,
    });
    updateSourceUrl("");
    setName("");
    setNote("");
    setError("");
    setMessage("已加入必買清單；未收錄的商品會先標示待確認官方圖。");
  }

  return (
    <details className="recommendation-panel">
      <summary>＋ 貼上推薦網址</summary>
      <form className="recommendation-form" onSubmit={(event) => { event.preventDefault(); addRecommendation(); }}>
        <p>貼商品頁或網友文章即可保留來源；不會擷取網友照片，未收錄時先顯示待確認官方圖。</p>
        <div className="recommendation-url-row">
          <label>
            <span>推薦網址</span>
            <input
              type="url"
              inputMode="url"
              value={sourceUrl}
              onChange={(event) => updateSourceUrl(event.target.value)}
              placeholder="https://…"
              maxLength={2048}
              required
            />
          </label>
          <button type="button" className="recommendation-preview-button" disabled={busy || !sourceUrl.trim()} onClick={() => void loadPreview()}>
            {busy ? "讀取中…" : "讀取網址"}
          </button>
        </div>
        <div className="recommendation-fields">
          <label>
            <span>商品名稱</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} required />
          </label>
          <label>
            <span>分類</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <label>
          <span>備註（選填）</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="例如：網友說蒜味很濃、在 7-Eleven 找"
            maxLength={500}
            rows={3}
          />
        </label>
        {(message || error) && <p className={error ? "recommendation-feedback error" : "recommendation-feedback"} role={error ? "alert" : "status"}>{error || message}</p>}
        <button className="recommendation-submit" type="submit" disabled={busy || sync.status === "loading"}>加入必買清單</button>
      </form>
    </details>
  );
}

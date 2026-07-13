"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  calculateAmountTWD,
  DEFAULT_EXCHANGE_RATE,
  EXPENSE_SETTINGS_KEY,
  getDefaultExpenseDate,
  getTokyoDate,
  isOutsideTrip,
  summarizeExpenses,
} from "@/lib/expenses";
import { processReceiptImage, type ProcessedReceiptImage } from "@/lib/receiptImage";
import {
  expenseCategories,
  expensePaymentMethods,
  type DuplicateMatch,
  type ExpenseDraft,
  type ReceiptAnalysis,
  type TravelExpense,
} from "@/types/expenses";

type PageMode = "dashboard" | "scan" | "manual" | "edit";

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

class ApiRequestError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

async function apiRequest<T>(url: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new ApiRequestError("NETWORK_ERROR", "網路連線中斷，請確認訊號後再試。", 0);
  }
  let envelope: ApiEnvelope<T>;
  try {
    envelope = await response.json() as ApiEnvelope<T>;
  } catch {
    throw new ApiRequestError("INVALID_RESPONSE", "伺服器回應異常，請稍後再試。", response.status);
  }
  if (!response.ok || !envelope.ok || envelope.data === undefined) {
    throw new ApiRequestError(envelope.error?.code ?? "REQUEST_FAILED", envelope.error?.message ?? "操作失敗，請稍後再試。", response.status, envelope.error?.details);
  }
  return envelope.data;
}

function formatJPY(value: number) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
}

function formatTWD(value: number) {
  return new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(value);
}

function newDraft(rate: number): ExpenseDraft {
  return {
    expenseDate: getDefaultExpenseDate(),
    storeName: "",
    storeNameJa: "",
    amountJPY: "",
    exchangeRate: String(rate),
    category: "其他",
    paymentMethod: "現金",
    note: "",
  };
}

function draftFromAnalysis(analysis: ReceiptAnalysis, rate: number): ExpenseDraft {
  return {
    expenseDate: analysis.expenseDate ?? getDefaultExpenseDate(),
    storeName: analysis.storeName ?? "",
    storeNameJa: analysis.storeNameJa ?? "",
    amountJPY: analysis.amountJPY === null ? "" : String(analysis.amountJPY),
    exchangeRate: String(rate),
    category: analysis.category,
    paymentMethod: analysis.paymentMethod,
    note: analysis.note ?? "",
  };
}

function draftFromExpense(expense: TravelExpense): ExpenseDraft {
  return {
    expenseDate: expense.expenseDate,
    storeName: expense.storeName ?? "",
    storeNameJa: expense.storeNameJa ?? "",
    amountJPY: String(expense.amountJPY),
    exchangeRate: String(expense.exchangeRate),
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    note: expense.note ?? "",
  };
}

interface ExpenseFormProps {
  draft: ExpenseDraft;
  setDraft: React.Dispatch<React.SetStateAction<ExpenseDraft>>;
  showJapaneseName: boolean;
  saving: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}

function ExpenseForm({ draft, setDraft, showJapaneseName, saving, submitLabel, onSubmit, onCancel }: ExpenseFormProps) {
  const amountJPY = Number(draft.amountJPY);
  const rate = Number(draft.exchangeRate);
  const amountTWD = draft.amountJPY.trim() && Number.isFinite(amountJPY) && amountJPY >= 0 && Number.isFinite(rate) && rate > 0
    ? calculateAmountTWD(amountJPY, rate)
    : null;
  const update = <K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form className="expense-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <label>
        <span>日期</span>
        <input type="date" required value={draft.expenseDate} onChange={(event) => update("expenseDate", event.target.value)} />
      </label>
      <label>
        <span>店名</span>
        <input maxLength={120} value={draft.storeName} onChange={(event) => update("storeName", event.target.value)} placeholder="例如：一蘭拉麵" />
      </label>
      {showJapaneseName && (
        <label>
          <span>日文店名</span>
          <input maxLength={120} value={draft.storeNameJa} onChange={(event) => update("storeNameJa", event.target.value)} placeholder="レシート上の店名" />
        </label>
      )}
      <label>
        <span>日圓金額</span>
        <input type="number" min="0" max="10000000" step="1" inputMode="numeric" required value={draft.amountJPY} onChange={(event) => update("amountJPY", event.target.value)} placeholder="0" />
      </label>
      <label>
        <span>分類</span>
        <select value={draft.category} onChange={(event) => update("category", event.target.value as ExpenseDraft["category"])}>
          {expenseCategories.map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>
      <label>
        <span>付款方式</span>
        <select value={draft.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value as ExpenseDraft["paymentMethod"])}>
          {expensePaymentMethods.map((method) => <option key={method}>{method}</option>)}
        </select>
      </label>
      <label>
        <span>匯率（1 JPY → TWD）</span>
        <input type="number" min="0.000001" max="100" step="0.000001" inputMode="decimal" required value={draft.exchangeRate} onChange={(event) => update("exchangeRate", event.target.value)} />
      </label>
      <label className="expense-note-field">
        <span>備註</span>
        <textarea maxLength={500} value={draft.note} onChange={(event) => update("note", event.target.value)} placeholder="可補充用途；請勿輸入卡號。" />
      </label>
      <div className="expense-conversion" aria-live="polite">
        <span>換算台幣</span>
        <strong>{amountTWD === null ? "—" : formatTWD(amountTWD)}</strong>
        <small>儲存時由伺服器重新計算並固定保留</small>
      </div>
      {isOutsideTrip(draft.expenseDate) && <p className="expense-inline-warning" role="alert">日期不在 2026/08/02–08/06 旅程期間，確認無誤後仍可儲存。</p>}
      <div className="expense-form-actions">
        <button type="button" className="expense-secondary-button" onClick={onCancel} disabled={saving}>取消</button>
        <button type="submit" className="expense-primary-button" disabled={saving}>{saving ? "儲存中…" : submitLabel}</button>
      </div>
    </form>
  );
}

export function ExpensesPageClient({ initialAuthenticated, authConfigured }: { initialAuthenticated: boolean; authConfigured: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<PageMode>("dashboard");
  const [expenses, setExpenses] = useState<TravelExpense[]>([]);
  const [loading, setLoading] = useState(initialAuthenticated);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rate, setRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [rateInput, setRateInput] = useState(String(DEFAULT_EXCHANGE_RATE));
  const [draft, setDraft] = useState(() => newDraft(DEFAULT_EXCHANGE_RATE));
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [receipt, setReceipt] = useState<ProcessedReceiptImage | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const clearReceipt = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setReceipt(null);
    setAnalysis(null);
    setDuplicates([]);
  }, []);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(EXPENSE_SETTINGS_KEY) ?? "null") as { exchangeRate?: unknown } | null;
        const value = Number(saved?.exchangeRate);
        if (Number.isFinite(value) && value > 0 && value <= 100) {
          setRate(value);
          setRateInput(String(value));
          setDraft((current) => ({ ...current, exchangeRate: String(value) }));
        }
      } catch {
        // Invalid local settings safely fall back to the default rate.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setExpenses(await apiRequest<TravelExpense[]>("/api/travel-expenses"));
    } catch (requestError) {
      const apiError = requestError as ApiRequestError;
      if (apiError.code === "UNAUTHORIZED") setAuthenticated(false);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void loadExpenses(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, loadExpenses]);

  const summary = useMemo(() => summarizeExpenses(expenses), [expenses]);
  const categoryTotals = useMemo(() => expenseCategories.map((category) => ({
    category,
    amountJPY: expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amountJPY, 0),
  })), [expenses]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pin) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest<{ authenticated: true }>("/api/travel-auth", { method: "POST", body: JSON.stringify({ pin }) });
      setPin("");
      setAuthenticated(true);
    } catch (requestError) {
      setError((requestError as ApiRequestError).message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await apiRequest<{ authenticated: false }>("/api/travel-auth", { method: "DELETE" }).catch(() => undefined);
    clearReceipt();
    setExpenses([]);
    setAuthenticated(false);
    setMode("dashboard");
  }

  function saveDefaultRate() {
    const value = Number(rateInput);
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      setError("匯率請輸入大於 0 的有效數字。");
      return;
    }
    localStorage.setItem(EXPENSE_SETTINGS_KEY, JSON.stringify({ exchangeRate: value }));
    setRate(value);
    setError("");
    setMessage("預設匯率已儲存在這台裝置；舊紀錄不會被改動。");
  }

  async function runAnalysis(currentReceipt: ProcessedReceiptImage) {
    setBusy(true);
    setError("");
    setAnalysis(null);
    try {
      const result = await apiRequest<ReceiptAnalysis>("/api/receipts/analyze", {
        method: "POST",
        body: JSON.stringify({ imageBase64: currentReceipt.imageBase64, mimeType: currentReceipt.mimeType }),
      });
      setAnalysis(result);
      setDraft(draftFromAnalysis(result, rate));
    } catch (requestError) {
      const apiError = requestError as ApiRequestError;
      if (apiError.code === "UNAUTHORIZED") setAuthenticated(false);
      setError(apiError.message);
      setDraft(newDraft(rate));
    } finally {
      setBusy(false);
    }
  }

  async function chooseReceipt(file: File | undefined) {
    if (!file) return;
    clearReceipt();
    setMode("scan");
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const processed = await processReceiptImage(file);
      previewUrlRef.current = processed.previewUrl;
      setReceipt(processed);
      await runAnalysis(processed);
    } catch (imageError) {
      const code = imageError instanceof Error ? imageError.message : "";
      const messages: Record<string, string> = {
        UNSUPPORTED_IMAGE: "僅支援 JPEG、PNG、WebP、HEIC 或 HEIF 圖片。",
        SOURCE_TOO_LARGE: "原始圖片超過 12MB，請改用較小的照片。",
        OUTPUT_TOO_LARGE: "壓縮後圖片仍過大，請重新拍攝較清晰、範圍較小的照片。",
      };
      setError(messages[code] ?? "無法讀取這張圖片，請重新拍攝或改用手動新增。");
      setBusy(false);
    }
  }

  function startManual() {
    clearReceipt();
    setDraft(newDraft(rate));
    setEditingId(null);
    setError("");
    setMessage("");
    setMode("manual");
  }

  function startEdit(expense: TravelExpense) {
    clearReceipt();
    setDraft(draftFromExpense(expense));
    setEditingId(expense.id);
    setError("");
    setMessage("");
    setMode("edit");
  }

  function cancelFlow() {
    clearReceipt();
    setEditingId(null);
    setMode("dashboard");
    setError("");
  }

  async function saveExpense(forceSave = false) {
    if (!draft.amountJPY.trim()) {
      setError("請輸入日圓金額。");
      return;
    }
    const amountJPY = Number(draft.amountJPY);
    const exchangeRate = Number(draft.exchangeRate);
    if (!Number.isInteger(amountJPY) || amountJPY < 0) {
      setError("日圓金額必須是 0 以上的整數。");
      return;
    }
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0 || exchangeRate > 100) {
      setError("匯率請輸入大於 0 的有效數字。");
      return;
    }

    const fields = {
      expenseDate: draft.expenseDate,
      storeName: draft.storeName.trim() || null,
      storeNameJa: draft.storeNameJa.trim() || null,
      amountJPY,
      exchangeRate,
      category: draft.category,
      paymentMethod: draft.paymentMethod,
      note: draft.note.trim() || null,
    };
    setBusy(true);
    setError("");
    try {
      if (mode === "edit" && editingId) {
        await apiRequest<TravelExpense>(`/api/travel-expenses/${editingId}`, { method: "PATCH", body: JSON.stringify(fields) });
        setMessage("旅費紀錄已更新。");
      } else {
        const scanMode = mode === "scan";
        await apiRequest<TravelExpense>("/api/travel-expenses", {
          method: "POST",
          body: JSON.stringify({
            ...fields,
            inputMethod: scanMode ? "scan" : "manual",
            receiptHash: scanMode ? receipt?.receiptHash ?? null : null,
            aiConfidence: scanMode ? analysis?.confidence ?? null : null,
            aiRawResult: scanMode ? analysis : null,
            forceSave,
          }),
        });
        setMessage(scanMode ? "收據旅費已儲存，照片已從暫存中清除。" : "手動旅費已新增。");
      }
      clearReceipt();
      setEditingId(null);
      setMode("dashboard");
      await loadExpenses();
    } catch (requestError) {
      const apiError = requestError as ApiRequestError;
      if (apiError.code === "DUPLICATE_SUSPECTED") {
        setDuplicates(Array.isArray(apiError.details) ? apiError.details as DuplicateMatch[] : []);
        setError("這張收據可能已儲存過，請核對後選擇取消或仍然儲存。");
      } else {
        if (apiError.code === "UNAUTHORIZED") setAuthenticated(false);
        setError(apiError.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeExpense(expense: TravelExpense) {
    if (!window.confirm(`確定刪除「${expense.storeName || "未命名旅費"}」${formatJPY(expense.amountJPY)}？`)) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest<{ id: string }>(`/api/travel-expenses/${expense.id}`, { method: "DELETE" });
      setMessage("旅費紀錄已刪除。");
      await loadExpenses();
    } catch (requestError) {
      setError((requestError as ApiRequestError).message);
    } finally {
      setBusy(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="expenses-page page-enter">
        <PageHeader eyebrow="PRIVATE TRAVEL LEDGER" title="旅費紀錄" description="收據與旅費包含私人資訊，請先驗證管理 PIN。" />
        <section className="expense-auth-card">
          <span className="expense-auth-mark" aria-hidden>¥</span>
          <h2>Owner access</h2>
          {!authConfigured ? (
            <p className="error-message" role="alert">正式環境尚未設定 TRAVEL_ADMIN_PIN，旅費功能已安全鎖定。</p>
          ) : (
            <form onSubmit={login}>
              <label htmlFor="travel-pin">管理 PIN</label>
              <input id="travel-pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} autoFocus />
              <button type="submit" disabled={busy || !pin}>{busy ? "驗證中…" : "解鎖旅費"}</button>
            </form>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          <p className="expense-privacy-copy">PIN 不會儲存在瀏覽器；驗證後使用 HttpOnly 安全工作階段。</p>
        </section>
      </div>
    );
  }

  if (mode === "manual" || mode === "edit") {
    return (
      <div className="expenses-page page-enter">
        <PageHeader eyebrow={mode === "edit" ? "EDIT EXPENSE" : "MANUAL ENTRY"} title={mode === "edit" ? "編輯旅費" : "手動新增"} description="台幣金額會依這筆紀錄的匯率，由伺服器重新計算。" />
        {error && <p className="error-message" role="alert">{error}</p>}
        <section className="expense-paper-card">
          <ExpenseForm draft={draft} setDraft={setDraft} showJapaneseName={mode === "edit"} saving={busy} submitLabel={mode === "edit" ? "儲存修改" : "新增旅費"} onSubmit={() => void saveExpense()} onCancel={cancelFlow} />
        </section>
      </div>
    );
  }

  if (mode === "scan") {
    const confidence = analysis ? Math.round(analysis.confidence * 100) : null;
    return (
      <div className="expenses-page page-enter">
        <PageHeader eyebrow="AI RECEIPT SCAN" title="確認收據旅費" description="照片只在這個流程中預覽、壓縮與辨識；按下確認前不會寫入資料庫。" />
        {error && <p className="error-message" role="alert">{error}</p>}
        <section className="receipt-review-grid">
          <div className="receipt-preview-card">
            <div className="section-header"><h2>收據預覽</h2><span>{receipt ? `${Math.round(receipt.byteLength / 1024)} KB` : "等待照片"}</span></div>
            {receipt ? (
              <Image className="receipt-preview-image" src={receipt.previewUrl} alt="待確認的收據照片" width={receipt.width} height={receipt.height} unoptimized />
            ) : (
              <label className="receipt-drop-zone">
                <span>拍攝或選取收據</span>
                <small>JPEG / PNG / WebP / HEIC，原圖上限 12MB</small>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" capture="environment" onChange={(event) => void chooseReceipt(event.target.files?.[0])} />
              </label>
            )}
            {busy && <p className="receipt-processing" role="status">正在修正方向、壓縮並辨識收據…</p>}
            {receipt && <p className="receipt-lifecycle-note">已縮至最長邊不超過 1600px 並轉為 JPEG；照片不會寫入 Neon 或任何 Storage。</p>}
          </div>

          {receipt && (
            <div className="receipt-analysis-card">
              <div className="section-header"><h2>AI 辨識</h2><span>{confidence === null ? "未完成" : `${confidence}%`}</span></div>
              {analysis ? (
                <>
                  <div className={`confidence-meter ${analysis.confidence < 0.65 ? "low" : ""}`}><span style={{ width: `${confidence}%` }} /></div>
                  <p className="confidence-label">{analysis.confidence < 0.65 ? "信心偏低，請逐欄核對" : "仍請依收據人工確認"}</p>
                  {analysis.warnings.length > 0 && (
                    <div className="receipt-warning-list" role="alert"><strong>辨識提醒</strong><ul>{analysis.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
                  )}
                </>
              ) : (
                <p className="receipt-lifecycle-note">AI 未完成辨識；你仍可手動填寫下方欄位，或重新掃描。</p>
              )}
            </div>
          )}
        </section>

        {receipt && (
          <section className="expense-paper-card receipt-fields-card">
            <div className="section-header"><h2>人工確認</h2><span>儲存前可修改</span></div>
            {duplicates.length > 0 && (
              <div className="duplicate-warning" role="alert">
                <strong>疑似重複收據</strong>
                {duplicates.map((duplicate) => <p key={duplicate.id}>{duplicate.reason === "receipt_hash" ? "相同照片" : "日期、金額與店名相似"}：{duplicate.expenseDate} · {duplicate.storeName || "未命名"} · {formatJPY(duplicate.amountJPY)}</p>)}
                <button type="button" onClick={() => void saveExpense(true)} disabled={busy}>{busy ? "儲存中…" : "確認仍然儲存"}</button>
              </div>
            )}
            <ExpenseForm draft={draft} setDraft={setDraft} showJapaneseName saving={busy} submitLabel="確認儲存" onSubmit={() => void saveExpense()} onCancel={cancelFlow} />
            <div className="receipt-secondary-actions">
              <label className="expense-secondary-button">重新掃描<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" capture="environment" onChange={(event) => void chooseReceipt(event.target.files?.[0])} /></label>
              {analysis === null && receipt && <button type="button" className="expense-secondary-button" disabled={busy} onClick={() => void runAnalysis(receipt)}>重試 AI 辨識</button>}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="expenses-page page-enter">
      <PageHeader eyebrow="PRIVATE TRAVEL LEDGER" title="旅費紀錄" description={`以東京時間統計今日（${getTokyoDate()}）與 2026/08/02–08/06 全旅程支出。`} />
      <div className="expense-session-bar"><span>私人旅費已解鎖</span><button type="button" onClick={() => void logout()}>鎖定</button></div>
      {message && <p className="success-message" role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="expense-summary-grid" aria-label="旅費摘要">
        <article className="expense-summary-card featured"><span>今日支出</span><strong>{formatJPY(summary.todayJPY)}</strong><small>{formatTWD(summary.todayTWD)}</small></article>
        <article className="expense-summary-card"><span>旅程累計</span><strong>{formatJPY(summary.tripJPY)}</strong><small>{formatTWD(summary.tripTWD)}</small></article>
        <article className="expense-summary-card count"><span>紀錄筆數</span><strong>{summary.count}</strong><small>文字化旅費</small></article>
      </section>

      <section className="expense-quick-actions" aria-label="快捷操作">
        <label className="expense-scan-action">
          <span>AI</span><strong>掃描收據</strong><small>拍照後先確認，不會直接儲存</small>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" capture="environment" onChange={(event) => void chooseReceipt(event.target.files?.[0])} />
        </label>
        <button type="button" className="expense-manual-action" onClick={startManual}><span>＋</span><strong>手動新增</strong><small>沒有收據也能記帳</small></button>
      </section>

      <section className="expense-rate-card" aria-labelledby="expense-rate-title">
        <div><span>DEFAULT RATE</span><h2 id="expense-rate-title">預設匯率</h2><p>只套用到新紀錄，不回算舊資料。</p></div>
        <div className="expense-rate-control"><label htmlFor="expense-rate">1 JPY → TWD</label><input id="expense-rate" type="number" min="0.000001" max="100" step="0.000001" inputMode="decimal" value={rateInput} onChange={(event) => setRateInput(event.target.value)} /><button type="button" onClick={saveDefaultRate}>儲存</button></div>
      </section>

      <section aria-labelledby="category-summary-title">
        <div className="section-header"><h2 id="category-summary-title">分類摘要</h2><span>全部紀錄</span></div>
        <div className="expense-category-grid">{categoryTotals.map((item) => <article key={item.category}><span>{item.category}</span><strong>{formatJPY(item.amountJPY)}</strong></article>)}</div>
      </section>

      <section className="expense-history" aria-labelledby="expense-history-title">
        <div className="section-header"><h2 id="expense-history-title">歷史紀錄</h2><span>{expenses.length} 筆</span></div>
        {loading ? <p className="expense-loading" role="status">正在讀取旅費…</p> : expenses.length === 0 ? (
          <EmptyState title="尚未有旅費" description="可以掃描第一張收據，或先用手動新增記一筆。" />
        ) : (
          <div className="expense-history-list">{expenses.map((expense) => (
            <article className="expense-history-row" key={expense.id}>
              <div className="expense-history-date"><span>{expense.expenseDate.slice(5).replace("-", "/")}</span><small>{expense.inputMethod === "scan" ? "SCAN" : "MANUAL"}</small></div>
              <div className="expense-history-copy"><h3>{expense.storeName || expense.storeNameJa || "未命名旅費"}</h3><p>{expense.category} · {expense.paymentMethod}{expense.note ? ` · ${expense.note}` : ""}</p><div><button type="button" onClick={() => startEdit(expense)}>編輯</button><button type="button" onClick={() => void removeExpense(expense)} disabled={busy}>刪除</button></div></div>
              <div className="expense-history-amount"><strong>{formatJPY(expense.amountJPY)}</strong><small>{formatTWD(expense.amountTWD)}</small></div>
            </article>
          ))}</div>
        )}
      </section>
    </div>
  );
}

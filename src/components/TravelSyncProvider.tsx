"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getTokyoDateKey, getTripStatusForDateKey } from "@/lib/date";
import { parsePrepChecksSnapshot } from "@/lib/prepStorage";
import { PREP_CHECKS_KEY, STORAGE_KEYS, parseChecklistSnapshot } from "@/lib/storage";
import { drainOperationQueue } from "@/lib/syncQueue";
import {
  clearCachedDayPlan,
  clearCachedSyncSnapshots,
  clearCachedTravelNamespace,
  deleteCachedDayPlanItem,
  deleteCachedTravelItem,
  enqueueLatestSyncOperation,
  enqueueSyncOperation,
  getCachedDayPlanItems,
  getCachedTravelItems,
  getSyncMeta,
  getSyncOutbox,
  putCachedDayPlanItem,
  putCachedTravelItem,
  removeSyncOperation,
  replaceCachedDayPlan,
  replaceCachedTravelItems,
  setSyncMeta,
  type DayPlanSyncOperation,
  type SyncOperation,
} from "@/lib/travelSyncDb";
import type { DayPlanCustomFields, DayPlanItemState, DayPlanResponse, DayPlanStatus } from "@/types/dayPlan";
import type { TravelNamespace, TravelStateItem, TravelStateResponse } from "@/types/travelSync";

export type TravelSyncStatus = "loading" | "synced" | "pending" | "offline" | "locked" | "error";

type DayPlanSeed = Pick<DayPlanItemState, "date" | "itemId" | "sortOrder" | "isCustom" | "custom"> & { updatedAt: string | null };

type TravelSyncContextValue = {
  items: TravelStateItem[];
  dayItems: DayPlanItemState[];
  status: TravelSyncStatus;
  authenticated: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  error: string;
  conflictMessage: string;
  toggleItem: (namespace: TravelNamespace, itemId: string) => void;
  addCustomItem: (namespace: Exclude<TravelNamespace, "prep">, name: string, category: string) => void;
  deleteCustomItem: (namespace: Exclude<TravelNamespace, "prep">, itemId: string) => void;
  resetNamespace: (namespace: TravelNamespace) => Promise<void>;
  ensureDayPlan: (date: string) => Promise<void>;
  setDayItemStatus: (seed: DayPlanSeed, status: DayPlanStatus) => void;
  addDayPlanItem: (date: string, custom: DayPlanCustomFields, sortOrder: number) => void;
  deleteDayPlanItem: (date: string, itemId: string) => void;
  reorderDayPlanItems: (date: string, items: DayPlanSeed[]) => void;
  resetDayPlan: (date: string) => Promise<void>;
  syncNow: () => Promise<void>;
  login: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
};

type ApiEnvelope<T> = { ok: boolean; data?: T; error?: { code: string; message: string; details?: unknown } };

class SyncApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) { super(message); }
}

const TravelSyncContext = createContext<TravelSyncContextValue | null>(null);
const AUTH_EVENT = "fukuoka-travel-auth-change";
type TravelAuthAction = "login" | "logout";
const LEGACY_MIGRATION_KEY = "legacy-local-storage-migrated";
let lastOperationTime = 0;

function newOperationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newOperationCreatedAt() {
  lastOperationTime = Math.max(Date.now(), lastOperationTime + 1);
  return new Date(lastOperationTime).toISOString();
}

async function apiRequest<T>(url: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new SyncApiError("NETWORK_ERROR", "目前無法連線，變更會保留在這支手機。");
  }
  const envelope = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !envelope?.ok || envelope.data === undefined) {
    throw new SyncApiError(envelope?.error?.code ?? "REQUEST_FAILED", envelope?.error?.message ?? "同步失敗，請稍後再試。", envelope?.error?.details);
  }
  return envelope.data;
}

function createItem(namespace: TravelNamespace, itemId: string, checked: boolean, name: string | null = null, category: string | null = null): TravelStateItem {
  return { namespace, itemId, checked, name, category, isCustom: Boolean(name && category), updatedAt: new Date().toISOString() };
}

async function migrateLegacyLocalStorage() {
  if (await getSyncMeta<boolean>(LEGACY_MIGRATION_KEY)) return;
  const add = async (item: TravelStateItem) => {
    await putCachedTravelItem(item);
    await enqueueSyncOperation({
      resource: "checklist", id: newOperationId(), action: "patch", namespace: item.namespace, itemId: item.itemId,
      checked: item.checked, name: item.name, category: item.category, baseUpdatedAt: null, createdAt: newOperationCreatedAt(),
    });
  };
  for (const namespace of ["packing", "shopping", "wishlist"] as const) {
    const snapshot = parseChecklistSnapshot(localStorage.getItem(STORAGE_KEYS[namespace]) ?? "");
    const checked = new Set(snapshot.checked);
    for (const itemId of checked) await add(createItem(namespace, itemId, true));
    for (const custom of snapshot.custom) await add(createItem(namespace, custom.id, checked.has(custom.id), custom.name, custom.category));
  }
  const prep = parsePrepChecksSnapshot(localStorage.getItem(PREP_CHECKS_KEY) ?? "");
  for (const itemId of prep.checked) await add(createItem("prep", itemId, true));
  await setSyncMeta(LEGACY_MIGRATION_KEY, true);
}

function defaultActiveDate() {
  return getTripStatusForDateKey(getTokyoDateKey()).activeDate;
}

export function TravelSyncProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TravelStateItem[]>([]);
  const itemsRef = useRef<TravelStateItem[]>([]);
  const [dayItems, setDayItems] = useState<DayPlanItemState[]>([]);
  const dayItemsRef = useRef<DayPlanItemState[]>([]);
  const [status, setStatus] = useState<TravelSyncStatus>("loading");
  const [authenticated, setAuthenticated] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [conflictMessage, setConflictMessage] = useState("");
  const syncPromiseRef = useRef<Promise<void> | null>(null);
  const rerunRequestedRef = useRef(false);
  const activeDateRef = useRef(defaultActiveDate());

  const updateItems = useCallback((next: TravelStateItem[]) => { itemsRef.current = next; setItems(next); }, []);
  const updateDayItems = useCallback((next: DayPlanItemState[]) => { dayItemsRef.current = next; setDayItems(next); }, []);

  const replaceDay = useCallback(async (date: string, nextDayItems: DayPlanItemState[]) => {
    await replaceCachedDayPlan(date, nextDayItems);
    updateDayItems([...dayItemsRef.current.filter((item) => item.date !== date), ...nextDayItems]);
  }, [updateDayItems]);

  const clearSharedSnapshots = useCallback(async () => {
    await clearCachedSyncSnapshots();
    updateItems([]);
    updateDayItems([]);
    setAuthenticated(false);
    setLastSyncedAt(null);
    setStatus("locked");
  }, [updateDayItems, updateItems]);

  const applyDayItem = useCallback(async (item: DayPlanItemState) => {
    await putCachedDayPlanItem(item);
    updateDayItems([...dayItemsRef.current.filter((current) => !(current.date === item.date && current.itemId === item.itemId)), item]);
  }, [updateDayItems]);

  const sendOperation = useCallback(async (operation: SyncOperation) => {
    if (operation.resource === "day-plan") {
      if (operation.action === "post" && operation.item) {
        return await apiRequest<DayPlanItemState>("/api/day-plan", { method: "POST", body: JSON.stringify({
          date: operation.date, itemId: operation.item.itemId, sortOrder: operation.item.sortOrder, custom: operation.item.custom,
        }) });
      }
      if (operation.action === "patch" && operation.item) {
        return await apiRequest<DayPlanItemState>("/api/day-plan", { method: "PATCH", body: JSON.stringify({
          ...operation.item, baseUpdatedAt: operation.baseUpdatedAt ?? null,
        }) });
      }
      if (operation.action === "reorder") {
        return await apiRequest<DayPlanItemState[]>("/api/day-plan", { method: "PUT", body: JSON.stringify({ date: operation.date, orderedItemIds: operation.orderedItemIds }) });
      }
      return await apiRequest<{ deleted: number | boolean }>("/api/day-plan", {
        method: "DELETE", body: JSON.stringify({ date: operation.date, itemId: operation.action === "delete" ? operation.itemId : undefined }),
      });
    }
    if (operation.action === "patch") {
      return await apiRequest<TravelStateItem>("/api/travel-state", { method: "PATCH", body: JSON.stringify({
        namespace: operation.namespace, itemId: operation.itemId, checked: operation.checked,
        name: operation.name, category: operation.category, baseUpdatedAt: operation.baseUpdatedAt ?? null,
      }) });
    }
    return await apiRequest<{ deleted: number | boolean }>("/api/travel-state", {
      method: "DELETE", body: JSON.stringify({ namespace: operation.namespace, itemId: operation.action === "delete" ? operation.itemId : undefined }),
    });
  }, []);

  const syncNow = useCallback(async () => {
    rerunRequestedRef.current = true;
    if (syncPromiseRef.current) return await syncPromiseRef.current;
    if (!navigator.onLine) {
      setStatus("offline");
      setPendingCount((await getSyncOutbox()).length);
      return;
    }

    const runner = async () => {
      setStatus("pending");
      setError("");
      try {
        do {
          rerunRequestedRef.current = false;
          const queuedBeforeDrain = await getSyncOutbox();
          setPendingCount(queuedBeforeDrain.length);
          await drainOperationQueue(
            async () => (await getSyncOutbox()).sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
            async (operation) => {
            try {
              const result = await sendOperation(operation);
              if (operation.resource === "day-plan" && operation.action !== "delete" && operation.action !== "reset") {
                if (Array.isArray(result)) await replaceDay(operation.date, result as DayPlanItemState[]);
                else if (result && "itemId" in (result as object)) await applyDayItem(result as DayPlanItemState);
              }
            } catch (operationError) {
              const apiError = operationError as SyncApiError;
              if (apiError.code !== "SYNC_CONFLICT") throw operationError;
              if (apiError.details && typeof apiError.details === "object" && "itemId" in apiError.details) {
                if (operation.resource === "day-plan") {
                  await applyDayItem(apiError.details as DayPlanItemState);
                } else {
                  const latest = apiError.details as TravelStateItem;
                  await putCachedTravelItem(latest);
                  updateItems([...itemsRef.current.filter((item) => !(item.namespace === latest.namespace && item.itemId === latest.itemId)), latest]);
                }
              }
              setConflictMessage("另一支手機已先更新同一項目，已套用最新版本。");
            }
            await removeSyncOperation(operation.id);
            },
          );

          const remote = await apiRequest<TravelStateResponse>("/api/travel-state");
          await replaceCachedTravelItems(remote.items);
          updateItems(remote.items);
          const activeDate = activeDateRef.current;
          const remoteDay = await apiRequest<DayPlanResponse>(`/api/day-plan?date=${encodeURIComponent(activeDate)}`);
          await replaceDay(activeDate, remoteDay.items);
          setAuthenticated(true);
          const syncedAt = remoteDay.updatedAt ?? remote.updatedAt ?? new Date().toISOString();
          setLastSyncedAt(syncedAt);
          await setSyncMeta("last-synced-at", syncedAt);
          const remaining = await getSyncOutbox();
          setPendingCount(remaining.length);
          if (remaining.length) rerunRequestedRef.current = true;
        } while (rerunRequestedRef.current);
        setStatus("synced");
      } catch (syncError) {
        const apiError = syncError as SyncApiError;
        const remaining = (await getSyncOutbox()).length;
        setPendingCount(remaining);
        if (apiError.code === "UNAUTHORIZED") { setAuthenticated(false); setStatus("locked"); setError(""); }
        else if (apiError.code === "NETWORK_ERROR") { setStatus("offline"); setError(apiError.message); }
        else { setStatus(remaining ? "pending" : "error"); setError(apiError.message); }
      }
    };

    syncPromiseRef.current = runner().finally(() => { syncPromiseRef.current = null; });
    return await syncPromiseRef.current;
  }, [applyDayItem, replaceDay, sendOperation, updateItems]);

  const resumeSync = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      setPendingCount((await getSyncOutbox()).length);
      return;
    }
    try {
      const session = await apiRequest<{ authenticated: boolean }>("/api/travel-auth");
      setAuthenticated(session.authenticated);
      if (session.authenticated) await syncNow();
      else setStatus("locked");
    } catch (sessionError) {
      const error = sessionError as SyncApiError;
      setStatus(error.code === "NETWORK_ERROR" ? "offline" : "error");
      setError(error.message);
    }
  }, [syncNow]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await migrateLegacyLocalStorage();
        const [cached, cachedDays, outbox, savedSyncAt] = await Promise.all([
          getCachedTravelItems(), getCachedDayPlanItems(), getSyncOutbox(), getSyncMeta<string>("last-synced-at"),
        ]);
        if (cancelled) return;
        updateItems(cached);
        updateDayItems(cachedDays);
        setPendingCount(outbox.length);
        setLastSyncedAt(savedSyncAt ?? null);
        await resumeSync();
      } catch {
        if (!cancelled) { setStatus("error"); setError("這個瀏覽器無法開啟同步儲存空間。"); }
      }
    })();
    return () => { cancelled = true; };
  }, [resumeSync, updateDayItems, updateItems]);

  useEffect(() => {
    const handleOnline = () => void resumeSync();
    const handleOffline = () => setStatus("offline");
    const handleAuth = (event: Event) => {
      const action = event instanceof CustomEvent ? event.detail as TravelAuthAction | undefined : undefined;
      if (action === "logout") void clearSharedSnapshots();
      else void resumeSync();
    };
    const handleVisible = () => { if (document.visibilityState === "visible") void resumeSync(); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleOnline);
    window.addEventListener(AUTH_EVENT, handleAuth);
    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleOnline); window.removeEventListener(AUTH_EVENT, handleAuth);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [clearSharedSnapshots, resumeSync]);

  const queueChecklistPatch = useCallback(async (item: TravelStateItem, baseUpdatedAt: string | null) => {
    await putCachedTravelItem(item);
    await enqueueLatestSyncOperation({
      resource: "checklist", id: newOperationId(), action: "patch", namespace: item.namespace, itemId: item.itemId,
      checked: item.checked, name: item.name, category: item.category, baseUpdatedAt, createdAt: newOperationCreatedAt(),
    });
    rerunRequestedRef.current = true;
    setPendingCount((await getSyncOutbox()).length);
    setStatus(!navigator.onLine ? "offline" : authenticated ? "pending" : "locked");
    if (navigator.onLine && authenticated) await syncNow();
  }, [authenticated, syncNow]);

  const toggleItem = useCallback((namespace: TravelNamespace, itemId: string) => {
    const current = itemsRef.current.find((item) => item.namespace === namespace && item.itemId === itemId);
    const next = createItem(namespace, itemId, !current?.checked, current?.name ?? null, current?.category ?? null);
    updateItems([...itemsRef.current.filter((item) => !(item.namespace === namespace && item.itemId === itemId)), next]);
    void queueChecklistPatch(next, current?.updatedAt ?? null);
  }, [queueChecklistPatch, updateItems]);

  const addCustomItem = useCallback((namespace: Exclude<TravelNamespace, "prep">, name: string, category: string) => {
    const item = createItem(namespace, `custom-${newOperationId()}`, false, name, category);
    updateItems([...itemsRef.current, item]);
    void queueChecklistPatch(item, null);
  }, [queueChecklistPatch, updateItems]);

  const deleteCustomItem = useCallback((namespace: Exclude<TravelNamespace, "prep">, itemId: string) => {
    updateItems(itemsRef.current.filter((item) => !(item.namespace === namespace && item.itemId === itemId)));
    void (async () => {
      await deleteCachedTravelItem(namespace, itemId);
      await enqueueSyncOperation({ resource: "checklist", id: newOperationId(), action: "delete", namespace, itemId, createdAt: newOperationCreatedAt() });
      rerunRequestedRef.current = true;
      setPendingCount((await getSyncOutbox()).length);
      setStatus(!navigator.onLine ? "offline" : authenticated ? "pending" : "locked");
      if (navigator.onLine && authenticated) await syncNow();
    })();
  }, [authenticated, syncNow, updateItems]);

  const resetNamespace = useCallback(async (namespace: TravelNamespace) => {
    updateItems(itemsRef.current.filter((item) => item.namespace !== namespace));
    await clearCachedTravelNamespace(namespace);
    await enqueueSyncOperation({ resource: "checklist", id: newOperationId(), action: "reset", namespace, createdAt: newOperationCreatedAt() });
    rerunRequestedRef.current = true;
    setPendingCount((await getSyncOutbox()).length);
    if (navigator.onLine && authenticated) await syncNow();
    else setStatus(navigator.onLine ? "locked" : "offline");
  }, [authenticated, syncNow, updateItems]);

  const ensureDayPlan = useCallback(async (date: string) => {
    activeDateRef.current = date;
    rerunRequestedRef.current = true;
    if (navigator.onLine && authenticated) await syncNow();
  }, [authenticated, syncNow]);

  const queueDayOperation = useCallback(async (operation: DayPlanSyncOperation, latest = false) => {
    if (latest) await enqueueLatestSyncOperation(operation); else await enqueueSyncOperation(operation);
    rerunRequestedRef.current = true;
    setPendingCount((await getSyncOutbox()).length);
    setStatus(!navigator.onLine ? "offline" : authenticated ? "pending" : "locked");
    if (navigator.onLine && authenticated) await syncNow();
  }, [authenticated, syncNow]);

  const setDayItemStatus = useCallback((seed: DayPlanSeed, nextStatus: DayPlanStatus) => {
    void (async () => {
      if (nextStatus === "active") {
        const otherActive = dayItemsRef.current.filter((item) => item.date === seed.date && item.status === "active" && item.itemId !== seed.itemId);
        for (const item of otherActive) await applyDayItem({ ...item, status: "pending", updatedAt: new Date().toISOString() });
      }
      const item: DayPlanItemState = { ...seed, status: nextStatus, updatedAt: new Date().toISOString() };
      await applyDayItem(item);
      await queueDayOperation({
        resource: "day-plan", id: newOperationId(), action: "patch", date: item.date, itemId: item.itemId,
        item, baseUpdatedAt: seed.updatedAt, createdAt: newOperationCreatedAt(),
      }, true);
    })();
  }, [applyDayItem, queueDayOperation]);

  const addDayPlanItem = useCallback((date: string, custom: DayPlanCustomFields, sortOrder: number) => {
    void (async () => {
      const item: DayPlanItemState = {
        date, itemId: `custom-${newOperationId()}`, status: "pending", sortOrder, isCustom: true,
        custom, updatedAt: new Date().toISOString(),
      };
      await applyDayItem(item);
      await queueDayOperation({ resource: "day-plan", id: newOperationId(), action: "post", date, itemId: item.itemId, item, createdAt: newOperationCreatedAt() });
    })();
  }, [applyDayItem, queueDayOperation]);

  const deleteDayPlanItem = useCallback((date: string, itemId: string) => {
    void (async () => {
      await deleteCachedDayPlanItem(date, itemId);
      updateDayItems(dayItemsRef.current.filter((item) => !(item.date === date && item.itemId === itemId)));
      await queueDayOperation({ resource: "day-plan", id: newOperationId(), action: "delete", date, itemId, createdAt: newOperationCreatedAt() });
    })();
  }, [queueDayOperation, updateDayItems]);

  const reorderDayPlanItems = useCallback((date: string, ordered: DayPlanSeed[]) => {
    void (async () => {
      const now = new Date().toISOString();
      const nextStates = ordered.map((seed, index) => ({
        ...seed, status: dayItemsRef.current.find((item) => item.date === date && item.itemId === seed.itemId)?.status ?? "pending" as DayPlanStatus,
        sortOrder: (index + 1) * 100, updatedAt: now,
      }));
      for (const item of nextStates) await putCachedDayPlanItem(item);
      updateDayItems([...dayItemsRef.current.filter((item) => item.date !== date), ...nextStates]);
      await queueDayOperation({
        resource: "day-plan", id: newOperationId(), action: "reorder", date,
        orderedItemIds: nextStates.map((item) => item.itemId), createdAt: newOperationCreatedAt(),
      }, true);
    })();
  }, [queueDayOperation, updateDayItems]);

  const resetDayPlan = useCallback(async (date: string) => {
    await clearCachedDayPlan(date);
    updateDayItems(dayItemsRef.current.filter((item) => item.date !== date));
    await queueDayOperation({ resource: "day-plan", id: newOperationId(), action: "reset", date, createdAt: newOperationCreatedAt() });
  }, [queueDayOperation, updateDayItems]);

  const login = useCallback(async (pin: string) => {
    await apiRequest<{ authenticated: true }>("/api/travel-auth", { method: "POST", body: JSON.stringify({ pin }) });
    setAuthenticated(true); notifyTravelAuthChanged("login");
  }, []);
  const logout = useCallback(async () => {
    await apiRequest<{ authenticated: false }>("/api/travel-auth", { method: "DELETE" });
    await clearSharedSnapshots();
  }, [clearSharedSnapshots]);

  const value = useMemo<TravelSyncContextValue>(() => ({
    items, dayItems, status, authenticated, pendingCount, lastSyncedAt, error, conflictMessage,
    toggleItem, addCustomItem, deleteCustomItem, resetNamespace, ensureDayPlan, setDayItemStatus,
    addDayPlanItem, deleteDayPlanItem, reorderDayPlanItems, resetDayPlan, syncNow, login, logout,
  }), [
    items, dayItems, status, authenticated, pendingCount, lastSyncedAt, error, conflictMessage,
    toggleItem, addCustomItem, deleteCustomItem, resetNamespace, ensureDayPlan, setDayItemStatus,
    addDayPlanItem, deleteDayPlanItem, reorderDayPlanItems, resetDayPlan, syncNow, login, logout,
  ]);

  return <TravelSyncContext.Provider value={value}>{children}</TravelSyncContext.Provider>;
}

export function useTravelSync() {
  const context = useContext(TravelSyncContext);
  if (!context) throw new Error("useTravelSync must be used inside TravelSyncProvider");
  return context;
}

export function notifyTravelAuthChanged(action: TravelAuthAction = "login") {
  window.dispatchEvent(new CustomEvent<TravelAuthAction>(AUTH_EVENT, { detail: action }));
}

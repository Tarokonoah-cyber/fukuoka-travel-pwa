"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { foodCandidatesSeed } from "@/data/food";
import { mergeFoodCandidates, parseFoodCandidates } from "@/lib/food";
import { foodCandidateSchema } from "@/lib/foodSchema";
import {
  enqueueFoodOperation,
  getCachedFoodCandidates,
  getFoodOutbox,
  putCachedFoodCandidate,
  removeFoodOperation,
  replaceCachedFoodCandidates,
} from "@/lib/foodStorage";
import type { FoodCandidate, FoodCandidatesResponse } from "@/types/food";
import { useTravelSync } from "@/components/TravelSyncProvider";

type FoodSyncStatus = "loading" | "local" | "pending" | "synced" | "offline" | "error";

type FoodContextValue = {
  items: FoodCandidate[];
  status: FoodSyncStatus;
  pendingCount: number;
  error: string;
  conflictMessage: string;
  lastSyncedAt: string | null;
  saveCandidate: (item: FoodCandidate) => void;
  syncNow: () => Promise<void>;
};

type ApiEnvelope<T> = { ok: boolean; data?: T; error?: { code: string; message: string; details?: unknown } };

class FoodApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) { super(message); }
}

const FoodContext = createContext<FoodContextValue | null>(null);
let lastOperationTime = 0;

function operationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `food-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function operationTime() {
  lastOperationTime = Math.max(Date.now(), lastOperationTime + 1);
  return new Date(lastOperationTime).toISOString();
}

async function apiRequest<T>(url: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new FoodApiError("NETWORK_ERROR", "目前無法連線，美食變更已保留在這支手機。");
  }
  const envelope = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !envelope?.ok || envelope.data === undefined) {
    throw new FoodApiError(envelope?.error?.code ?? "REQUEST_FAILED", envelope?.error?.message ?? "美食清單同步失敗。", envelope?.error?.details);
  }
  return envelope.data;
}

function validateRemoteItems(response: FoodCandidatesResponse) {
  const items = parseFoodCandidates(response.items);
  if (items.length !== response.items.length) throw new FoodApiError("INVALID_DATA", "雲端美食資料格式異常，已保留手機中的安全版本。");
  return items;
}

export function FoodProvider({ children }: { children: ReactNode }) {
  const travel = useTravelSync();
  const [items, setItems] = useState<FoodCandidate[]>(foodCandidatesSeed);
  const itemsRef = useRef(foodCandidatesSeed);
  const [status, setStatus] = useState<FoodSyncStatus>("loading");
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState("");
  const [conflictMessage, setConflictMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const syncPromiseRef = useRef<Promise<void> | null>(null);

  const updateItems = useCallback((next: FoodCandidate[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const applyRemoteItem = useCallback(async (item: FoodCandidate) => {
    const next = mergeFoodCandidates(itemsRef.current.filter((current) => current.id !== item.id), [item]);
    updateItems(next);
    await putCachedFoodCandidate(item);
  }, [updateItems]);

  const syncNow = useCallback(async () => {
    if (syncPromiseRef.current) return await syncPromiseRef.current;
    if (!navigator.onLine) {
      setStatus("offline");
      setPendingCount((await getFoodOutbox()).length);
      return;
    }
    if (!travel.authenticated) {
      setStatus("local");
      setPendingCount((await getFoodOutbox()).length);
      return;
    }

    const runner = async () => {
      setStatus("pending");
      setError("");
      try {
        const remote = await apiRequest<FoodCandidatesResponse>("/api/food-candidates");
        const remoteItems = validateRemoteItems(remote);
        const queuedBeforeMerge = await getFoodOutbox();
        const queuedIds = new Set(queuedBeforeMerge.map((operation) => operation.item.id));
        const remoteById = new Map(remoteItems.map((item) => [item.id, item]));
        const local = mergeFoodCandidates(foodCandidatesSeed, itemsRef.current);
        const merged = mergeFoodCandidates(
          remoteItems,
          local.filter((item) => queuedIds.has(item.id) || !remoteById.has(item.id)),
        );
        updateItems(merged);
        await replaceCachedFoodCandidates(merged);

        for (const item of local) {
          if (!remoteById.has(item.id) && !queuedIds.has(item.id)) {
            await enqueueFoodOperation({ id: operationId(), item, baseUpdatedAt: null, createdAt: operationTime() });
          }
        }

        const queue = (await getFoodOutbox()).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
        setPendingCount(queue.length);
        for (const operation of queue) {
          try {
            const saved = await apiRequest<FoodCandidate>("/api/food-candidates", {
              method: "PATCH",
              body: JSON.stringify({ item: operation.item, baseUpdatedAt: operation.baseUpdatedAt }),
            });
            await applyRemoteItem(saved);
          } catch (syncError) {
            const apiError = syncError as FoodApiError;
            if (apiError.code !== "SYNC_CONFLICT") throw syncError;
            const latest = parseFoodCandidates([apiError.details])[0];
            if (latest) await applyRemoteItem(latest);
            setConflictMessage("另一支手機已先更新同一家候選，已套用最新版本。");
          }
          await removeFoodOperation(operation.id);
        }

        const refreshed = await apiRequest<FoodCandidatesResponse>("/api/food-candidates");
        const finalItems = mergeFoodCandidates(foodCandidatesSeed, validateRemoteItems(refreshed));
        updateItems(finalItems);
        await replaceCachedFoodCandidates(finalItems);
        setPendingCount(0);
        setLastSyncedAt(refreshed.updatedAt);
        setStatus("synced");
      } catch (syncError) {
        const apiError = syncError as FoodApiError;
        const remaining = (await getFoodOutbox()).length;
        setPendingCount(remaining);
        if (apiError.code === "UNAUTHORIZED") setStatus("local");
        else if (apiError.code === "NETWORK_ERROR") setStatus("offline");
        else setStatus("error");
        setError(apiError.message);
      }
    };
    syncPromiseRef.current = runner().finally(() => { syncPromiseRef.current = null; });
    return await syncPromiseRef.current;
  }, [applyRemoteItem, travel.authenticated, updateItems]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [cached, queue] = await Promise.all([getCachedFoodCandidates(), getFoodOutbox()]);
        if (cancelled) return;
        const parsedCached = parseFoodCandidates(cached);
        const invalidCachedData = parsedCached.length !== cached.length;
        const initial = mergeFoodCandidates(foodCandidatesSeed, parsedCached);
        updateItems(initial);
        await replaceCachedFoodCandidates(initial);
        setPendingCount(queue.length);
        setStatus(invalidCachedData ? "error" : navigator.onLine ? "local" : "offline");
        if (invalidCachedData) setError("部分損壞的離線美食資料已略過，安全資料仍可正常使用。");
        setInitialized(true);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("這個瀏覽器無法開啟美食清單的離線儲存空間。");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [updateItems]);

  useEffect(() => {
    if (!initialized || !travel.authenticated) return;
    const timer = window.setTimeout(() => void syncNow(), 0);
    return () => window.clearTimeout(timer);
  }, [initialized, syncNow, travel.authenticated]);

  useEffect(() => {
    const handleOnline = () => void syncNow();
    const handleOffline = () => setStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow]);

  const saveCandidate = useCallback((candidate: FoodCandidate) => {
    const current = itemsRef.current.find((item) => item.id === candidate.id);
    const now = new Date().toISOString();
    const item = { ...candidate, createdAt: current?.createdAt ?? candidate.createdAt ?? now, updatedAt: now };
    const parsed = foodCandidateSchema.safeParse(item);
    if (!parsed.success) {
      setStatus("error");
      setError("這筆美食資料格式不完整，尚未儲存；請檢查日期與網址。");
      return;
    }
    const validatedItem = parsed.data;
    updateItems([...itemsRef.current.filter((existing) => existing.id !== validatedItem.id), validatedItem]);
    void (async () => {
      await putCachedFoodCandidate(validatedItem);
      await enqueueFoodOperation({ id: operationId(), item: validatedItem, baseUpdatedAt: current?.updatedAt ?? null, createdAt: operationTime() });
      setPendingCount((await getFoodOutbox()).length);
      setStatus(!navigator.onLine ? "offline" : travel.authenticated ? "pending" : "local");
      if (navigator.onLine && travel.authenticated) await syncNow();
    })().catch(() => {
      setStatus("error");
      setError("美食變更暫時無法寫入離線儲存空間。");
    });
  }, [syncNow, travel.authenticated, updateItems]);

  const value = useMemo<FoodContextValue>(() => ({
    items, status, pendingCount, error, conflictMessage, lastSyncedAt, saveCandidate, syncNow,
  }), [items, status, pendingCount, error, conflictMessage, lastSyncedAt, saveCandidate, syncNow]);

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFoodCandidates() {
  const context = useContext(FoodContext);
  if (!context) throw new Error("useFoodCandidates must be used inside FoodProvider");
  return context;
}

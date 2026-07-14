"use client";

import type { TravelNamespace, TravelStateItem } from "@/types/travelSync";
import type { DayPlanItemState } from "@/types/dayPlan";

const DB_NAME = "fukuoka-travel-sync-v1";
const DB_VERSION = 2;
const ITEM_STORE = "items";
const DAY_ITEM_STORE = "day-items";
const OUTBOX_STORE = "outbox";
const META_STORE = "meta";

export type ChecklistSyncOperation = {
  resource?: "checklist";
  id: string;
  action: "patch" | "delete" | "reset";
  namespace: TravelNamespace;
  itemId?: string;
  checked?: boolean;
  name?: string | null;
  category?: string | null;
  baseUpdatedAt?: string | null;
  createdAt: string;
};

export type DayPlanSyncOperation = {
  resource: "day-plan";
  id: string;
  action: "post" | "patch" | "delete" | "reset" | "reorder";
  date: string;
  itemId?: string;
  item?: DayPlanItemState;
  baseUpdatedAt?: string | null;
  orderedItemIds?: string[];
  createdAt: string;
};

export type SyncOperation = ChecklistSyncOperation | DayPlanSyncOperation;

type StoredItem = TravelStateItem & { key: string };
type StoredDayItem = DayPlanItemState & { key: string };
type MetaRecord = { key: string; value: unknown };

let databasePromise: Promise<IDBDatabase> | null = null;

function itemKey(namespace: TravelNamespace, itemId: string) {
  return `${namespace}:${itemId}`;
}

function dayItemKey(date: string, itemId: string) {
  return `${date}:${itemId}`;
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("INDEXED_DB_REQUEST_FAILED"));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("INDEXED_DB_TRANSACTION_FAILED"));
    transaction.onabort = () => reject(transaction.error ?? new Error("INDEXED_DB_TRANSACTION_ABORTED"));
  });
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ITEM_STORE)) database.createObjectStore(ITEM_STORE, { keyPath: "key" });
      if (!database.objectStoreNames.contains(DAY_ITEM_STORE)) database.createObjectStore(DAY_ITEM_STORE, { keyPath: "key" });
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) database.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(META_STORE)) database.createObjectStore(META_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("INDEXED_DB_OPEN_FAILED"));
  });
  return databasePromise;
}

export async function getCachedTravelItems() {
  const database = await openDatabase();
  const rows = await requestResult(database.transaction(ITEM_STORE).objectStore(ITEM_STORE).getAll()) as StoredItem[];
  return rows.map((row) => ({
    namespace: row.namespace,
    itemId: row.itemId,
    checked: row.checked,
    name: row.name,
    category: row.category,
    isCustom: row.isCustom,
    updatedAt: row.updatedAt,
  }));
}

export async function replaceCachedTravelItems(items: TravelStateItem[]) {
  const database = await openDatabase();
  const transaction = database.transaction(ITEM_STORE, "readwrite");
  const store = transaction.objectStore(ITEM_STORE);
  store.clear();
  for (const item of items) store.put({ ...item, key: itemKey(item.namespace, item.itemId) } satisfies StoredItem);
  await transactionDone(transaction);
}

export async function clearCachedSyncSnapshots() {
  const database = await openDatabase();
  const transaction = database.transaction([ITEM_STORE, DAY_ITEM_STORE], "readwrite");
  transaction.objectStore(ITEM_STORE).clear();
  transaction.objectStore(DAY_ITEM_STORE).clear();
  await transactionDone(transaction);
}

export async function putCachedTravelItem(item: TravelStateItem) {
  const database = await openDatabase();
  const transaction = database.transaction(ITEM_STORE, "readwrite");
  transaction.objectStore(ITEM_STORE).put({ ...item, key: itemKey(item.namespace, item.itemId) } satisfies StoredItem);
  await transactionDone(transaction);
}

export async function deleteCachedTravelItem(namespace: TravelNamespace, itemId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(ITEM_STORE, "readwrite");
  transaction.objectStore(ITEM_STORE).delete(itemKey(namespace, itemId));
  await transactionDone(transaction);
}

export async function clearCachedTravelNamespace(namespace: TravelNamespace) {
  const database = await openDatabase();
  const rows = await requestResult(database.transaction(ITEM_STORE).objectStore(ITEM_STORE).getAll()) as StoredItem[];
  const transaction = database.transaction(ITEM_STORE, "readwrite");
  const store = transaction.objectStore(ITEM_STORE);
  for (const row of rows) if (row.namespace === namespace) store.delete(row.key);
  await transactionDone(transaction);
}

export async function getCachedDayPlanItems() {
  const database = await openDatabase();
  const rows = await requestResult(database.transaction(DAY_ITEM_STORE).objectStore(DAY_ITEM_STORE).getAll()) as StoredDayItem[];
  return rows.map((row) => ({
    date: row.date,
    itemId: row.itemId,
    status: row.status,
    sortOrder: row.sortOrder,
    isCustom: row.isCustom,
    custom: row.custom,
    updatedAt: row.updatedAt,
  }));
}

export async function replaceCachedDayPlan(date: string, items: DayPlanItemState[]) {
  const database = await openDatabase();
  const existing = await requestResult(database.transaction(DAY_ITEM_STORE).objectStore(DAY_ITEM_STORE).getAll()) as StoredDayItem[];
  const transaction = database.transaction(DAY_ITEM_STORE, "readwrite");
  const store = transaction.objectStore(DAY_ITEM_STORE);
  for (const row of existing) if (row.date === date) store.delete(row.key);
  for (const item of items) store.put({ ...item, key: dayItemKey(item.date, item.itemId) } satisfies StoredDayItem);
  await transactionDone(transaction);
}

export async function putCachedDayPlanItem(item: DayPlanItemState) {
  const database = await openDatabase();
  const transaction = database.transaction(DAY_ITEM_STORE, "readwrite");
  transaction.objectStore(DAY_ITEM_STORE).put({ ...item, key: dayItemKey(item.date, item.itemId) } satisfies StoredDayItem);
  await transactionDone(transaction);
}

export async function deleteCachedDayPlanItem(date: string, itemId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(DAY_ITEM_STORE, "readwrite");
  transaction.objectStore(DAY_ITEM_STORE).delete(dayItemKey(date, itemId));
  await transactionDone(transaction);
}

export async function clearCachedDayPlan(date: string) {
  const database = await openDatabase();
  const existing = await requestResult(database.transaction(DAY_ITEM_STORE).objectStore(DAY_ITEM_STORE).getAll()) as StoredDayItem[];
  const transaction = database.transaction(DAY_ITEM_STORE, "readwrite");
  const store = transaction.objectStore(DAY_ITEM_STORE);
  for (const row of existing) if (row.date === date) store.delete(row.key);
  await transactionDone(transaction);
}

export async function getSyncOutbox() {
  const database = await openDatabase();
  return await requestResult(database.transaction(OUTBOX_STORE).objectStore(OUTBOX_STORE).getAll()) as SyncOperation[];
}

export async function enqueueSyncOperation(operation: SyncOperation) {
  const database = await openDatabase();
  const transaction = database.transaction(OUTBOX_STORE, "readwrite");
  transaction.objectStore(OUTBOX_STORE).put(operation);
  await transactionDone(transaction);
}

function operationsCanCoalesce(existing: SyncOperation, next: SyncOperation) {
  if ((existing.resource ?? "checklist") !== (next.resource ?? "checklist") || existing.action !== next.action) return false;
  if (next.resource === "day-plan" && existing.resource === "day-plan") {
    if (next.action === "reorder") return existing.date === next.date;
    if (next.action === "patch") return existing.date === next.date && existing.itemId === next.itemId;
    return false;
  }
  if (next.resource !== "day-plan" && existing.resource !== "day-plan") {
    return next.action === "patch" && existing.namespace === next.namespace && existing.itemId === next.itemId;
  }
  return false;
}

export async function enqueueLatestSyncOperation(operation: SyncOperation) {
  const database = await openDatabase();
  const existing = await requestResult(database.transaction(OUTBOX_STORE).objectStore(OUTBOX_STORE).getAll()) as SyncOperation[];
  const transaction = database.transaction(OUTBOX_STORE, "readwrite");
  const store = transaction.objectStore(OUTBOX_STORE);
  const coalesced = existing.filter((queued) => operationsCanCoalesce(queued, operation)).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  let next = operation;
  const oldest = coalesced[0];
  if (oldest?.action === "patch" && operation.action === "patch") {
    next = { ...operation, baseUpdatedAt: oldest.baseUpdatedAt ?? null } as SyncOperation;
  }
  for (const queued of coalesced) store.delete(queued.id);
  store.put(next);
  await transactionDone(transaction);
}

export async function removeSyncOperation(id: string) {
  const database = await openDatabase();
  const transaction = database.transaction(OUTBOX_STORE, "readwrite");
  transaction.objectStore(OUTBOX_STORE).delete(id);
  await transactionDone(transaction);
}

export async function getSyncMeta<T>(key: string) {
  const database = await openDatabase();
  const value = await requestResult(database.transaction(META_STORE).objectStore(META_STORE).get(key)) as MetaRecord | undefined;
  return value?.value as T | undefined;
}

export async function setSyncMeta(key: string, value: unknown) {
  const database = await openDatabase();
  const transaction = database.transaction(META_STORE, "readwrite");
  transaction.objectStore(META_STORE).put({ key, value } satisfies MetaRecord);
  await transactionDone(transaction);
}

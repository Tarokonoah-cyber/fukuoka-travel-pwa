"use client";

import type { FoodCandidate } from "@/types/food";

const DB_NAME = "fukuoka-food-candidates-v1";
const DB_VERSION = 1;
const CANDIDATE_STORE = "candidates";
const OUTBOX_STORE = "outbox";

export type FoodSyncOperation = {
  id: string;
  item: FoodCandidate;
  baseUpdatedAt: string | null;
  createdAt: string;
};

let databasePromise: Promise<IDBDatabase> | null = null;

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("FOOD_DB_REQUEST_FAILED"));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("FOOD_DB_TRANSACTION_FAILED"));
    transaction.onabort = () => reject(transaction.error ?? new Error("FOOD_DB_TRANSACTION_ABORTED"));
  });
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CANDIDATE_STORE)) database.createObjectStore(CANDIDATE_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) database.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("FOOD_DB_OPEN_FAILED"));
  });
  return databasePromise;
}

export async function getCachedFoodCandidates() {
  const database = await openDatabase();
  return await requestResult(database.transaction(CANDIDATE_STORE).objectStore(CANDIDATE_STORE).getAll()) as FoodCandidate[];
}

export async function replaceCachedFoodCandidates(items: FoodCandidate[]) {
  const database = await openDatabase();
  const transaction = database.transaction(CANDIDATE_STORE, "readwrite");
  const store = transaction.objectStore(CANDIDATE_STORE);
  store.clear();
  for (const item of items) store.put(item);
  await transactionDone(transaction);
}

export async function putCachedFoodCandidate(item: FoodCandidate) {
  const database = await openDatabase();
  const transaction = database.transaction(CANDIDATE_STORE, "readwrite");
  transaction.objectStore(CANDIDATE_STORE).put(item);
  await transactionDone(transaction);
}

export async function getFoodOutbox() {
  const database = await openDatabase();
  return await requestResult(database.transaction(OUTBOX_STORE).objectStore(OUTBOX_STORE).getAll()) as FoodSyncOperation[];
}

export async function enqueueFoodOperation(operation: FoodSyncOperation) {
  const database = await openDatabase();
  const existing = await getFoodOutbox();
  const transaction = database.transaction(OUTBOX_STORE, "readwrite");
  const store = transaction.objectStore(OUTBOX_STORE);
  const sameItem = existing.filter((queued) => queued.item.id === operation.item.id);
  const first = sameItem.sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
  for (const queued of sameItem) store.delete(queued.id);
  store.put({ ...operation, baseUpdatedAt: first?.baseUpdatedAt ?? operation.baseUpdatedAt });
  await transactionDone(transaction);
}

export async function removeFoodOperation(id: string) {
  const database = await openDatabase();
  const transaction = database.transaction(OUTBOX_STORE, "readwrite");
  transaction.objectStore(OUTBOX_STORE).delete(id);
  await transactionDone(transaction);
}

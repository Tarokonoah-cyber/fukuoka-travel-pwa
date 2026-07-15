"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_TEXT_SIZE, parseTextSize, TEXT_SIZE_STORAGE_KEY, type TextSize } from "@/lib/textSize";

interface TextSizeContextValue {
  textSize: TextSize;
  setTextSize: (value: TextSize) => void;
}

const TextSizeContext = createContext<TextSizeContextValue | null>(null);
const TEXT_SIZE_CHANGE_EVENT = "fukuoka-text-size-change";
const TEXT_SIZE_CHANNEL = "fukuoka-text-size-sync-v1";

function applyTextSize(value: TextSize) {
  document.documentElement.dataset.textSize = value;
}

function subscribeTextSize(onStoreChange: () => void) {
  const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(TEXT_SIZE_CHANNEL);

  function syncFromStorage() {
    applyTextSize(getTextSizeSnapshot());
    onStoreChange();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== TEXT_SIZE_STORAGE_KEY) return;
    applyTextSize(parseTextSize(event.newValue));
    onStoreChange();
  }
  function handleBroadcast(event: MessageEvent<unknown>) {
    applyTextSize(parseTextSize(typeof event.data === "string" ? event.data : null));
    onStoreChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(TEXT_SIZE_CHANGE_EVENT, onStoreChange);
  window.addEventListener("pageshow", syncFromStorage);
  channel?.addEventListener("message", handleBroadcast);
  queueMicrotask(syncFromStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(TEXT_SIZE_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("pageshow", syncFromStorage);
    channel?.removeEventListener("message", handleBroadcast);
    channel?.close();
  };
}

function getTextSizeSnapshot() {
  return parseTextSize(window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY));
}

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const textSize = useSyncExternalStore(subscribeTextSize, getTextSizeSnapshot, () => DEFAULT_TEXT_SIZE);

  const setTextSize = useCallback((value: TextSize) => {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, value);
    applyTextSize(value);
    window.dispatchEvent(new Event(TEXT_SIZE_CHANGE_EVENT));
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(TEXT_SIZE_CHANNEL);
      channel.postMessage(value);
      channel.close();
    }
  }, []);

  return <TextSizeContext.Provider value={{ textSize, setTextSize }}>{children}</TextSizeContext.Provider>;
}

export function useTextSize() {
  const value = useContext(TextSizeContext);
  if (!value) throw new Error("useTextSize must be used inside TextSizeProvider");
  return value;
}

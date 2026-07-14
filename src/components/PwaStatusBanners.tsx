"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTravelSync } from "./TravelSyncProvider";

export function OfflineStatusBanner({ isOffline }: { isOffline: boolean }) {
  if (!isOffline) return null;
  return <div className="pwa-banner offline-banner" role="status"><div><strong>目前離線</strong><span>變更會先保留在這支手機，恢復連線後自動同步。</span></div></div>;
}

export function UpdateAvailableBanner({ isVisible, onRefresh }: { isVisible: boolean; onRefresh: () => void }) {
  if (!isVisible) return null;
  return <div className="pwa-banner update-banner" role="status"><div><strong>新版本已準備好</strong><span>更新後會重新載入旅行手冊。</span></div><button type="button" onClick={onRefresh}>立即更新</button></div>;
}

export function PwaStatusBanners() {
  const pathname = usePathname();
  const sync = useTravelSync();
  const previousPending = useRef(sync.pendingCount);
  const [isOffline, setIsOffline] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [dismissedPendingCount, setDismissedPendingCount] = useState<number | null>(null);

  useEffect(() => {
    function updateOnlineState() { setIsOffline(!navigator.onLine); }
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => { window.removeEventListener("online", updateOnlineState); window.removeEventListener("offline", updateOnlineState); };
  }, []);

  useEffect(() => {
    if (previousPending.current > 0 && sync.pendingCount === 0 && sync.status === "synced") {
      setSyncCompleted(true);
      const timer = window.setTimeout(() => setSyncCompleted(false), 3500);
      previousPending.current = sync.pendingCount;
      return () => window.clearTimeout(timer);
    }
    previousPending.current = sync.pendingCount;
  }, [sync.pendingCount, sync.status]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    function watchRegistration(registration: ServiceWorkerRegistration) {
      if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller && !cancelled) setWaitingWorker(installingWorker);
        });
      });
    }
    navigator.serviceWorker.register("/serwist/sw.js", { scope: "/", updateViaCache: "none", type: "module" }).then((registration) => {
      if (cancelled) return;
      watchRegistration(registration);
      registration.update().catch(() => undefined);
      if (!sessionStorage.getItem("fukuoka-offline-ready-shown")) {
        navigator.serviceWorker.ready.then(() => {
          if (cancelled) return;
          setOfflineReady(true);
          sessionStorage.setItem("fukuoka-offline-ready-shown", "1");
          window.setTimeout(() => setOfflineReady(false), 4500);
        }).catch(() => undefined);
      }
    }).catch(() => undefined);
    const handleControllerChange = () => {
      if (isRefreshing) return;
      setIsRefreshing(true);
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => { cancelled = true; navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange); };
  }, [isRefreshing]);

  const showLockedPending = !isOffline
    && pathname !== "/settings"
    && sync.status === "locked"
    && sync.pendingCount > 0
    && dismissedPendingCount !== sync.pendingCount;
  const hasBanner = Boolean(waitingWorker) || isOffline || showLockedPending || syncCompleted || offlineReady || (!isOffline && sync.status === "error");
  if (!hasBanner) return null;

  return <div className="pwa-banner-stack" aria-live="polite">
    <UpdateAvailableBanner isVisible={Boolean(waitingWorker)} onRefresh={() => waitingWorker?.postMessage({ type: "SKIP_WAITING" })} />
    <OfflineStatusBanner isOffline={isOffline} />
    {showLockedPending && <div className="pwa-banner sync-banner" role="status"><div><strong>{sync.pendingCount} 筆變更尚未同步</strong><span><Link href="/settings">輸入旅行共用 PIN</Link> 後會自動送出。</span></div><button type="button" className="pwa-dismiss" aria-label="關閉待同步提醒" onClick={() => setDismissedPendingCount(sync.pendingCount)}>×</button></div>}
    {!isOffline && sync.status === "error" && <div className="pwa-banner offline-banner" role="status"><div><strong>同步暫時無法完成</strong><span>{sync.error}</span></div></div>}
    {syncCompleted && <div className="pwa-banner ready-banner" role="status"><div><strong>兩支手機已同步</strong><span>剛才的變更已安全送出。</span></div></div>}
    {offlineReady && <div className="pwa-banner ready-banner" role="status"><div><strong>離線頁面已準備好</strong><span>主要頁面與清單可以在沒有網路時開啟。</span></div></div>}
  </div>;
}

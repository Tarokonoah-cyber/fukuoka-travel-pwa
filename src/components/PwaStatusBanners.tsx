"use client";

import { useEffect, useState } from "react";

export function OfflineStatusBanner({ isOffline }: { isOffline: boolean }) {
  if (!isOffline) return null;
  return (
    <div className="pwa-banner offline-banner" role="status">
      <strong>目前離線中</strong>
      <span>顯示已儲存的旅程資料，天氣與匯率可能不是最新。</span>
    </div>
  );
}

export function UpdateAvailableBanner({
  isVisible,
  onRefresh,
}: {
  isVisible: boolean;
  onRefresh: () => void;
}) {
  if (!isVisible) return null;
  return (
    <div className="pwa-banner update-banner" role="status">
      <div>
        <strong>旅遊手冊有新版本</strong>
        <span>重新整理後套用。</span>
      </div>
      <button type="button" onClick={onRefresh}>
        重新整理
      </button>
    </div>
  );
}

export function PwaStatusBanners() {
  const [isOffline, setIsOffline] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    function updateOnlineState() {
      setIsOffline(!navigator.onLine);
    }

    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    function watchRegistration(registration: ServiceWorkerRegistration) {
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller &&
            !cancelled
          ) {
            setWaitingWorker(installingWorker);
          }
        });
      });
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        if (cancelled) return;
        watchRegistration(registration);
        registration.update().catch(() => undefined);
      })
      .catch(() => undefined);

    const handleControllerChange = () => {
      if (isRefreshing) return;
      setIsRefreshing(true);
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [isRefreshing]);

  function applyUpdate() {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <div className="pwa-banner-stack" aria-live="polite">
      <UpdateAvailableBanner isVisible={Boolean(waitingWorker)} onRefresh={applyUpdate} />
      <OfflineStatusBanner isOffline={isOffline} />
    </div>
  );
}

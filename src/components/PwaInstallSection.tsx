"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function subscribeDisplayMode(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const subscribeClient = () => () => undefined;

export function PwaInstallSection() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installCompleted, setInstallCompleted] = useState(false);
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  const installed = standalone || installCompleted;
  const isIos = isClient && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallCompleted(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstallCompleted(true);
    setPrompt(null);
  }

  return (
    <section aria-labelledby="install-app-title">
      <div className="section-header">
        <h2 id="install-app-title">安裝到手機</h2>
        <span>PWA</span>
      </div>
      <div className="install-card">
        {installed ? (
          <><strong>已用 App 模式開啟</strong><p>旅遊手冊已加入主畫面，可從手機桌面直接啟動。</p></>
        ) : prompt ? (
          <><strong>可以安裝旅遊手冊</strong><p>安裝後會以獨立 App 開啟，也更容易在離線時找到。</p><button type="button" onClick={() => void install()}>安裝到主畫面</button></>
        ) : isIos ? (
          <><strong>在 iPhone 加入主畫面</strong><p>點 Safari 的分享按鈕，再選「加入主畫面」。安裝後主要旅程頁面可離線開啟。</p></>
        ) : (
          <><strong>從瀏覽器選單安裝</strong><p>若沒有出現安裝按鈕，請開啟瀏覽器選單並選擇「安裝應用程式」或「加入主畫面」。</p></>
        )}
      </div>
    </section>
  );
}

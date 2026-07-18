import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "福岡 8/2–8/6 旅遊手冊",
    short_name: "福岡旅遊",
    description: "2026 福岡兩人旅行手冊",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4efe5",
    theme_color: "#f4efe5",
    lang: "zh-Hant",
    categories: ["travel", "lifestyle"],
    shortcuts: [
      { name: "今日行程", short_name: "今日", url: "/today", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "完整行程", short_name: "行程", url: "/itinerary", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "旅費紀錄", short_name: "旅費", url: "/expenses", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

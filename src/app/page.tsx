import Link from "next/link";
import { HomeMenuCard } from "@/components/HomeMenuCard";
import { HomeSmartDashboard } from "@/components/HomeSmartDashboard";

const menu = [
  ["/today", "今日", "旅途中快速查看"],
  ["/itinerary", "行程", "五天完整安排"],
  ["/map", "地圖", "飯店與重點點位"],
  ["/expenses", "旅費", "AI 收據掃描與雲端旅費紀錄"],
  ["/comfort", "舒適度", "天氣、步行量與媽媽友善提醒"],
  ["/prep", "行前檢查", "航班、球賽與交通確認"],
  ["/emergency", "緊急", "電話與求助資訊"],
  ["/packing", "清單", "行李與出發前確認"],
  ["/weather", "天氣", "福岡預報與提醒"],
  ["/currency", "匯率", "日幣台幣快速換算"],
  ["/shopping", "購物", "伴手禮與必買"],
  ["/wishlist", "願望", "想去的地方"],
  ["/transport", "交通", "少轉乘路線"],
  ["/documents", "文件", "票券與重要資料"],
] as const;

export default function Home() {
  return (
    <div className="home-page page-enter">
      <HomeSmartDashboard />

      <section className="home-menu" aria-labelledby="menu-title">
        <div className="toc-heading">
          <span>CONTENTS</span>
          <h2 id="menu-title">旅程目次</h2>
        </div>
        <div className="menu-grid">
          {menu.map((m, i) => (
            <HomeMenuCard key={m[0]} href={m[0]} label={m[1]} detail={m[2]} index={i + 1} />
          ))}
        </div>
        <Link className="settings-link" href="/settings">
          同步、安裝與設定 <span>→</span>
        </Link>
      </section>
    </div>
  );
}

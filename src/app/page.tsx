import Link from "next/link";
import { CountdownCard } from "@/components/CountdownCard";
import { HomeBudgetSummary } from "@/components/HomeBudgetSummary";
import { HomeMenuCard } from "@/components/HomeMenuCard";
import { HomeTodayStatus } from "@/components/HomeTodayStatus";

const menu = [
  ["/today", "今日", "旅途中快速查看"],
  ["/comfort", "舒適度", "天氣、步行量與媽媽友善提醒"],
  ["/itinerary", "行程", "五天完整安排"],
  ["/map", "地圖", "飯店與重點點位"],
  ["/budget", "花費", "預算與記帳"],
  ["/prep", "行前檢查", "航班、球賽、保險與待補資料"],
  ["/packing", "清單", "行李與出發前確認"],
  ["/weather", "天氣", "福岡預報與提醒"],
  ["/currency", "匯率", "日幣台幣快速換算"],
  ["/shopping", "購物", "伴手禮與必買"],
  ["/wishlist", "願望", "想去的地方"],
  ["/transport", "交通", "少轉乘路線"],
  ["/documents", "文件", "票券與重要資料"],
  ["/emergency", "緊急", "電話與求助資訊"],
] as const;

export default function Home() {
  return (
    <div className="home-page page-enter">
      <header className="travel-cover">
        <div className="cover-kicker">
          <span>TRAVEL HANDBOOK</span>
          <span>FUK 2026</span>
        </div>
        <div className="cover-title">
          <div>
            <p>Fukuoka Travel Handbook</p>
            <h1>福岡</h1>
            <strong>2026.08.02 – 08.06</strong>
          </div>
          <div className="trip-seal">
            <span>5 DAYS</span>
            <strong>05</strong>
            <small>4 NIGHTS</small>
          </div>
        </div>
        <p className="cover-route">
          博多 <i>/</i> 天神 <i>/</i> PayPay Dome
        </p>
        <dl className="cover-details">
          <div>
            <dt>MEMBERS</dt>
            <dd>2 人</dd>
          </div>
          <div>
            <dt>STAY</dt>
            <dd>Nishitetsu Croom Hakata</dd>
          </div>
        </dl>
      </header>

      <div className="home-status-row">
        <CountdownCard />
        <HomeTodayStatus />
      </div>
      <HomeBudgetSummary />

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
          本機資料與設定 <span>→</span>
        </Link>
      </section>
    </div>
  );
}

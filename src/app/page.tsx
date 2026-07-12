import { CountdownCard } from "@/components/CountdownCard";
import { HomeMenuCard } from "@/components/HomeMenuCard";
import { HomeTodayStatus } from "@/components/HomeTodayStatus";

const menu=[
  ["/today","今日","現在要去哪裡"],["/itinerary","行程","五天完整安排"],["/packing","清單","出發前確認"],
  ["/shopping","購物","伴手禮與必買"],["/wishlist","願望","想去的地方"],["/transport","交通","少轉乘路線"],
  ["/documents","文件","非敏感摘要"],["/emergency","緊急","電話與處理方式"],["/settings","設定","本機資料管理"],
] as const;

export default function Home(){
  return <div className="home-page page-enter">
    <header className="home-header"><div><span className="eyebrow">TRAVEL NOTE · 2026</span><h1>福岡 <b>8/2–8/6</b></h1><p>Fukuoka Travel Handbook</p></div><div className="trip-seal"><span>2 人</span><strong>5日</strong><small>4 夜</small></div></header>
    <CountdownCard />
    <section className="home-facts"><span><small>住宿</small><strong>Nishitetsu Croom Hakata</strong></span><span><small>旅程</small><strong>博多・天神・棒球</strong></span></section>
    <section className="home-menu" aria-labelledby="menu-title"><div className="section-header"><h2 id="menu-title">旅程目次</h2><span>點一下就出發</span></div><div className="menu-grid">{menu.map((m,i)=><HomeMenuCard key={m[0]} href={m[0]} label={m[1]} detail={m[2]} index={i+1}/>)}</div></section>
    <HomeTodayStatus />
  </div>
}

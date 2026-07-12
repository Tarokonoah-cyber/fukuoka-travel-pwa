"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items=[
  {href:"/",label:"首頁",mark:"冊"},{href:"/today",label:"今日",mark:"今"},{href:"/itinerary",label:"行程",mark:"程"},
  {href:"/map",label:"地圖",mark:"圖"},{href:"/packing",label:"清單",mark:"單"},
];
export function BottomNav(){
  const pathname=usePathname();
  return <nav className="bottom-nav" aria-label="主要導覽"><div className="bottom-nav-inner">{items.map(item=>{
    const active=item.href==="/"?pathname==="/":pathname.startsWith(item.href);
    return <Link key={item.href} href={item.href} className={active?"nav-item active":"nav-item"} aria-current={active?"page":undefined}>
      <span className="nav-mark" aria-hidden>{item.mark}</span><span>{item.label}</span>
    </Link>;
  })}</div></nav>;
}

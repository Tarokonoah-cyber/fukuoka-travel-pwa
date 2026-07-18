"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "首頁", mark: "首" },
  { href: "/today", label: "今日", mark: "今" },
  { href: "/food", label: "美食", mark: "食" },
  { href: "/currency", label: "匯率", mark: "匯" },
  { href: "/map", label: "地圖", mark: "圖" },
  { href: "/expenses", label: "旅費", mark: "¥" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="主要導覽">
      <div className="bottom-nav-inner">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} className={active ? "nav-item active" : "nav-item"} aria-current={active ? "page" : undefined}>
              <span className="nav-mark" aria-hidden>
                {item.mark}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { PwaStatusBanners } from "./PwaStatusBanners";

export function AppShell({children}:{children:ReactNode}){
  return <div className="app-shell"><main className="page-frame">{children}</main><PwaStatusBanners /><BottomNav /></div>;
}

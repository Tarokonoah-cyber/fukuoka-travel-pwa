import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({children}:{children:ReactNode}){
  return <div className="app-shell"><main className="page-frame">{children}</main><BottomNav /></div>;
}

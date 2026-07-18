import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { PwaStatusBanners } from "./PwaStatusBanners";
import { TravelSyncProvider } from "./TravelSyncProvider";
import { OfflineNavigationGuard } from "./OfflineNavigationGuard";
import { TextSizeProvider } from "./TextSizeProvider";
import { FoodProvider } from "./FoodProvider";

export function AppShell({children}:{children:ReactNode}){
  return <TextSizeProvider><TravelSyncProvider><FoodProvider><div className="app-shell"><OfflineNavigationGuard /><PwaStatusBanners /><main className="page-frame">{children}</main><BottomNav /></div></FoodProvider></TravelSyncProvider></TextSizeProvider>;
}

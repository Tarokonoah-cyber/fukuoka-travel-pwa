"use client";
import { useSyncExternalStore } from "react";
import { getTripStatus } from "./date";

function todayKey(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`}
function subscribe(callback:()=>void){const timer=window.setInterval(callback,60_000);return ()=>window.clearInterval(timer)}

export function useTripStatus(){
  const key=useSyncExternalStore(subscribe,todayKey,()=>"2026-08-02");
  return getTripStatus(new Date(`${key}T12:00:00`));
}

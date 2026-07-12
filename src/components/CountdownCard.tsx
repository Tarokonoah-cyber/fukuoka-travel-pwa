"use client";
import { useTripStatus } from "@/lib/useTripStatus";
export function CountdownCard(){
  const status=useTripStatus();
  const main=status.phase==="before"?`${status.countdown} 天`:status.phase==="during"?`第 ${status.day} 天`:"旅程已結束";
  const label=status.phase==="before"?"距離出發":status.phase==="during"?"正在旅行中":"2026.8.2 — 8.6";
  return <div className="countdown-card"><span>{label}</span><strong>{main}</strong><small>福岡・博多｜5 天 4 晚</small></div>;
}

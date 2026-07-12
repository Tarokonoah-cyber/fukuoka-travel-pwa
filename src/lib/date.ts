import { itinerary } from "@/data/itinerary";

const toLocalDate = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
const fromISO = (iso: string) => { const [y,m,d]=iso.split("-").map(Number); return new Date(y,m-1,d); };

export function getTripStatus(now = new Date()) {
  const today=toLocalDate(now), start=fromISO("2026-08-02"), end=fromISO("2026-08-06");
  const diff=Math.ceil((start.getTime()-today.getTime())/86400000);
  if(today<start) return {phase:"before" as const, countdown:diff, day:1, activeDate:"2026-08-02"};
  if(today>end) return {phase:"after" as const, countdown:0, day:5, activeDate:"2026-08-06"};
  const day=Math.floor((today.getTime()-start.getTime())/86400000)+1;
  return {phase:"during" as const, countdown:0, day, activeDate:itinerary[day-1].date};
}

export function formatTripDate(iso:string){
  return new Intl.DateTimeFormat("zh-TW",{month:"numeric",day:"numeric",weekday:"short"}).format(fromISO(iso));
}

export function formatToday(now=new Date()){
  return new Intl.DateTimeFormat("zh-TW",{year:"numeric",month:"long",day:"numeric",weekday:"short"}).format(now);
}

export const STORAGE_KEYS={packing:"fukuoka-packing-v1",shopping:"fukuoka-shopping-v1",wishlist:"fukuoka-wishlist-v1"} as const;
export const WEATHER_CACHE_KEY="fukuoka-weather-v1";
export const CURRENCY_CACHE_KEY="fukuoka-currency-v1";
export const BUDGET_EXPENSES_KEY="fukuoka-budget-expenses-v1";
export type StorageKey=typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export interface StoredChecklist { checked:string[]; custom:{id:string;name:string;category:string}[] }
export const EMPTY_CHECKLIST:StoredChecklist={checked:[],custom:[]};
const STORAGE_EVENT="fukuoka-storage-change";
const TOOL_CACHE_KEYS=[WEATHER_CACHE_KEY,CURRENCY_CACHE_KEY,BUDGET_EXPENSES_KEY];

export function readChecklist(key:StorageKey):StoredChecklist{
  if(typeof window==="undefined") return EMPTY_CHECKLIST;
  return parseChecklistSnapshot(localStorage.getItem(key)??"");
}
export function parseChecklistSnapshot(value:string):StoredChecklist{try{const parsed=JSON.parse(value);return{checked:Array.isArray(parsed.checked)?parsed.checked:[],custom:Array.isArray(parsed.custom)?parsed.custom:[]}}catch{return EMPTY_CHECKLIST}}
export function writeChecklist(key:StorageKey,value:StoredChecklist){ localStorage.setItem(key,JSON.stringify(value)); window.dispatchEvent(new Event(STORAGE_EVENT)); }
export function clearStoredChecklist(key:StorageKey){ localStorage.removeItem(key); window.dispatchEvent(new Event(STORAGE_EVENT)); }
export function clearWeatherCache(){ localStorage.removeItem(WEATHER_CACHE_KEY); window.dispatchEvent(new Event(STORAGE_EVENT)); }
export function clearCurrencyCache(){ localStorage.removeItem(CURRENCY_CACHE_KEY); window.dispatchEvent(new Event(STORAGE_EVENT)); }
export function clearAllTripData(){ [...Object.values(STORAGE_KEYS),...TOOL_CACHE_KEYS].forEach(key=>localStorage.removeItem(key)); window.dispatchEvent(new Event(STORAGE_EVENT)); }
export function subscribeToChecklist(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener(STORAGE_EVENT,callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener(STORAGE_EVENT,callback)}}
export function getChecklistSnapshot(key:StorageKey){return localStorage.getItem(key)??""}
export function getServerChecklistSnapshot(){return ""}

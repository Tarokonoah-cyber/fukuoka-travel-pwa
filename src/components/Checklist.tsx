"use client";
import { useMemo,useState,useSyncExternalStore } from "react";
import type { ChecklistItemData } from "@/types/trip";
import { getChecklistSnapshot,getServerChecklistSnapshot,parseChecklistSnapshot,subscribeToChecklist,writeChecklist,type StorageKey } from "@/lib/storage";
import { ChecklistItem } from "./ChecklistItem";
import { ProgressBar } from "./ProgressBar";
import { SectionHeader } from "./SectionHeader";

export function Checklist({items,categories,storageKey,customPlaceholder="新增項目"}:{items:ChecklistItemData[];categories:string[];storageKey:StorageKey;customPlaceholder?:string}){
  const snapshot=useSyncExternalStore(subscribeToChecklist,()=>getChecklistSnapshot(storageKey),getServerChecklistSnapshot);
  const state=parseChecklistSnapshot(snapshot);
  const [name,setName]=useState(""); const [category,setCategory]=useState(categories[0]);
  const all=useMemo(()=>[...items,...state.custom],[items,state.custom]);
  function toggle(id:string){writeChecklist(storageKey,{...state,checked:state.checked.includes(id)?state.checked.filter(x=>x!==id):[...state.checked,id]})}
  function add(){const clean=name.trim();if(!clean)return;writeChecklist(storageKey,{...state,custom:[...state.custom,{id:`custom-${Date.now()}`,name:clean,category}]});setName("")}
  return <div className="checklist-wrap"><ProgressBar value={all.filter(i=>state.checked.includes(i.id)).length} total={all.length}/>
    <details className="add-panel"><summary>＋ 新增自訂項目</summary><form className="add-form" onSubmit={e=>{e.preventDefault();add()}}><label><span>項目名稱</span><input value={name} onChange={e=>setName(e.target.value)} placeholder={customPlaceholder}/></label><label><span>分類</span><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><button type="submit">新增</button></form></details>
    {categories.map(c=>{const list=all.filter(item=>item.category===c);if(!list.length)return null;return <section className="check-group" key={c}><SectionHeader title={c} note={`${list.filter(i=>state.checked.includes(i.id)).length} / ${list.length}`}/><div>{list.map(item=><ChecklistItem key={item.id} item={item} checked={state.checked.includes(item.id)} onToggle={()=>toggle(item.id)}/>)}</div></section>})}
  </div>
}

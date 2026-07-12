import type { ChecklistItemData } from "@/types/trip";
export function ChecklistItem({item,checked,onToggle}:{item:ChecklistItemData;checked:boolean;onToggle:()=>void}){return <label className={checked?"check-item checked":"check-item"}>
  <input type="checkbox" checked={checked} onChange={onToggle}/><span className="check-box" aria-hidden>{checked?"✓":""}</span>
  <span className="check-copy"><strong>{item.name}</strong>{item.note&&<small>{item.note}</small>}{(item.price||item.location)&&<small>{item.price?`約 ¥${item.price.toLocaleString()}`:""}{item.price&&item.location?" · ":""}{item.location}</small>}{item.reason&&<small>{item.area} · {item.reason}</small>}</span>
  {item.important&&<span className="important-tag">重要</span>}
  </label>}

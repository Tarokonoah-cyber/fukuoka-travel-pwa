import type { ChecklistItemData } from "@/types/trip";
export function ChecklistItem({item,checked,onToggle}:{item:ChecklistItemData;checked:boolean;onToggle:()=>void}){return <label className={checked?"check-item checked":"check-item"}>
  <input type="checkbox" checked={checked} onChange={onToggle}/><span className="check-box" aria-hidden>{checked?"✓":""}</span>
  <span className="check-copy"><strong>{item.name}</strong>{item.note&&<small>{item.note}</small>}{(item.price||item.location)&&<small>{typeof item.price==="number"?`約 ¥${item.price.toLocaleString()}`:item.price}{item.price&&item.location?" · ":""}{item.location}</small>}{item.reason&&<small>{item.area} · {item.reason}</small>}{(item.suitability||item.momFriendly)&&<small>{item.suitability&&`適合 ${item.suitability}`}{item.suitability&&item.momFriendly?" · ":""}{item.momFriendly&&`媽媽友善 ${item.momFriendly}`}</small>}</span>
  {item.important&&<span className="important-tag">重要</span>}
  </label>}

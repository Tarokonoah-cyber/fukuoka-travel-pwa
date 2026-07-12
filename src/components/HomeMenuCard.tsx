import Link from "next/link";
export function HomeMenuCard({href,label,detail,index}:{href:string;label:string;detail:string;index:number}){
  return <Link className="menu-card" href={href}><span className="menu-index">{String(index).padStart(2,"0")}</span><span><strong>{label}</strong><small>{detail}</small></span><span className="menu-arrow" aria-hidden>→</span></Link>;
}

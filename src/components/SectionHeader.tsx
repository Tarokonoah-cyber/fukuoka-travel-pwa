export function SectionHeader({title,note}:{title:string;note?:string}){return <div className="section-header"><h2>{title}</h2>{note&&<span>{note}</span>}</div>}

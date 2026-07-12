import Link from "next/link";
export function PageHeader({eyebrow,title,description,back=true}:{eyebrow?:string;title:string;description?:string;back?:boolean}){
  return <header className="page-header">
    <div className="page-header-row">{back&&<Link className="back-link" href="/" aria-label="回到目次">← 目次</Link>}{eyebrow&&<span className="eyebrow">{eyebrow}</span>}</div>
    <h1>{title}</h1>{description&&<p>{description}</p>}
  </header>;
}

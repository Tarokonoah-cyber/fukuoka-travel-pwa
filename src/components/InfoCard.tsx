import type { ReactNode } from "react";
export function InfoCard({title,children,className=""}:{title?:string;children:ReactNode;className?:string}){return <section className={`info-card ${className}`}>{title&&<h2>{title}</h2>}{children}</section>}

import type { ReactNode } from "react";
export function NoticeBox({title="先確認這個",children,tone="warm"}:{title?:string;children:ReactNode;tone?:"warm"|"blue"|"plain"}){return <aside className={`notice-box ${tone}`}><strong>{title}</strong><div>{children}</div></aside>}

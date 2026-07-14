import type { ReactNode } from "react";

export function EmptyState({ children, title, description }: { children?: ReactNode; title?: string; description?: string }) {
  if (title || description) {
    return (
      <div className="empty-state">
        {title && <strong>{title}</strong>}
        {description && <p>{description}</p>}
      </div>
    );
  }

  return <div className="empty-state">{children ?? "尚未有資料"}</div>;
}

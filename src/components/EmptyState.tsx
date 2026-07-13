export function EmptyState({ children, title, description }: { children?: string; title?: string; description?: string }) {
  if (title || description) {
    return (
      <div className="empty-state">
        {title && <strong>{title}</strong>}
        {description && <p>{description}</p>}
      </div>
    );
  }

  return <p className="empty-state">{children ?? "尚未有資料"}</p>;
}

export function EmptyState({ title = "No data", children }) {
  return (
    <div className="ui-empty-state">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

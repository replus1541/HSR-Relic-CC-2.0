export function Tabs({ items = [], activeId, onSelect }) {
  return (
    <div className="ui-tabs" role="tablist">
      {items.map((item) => (
        <button
          className={item.id === activeId ? "is-active" : ""}
          key={item.id}
          onClick={() => onSelect?.(item.id)}
          role="tab"
          type="button"
          aria-selected={item.id === activeId}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

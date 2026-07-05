export function Panel({ title, eyebrow, toolbar, children, className = "" }) {
  return (
    <section className={["ui-panel", className].filter(Boolean).join(" ")}>
      {(title || eyebrow || toolbar) && (
        <header className="ui-panel__header">
          <div>
            {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {toolbar && <div className="ui-panel__toolbar">{toolbar}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Card({ children, className = "" }) {
  return <div className={["ui-card", className].filter(Boolean).join(" ")}>{children}</div>;
}

const toneClass = {
  neutral: "ui-badge--neutral",
  ready: "ui-badge--ready",
  blocked: "ui-badge--blocked",
  warning: "ui-badge--warning",
};

export function Badge({ children, tone = "neutral" }) {
  return <span className={["ui-badge", toneClass[tone] ?? toneClass.neutral].join(" ")}>{children}</span>;
}

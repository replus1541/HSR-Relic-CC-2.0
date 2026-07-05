export function TraceRow({ label, value, meta }) {
  return (
    <div className="ui-trace-row">
      <span>{label}</span>
      <strong>{value}</strong>
      {meta && <small>{meta}</small>}
    </div>
  );
}

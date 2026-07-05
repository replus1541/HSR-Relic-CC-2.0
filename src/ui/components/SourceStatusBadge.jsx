import { Badge } from "./Badge.jsx";

function toneForSource({ sourceOrigin, calculationReady, blockedReason }) {
  if (sourceOrigin === "manual_hint" || sourceOrigin === "manual_guide") return "blocked";
  if (blockedReason) return "blocked";
  return calculationReady ? "ready" : "warning";
}

export function SourceStatusBadge({ sourceOrigin, calculationReady, blockedReason }) {
  const label = blockedReason ?? (calculationReady ? "calculation_ready" : sourceOrigin ?? "pending");
  return <Badge tone={toneForSource({ sourceOrigin, calculationReady, blockedReason })}>{label}</Badge>;
}

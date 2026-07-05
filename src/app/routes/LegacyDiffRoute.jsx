import { Badge, EmptyState, Panel } from "../../ui/components/index.js";

export function LegacyDiffRoute() {
  return (
    <Panel eyebrow="Diff" title="Legacy Comparison" toolbar={<Badge tone="blocked">not connected</Badge>}>
      <EmptyState title="Legacy diff pending">
        Phase 16 will compare v2 output against approved legacy reference snapshots.
      </EmptyState>
    </Panel>
  );
}

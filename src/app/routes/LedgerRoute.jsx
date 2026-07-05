import { Badge, Card, Panel, TraceRow } from "../../ui/components/index.js";

export function LedgerRoute() {
  return (
    <Panel eyebrow="Ledger" title="Combat Ledger" toolbar={<Badge tone="neutral">sample-ready</Badge>}>
      <Card>
        <TraceRow label="Source" value="deduped effects" meta="Phase 11 sample ledger is generated outside the UI." />
        <TraceRow label="Used rows" value="display only" meta="Aggregation and value resolving are not run by this route." />
      </Card>
    </Panel>
  );
}

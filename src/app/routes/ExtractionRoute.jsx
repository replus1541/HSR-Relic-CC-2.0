import { Badge, EmptyState, Panel } from "../../ui/components/index.js";

export function ExtractionRoute() {
  return (
    <Panel eyebrow="Extraction" title="Canonical Dataset Review" toolbar={<Badge tone="warning">placeholder</Badge>}>
      <EmptyState title="Overview route pending">
        Phase 14 will connect generated extraction status and character detail shells.
      </EmptyState>
    </Panel>
  );
}

import { Badge, Card, EmptyState, MetricList, Panel } from "../../ui/components/index.js";

export function ImportPreviewModal({ loadoutState, title = "Import Preview" }) {
  if (!loadoutState) {
    return <EmptyState title="No import preview">Import preview data is not loaded.</EmptyState>;
  }

  return (
    <Panel eyebrow="Import" title={title} toolbar={<Badge tone="neutral">{loadoutState.sourceKind}</Badge>}>
      <div className="route-grid">
        <Card>
          <h3>Mapped</h3>
          <MetricList
            items={[
              { label: "Roster", value: loadoutState.roster.length },
              { label: "Party slots", value: loadoutState.partySlots.filter(Boolean).length },
              { label: "Lightcones", value: Object.keys(loadoutState.equipment.lightcones).length },
              { label: "Relic owners", value: Object.keys(loadoutState.equipment.relics).length },
            ]}
          />
        </Card>
        <Card>
          <h3>Warnings</h3>
          <MetricList
            items={[
              { label: "Warnings", value: loadoutState.warnings.length },
              { label: "Failed rows", value: loadoutState.failedRows.length },
            ]}
          />
        </Card>
      </div>
    </Panel>
  );
}

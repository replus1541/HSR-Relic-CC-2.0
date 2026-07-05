import extractionStatus from "../../data/generated/extraction-status.json";
import { Badge, Card, EmptyState, MetricList, Panel } from "../ui/components/index.js";

function statusTone(row) {
  return row.extractionReady ? "ready" : "blocked";
}

export function ExtractionOverview() {
  const rows = extractionStatus.rows ?? [];
  const summary = extractionStatus.summary ?? {};

  return (
    <Panel eyebrow="Extraction" title="Canonical Dataset Overview" toolbar={<Badge tone="neutral">generated status</Badge>}>
      <MetricList
        items={[
          { label: "Characters", value: summary.characters ?? 0 },
          { label: "Ready", value: summary.extractionReady ?? 0 },
          { label: "Blocked", value: summary.blocked ?? 0 },
          { label: "Blocked rows", value: summary.blockedRows ?? 0 },
        ]}
      />
      {rows.length ? (
        <div className="route-grid">
          {rows.map((row) => (
            <Card key={row.characterId}>
              <h3>{row.characterId}</h3>
              <Badge tone={statusTone(row)}>{row.extractionReady ? "ready" : "blocked"}</Badge>
              <MetricList
                items={[
                  { label: "Sources", value: row.sourceRows },
                  { label: "Effects", value: row.effectRows },
                  { label: "Blocked", value: row.blockedRows },
                ]}
              />
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No extraction status">Generated extraction status is not available.</EmptyState>
      )}
    </Panel>
  );
}

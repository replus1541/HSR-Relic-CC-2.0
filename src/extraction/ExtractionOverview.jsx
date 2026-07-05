import extractionStatus from "../../data/generated/extraction-status.json";
import { Badge, Card, EmptyState, MetricList, Panel } from "../ui/components/index.js";

function statusTone(row) {
  return row.extractionReady ? "ready" : "blocked";
}

export function ExtractionOverview() {
  const rows = extractionStatus.rows ?? [];
  const summary = extractionStatus.summary ?? {};

  return (
    <Panel eyebrow="Extraction" title="Canonical Dataset Overview" toolbar={<Badge tone="ready">{extractionStatus.datasetMode ?? "sample"} dataset</Badge>}>
      <MetricList
        items={[
          { label: "Characters", value: summary.characters ?? 0 },
          { label: "Ready", value: summary.extractionReady ?? 0 },
          { label: "Blocked", value: summary.blocked ?? 0 },
          { label: "Blocked rows", value: summary.blockedRows ?? 0 },
          { label: "Effect rows 0", value: summary.effectRowsZero ?? 0 },
          { label: "Dynamic formula", value: summary.dynamicFormulaCharacters ?? 0 },
        ]}
      />
      {rows.length ? (
        <div className="route-grid">
          {rows.map((row) => (
            <Card key={row.characterId}>
              <h3>
                <a href={`/extraction/${encodeURIComponent(row.characterId)}`}>{row.displayName ?? row.characterId}</a>
              </h3>
              <Badge tone={statusTone(row)}>{row.extractionReady ? "ready" : "blocked"}</Badge>
              <MetricList
                items={[
                  { label: "Sources", value: row.sourceRows },
                  { label: "Effects", value: row.effectRows },
                  { label: "Coefficients", value: row.coefficientRows },
                  { label: "Blocked", value: row.blockedRows },
                  { label: "Missing", value: row.missingExtraction?.length ?? 0 },
                ]}
              />
              {(row.missingExtraction?.length ?? 0) > 0 && <p>{row.missingExtraction.slice(0, 3).join(", ")}</p>}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No extraction status">Generated extraction status is not available.</EmptyState>
      )}
    </Panel>
  );
}

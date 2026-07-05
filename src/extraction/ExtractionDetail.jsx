import canonicalDataset from "../../data/generated/extraction-canonical-dataset.json";
import { Badge, Card, EmptyState, MetricList, Panel } from "../ui/components/index.js";

function ownerFromSourceId(sourceId) {
  const parts = String(sourceId ?? "").split(":");
  if (parts[0] !== "source") return null;
  if (parts[1] === "hoyowiki") return parts[2] || null;
  return parts[1] || null;
}

function rowOwner(row) {
  return row.characterId ?? row.effectProviderId ?? ownerFromSourceId(row.sourceId) ?? ownerFromSourceId(row.id);
}

export function ExtractionDetail({ params = {} }) {
  const characterId = params.characterId;
  const sourceRows = canonicalDataset.rows.sourceRows.filter((row) => rowOwner(row) === characterId);
  const effectRows = canonicalDataset.rows.effectRows.filter((row) => rowOwner(row) === characterId);
  const coefficientRows = canonicalDataset.rows.coefficientRows.filter((row) => rowOwner(row) === characterId);
  const hasRows = sourceRows.length + effectRows.length + coefficientRows.length > 0;

  return (
    <Panel eyebrow="Extraction Detail" title={characterId ?? "Unknown character"} toolbar={<Badge tone={hasRows ? "ready" : "blocked"}>{hasRows ? "found" : "missing"}</Badge>}>
      {hasRows ? (
        <div className="route-grid">
          <Card>
            <h3>Sources</h3>
            <MetricList items={[{ label: "Rows", value: sourceRows.length }, { label: "Ready", value: sourceRows.filter((row) => row.calculationReady).length }]} />
          </Card>
          <Card>
            <h3>Effects</h3>
            <MetricList items={[{ label: "Rows", value: effectRows.length }, { label: "Ready", value: effectRows.filter((row) => row.calculationStatus === "calculation_ready").length }]} />
          </Card>
          <Card>
            <h3>Coefficients</h3>
            <MetricList items={[{ label: "Rows", value: coefficientRows.length }, { label: "Ready", value: coefficientRows.filter((row) => row.calculationStatus === "calculation_ready").length }]} />
          </Card>
        </div>
      ) : (
        <EmptyState title="Character rows not found">This shell only displays generated canonical dataset rows.</EmptyState>
      )}
    </Panel>
  );
}

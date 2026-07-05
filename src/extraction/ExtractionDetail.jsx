import canonicalDataset from "../../data/generated/extraction-canonical-dataset.json";
import extractionStatus from "../../data/generated/extraction-status.json";
import { Badge, Card, EmptyState, MetricList, Panel, SourceStatusBadge, TraceRow } from "../ui/components/index.js";

function ownerFromSourceId(sourceId) {
  const parts = String(sourceId ?? "").split(":");
  if (parts[0] !== "source") return null;
  if (parts[1] === "hoyowiki") return parts[2] || null;
  return parts[1] || null;
}

function rowOwner(row) {
  return row.characterId ?? row.effectProviderId ?? row.characterName ?? ownerFromSourceId(row.sourceId) ?? ownerFromSourceId(row.id);
}

function findStatusRow(characterId) {
  const decoded = decodeURIComponent(characterId ?? "");
  return (extractionStatus.rows ?? []).find((row) => {
    const identifiers = [
      row.characterId,
      row.displayName,
      row.officialName,
      row.localizedName,
      row.internalId,
      row.internalName,
      row.identifiers?.effectAvatar,
      row.identifiers?.effectName,
      row.identifiers?.hoyowikiEntryPageId,
      row.identifiers?.coefficientAvatar,
      row.identifiers?.coefficientAvatarId,
      ...(row.aliasNames ?? []),
      ...(row.sourceNames ?? []),
    ].filter(Boolean);
    return identifiers.includes(decoded);
  });
}

function rowMatchesStatus(row, statusRow, fallbackCharacterId) {
  if (!statusRow) return rowOwner(row) === fallbackCharacterId;
  const owner = rowOwner(row);
  return [
    statusRow.characterId,
    statusRow.displayName,
    statusRow.officialName,
    statusRow.localizedName,
    statusRow.internalId,
    statusRow.internalName,
    statusRow.identifiers?.effectAvatar,
    statusRow.identifiers?.effectName,
    statusRow.identifiers?.hoyowikiEntryPageId,
    statusRow.identifiers?.coefficientAvatar,
    statusRow.identifiers?.coefficientAvatarId,
    ...(statusRow.aliasNames ?? []),
    ...(statusRow.sourceNames ?? []),
  ].filter(Boolean).includes(owner);
}

export function ExtractionDetail({ params = {} }) {
  const characterId = decodeURIComponent(params.characterId ?? "");
  const statusRow = findStatusRow(characterId);
  const title = statusRow?.displayName ?? characterId ?? "Unknown character";
  const sourceRows = canonicalDataset.rows.sourceRows.filter((row) => rowMatchesStatus(row, statusRow, characterId));
  const effectRows = canonicalDataset.rows.effectRows.filter((row) => rowMatchesStatus(row, statusRow, characterId));
  const coefficientRows = canonicalDataset.rows.coefficientRows.filter((row) => rowMatchesStatus(row, statusRow, characterId));
  const blockedSourceRows = sourceRows.filter((row) => !row.calculationReady || row.policyBlockedReason);
  const hasRows = sourceRows.length + effectRows.length + coefficientRows.length > 0;
  const statusTone = statusRow?.readinessStatus === "ready" ? "ready" : statusRow?.readinessStatus === "partial" ? "warning" : "blocked";

  return (
    <Panel eyebrow="Extraction Detail" title={title} toolbar={<Badge tone={statusTone}>{statusRow?.readinessStatus ?? (hasRows ? "partial" : "blocked")}</Badge>}>
      {hasRows ? (
        <div className="route-grid">
          <Card>
            <h3>Coverage</h3>
            <MetricList
              items={[
                { label: "Missing", value: statusRow?.missingExtraction?.length ?? 0 },
                { label: "Required", value: statusRow?.requiredMissingCount ?? 0 },
                { label: "Optional", value: statusRow?.optionalMissingCount ?? 0 },
                { label: "Dynamic formula", value: statusRow?.valueMode?.dynamicFormula ?? 0 },
                { label: "Unknown value", value: statusRow?.valueMode?.unknown ?? 0 },
              ]}
            />
            <TraceRow label="Skill text" value={statusRow?.sourceAvailability?.skillText ? "linked" : "missing"} meta={statusRow?.identifiers?.hoyowikiEntryPageId} />
            <TraceRow label="Effect trace" value={statusRow?.sourceAvailability?.effectTrace ? "linked" : "missing"} meta={statusRow?.identifiers?.effectAvatar} />
            <TraceRow label="Coefficient" value={statusRow?.sourceAvailability?.coefficient ? "linked" : "missing"} meta={statusRow?.identifiers?.coefficientAvatar} />
            <TraceRow label="Relic source" value={statusRow?.sourceAvailability?.relic ?? "missing_snapshot"} />
            {(statusRow?.missingCount ?? 0) > 0 && <p>{[...(statusRow.requiredMissingItems ?? []), ...(statusRow.optionalMissingItems ?? [])].join(", ")}</p>}
          </Card>
          <Card>
            <h3>Sources</h3>
            <MetricList items={[{ label: "Rows", value: sourceRows.length }, { label: "Ready", value: sourceRows.filter((row) => row.calculationReady).length }, { label: "Blocked", value: blockedSourceRows.length }]} />
            {sourceRows.slice(0, 4).map((row) => (
              <TraceRow
                key={row.id}
                label={row.sourceKind}
                value={<SourceStatusBadge sourceOrigin={row.sourceOrigin} calculationReady={row.calculationReady} blockedReason={row.policyBlockedReason} />}
                meta={row.sourceRecord}
              />
            ))}
          </Card>
          <Card>
            <h3>Effects</h3>
            <MetricList items={[{ label: "Rows", value: effectRows.length }, { label: "Ready", value: effectRows.filter((row) => row.calculationStatus === "calculation_ready").length }]} />
            {effectRows.slice(0, 4).map((row) => (
              <TraceRow key={row.id} label={row.stat} value={row.valueMode} meta={row.sourceTrace ?? row.sourceId} />
            ))}
          </Card>
          <Card>
            <h3>Coefficients</h3>
            <MetricList items={[{ label: "Rows", value: coefficientRows.length }, { label: "Ready", value: coefficientRows.filter((row) => row.calculationStatus === "calculation_ready").length }]} />
            {coefficientRows.slice(0, 4).map((row) => (
              <TraceRow key={row.id} label={row.attackType} value={row.coefficientValues?.length ?? 0} meta={row.skillId} />
            ))}
          </Card>
        </div>
      ) : (
        <EmptyState title="Character rows not found">This shell only displays generated canonical dataset rows.</EmptyState>
      )}
    </Panel>
  );
}

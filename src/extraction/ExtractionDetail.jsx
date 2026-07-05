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
  const blockedEffectRows = effectRows.filter((row) => row.calculationStatus !== "calculation_ready");
  const reviewedEffectRows = effectRows.filter((row) => row.userReview);
  const hasRows = sourceRows.length + effectRows.length + coefficientRows.length > 0;
  const statusTone = statusRow?.readinessStatus === "ready" ? "ready" : statusRow?.readinessStatus === "partial" ? "warning" : "blocked";
  const missingDiagnostics = statusRow?.missingDiagnostics ?? [];

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
                { label: "Reviewed dynamic", value: statusRow?.valueMode?.dynamicFormulaReviewed ?? 0 },
                { label: "Unreviewed dynamic", value: statusRow?.valueMode?.dynamicFormulaUnreviewed ?? 0 },
                { label: "Unknown value", value: statusRow?.valueMode?.unknown ?? 0 },
              ]}
            />
            <TraceRow label="Skill text" value={statusRow?.sourceAvailability?.skillText ? "linked" : "missing"} meta={statusRow?.identifiers?.hoyowikiEntryPageId} />
            <TraceRow label="Effect trace" value={statusRow?.sourceAvailability?.effectTrace ? "linked" : "missing"} meta={statusRow?.identifiers?.effectAvatar} />
            <TraceRow label="Coefficient" value={statusRow?.sourceAvailability?.coefficient ? "linked" : "missing"} meta={statusRow?.identifiers?.coefficientAvatar} />
            <TraceRow label="Relic source" value={statusRow?.sourceAvailability?.relic ?? "missing_snapshot"} />
            {(statusRow?.missingCount ?? 0) > 0 && <p>{[...(statusRow.requiredMissingItems ?? []), ...(statusRow.optionalMissingItems ?? [])].join(", ")}</p>}
          </Card>
          {missingDiagnostics.length > 0 && (
          <Card>
            <h3>Missing Analysis</h3>
            <MetricList
              items={[
                { label: "Auto match", value: missingDiagnostics.filter((item) => item.autoMatchPossible).length },
                { label: "Curated source", value: missingDiagnostics.filter((item) => item.needsCuratedSource).length },
                { label: "Parser", value: missingDiagnostics.filter((item) => item.failureReason === "parser_not_implemented").length },
              ]}
            />
            {missingDiagnostics.slice(0, 6).map((item) => (
              <TraceRow
                key={`${item.missingType}:${item.failureReason}`}
                label={item.missingType}
                value={item.failureReason}
                meta={item.nextAction}
              />
            ))}
          </Card>
          )}
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
            <MetricList
              items={[
                { label: "Rows", value: effectRows.length },
                { label: "Ready", value: effectRows.filter((row) => row.calculationStatus === "calculation_ready").length },
                { label: "Blocked", value: blockedEffectRows.length },
                { label: "User reviewed", value: reviewedEffectRows.length },
              ]}
            />
            {effectRows.map((row) => (
              <TraceRow
                key={row.id}
                label={row.stat}
                value={`${row.valueMode}${row.blockedReason ? ` / ${row.blockedReason}` : ""}`}
                meta={row.userReview?.decision ?? row.sourceTrace ?? row.sourceId}
              />
            ))}
            {reviewedEffectRows.some((row) => row.userReview?.relatedModelingNotes?.length) && (
              <div className="trace-stack">
                {reviewedEffectRows.flatMap((row) => (row.userReview?.relatedModelingNotes ?? []).map((note) => (
                  <TraceRow key={`${row.id}:${note}`} label={`${row.stat} note`} value="modeling" meta={note} />
                )))}
              </div>
            )}
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

import fs from "node:fs";
import { BlockedReason, CalculationStatus, SourceKind, SourceOrigin } from "../src/data-model/schemas/index.js";
import { buildCanonicalDataset } from "../src/extraction/build-canonical-dataset.js";

const generatedDir = "data/generated";
const datasetPath = `${generatedDir}/extraction-canonical-dataset.json`;
const statusPath = `${generatedDir}/extraction-status.json`;
const reportPath = "reports/extraction/canonical-dataset-report.md";

function readRows(fileName) {
  const payload = JSON.parse(fs.readFileSync(`${generatedDir}/${fileName}`, "utf8"));
  if (!Array.isArray(payload.rows)) throw new Error(`${fileName} rows must be an array`);
  return payload.rows;
}

function writeJson(relativePath, value) {
  fs.writeFileSync(relativePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ownerFromSourceId(sourceId) {
  const parts = String(sourceId ?? "").split(":");
  if (parts[0] !== "source") return null;
  if (parts[1] === "hoyowiki") return parts[2] || null;
  return parts[1] || null;
}

function getRowOwnerId(row) {
  return row?.characterId ?? row?.effectProviderId ?? ownerFromSourceId(row?.sourceId) ?? ownerFromSourceId(row?.id) ?? "unknown";
}

function createEmptyStatus(characterId) {
  return {
    characterId,
    sourceRows: 0,
    effectRows: 0,
    coefficientRows: 0,
    readyRows: 0,
    blockedRows: 0,
    calculationReadySourceRows: 0,
    blockedSourceRows: 0,
    calculationReadyEffectRows: 0,
    blockedEffectRows: 0,
    calculationReadyCoefficientRows: 0,
    blockedCoefficientRows: 0,
    extractionReady: false,
  };
}

function addStatusRow(statusByCharacter, characterId, rowKind, row, isReady) {
  const status = statusByCharacter.get(characterId) ?? createEmptyStatus(characterId);
  statusByCharacter.set(characterId, status);
  status[`${rowKind}Rows`] += 1;
  if (isReady) status.readyRows += 1;
  else status.blockedRows += 1;

  if (rowKind === "source") {
    if (isReady) status.calculationReadySourceRows += 1;
    else status.blockedSourceRows += 1;
  }
  if (rowKind === "effect") {
    if (isReady) status.calculationReadyEffectRows += 1;
    else status.blockedEffectRows += 1;
  }
  if (rowKind === "coefficient") {
    if (isReady) status.calculationReadyCoefficientRows += 1;
    else status.blockedCoefficientRows += 1;
  }
}

export function buildExtractionStatus(dataset) {
  const statusByCharacter = new Map();

  for (const row of dataset.rows.sourceRows) {
    addStatusRow(statusByCharacter, getRowOwnerId(row), "source", row, row.calculationReady === true);
  }
  for (const row of dataset.rows.effectRows) {
    addStatusRow(statusByCharacter, getRowOwnerId(row), "effect", row, row.calculationStatus === CalculationStatus.CALCULATION_READY);
  }
  for (const row of dataset.rows.coefficientRows) {
    addStatusRow(statusByCharacter, getRowOwnerId(row), "coefficient", row, row.calculationStatus === CalculationStatus.CALCULATION_READY);
  }

  const rows = [...statusByCharacter.values()]
    .map((status) => ({
      ...status,
      extractionReady: status.readyRows > 0 && status.blockedRows === 0,
    }))
    .sort((left, right) => left.characterId.localeCompare(right.characterId));

  return {
    version: 1,
    generatedBy: "tools/validate_canonical_dataset.mjs",
    rows,
    summary: {
      characters: rows.length,
      extractionReady: rows.filter((row) => row.extractionReady).length,
      blocked: rows.filter((row) => !row.extractionReady).length,
      sourceRows: rows.reduce((sum, row) => sum + row.sourceRows, 0),
      effectRows: rows.reduce((sum, row) => sum + row.effectRows, 0),
      coefficientRows: rows.reduce((sum, row) => sum + row.coefficientRows, 0),
      readyRows: rows.reduce((sum, row) => sum + row.readyRows, 0),
      blockedRows: rows.reduce((sum, row) => sum + row.blockedRows, 0),
    },
  };
}

function validateCanonicalDataset(dataset) {
  const errors = [];
  if (dataset?.version !== 1) errors.push("dataset version must be 1");
  if (!dataset?.rows || !Array.isArray(dataset.rows.sourceRows)) errors.push("sourceRows must be an array");
  if (!Array.isArray(dataset?.rows?.effectRows)) errors.push("effectRows must be an array");
  if (!Array.isArray(dataset?.rows?.coefficientRows)) errors.push("coefficientRows must be an array");
  if (dataset?.policy?.manualGuideCalculationAllowed !== false) errors.push("manual guide calculation must remain disabled");
  if (dataset?.policy?.sourcePriorityApplied !== true) errors.push("source priority policy must be applied");
  if (dataset?.policy?.calculationReadinessApplied !== true) errors.push("calculation readiness policy must be applied");

  for (const row of dataset?.rows?.sourceRows ?? []) {
    if (typeof row.sourcePriority !== "number") errors.push(`${row.id}: sourcePriority missing`);
    if (typeof row.calculationReady !== "boolean") errors.push(`${row.id}: calculationReady missing`);
    if ((row.sourceOrigin === SourceOrigin.MANUAL_HINT || row.sourceOrigin === SourceOrigin.MANUAL_GUIDE) && row.calculationReady) {
      errors.push(`${row.id}: manual source must not be calculation ready`);
    }
    if (row.sourceOrigin === SourceOrigin.FALLBACK && row.calculationReady) {
      errors.push(`${row.id}: fallback source must not be calculation ready`);
    }
    if (!row.calculationReady && row.calculationStatus === CalculationStatus.CALCULATION_READY && !row.policyBlockedReason) {
      errors.push(`${row.id}: blocked calculation-ready source requires policyBlockedReason`);
    }
  }

  return { ok: errors.length === 0, errors };
}

function validateExtractionStatus(status, dataset) {
  const errors = [];
  if (status?.version !== 1) errors.push("status version must be 1");
  if (!Array.isArray(status?.rows)) errors.push("status rows must be an array");
  if (status?.summary?.sourceRows !== dataset.rows.sourceRows.length) errors.push("status sourceRows summary mismatch");
  if (status?.summary?.effectRows !== dataset.rows.effectRows.length) errors.push("status effectRows summary mismatch");
  if (status?.summary?.coefficientRows !== dataset.rows.coefficientRows.length) errors.push("status coefficientRows summary mismatch");
  for (const row of status?.rows ?? []) {
    if (!row.characterId) errors.push("status row missing characterId");
    if (row.readyRows + row.blockedRows !== row.sourceRows + row.effectRows + row.coefficientRows) {
      errors.push(`${row.characterId}: ready/blocked row total mismatch`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function assertValidCanonicalDataset(dataset, label) {
  const result = validateCanonicalDataset(dataset);
  if (!result.ok) throw new Error(`${label} failed validation: ${result.errors.join("; ")}`);
  return dataset;
}

function assertValidExtractionStatus(status, dataset, label) {
  const result = validateExtractionStatus(status, dataset);
  if (!result.ok) throw new Error(`${label} failed validation: ${result.errors.join("; ")}`);
  return status;
}

const dataset = assertValidCanonicalDataset(buildCanonicalDataset({
  sourceRows: readRows("source-rows.json"),
  effectRows: readRows("effect-rows.json"),
  coefficientRows: readRows("coefficient-rows.json"),
}, { generatedBy: "tools/validate_canonical_dataset.mjs" }), "generated canonical dataset");

const invalidManualHintDataset = buildCanonicalDataset({
  sourceRows: [
    {
      id: "invalid:manual-hint-ready",
      sourceOrigin: SourceOrigin.MANUAL_HINT,
      sourceKind: SourceKind.LEGACY_SNAPSHOT,
      sourcePath: "data/character-effects/character-guides.json",
      sourceRecord: "guide:invalid",
      calculationStatus: CalculationStatus.CALCULATION_READY,
    },
  ],
  effectRows: [],
  coefficientRows: [],
}, { generatedBy: "invalid-manual-hint-fixture" });

const invalidManualHintRow = invalidManualHintDataset.rows.sourceRows[0];
if (invalidManualHintRow.calculationReady !== false || invalidManualHintRow.policyBlockedReason !== BlockedReason.MANUAL_SOURCE_BLOCKED) {
  throw new Error("manual_hint calculation-ready fixture was not blocked by source policy");
}
assertValidCanonicalDataset(invalidManualHintDataset, "manual_hint blocked fixture");

const invalidPolicyBypassDataset = {
  ...invalidManualHintDataset,
  rows: {
    ...invalidManualHintDataset.rows,
    sourceRows: [
      {
        ...invalidManualHintRow,
        calculationReady: true,
        policyBlockedReason: null,
      },
    ],
  },
};
if (validateCanonicalDataset(invalidPolicyBypassDataset).ok) {
  throw new Error("manual_hint calculation-ready policy bypass unexpectedly passed validation");
}

const extractionStatus = assertValidExtractionStatus(buildExtractionStatus(dataset), dataset, "extraction status");

fs.mkdirSync(generatedDir, { recursive: true });
writeJson(datasetPath, dataset);
writeJson(statusPath, extractionStatus);

const reportLines = [
  "# Canonical Dataset Report",
  "",
  "Generated by `npm.cmd run validate:canonical-dataset`.",
  "",
  "## Dataset Shape",
  "",
  `- sourceRows: ${dataset.manifest.counts.sourceRows}`,
  `- effectRows: ${dataset.manifest.counts.effectRows}`,
  `- coefficientRows: ${dataset.manifest.counts.coefficientRows}`,
  "",
  "## Source Policy",
  "",
  `- sourcePriorityApplied: ${dataset.policy.sourcePriorityApplied}`,
  `- calculationReadinessApplied: ${dataset.policy.calculationReadinessApplied}`,
  `- manualGuideCalculationAllowed: ${dataset.policy.manualGuideCalculationAllowed}`,
  `- calculationReadySourceRows: ${dataset.manifest.sourcePolicy.ready}`,
  `- blockedSourceRows: ${dataset.manifest.sourcePolicy.blocked}`,
  `- manual_hint guard: blocked as ${BlockedReason.MANUAL_SOURCE_BLOCKED}`,
  "",
  "## Extraction Status",
  "",
  `- characters: ${extractionStatus.summary.characters}`,
  `- extractionReady: ${extractionStatus.summary.extractionReady}`,
  `- blocked: ${extractionStatus.summary.blocked}`,
  `- readyRows: ${extractionStatus.summary.readyRows}`,
  `- blockedRows: ${extractionStatus.summary.blockedRows}`,
  "",
  "## Deferred",
  "",
  "- Effect normalization is deferred to Phase 8.",
  "- Calculation logic remains out of scope.",
];
fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`, "utf8");

console.log(`canonical dataset validation ok: sourceRows=${dataset.manifest.counts.sourceRows}, ready=${dataset.manifest.sourcePolicy.ready}, blocked=${dataset.manifest.sourcePolicy.blocked}, statusCharacters=${extractionStatus.summary.characters}, manual_hint_guard=blocked`);

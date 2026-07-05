import fs from "node:fs";
import { BlockedReason, CalculationStatus, SourceKind, SourceOrigin, ValueMode } from "../src/data-model/schemas/index.js";
import { buildCanonicalDataset } from "../src/extraction/build-canonical-dataset.js";

const generatedDir = "data/generated";
const datasetPath = `${generatedDir}/extraction-canonical-dataset.json`;
const statusPath = `${generatedDir}/extraction-status.json`;
const coveragePath = `${generatedDir}/extraction-coverage.json`;
const reportPath = "reports/extraction/canonical-dataset-report.md";
const coverageReportPath = "reports/extraction/dataset-coverage-report.md";

function readRows(fileName) {
  const payload = JSON.parse(fs.readFileSync(`${generatedDir}/${fileName}`, "utf8"));
  if (!Array.isArray(payload.rows)) throw new Error(`${fileName} rows must be an array`);
  return payload.rows;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(relativePath, "utf8"));
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

function normalizeName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function countCoefficientSlots(character) {
  return (character?.slots ?? []).reduce((sum, slot) => {
    const confirmed = slot?.confirmedCoefficient;
    if (Array.isArray(confirmed?.rows)) return sum + confirmed.rows.length;
    if (Array.isArray(confirmed?.values)) return sum + 1;
    return sum;
  }, 0);
}

function findManifestEntry(manifest, id) {
  return manifest.entries.find((entry) => entry.id === id) ?? null;
}

function loadCoverageSources() {
  const manifest = readJson("data/legacy-reference/manifest.json");
  const effectEntry = findManifestEntry(manifest, "legacy:character-effect-candidates");
  const skillEntry = findManifestEntry(manifest, "legacy:hoyowiki-character-skills");
  const coefficientEntry = findManifestEntry(manifest, "legacy:attack-coefficient-candidates");
  const lightconeEntry = findManifestEntry(manifest, "legacy:lightcone-effect-candidates");
  return {
    manifest,
    effectPayload: effectEntry ? readJson(effectEntry.snapshotPath) : { characters: [] },
    skillPayload: skillEntry ? readJson(skillEntry.snapshotPath) : { characters: [] },
    coefficientPayload: coefficientEntry ? readJson(coefficientEntry.snapshotPath) : { characters: [] },
    lightconePayload: lightconeEntry ? readJson(lightconeEntry.snapshotPath) : { lightCones: [], summary: {} },
  };
}

function ensureCoverageCharacter(map, displayName) {
  const key = normalizeName(displayName || "unknown");
  const current = map.get(key) ?? {
    characterKey: key,
    displayName: key,
    identifiers: {
      effectAvatar: null,
      effectName: null,
      hoyowikiEntryPageId: null,
      coefficientAvatar: null,
      coefficientAvatarId: null,
    },
    sourceAvailability: {
      skillText: false,
      effectTrace: false,
      coefficient: false,
      eidolon: false,
      lightcone: "global_snapshot",
      relic: "missing_snapshot",
    },
    sourceCounts: {
      skillRows: 0,
      effectCandidates: 0,
      coefficientSlots: 0,
      eidolons: 0,
    },
  };
  map.set(key, current);
  return current;
}

function buildCoverageIndex() {
  const { effectPayload, skillPayload, coefficientPayload, lightconePayload } = loadCoverageSources();
  const byName = new Map();

  for (const character of effectPayload.characters ?? []) {
    const row = ensureCoverageCharacter(byName, character.name ?? character.avatar);
    row.identifiers.effectAvatar = character.avatar ?? row.identifiers.effectAvatar;
    row.identifiers.effectName = character.name ?? row.identifiers.effectName;
    row.sourceCounts.effectCandidates = character.activeEffects?.length ?? 0;
    row.sourceAvailability.effectTrace = row.sourceCounts.effectCandidates > 0;
  }

  for (const character of skillPayload.characters ?? []) {
    const row = ensureCoverageCharacter(byName, character.nameKo ?? character.entryPageId);
    row.identifiers.hoyowikiEntryPageId = character.entryPageId ?? row.identifiers.hoyowikiEntryPageId;
    row.sourceCounts.skillRows = character.skills?.length ?? 0;
    row.sourceCounts.eidolons = character.eidolons?.length ?? 0;
    row.sourceAvailability.skillText = row.sourceCounts.skillRows > 0;
    row.sourceAvailability.eidolon = row.sourceCounts.eidolons > 0;
  }

  for (const character of coefficientPayload.characters ?? []) {
    const row = ensureCoverageCharacter(byName, character.localName ?? character.nameKo ?? character.avatar);
    row.identifiers.coefficientAvatar = character.avatar ?? row.identifiers.coefficientAvatar;
    row.identifiers.coefficientAvatarId = character.avatarId ?? row.identifiers.coefficientAvatarId;
    row.sourceCounts.coefficientSlots = countCoefficientSlots(character);
    row.sourceAvailability.coefficient = row.sourceCounts.coefficientSlots > 0;
  }

  return {
    rows: [...byName.values()].sort((left, right) => left.displayName.localeCompare(right.displayName)),
    sourceLinkage: {
      skillTextCharacters: (skillPayload.characters ?? []).filter((character) => (character.skills ?? []).length > 0).length,
      effectTraceCharacters: (effectPayload.characters ?? []).filter((character) => (character.activeEffects ?? []).length > 0).length,
      coefficientCharacters: (coefficientPayload.characters ?? []).filter((character) => countCoefficientSlots(character) > 0).length,
      eidolonCharacters: (skillPayload.characters ?? []).filter((character) => (character.eidolons ?? []).length > 0).length,
      lightconeEffects: lightconePayload.summary?.effectRows ?? 0,
      relicSource: "missing_snapshot",
    },
  };
}

function rowMatchesCoverage(row, coverageRow) {
  const owner = getRowOwnerId(row);
  return [
    coverageRow.identifiers.effectAvatar,
    coverageRow.identifiers.effectName,
    coverageRow.identifiers.hoyowikiEntryPageId,
    coverageRow.identifiers.coefficientAvatar,
    coverageRow.identifiers.coefficientAvatarId,
    coverageRow.characterKey,
    coverageRow.displayName,
  ].filter(Boolean).includes(owner);
}

function classifyMissingExtraction(row) {
  const missing = [];
  if (!row.sourceAvailability.skillText) missing.push("missing_skill_text");
  if (!row.sourceAvailability.effectTrace) missing.push("missing_effect_trace");
  if (!row.sourceAvailability.coefficient) missing.push("missing_coefficient");
  if (!row.sourceAvailability.eidolon) missing.push("missing_eidolon_trace");
  if (row.counts.effectRows === 0) missing.push("effect_rows_zero");
  if (row.counts.coefficientRows === 0) missing.push("coefficient_rows_zero");
  if (row.valueMode.unknown > 0) missing.push("value_mode_unknown");
  if (row.valueMode.dynamicFormula > 0) missing.push("dynamic_formula_blocked");
  return missing;
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

export function buildExtractionCoverage(dataset) {
  const coverageIndex = buildCoverageIndex();
  const rows = coverageIndex.rows.map((coverageRow) => {
    const sourceRows = dataset.rows.sourceRows.filter((row) => rowMatchesCoverage(row, coverageRow));
    const effectRows = dataset.rows.effectRows.filter((row) => rowMatchesCoverage(row, coverageRow));
    const coefficientRows = dataset.rows.coefficientRows.filter((row) => rowMatchesCoverage(row, coverageRow));
    const status = createEmptyStatus(coverageRow.characterKey);
    for (const row of sourceRows) addStatusRow(new Map([[coverageRow.characterKey, status]]), coverageRow.characterKey, "source", row, row.calculationReady === true);
    for (const row of effectRows) addStatusRow(new Map([[coverageRow.characterKey, status]]), coverageRow.characterKey, "effect", row, row.calculationStatus === CalculationStatus.CALCULATION_READY);
    for (const row of coefficientRows) addStatusRow(new Map([[coverageRow.characterKey, status]]), coverageRow.characterKey, "coefficient", row, row.calculationStatus === CalculationStatus.CALCULATION_READY);
    const valueMode = {
      unknown: effectRows.filter((row) => row.valueMode === ValueMode.UNKNOWN).length,
      dynamicFormula: effectRows.filter((row) => row.valueMode === ValueMode.DYNAMIC_FORMULA).length,
    };
    const enriched = {
      ...coverageRow,
      characterId: coverageRow.characterKey,
      counts: {
        sourceRows: sourceRows.length,
        effectRows: effectRows.length,
        coefficientRows: coefficientRows.length,
        readyRows: status.readyRows,
        blockedRows: status.blockedRows,
      },
      sourceRows: sourceRows.length,
      effectRows: effectRows.length,
      coefficientRows: coefficientRows.length,
      readyRows: status.readyRows,
      blockedRows: status.blockedRows,
      calculationReadySourceRows: status.calculationReadySourceRows,
      blockedSourceRows: status.blockedSourceRows,
      calculationReadyEffectRows: status.calculationReadyEffectRows,
      blockedEffectRows: status.blockedEffectRows,
      calculationReadyCoefficientRows: status.calculationReadyCoefficientRows,
      blockedCoefficientRows: status.blockedCoefficientRows,
      valueMode,
      extractionReady: status.readyRows > 0 && status.blockedRows === 0,
    };
    return {
      ...enriched,
      missingExtraction: classifyMissingExtraction(enriched),
    };
  });

  return {
    version: 1,
    generatedBy: "tools/validate_canonical_dataset.mjs",
    datasetMode: "full",
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
      effectRowsZero: rows.filter((row) => row.effectRows === 0).length,
      valueModeUnknownCharacters: rows.filter((row) => row.valueMode.unknown > 0).length,
      dynamicFormulaCharacters: rows.filter((row) => row.valueMode.dynamicFormula > 0).length,
    },
    sourceLinkage: coverageIndex.sourceLinkage,
  };
}

export function buildExtractionStatus(dataset) {
  return buildExtractionCoverage(dataset);
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
  if (status?.datasetMode !== "full") errors.push("status datasetMode must be full");
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
writeJson(coveragePath, extractionStatus);

const effectRowsZero = extractionStatus.rows.filter((row) => row.effectRows === 0);
const missingRows = extractionStatus.rows.filter((row) => row.missingExtraction.length > 0);
const unknownRows = extractionStatus.rows.filter((row) => row.valueMode.unknown > 0);
const dynamicRows = extractionStatus.rows.filter((row) => row.valueMode.dynamicFormula > 0);

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
  `- datasetMode: ${extractionStatus.datasetMode}`,
  "",
  "## Deferred",
  "",
  "- Effect normalization is deferred to Phase 8.",
  "- Calculation logic remains out of scope.",
];
fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`, "utf8");

const coverageReportLines = [
  "# Dataset Coverage Report",
  "",
  "Generated by `npm.cmd run validate:canonical-dataset`.",
  "",
  "## Summary",
  "",
  `- datasetMode: ${extractionStatus.datasetMode}`,
  `- characters: ${extractionStatus.summary.characters}`,
  `- extractionReady: ${extractionStatus.summary.extractionReady}`,
  `- missingExtractionCharacters: ${missingRows.length}`,
  `- effectRowsZero: ${effectRowsZero.length}`,
  `- valueModeUnknownCharacters: ${unknownRows.length}`,
  `- dynamicFormulaCharacters: ${dynamicRows.length}`,
  "",
  "## Source Linkage",
  "",
  `- skillTextCharacters: ${extractionStatus.sourceLinkage.skillTextCharacters}`,
  `- effectTraceCharacters: ${extractionStatus.sourceLinkage.effectTraceCharacters}`,
  `- coefficientCharacters: ${extractionStatus.sourceLinkage.coefficientCharacters}`,
  `- eidolonCharacters: ${extractionStatus.sourceLinkage.eidolonCharacters}`,
  `- lightconeEffects: ${extractionStatus.sourceLinkage.lightconeEffects}`,
  `- relicSource: ${extractionStatus.sourceLinkage.relicSource}`,
  "",
  "## Missing Extraction By Character",
  "",
  ...(missingRows.length ? missingRows.map((row) => `- ${row.displayName}: ${row.missingExtraction.join(", ")}`) : ["- none"]),
  "",
  "## effectRows 0 Characters",
  "",
  ...(effectRowsZero.length ? effectRowsZero.map((row) => `- ${row.displayName}`) : ["- none"]),
  "",
  "## valueMode unknown / dynamic_formula",
  "",
  ...(unknownRows.length ? unknownRows.map((row) => `- ${row.displayName}: unknown=${row.valueMode.unknown}`) : ["- unknown: none"]),
  ...(dynamicRows.length ? dynamicRows.map((row) => `- ${row.displayName}: dynamic_formula=${row.valueMode.dynamicFormula}`) : ["- dynamic_formula: none"]),
  "",
  "## Policy",
  "",
  "- manual guide fallback is not used for coverage completion.",
  "- Only source-backed raw_source and curated_source rows can become calculation candidates.",
  "- Missing relic source remains missing instead of being filled from manual guide data.",
];
fs.writeFileSync(coverageReportPath, `${coverageReportLines.join("\n")}\n`, "utf8");

console.log(`canonical dataset validation ok: sourceRows=${dataset.manifest.counts.sourceRows}, ready=${dataset.manifest.sourcePolicy.ready}, blocked=${dataset.manifest.sourcePolicy.blocked}, statusCharacters=${extractionStatus.summary.characters}, datasetMode=${extractionStatus.datasetMode}, effectRowsZero=${extractionStatus.summary.effectRowsZero}, manual_hint_guard=blocked`);

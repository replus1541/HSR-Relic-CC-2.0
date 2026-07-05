import fs from "node:fs";
import { BlockedReason, CalculationStatus, SourceKind, SourceOrigin, ValueMode } from "../src/data-model/schemas/index.js";
import { buildCanonicalDataset } from "../src/extraction/build-canonical-dataset.js";
import { normalizeIdentityKey } from "../src/identity/character-identity.js";

const generatedDir = "data/generated";
const datasetPath = `${generatedDir}/extraction-canonical-dataset.json`;
const statusPath = `${generatedDir}/extraction-status.json`;
const coveragePath = `${generatedDir}/extraction-coverage.json`;
const reportPath = "reports/extraction/canonical-dataset-report.md";
const coverageReportPath = "reports/extraction/dataset-coverage-report.md";
const missingMatchAnalysisPath = "reports/extraction/missing-match-analysis.json";
const missingMatchAnalysisReportPath = "reports/extraction/missing-match-analysis.md";

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

function buildCoverageIndex() {
  const identityDataset = readJson("data/generated/character-identity.json");
  if (!Array.isArray(identityDataset.rows)) throw new Error("character identity rows must be generated before canonical coverage");
  const rows = identityDataset.rows.map((row) => ({
    characterKey: row.characterId,
    characterId: row.characterId,
    internalId: row.internalId,
    internalName: row.internalName,
    officialName: row.officialName,
    localizedName: row.localizedName,
    displayName: row.displayName,
    aliasNames: row.aliasNames ?? [],
    element: row.element ?? null,
    path: row.path ?? null,
    iconPath: row.iconPath ?? null,
    sourceOrigin: row.sourceOrigin ?? null,
    sourcePath: row.sourcePath ?? null,
    sourceText: row.sourceText ?? row.displayName,
    localizationSourcePath: row.localizationSourcePath ?? row.sourcePath ?? null,
    nameReviewStatus: row.nameReviewStatus,
    isDisplayNameSourceBacked: row.isDisplayNameSourceBacked,
    isCharacterIdentitySourceBacked: row.isCharacterIdentitySourceBacked,
    identifiers: row.identifiers ?? {},
    sourceAvailability: row.sourceAvailability ?? {},
    sourceCounts: row.sourceCounts ?? {},
    sourceNames: row.sourceNames ?? [],
    nameSources: row.nameSources ?? [],
  }));

  return {
    rows: rows.sort((left, right) => left.displayName.localeCompare(right.displayName)),
    sourceLinkage: {
      skillTextCharacters: rows.filter((row) => row.sourceAvailability.skillText).length,
      effectTraceCharacters: rows.filter((row) => row.sourceAvailability.effectTrace).length,
      coefficientCharacters: rows.filter((row) => row.sourceAvailability.coefficient).length,
      eidolonCharacters: rows.filter((row) => row.sourceAvailability.eidolon).length,
      lightconeEffects: identityDataset.summary?.lightconeEffects ?? 0,
      relicSource: "missing_snapshot",
    },
  };
}

function rowMatchesCoverage(row, coverageRow) {
  const owner = getRowOwnerId(row);
  const candidates = [
    coverageRow.characterId,
    coverageRow.internalId,
    coverageRow.internalName,
    coverageRow.officialName,
    coverageRow.localizedName,
    coverageRow.displayName,
    coverageRow.identifiers.effectAvatar,
    coverageRow.identifiers.effectName,
    coverageRow.identifiers.hoyowikiEntryPageId,
    coverageRow.identifiers.coefficientAvatar,
    coverageRow.identifiers.coefficientAvatarId,
    coverageRow.characterKey,
    ...(coverageRow.aliasNames ?? []),
    ...(coverageRow.sourceNames ?? []),
    ...(coverageRow.nameSources ?? []).map((source) => source.sourceName),
  ].filter(Boolean);
  const normalizedOwner = normalizeIdentityKey(owner);
  return candidates.some((candidate) => String(candidate) === String(owner) || normalizeIdentityKey(candidate) === normalizedOwner);
}

function classifyMissingExtraction(row) {
  return [...row.requiredMissingItems, ...row.optionalMissingItems];
}

function classifyOptionalMissing(row) {
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

function hasSourceTrace(row) {
  return Boolean(row?.sourceId || row?.sourceRecord || row?.sourcePath || row?.sourceTrace || row?.skillId);
}

function isDisplayNameSourceBacked(row) {
  if (typeof row.isDisplayNameSourceBacked === "boolean") return row.isDisplayNameSourceBacked;
  return (row.nameSources ?? []).some((source) => (
    normalizeName(source.sourceName) === row.displayName
    && source.sourcePath
    && source.sourceOrigin !== SourceOrigin.MANUAL_HINT
    && source.sourceOrigin !== SourceOrigin.MANUAL_GUIDE
  ));
}

function isCharacterIdentitySourceBacked(row) {
  if (typeof row.isCharacterIdentitySourceBacked === "boolean") return row.isCharacterIdentitySourceBacked;
  return Boolean(
    row.identifiers?.effectAvatar
    || row.identifiers?.hoyowikiEntryPageId
    || row.identifiers?.coefficientAvatar
    || (row.nameSources ?? []).some((source) => source.internalId || source.internalName),
  );
}

function classifyRequiredMissing(row) {
  const missing = [];
  if (!row.isDisplayNameSourceBacked) missing.push("display_name_source_missing");
  if (!row.isCharacterIdentitySourceBacked) missing.push("character_identity_source_missing");
  if (row.sourceTraceMissingRows > 0) missing.push("calculation_ready_source_trace_missing");
  if (row.blockedRows > 0) missing.push("blocked_rows_present");
  if (row.readyRows === 0) missing.push("no_calculation_ready_rows");
  return missing;
}

function calculateReadinessStatus(row) {
  if (row.requiredMissingItems.length > 0) return "blocked";
  if (row.optionalMissingItems.length > 0) return "partial";
  return "ready";
}

function countItems(rows, field) {
  return rows.reduce((counts, row) => {
    for (const item of row[field] ?? []) counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});
}

function countDiagnostics(rows, field) {
  return rows.reduce((counts, row) => {
    for (const item of row.missingDiagnostics ?? []) {
      const key = item[field] ?? "unknown";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, {});
}

function closestCandidates(row, rowSets = {}) {
  const candidates = [
    row.displayName,
    row.officialName,
    row.localizedName,
    row.internalName,
    row.internalId,
    row.identifiers?.effectAvatar,
    row.identifiers?.effectName,
    row.identifiers?.hoyowikiEntryPageId,
    row.identifiers?.coefficientAvatar,
    row.identifiers?.coefficientAvatarId,
    ...(row.aliasNames ?? []),
    ...(row.sourceNames ?? []),
    ...(row.nameSources ?? []).map((source) => source.sourceName),
    ...(rowSets.sourceRows ?? []).slice(0, 3).map((source) => source.id),
    ...(rowSets.effectRows ?? []).slice(0, 3).map((effect) => effect.id),
    ...(rowSets.coefficientRows ?? []).slice(0, 3).map((coefficient) => coefficient.id),
  ].filter(Boolean).map(String);
  return [...new Set(candidates)].slice(0, 8);
}

function diagnosticForMissing(missingType, row, rowSets) {
  const base = {
    missingType,
    attemptedSources: [],
    matchedCandidateCount: 0,
    closestCandidates: closestCandidates(row, rowSets),
    failureReason: "no_candidate_found",
    autoMatchPossible: false,
    needsCuratedSource: false,
    nextAction: "Inspect source availability and adapter mapping.",
  };
  const dynamicRows = (rowSets.effectRows ?? []).filter((effect) => effect.valueMode === ValueMode.DYNAMIC_FORMULA);
  const unknownRows = (rowSets.effectRows ?? []).filter((effect) => effect.valueMode === ValueMode.UNKNOWN);
  const blockedRows = [
    ...(rowSets.sourceRows ?? []).filter((source) => !source.calculationReady || source.policyBlockedReason),
    ...(rowSets.effectRows ?? []).filter((effect) => effect.calculationStatus !== CalculationStatus.CALCULATION_READY),
    ...(rowSets.coefficientRows ?? []).filter((coefficient) => coefficient.calculationStatus !== CalculationStatus.CALCULATION_READY),
  ];

  if (missingType === "missing_skill_text") {
    return {
      ...base,
      attemptedSources: ["data/legacy-reference/game-db/hoyowiki-character-skills.json"],
      matchedCandidateCount: row.sourceCounts?.skillRows ?? 0,
      failureReason: row.identifiers?.hoyowikiEntryPageId ? "parser_not_implemented" : "source_exists_but_id_mismatch",
      autoMatchPossible: Boolean(row.identifiers?.hoyowikiEntryPageId),
      nextAction: row.identifiers?.hoyowikiEntryPageId
        ? "Extend HoyoWiki skill parser for this identity and regenerate adapters."
        : "Map this character to a HoyoWiki entryPageId before skill extraction.",
    };
  }
  if (missingType === "missing_effect_trace" || missingType === "effect_rows_zero") {
    const effectCandidateCount = row.sourceCounts?.effectCandidates ?? row.effectRows ?? 0;
    return {
      ...base,
      attemptedSources: ["data/legacy-reference/game-db/character-effect-candidates.json", "data/generated/effect-rows.json"],
      matchedCandidateCount: missingType === "effect_rows_zero" ? row.effectRows : effectCandidateCount,
      failureReason: effectCandidateCount > 0 && row.effectRows === 0 ? "source_exists_but_id_mismatch" : "effect_trace_not_found",
      autoMatchPossible: effectCandidateCount > 0 && row.effectRows === 0,
      needsCuratedSource: effectCandidateCount === 0,
      nextAction: effectCandidateCount > 0 && row.effectRows === 0
        ? "Align effect provider ids with character identity ids; do not change values."
        : "Add or curate source-backed effect extraction evidence for this character.",
    };
  }
  if (missingType === "missing_coefficient" || missingType === "coefficient_rows_zero") {
    const coefficientCandidateCount = row.sourceCounts?.coefficientSlots ?? row.coefficientRows ?? 0;
    return {
      ...base,
      attemptedSources: ["data/legacy-reference/game-db/attack-coefficient-candidates.json", "data/generated/coefficient-rows.json"],
      matchedCandidateCount: missingType === "coefficient_rows_zero" ? row.coefficientRows : coefficientCandidateCount,
      failureReason: coefficientCandidateCount > 0 && row.coefficientRows === 0 ? "source_exists_but_id_mismatch" : "coefficient_not_found",
      autoMatchPossible: coefficientCandidateCount > 0 && row.coefficientRows === 0,
      needsCuratedSource: coefficientCandidateCount === 0,
      nextAction: coefficientCandidateCount > 0 && row.coefficientRows === 0
        ? "Align coefficient avatar ids with character identity ids; do not infer coefficients."
        : "Add source-backed coefficient extraction coverage for this character.",
    };
  }
  if (missingType === "missing_eidolon_trace") {
    return {
      ...base,
      attemptedSources: ["data/legacy-reference/game-db/hoyowiki-character-skills.json"],
      matchedCandidateCount: row.sourceCounts?.eidolons ?? 0,
      failureReason: row.sourceAvailability?.skillText ? "parser_not_implemented" : "source_not_loaded",
      autoMatchPossible: false,
      nextAction: row.sourceAvailability?.skillText
        ? "Extend the HoyoWiki eidolon parser and regenerate adapters."
        : "Load skill/eidolon source before parsing eidolon traces.",
    };
  }
  if (missingType === "dynamic_formula_blocked") {
    return {
      ...base,
      attemptedSources: ["data/generated/effect-rows.json", "src/effect-engine/value-resolvers/dynamic-formula.js"],
      matchedCandidateCount: dynamicRows.length || row.valueMode?.dynamicFormula || 0,
      closestCandidates: closestCandidates(row, { ...rowSets, effectRows: dynamicRows }),
      failureReason: "valueMode_dynamic_formula_unresolved",
      autoMatchPossible: false,
      needsCuratedSource: false,
      nextAction: "Implement a source-backed dynamic formula resolver or keep these rows blocked.",
    };
  }
  if (missingType === "value_mode_unknown") {
    return {
      ...base,
      attemptedSources: ["data/generated/effect-rows.json", "src/effect-engine/value-resolvers/unknown.js"],
      matchedCandidateCount: unknownRows.length || row.valueMode?.unknown || 0,
      closestCandidates: closestCandidates(row, { ...rowSets, effectRows: unknownRows }),
      failureReason: "parser_not_implemented",
      autoMatchPossible: false,
      needsCuratedSource: true,
      nextAction: "Classify the source-backed value mode before allowing calculation.",
    };
  }
  if (missingType === "blocked_rows_present") {
    return {
      ...base,
      attemptedSources: ["data/generated/source-rows.json", "data/generated/effect-rows.json", "data/generated/coefficient-rows.json"],
      matchedCandidateCount: blockedRows.length,
      closestCandidates: closestCandidates(row, {
        sourceRows: blockedRows.filter((item) => item.kind === "source_row"),
        effectRows: blockedRows.filter((item) => item.effectType),
        coefficientRows: blockedRows.filter((item) => item.attackType),
      }),
      failureReason: blockedRows.some((item) => item.policyBlockedReason) ? "source_exists_but_blocked_by_policy" : "curated_source_required",
      autoMatchPossible: false,
      needsCuratedSource: !blockedRows.some((item) => item.policyBlockedReason),
      nextAction: "Inspect blocked rows and resolve the policy or curated source requirement without promoting manual hints.",
    };
  }
  if (missingType === "calculation_ready_source_trace_missing") {
    return {
      ...base,
      attemptedSources: ["data/generated/source-rows.json", "data/generated/effect-rows.json", "data/generated/coefficient-rows.json"],
      matchedCandidateCount: row.sourceTraceMissingRows ?? 0,
      failureReason: "source_exists_but_missing_sourcePath",
      autoMatchPossible: false,
      needsCuratedSource: true,
      nextAction: "Add source trace metadata before treating these rows as calculation-ready.",
    };
  }
  if (missingType === "display_name_source_missing") {
    return {
      ...base,
      attemptedSources: ["data/generated/character-identity.json"],
      matchedCandidateCount: row.nameSources?.length ?? 0,
      failureReason: row.nameSources?.some((source) => source.sourceName === row.displayName) ? "source_exists_but_missing_sourcePath" : "source_exists_but_name_alias_mismatch",
      autoMatchPossible: false,
      needsCuratedSource: true,
      nextAction: "Attach official localization evidence before allowing ready status.",
    };
  }
  if (missingType === "character_identity_source_missing") {
    return {
      ...base,
      attemptedSources: ["data/generated/character-identity.json"],
      matchedCandidateCount: row.nameSources?.length ?? 0,
      failureReason: "source_exists_but_id_mismatch",
      autoMatchPossible: Boolean(row.nameSources?.length),
      needsCuratedSource: !row.nameSources?.length,
      nextAction: "Attach an internal id/name or official source identity record.",
    };
  }
  if (missingType === "no_calculation_ready_rows") {
    return {
      ...base,
      attemptedSources: ["data/generated/source-rows.json", "data/generated/effect-rows.json", "data/generated/coefficient-rows.json"],
      matchedCandidateCount: row.sourceRows + row.effectRows + row.coefficientRows,
      failureReason: row.sourceRows + row.effectRows + row.coefficientRows > 0 ? "source_exists_but_blocked_by_policy" : "curated_source_required",
      autoMatchPossible: false,
      needsCuratedSource: row.sourceRows + row.effectRows + row.coefficientRows === 0,
      nextAction: "Add source-backed rows or clear blocking policy before readiness can improve.",
    };
  }
  return base;
}

function createMissingDiagnostics(missingItems, row, rowSets) {
  return missingItems.map((missingType) => diagnosticForMissing(missingType, row, rowSets));
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
    const calculationReadyRows = [
      ...sourceRows.filter((row) => row.calculationReady === true),
      ...effectRows.filter((row) => row.calculationStatus === CalculationStatus.CALCULATION_READY),
      ...coefficientRows.filter((row) => row.calculationStatus === CalculationStatus.CALCULATION_READY),
    ];
    const sourceTraceMissingRows = calculationReadyRows.filter((row) => !hasSourceTrace(row)).length;
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
      sourceTraceMissingRows,
    };
    const statusMetadata = {
      ...enriched,
      isDisplayNameSourceBacked: isDisplayNameSourceBacked(enriched),
      isCharacterIdentitySourceBacked: isCharacterIdentitySourceBacked(enriched),
    };
    const optionalMissingItems = classifyOptionalMissing(statusMetadata);
    const requiredMissingItems = classifyRequiredMissing({
      ...statusMetadata,
      optionalMissingItems,
    });
    const missingItems = [...requiredMissingItems, ...optionalMissingItems];
    const missingDiagnostics = createMissingDiagnostics(missingItems, statusMetadata, { sourceRows, effectRows, coefficientRows });
    const readinessStatus = calculateReadinessStatus({
      ...statusMetadata,
      requiredMissingItems,
      optionalMissingItems,
    });
    return {
      ...statusMetadata,
      requiredMissingItems,
      optionalMissingItems,
      missingItems,
      missingExtraction: missingItems,
      missingDiagnostics,
      requiredMissingCount: requiredMissingItems.length,
      optionalMissingCount: optionalMissingItems.length,
      missingCount: missingItems.length,
      readinessStatus,
      extractionReady: readinessStatus === "ready",
    };
  });

  return {
    version: 1,
    generatedBy: "tools/validate_canonical_dataset.mjs",
    datasetMode: "full",
    rows,
    summary: {
      characters: rows.length,
      ready: rows.filter((row) => row.readinessStatus === "ready").length,
      partial: rows.filter((row) => row.readinessStatus === "partial").length,
      blocked: rows.filter((row) => row.readinessStatus === "blocked").length,
      extractionReady: rows.filter((row) => row.readinessStatus === "ready").length,
      sourceRows: rows.reduce((sum, row) => sum + row.sourceRows, 0),
      effectRows: rows.reduce((sum, row) => sum + row.effectRows, 0),
      coefficientRows: rows.reduce((sum, row) => sum + row.coefficientRows, 0),
      readyRows: rows.reduce((sum, row) => sum + row.readyRows, 0),
      blockedRows: rows.reduce((sum, row) => sum + row.blockedRows, 0),
      effectRowsZero: rows.filter((row) => row.effectRows === 0).length,
      valueModeUnknownCharacters: rows.filter((row) => row.valueMode.unknown > 0).length,
      dynamicFormulaCharacters: rows.filter((row) => row.valueMode.dynamicFormula > 0).length,
      legacyReadyWithMissing: rows.filter((row) => row.readyRows > 0 && row.blockedRows === 0 && row.missingCount > 0).length,
      displayNameSourceMissing: rows.filter((row) => !row.isDisplayNameSourceBacked).length,
      characterIdentitySourceMissing: rows.filter((row) => !row.isCharacterIdentitySourceBacked).length,
      autoMatchPossible: rows.reduce((sum, row) => sum + (row.missingDiagnostics ?? []).filter((item) => item.autoMatchPossible).length, 0),
      curatedSourceRequired: rows.reduce((sum, row) => sum + (row.missingDiagnostics ?? []).filter((item) => item.needsCuratedSource).length, 0),
      adapterParserImprovements: rows.reduce((sum, row) => sum + (row.missingDiagnostics ?? []).filter((item) => ["adapter_not_implemented", "parser_not_implemented"].includes(item.failureReason)).length, 0),
    },
    requiredMissingCounts: countItems(rows, "requiredMissingItems"),
    optionalMissingCounts: countItems(rows, "optionalMissingItems"),
    failureReasonCounts: countDiagnostics(rows, "failureReason"),
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
    if (!["ready", "partial", "blocked"].includes(row.readinessStatus)) errors.push(`${row.characterId}: invalid readinessStatus`);
    if (!Array.isArray(row.requiredMissingItems)) errors.push(`${row.characterId}: requiredMissingItems must be an array`);
    if (!Array.isArray(row.optionalMissingItems)) errors.push(`${row.characterId}: optionalMissingItems must be an array`);
    if (row.missingCount !== (row.requiredMissingCount ?? 0) + (row.optionalMissingCount ?? 0)) {
      errors.push(`${row.characterId}: missingCount mismatch`);
    }
    if (!Array.isArray(row.missingDiagnostics)) errors.push(`${row.characterId}: missingDiagnostics must be an array`);
    if ((row.missingDiagnostics?.length ?? 0) !== row.missingCount) errors.push(`${row.characterId}: missingDiagnostics count mismatch`);
    for (const diagnostic of row.missingDiagnostics ?? []) {
      for (const field of ["missingType", "attemptedSources", "matchedCandidateCount", "closestCandidates", "failureReason", "autoMatchPossible", "needsCuratedSource", "nextAction"]) {
        if (!(field in diagnostic)) errors.push(`${row.characterId}: missing diagnostic ${diagnostic.missingType ?? "unknown"} missing ${field}`);
      }
    }
    if (row.readyRows + row.blockedRows !== row.sourceRows + row.effectRows + row.coefficientRows) {
      errors.push(`${row.characterId}: ready/blocked row total mismatch`);
    }
    if (row.readinessStatus === "ready" && row.missingCount > 0) {
      errors.push(`${row.characterId}: ready status must not have missing items`);
    }
    if (row.readinessStatus === "ready" && (row.requiredMissingCount > 0 || row.blockedRows > 0)) {
      errors.push(`${row.characterId}: ready status must not have required missing or blocked rows`);
    }
    if (row.readinessStatus === "ready" && !row.isDisplayNameSourceBacked) {
      errors.push(`${row.characterId}: displayName source missing cannot be ready`);
    }
    if (row.readinessStatus === "ready" && !row.isCharacterIdentitySourceBacked) {
      errors.push(`${row.characterId}: character identity source missing cannot be ready`);
    }
    if (row.readinessStatus === "ready" && row.sourceTraceMissingRows > 0) {
      errors.push(`${row.characterId}: source trace missing cannot be ready`);
    }
    if (row.readinessStatus === "partial" && row.requiredMissingCount > 0) {
      errors.push(`${row.characterId}: partial status must not have required missing items`);
    }
    if (row.readinessStatus === "partial" && row.optionalMissingCount === 0) {
      errors.push(`${row.characterId}: partial status requires optional missing items`);
    }
    if (row.readinessStatus === "blocked" && row.requiredMissingCount === 0) {
      errors.push(`${row.characterId}: blocked status requires required missing items`);
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
const missingRows = extractionStatus.rows.filter((row) => row.missingCount > 0);
const requiredMissingRows = extractionStatus.rows.filter((row) => row.requiredMissingCount > 0);
const optionalMissingRows = extractionStatus.rows.filter((row) => row.optionalMissingCount > 0);
const unknownRows = extractionStatus.rows.filter((row) => row.valueMode.unknown > 0);
const dynamicRows = extractionStatus.rows.filter((row) => row.valueMode.dynamicFormula > 0);
const missingDiagnostics = missingRows.flatMap((row) => (row.missingDiagnostics ?? []).map((diagnostic) => ({
  characterId: row.characterId,
  displayName: row.displayName,
  readinessStatus: row.readinessStatus,
  ...diagnostic,
})));
const failureReasonCounts = missingDiagnostics.reduce((counts, item) => {
  counts[item.failureReason] = (counts[item.failureReason] ?? 0) + 1;
  return counts;
}, {});
const missingMatchAnalysis = {
  version: 1,
  generatedBy: "tools/validate_canonical_dataset.mjs",
  summary: {
    characters: extractionStatus.summary.characters,
    partial: extractionStatus.summary.partial,
    blocked: extractionStatus.summary.blocked,
    missingItems: missingDiagnostics.length,
    autoMatchPossible: missingDiagnostics.filter((item) => item.autoMatchPossible).length,
    curatedSourceRequired: missingDiagnostics.filter((item) => item.needsCuratedSource).length,
    adapterParserImprovements: missingDiagnostics.filter((item) => ["adapter_not_implemented", "parser_not_implemented"].includes(item.failureReason)).length,
    failureReasonCounts,
  },
  rows: missingRows.map((row) => ({
    characterId: row.characterId,
    displayName: row.displayName,
    readinessStatus: row.readinessStatus,
    requiredMissingItems: row.requiredMissingItems,
    optionalMissingItems: row.optionalMissingItems,
    missingDiagnostics: row.missingDiagnostics,
  })),
};
writeJson(missingMatchAnalysisPath, missingMatchAnalysis);

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
  `- ready: ${extractionStatus.summary.ready}`,
  `- partial: ${extractionStatus.summary.partial}`,
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
  `- ready: ${extractionStatus.summary.ready}`,
  `- partial: ${extractionStatus.summary.partial}`,
  `- blocked: ${extractionStatus.summary.blocked}`,
  `- legacyReadyWithMissing: ${extractionStatus.summary.legacyReadyWithMissing}`,
  `- missingExtractionCharacters: ${missingRows.length}`,
  `- requiredMissingCharacters: ${requiredMissingRows.length}`,
  `- optionalMissingCharacters: ${optionalMissingRows.length}`,
  `- effectRowsZero: ${effectRowsZero.length}`,
  `- valueModeUnknownCharacters: ${unknownRows.length}`,
  `- dynamicFormulaCharacters: ${dynamicRows.length}`,
  `- displayNameSourceMissing: ${extractionStatus.summary.displayNameSourceMissing}`,
  `- characterIdentitySourceMissing: ${extractionStatus.summary.characterIdentitySourceMissing}`,
  `- autoMatchPossible: ${missingMatchAnalysis.summary.autoMatchPossible}`,
  `- curatedSourceRequired: ${missingMatchAnalysis.summary.curatedSourceRequired}`,
  `- adapterParserImprovements: ${missingMatchAnalysis.summary.adapterParserImprovements}`,
  "",
  "## Readiness Status",
  "",
  `- ready: ${extractionStatus.summary.ready}`,
  `- partial: ${extractionStatus.summary.partial}`,
  `- blocked: ${extractionStatus.summary.blocked}`,
  `- previously ready with missing > 0: ${extractionStatus.summary.legacyReadyWithMissing}`,
  "",
  "## Required Missing Counts",
  "",
  ...(Object.keys(extractionStatus.requiredMissingCounts).length ? Object.entries(extractionStatus.requiredMissingCounts).map(([key, value]) => `- ${key}: ${value}`) : ["- none"]),
  "",
  "## Optional Missing Counts",
  "",
  ...(Object.keys(extractionStatus.optionalMissingCounts).length ? Object.entries(extractionStatus.optionalMissingCounts).map(([key, value]) => `- ${key}: ${value}`) : ["- none"]),
  "",
  "## Failure Reason Counts",
  "",
  ...(Object.keys(failureReasonCounts).length ? Object.entries(failureReasonCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => `- ${key}: ${value}`) : ["- none"]),
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
  ...(missingRows.length ? missingRows.map((row) => `- ${row.displayName}: ${row.readinessStatus}; required=[${row.requiredMissingItems.join(", ") || "none"}]; optional=[${row.optionalMissingItems.join(", ") || "none"}]`) : ["- none"]),
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

const missingMatchReportLines = [
  "# Missing Match Analysis",
  "",
  "Generated by `npm.cmd run validate:canonical-dataset`.",
  "",
  "## Summary",
  "",
  `- partial: ${missingMatchAnalysis.summary.partial}`,
  `- blocked: ${missingMatchAnalysis.summary.blocked}`,
  `- missingItems: ${missingMatchAnalysis.summary.missingItems}`,
  `- autoMatchPossible: ${missingMatchAnalysis.summary.autoMatchPossible}`,
  `- curatedSourceRequired: ${missingMatchAnalysis.summary.curatedSourceRequired}`,
  `- adapterParserImprovements: ${missingMatchAnalysis.summary.adapterParserImprovements}`,
  "",
  "## Failure Reason Counts",
  "",
  ...(Object.keys(failureReasonCounts).length ? Object.entries(failureReasonCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => `- ${key}: ${value}`) : ["- none"]),
  "",
  "## Character Diagnostics",
  "",
  ...(missingMatchAnalysis.rows.length ? missingMatchAnalysis.rows.flatMap((row) => [
    `### ${row.displayName}`,
    "",
    `- characterId: ${row.characterId}`,
    `- readinessStatus: ${row.readinessStatus}`,
    ...row.missingDiagnostics.map((item) => `- ${item.missingType}: reason=${item.failureReason}; matched=${item.matchedCandidateCount}; autoMatchPossible=${item.autoMatchPossible}; needsCuratedSource=${item.needsCuratedSource}; nextAction=${item.nextAction}`),
    "",
  ]) : ["- none"]),
  "## Policy",
  "",
  "- This report is diagnostic only; it does not auto-match or patch character names/values.",
  "- Manual hints and manual guides remain blocked from calculation readiness.",
];
fs.writeFileSync(missingMatchAnalysisReportPath, `${missingMatchReportLines.join("\n")}\n`, "utf8");

console.log(`canonical dataset validation ok: sourceRows=${dataset.manifest.counts.sourceRows}, sourceReady=${dataset.manifest.sourcePolicy.ready}, sourceBlocked=${dataset.manifest.sourcePolicy.blocked}, statusCharacters=${extractionStatus.summary.characters}, readiness=ready:${extractionStatus.summary.ready}/partial:${extractionStatus.summary.partial}/blocked:${extractionStatus.summary.blocked}, readyWithMissing=0, datasetMode=${extractionStatus.datasetMode}, effectRowsZero=${extractionStatus.summary.effectRowsZero}, manual_hint_guard=blocked`);

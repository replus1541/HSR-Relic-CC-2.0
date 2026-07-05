const emptyRows = Object.freeze([]);

function asRows(input, key) {
  const rows = input?.[key];
  return Array.isArray(rows) ? rows : emptyRows;
}

function countBy(rows, field) {
  return rows.reduce((counts, row) => {
    const value = row?.[field] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function collectUniqueIds(rows, field) {
  return [...new Set(rows.map((row) => row?.[field]).filter(Boolean))].sort();
}

export function buildCanonicalDataset(input = {}, options = {}) {
  const sourceRows = [...asRows(input, "sourceRows")];
  const effectRows = [...asRows(input, "effectRows")];
  const coefficientRows = [...asRows(input, "coefficientRows")];
  const generatedBy = options.generatedBy ?? "src/extraction/build-canonical-dataset.js";

  return {
    version: 1,
    generatedBy,
    manifest: {
      counts: {
        sourceRows: sourceRows.length,
        effectRows: effectRows.length,
        coefficientRows: coefficientRows.length,
      },
      sourceOrigins: countBy(sourceRows, "sourceOrigin"),
      sourceKinds: countBy(sourceRows, "sourceKind"),
      effectTypes: countBy(effectRows, "effectType"),
      coefficientAttackTypes: countBy(coefficientRows, "attackType"),
      characterIds: collectUniqueIds([...sourceRows, ...effectRows, ...coefficientRows], "characterId"),
    },
    rows: {
      sourceRows,
      effectRows,
      coefficientRows,
    },
    policy: {
      priorityApplied: false,
      calculationReadinessApplied: false,
      manualGuideCalculationAllowed: false,
    },
  };
}

export function createEmptyCanonicalDataset(options = {}) {
  return buildCanonicalDataset({}, options);
}

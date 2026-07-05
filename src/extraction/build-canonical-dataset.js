import { applySourcePolicy, summarizeSourcePolicy } from "./source-policy.js";

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
  const rawSourceRows = [...asRows(input, "sourceRows")];
  const sourceRows = options.applySourcePolicy === false ? rawSourceRows : applySourcePolicy(rawSourceRows);
  const effectRows = [...asRows(input, "effectRows")];
  const coefficientRows = [...asRows(input, "coefficientRows")];
  const generatedBy = options.generatedBy ?? "src/extraction/build-canonical-dataset.js";
  const sourcePolicySummary = summarizeSourcePolicy(sourceRows);

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
      sourcePolicy: sourcePolicySummary,
    },
    rows: {
      sourceRows,
      effectRows,
      coefficientRows,
    },
    policy: {
      sourcePriorityApplied: options.applySourcePolicy !== false,
      calculationReadinessApplied: options.applySourcePolicy !== false,
      manualGuideCalculationAllowed: false,
    },
  };
}

export function createEmptyCanonicalDataset(options = {}) {
  return buildCanonicalDataset({}, options);
}

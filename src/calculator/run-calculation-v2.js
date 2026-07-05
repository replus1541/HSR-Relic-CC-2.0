import { aggregateDamageModifiers, aggregateEnemyDebuffs } from "./aggregate-damage-modifiers.js";
import { aggregateStats } from "./aggregate-stats.js";
import { createEmptyAggregationResult } from "./aggregation-contract.js";

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createLedgerInputHash(ledgerRows = []) {
  return hashString(stableStringify(ledgerRows.map((row) => ({
    ledgerId: row.ledgerId,
    stat: row.stat,
    resolvedValue: row.resolvedValue,
    usedForCalculation: row.usedForCalculation,
    blockedReason: row.blockedReason,
    targetPolicy: row.targetPolicy,
  }))));
}

export function runCalculationV2(ledgerRows = [], options = {}) {
  const scenarioId = options.scenarioId ?? "default";
  const subjectId = options.subjectId ?? "unknown";
  const result = createEmptyAggregationResult({
    scenarioId,
    subjectId,
    inputHash: createLedgerInputHash(ledgerRows),
  });

  result.ledgerRowIds = ledgerRows.map((row) => row.ledgerId);
  result.statTotals = aggregateStats(ledgerRows);
  result.damageModifiers = aggregateDamageModifiers(ledgerRows);
  result.enemyDebuffs = aggregateEnemyDebuffs(ledgerRows);
  result.sourceTrace = {
    ledgerRows: ledgerRows.length,
    usedRows: ledgerRows.filter((row) => row.usedForCalculation).length,
    blockedRows: ledgerRows.filter((row) => !row.usedForCalculation).length,
  };
  result.skippedRows = ledgerRows
    .filter((row) => !row.usedForCalculation)
    .map((row) => ({ ledgerId: row.ledgerId, blockedReason: row.blockedReason }));

  return result;
}

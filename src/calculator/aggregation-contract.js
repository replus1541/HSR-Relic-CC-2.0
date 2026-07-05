export const AggregationBuckets = Object.freeze({
  STAT_TOTALS: "statTotals",
  DAMAGE_MODIFIERS: "damageModifiers",
  ENEMY_DEBUFFS: "enemyDebuffs",
  PARTY_EFFECTS: "partyEffects",
  ADDITIONAL_DAMAGE: "additionalDamage",
});

export const AggregationResultFields = Object.freeze([
  "id",
  "scenarioId",
  "subjectId",
  "inputHash",
  "ledgerRowIds",
  "statTotals",
  "damageModifiers",
  "enemyDebuffs",
  "partyEffects",
  "additionalDamage",
  "sourceTrace",
  "skippedRows",
]);

export function createEmptyAggregationResult({ scenarioId = "default", subjectId = "unknown", inputHash = "pending" } = {}) {
  return {
    id: `aggregation:${scenarioId}:${subjectId}`,
    scenarioId,
    subjectId,
    inputHash,
    ledgerRowIds: [],
    statTotals: {},
    damageModifiers: {},
    enemyDebuffs: {},
    partyEffects: {},
    additionalDamage: {},
    sourceTrace: {
      ledgerRows: 0,
      usedRows: 0,
      blockedRows: 0,
    },
    skippedRows: [],
  };
}

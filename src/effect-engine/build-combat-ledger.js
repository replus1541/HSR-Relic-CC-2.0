export const CombatLedgerFieldMapping = Object.freeze({
  ledgerId: "derived from resolved effect id",
  sourceId: "dedupedEffect.sourceId",
  sourceRowId: "dedupedEffect.sourceId",
  canonicalEffectKey: "dedupedEffect.canonicalEffectKey",
  valueMode: "context.normalizedEffect.valueMode",
  ownerId: "context.normalizedEffect.effectProviderId",
  subjectId: "context.subjectId or ownerId",
  targetPolicy: "context.normalizedEffect.targetScope",
  stat: "dedupedEffect.stat",
  resolvedValue: "dedupedEffect.resolvedValue when used",
  blockedReason: "dedupedEffect.blockedReason or dedupeResult.reason when blocked",
  usedForCalculation: "dedupeResult.role === winner and calculationStatus is calculation_ready",
  category: "effect",
  sourceTrace: "source, normalized, resolved, dedupe ids",
});

export const RequiredCombatLedgerFields = Object.freeze([
  "ledgerId",
  "sourceId",
  "sourceRowId",
  "canonicalEffectKey",
  "valueMode",
  "ownerId",
  "subjectId",
  "targetPolicy",
  "stat",
  "usedForCalculation",
  "category",
  "sourceTrace",
]);

function mapBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows ?? []) {
    const key = keyFn(row);
    if (key) map.set(key, row);
  }
  return map;
}

export function createCombatLedgerContractRow(dedupedEffect, context = {}) {
  const normalizedEffect = context.normalizedEffect ?? {};
  const ownerId = normalizedEffect.effectProviderId ?? context.ownerId ?? "unknown_owner";
  const usedForCalculation = dedupedEffect?.dedupeResult?.role === "winner" && dedupedEffect?.calculationStatus === "calculation_ready";
  const blockedReason = usedForCalculation ? null : dedupedEffect?.blockedReason ?? dedupedEffect?.dedupeResult?.reason ?? "not_used_for_calculation";

  return {
    ledgerId: `ledger:${dedupedEffect?.id ?? "unknown"}`,
    sourceId: dedupedEffect?.sourceId ?? null,
    sourceRowId: dedupedEffect?.sourceId ?? null,
    canonicalEffectKey: dedupedEffect?.canonicalEffectKey ?? null,
    valueMode: normalizedEffect.valueMode ?? null,
    ownerId,
    subjectId: context.subjectId ?? ownerId,
    targetPolicy: normalizedEffect.targetScope ?? null,
    stat: dedupedEffect?.stat ?? null,
    resolvedValue: usedForCalculation ? dedupedEffect.resolvedValue : null,
    blockedReason,
    skippedReason: blockedReason,
    usedForCalculation,
    category: "effect",
    calculationStatus: dedupedEffect?.calculationStatus ?? "blocked",
    sourceTrace: {
      sourceId: dedupedEffect?.sourceId ?? null,
      sourceRowId: dedupedEffect?.sourceId ?? null,
      effectRowId: dedupedEffect?.effectRowId ?? null,
      resolvedEffectId: dedupedEffect?.id ?? null,
      normalizedEffectId: normalizedEffect.id ?? null,
      canonicalEffectKey: dedupedEffect?.canonicalEffectKey ?? null,
      dedupeRole: dedupedEffect?.dedupeResult?.role ?? null,
    },
  };
}

export function buildCombatLedger(dedupedEffects = [], context = {}) {
  const normalizedByEffectRowId = mapBy(context.normalizedEffects, (row) => row.effectRowId);
  return dedupedEffects.map((dedupedEffect) => createCombatLedgerContractRow(dedupedEffect, {
    ...context,
    normalizedEffect: normalizedByEffectRowId.get(dedupedEffect.effectRowId),
  }));
}

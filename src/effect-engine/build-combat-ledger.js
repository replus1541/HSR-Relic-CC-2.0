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
  "sourceTrace",
]);

export function createCombatLedgerContractRow(dedupedEffect, context = {}) {
  const normalizedEffect = context.normalizedEffect ?? {};
  const ownerId = normalizedEffect.effectProviderId ?? context.ownerId ?? "unknown_owner";
  const usedForCalculation = dedupedEffect?.dedupeResult?.role === "winner" && dedupedEffect?.calculationStatus === "calculation_ready";

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
    blockedReason: usedForCalculation ? null : dedupedEffect?.blockedReason ?? dedupedEffect?.dedupeResult?.reason ?? "not_used_for_calculation",
    usedForCalculation,
    sourceTrace: {
      sourceId: dedupedEffect?.sourceId ?? null,
      effectRowId: dedupedEffect?.effectRowId ?? null,
      resolvedEffectId: dedupedEffect?.id ?? null,
      canonicalEffectKey: dedupedEffect?.canonicalEffectKey ?? null,
    },
  };
}

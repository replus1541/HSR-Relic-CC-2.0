import {
  AttackType,
  BlockedReason,
  CalculationStatus,
  TargetScope,
} from "../data-model/schemas/index.js";
import {
  getUnknownTaxonomyPolicy,
  isKnownAttackType,
  isKnownEffectType,
  isKnownTargetScope,
  isKnownValueMode,
} from "./effect-taxonomy.js";

const targetPolicyToScope = Object.freeze({
  self: TargetScope.SELF,
  singleAlly: TargetScope.SINGLE_ALLY,
  allAllies: TargetScope.ALL_ALLIES,
  enemySingle: TargetScope.ENEMY_SINGLE,
  enemyAll: TargetScope.ENEMY_ALL,
  field: TargetScope.FIELD,
});

function normalizeTargetScope(effectRow) {
  return targetPolicyToScope[effectRow?.effectTargetPolicy] ?? TargetScope.UNKNOWN;
}

function normalizeAttackType(effectRow) {
  return effectRow?.attackType ?? AttackType.SUPPORT;
}

function firstBlockedReason(checks) {
  const failed = checks.find((check) => !check.ok);
  return failed?.blockedReason ?? null;
}

function createTaxonomyChecks(normalized) {
  return [
    {
      field: "effectType",
      ok: isKnownEffectType(normalized.effectType),
      blockedReason: getUnknownTaxonomyPolicy("effectType").blockedReason,
    },
    {
      field: "targetScope",
      ok: isKnownTargetScope(normalized.targetScope) && normalized.targetScope !== TargetScope.UNKNOWN,
      blockedReason: getUnknownTaxonomyPolicy("targetScope").blockedReason,
    },
    {
      field: "attackType",
      ok: isKnownAttackType(normalized.attackType),
      blockedReason: getUnknownTaxonomyPolicy("attackType").blockedReason,
    },
    {
      field: "valueMode",
      ok: isKnownValueMode(normalized.valueMode),
      blockedReason: getUnknownTaxonomyPolicy("valueMode").blockedReason,
    },
  ];
}

export function normalizeEffect(effectRow) {
  const normalized = {
    id: `normalized:${effectRow.id}`,
    effectRowId: effectRow.id,
    sourceId: effectRow.sourceId,
    sourceOrigin: effectRow.sourceOrigin,
    effectProviderId: effectRow.effectProviderId,
    stat: effectRow.stat,
    rawValue: effectRow.rawValue,
    effectType: effectRow.effectType,
    targetScope: normalizeTargetScope(effectRow),
    attackType: normalizeAttackType(effectRow),
    valueMode: effectRow.valueMode,
    condition: {
      conditionKey: effectRow.conditionKey ?? null,
      sourcePolicy: "unresolved_until_value_resolution",
    },
    stackRule: {
      stackKey: effectRow.stackKey ?? null,
      sourcePolicy: "unresolved_until_value_resolution",
    },
    sourcePolicies: {
      effectTargetPolicy: effectRow.effectTargetPolicy ?? null,
      calculationSubjectPolicy: effectRow.calculationSubjectPolicy ?? null,
    },
  };

  const taxonomyChecks = createTaxonomyChecks(normalized);
  const taxonomyBlockedReason = firstBlockedReason(taxonomyChecks);
  const sourceBlockedReason = effectRow.calculationStatus === CalculationStatus.CALCULATION_READY
    ? null
    : effectRow.blockedReason ?? BlockedReason.PENDING_REVIEW;
  const blockedReason = taxonomyBlockedReason ?? sourceBlockedReason;

  return {
    ...normalized,
    taxonomyChecks,
    calculationStatus: blockedReason ? CalculationStatus.BLOCKED : CalculationStatus.CALCULATION_READY,
    ...(blockedReason ? { blockedReason } : {}),
  };
}

export function normalizeEffects(effectRows = []) {
  return effectRows.map((effectRow) => normalizeEffect(effectRow));
}

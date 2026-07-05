import {
  AttackType,
  BlockedReason,
  EffectType,
  TargetScope,
  ValueMode,
} from "../data-model/schemas/index.js";

export const EffectTaxonomy = Object.freeze({
  effectTypes: Object.freeze(Object.values(EffectType)),
  targetScopes: Object.freeze(Object.values(TargetScope)),
  attackTypes: Object.freeze(Object.values(AttackType)),
  valueModes: Object.freeze(Object.values(ValueMode)),
});

export const UnknownTaxonomyPolicy = Object.freeze({
  effectType: Object.freeze({
    calculationReady: false,
    blockedReason: BlockedReason.PENDING_REVIEW,
  }),
  targetScope: Object.freeze({
    calculationReady: false,
    blockedReason: BlockedReason.TARGET_POLICY_MISSING,
  }),
  attackType: Object.freeze({
    calculationReady: false,
    blockedReason: BlockedReason.PENDING_REVIEW,
  }),
  valueMode: Object.freeze({
    calculationReady: false,
    blockedReason: BlockedReason.VALUE_MODE_UNKNOWN,
  }),
});

function hasTaxonomyValue(values, value) {
  return values.includes(value);
}

export function isKnownEffectType(value) {
  return hasTaxonomyValue(EffectTaxonomy.effectTypes, value);
}

export function isKnownTargetScope(value) {
  return hasTaxonomyValue(EffectTaxonomy.targetScopes, value);
}

export function isKnownAttackType(value) {
  return hasTaxonomyValue(EffectTaxonomy.attackTypes, value);
}

export function isKnownValueMode(value) {
  return hasTaxonomyValue(EffectTaxonomy.valueModes, value);
}

export function getUnknownTaxonomyPolicy(field) {
  return UnknownTaxonomyPolicy[field] ?? Object.freeze({
    calculationReady: false,
    blockedReason: BlockedReason.PENDING_REVIEW,
  });
}

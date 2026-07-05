import { CalculationStatus, ValueMode } from "../data-model/schemas/index.js";
import {
  resolveDynamicFormula,
  resolveEidolonAdjusted,
  resolveFixedValue,
  resolveSkillLevelScaled,
  resolveSuperimpositionScaled,
  resolveUnknownValueMode,
} from "./value-resolvers/index.js";

const defaultContext = Object.freeze({
  skillLevel: 10,
  eidolon: 6,
  superimposition: 1,
});

function createPendingDedupeKey(effect) {
  return [
    "pending_dedupe",
    effect.effectProviderId ?? "unknown_provider",
    effect.sourceId ?? "unknown_source",
    effect.stat ?? "unknown_stat",
    effect.effectType ?? "unknown_effect_type",
    effect.targetScope ?? "unknown_target",
  ].join(":");
}

function runResolver(effect, context) {
  if (effect.calculationStatus !== CalculationStatus.CALCULATION_READY) {
    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: effect.blockedReason,
      valueTrace: { resolver: "preblocked", reason: effect.blockedReason ?? "not calculation_ready" },
    };
  }

  switch (effect.valueMode) {
    case ValueMode.FIXED:
      return resolveFixedValue(effect, context);
    case ValueMode.SKILL_LEVEL_SCALED:
      return resolveSkillLevelScaled(effect, context);
    case ValueMode.EIDOLON_ADJUSTED:
      return resolveEidolonAdjusted(effect, context);
    case ValueMode.SUPERIMPOSITION_SCALED:
      return resolveSuperimpositionScaled(effect, context);
    case ValueMode.DYNAMIC_FORMULA:
      return resolveDynamicFormula(effect, context);
    case ValueMode.UNKNOWN:
    default:
      return resolveUnknownValueMode(effect, context);
  }
}

export function resolveValue(effect, options = {}) {
  const context = { ...defaultContext, ...(options.context ?? {}) };
  const result = runResolver(effect, context);

  return {
    id: `resolved:${effect.effectRowId}`,
    effectRowId: effect.effectRowId,
    sourceId: effect.sourceId,
    stat: effect.stat,
    valueTrace: result.valueTrace ?? {},
    dedupeKey: createPendingDedupeKey(effect),
    calculationStatus: result.calculationStatus,
    ...(typeof result.resolvedValue === "number" ? { resolvedValue: result.resolvedValue } : {}),
    ...(result.blockedReason ? { blockedReason: result.blockedReason } : {}),
  };
}

export function resolveValues(normalizedEffects = [], options = {}) {
  return normalizedEffects.map((effect) => resolveValue(effect, options));
}

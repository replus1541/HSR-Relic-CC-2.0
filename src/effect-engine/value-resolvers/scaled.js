import { BlockedReason, CalculationStatus } from "../../data-model/schemas/index.js";

function resolveRawScalar(effect, resolver, contextKey, contextValue) {
  if (contextValue == null) {
    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: BlockedReason.MISSING_RESOLVED_VALUE,
      valueTrace: { resolver, reason: `${contextKey} missing` },
    };
  }

  if (typeof effect.rawValue !== "number") {
    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: BlockedReason.MISSING_RESOLVED_VALUE,
      valueTrace: { resolver, reason: "rawValue missing" },
    };
  }

  return {
    resolvedValue: effect.rawValue,
    calculationStatus: CalculationStatus.CALCULATION_READY,
    valueTrace: { resolver, source: "adapter_rawValue", [contextKey]: contextValue },
  };
}

export function resolveSkillLevelScaled(effect, context) {
  return resolveRawScalar(effect, "skill_level_scaled", "skillLevel", context.skillLevel);
}

export function resolveEidolonAdjusted(effect, context) {
  if (context.eidolon == null) {
    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: BlockedReason.CONDITION_NOT_MET,
      valueTrace: { resolver: "eidolon_adjusted", reason: "eidolon missing" },
    };
  }
  return resolveRawScalar(effect, "eidolon_adjusted", "eidolon", context.eidolon);
}

export function resolveSuperimpositionScaled(effect, context) {
  return resolveRawScalar(effect, "superimposition_scaled", "superimposition", context.superimposition);
}

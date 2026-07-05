import { BlockedReason, CalculationStatus } from "../../data-model/schemas/index.js";

function resolveEffectiveSkillLevel(effect, context) {
  const scaling = effect.skillScaling;
  if (!scaling || !Array.isArray(scaling.coefficientValues) || scaling.coefficientValues.length === 0) return null;

  const eidolon = Number.isFinite(context.eidolon) ? context.eidolon : 0;
  let level = Number.isFinite(scaling.baseLevel) ? scaling.baseLevel : null;
  if (level == null) return null;

  let hardCap = Number.isFinite(scaling.hardCap) ? scaling.hardCap : scaling.coefficientValues.length;
  for (const bonus of scaling.eidolonLevelBonuses ?? []) {
    if (!Number.isFinite(bonus?.minEidolon) || !Number.isFinite(bonus?.levelBonus)) continue;
    if (eidolon < bonus.minEidolon) continue;
    level += bonus.levelBonus;
    if (Number.isFinite(bonus.levelCap)) hardCap = Math.min(hardCap, bonus.levelCap);
  }

  level = Math.min(level, hardCap);
  return {
    effectiveLevel: level,
    tableIndex: level - 1,
  };
}

function resolveCoefficientTable(effect, context) {
  const scaling = effect.skillScaling;
  const levelInfo = resolveEffectiveSkillLevel(effect, context);
  if (!levelInfo) {
    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: BlockedReason.MISSING_RESOLVED_VALUE,
      valueTrace: { resolver: "skill_level_scaled", reason: "skillScaling coefficient table missing" },
    };
  }

  const resolvedValue = scaling.coefficientValues[levelInfo.tableIndex];
  const aggregateMultiplier = Number.isFinite(scaling.aggregateMultiplier) ? scaling.aggregateMultiplier : 1;
  if (typeof resolvedValue !== "number" || !Number.isFinite(resolvedValue)) {
    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: BlockedReason.MISSING_RESOLVED_VALUE,
      valueTrace: {
        resolver: "skill_level_scaled",
        reason: "effective level is outside coefficient table",
        effectiveLevel: levelInfo.effectiveLevel,
        tableLength: scaling.coefficientValues.length,
      },
    };
  }

  return {
    resolvedValue: resolvedValue * aggregateMultiplier,
    calculationStatus: CalculationStatus.CALCULATION_READY,
    valueTrace: {
      resolver: "skill_level_scaled",
      source: scaling.source,
      skillCategory: scaling.skillCategory,
      skillTitle: scaling.skillTitle,
      coefficientLabel: scaling.coefficientLabel,
      baseLevel: scaling.baseLevel,
      eidolon: context.eidolon,
      eidolonLevelBonuses: scaling.eidolonLevelBonuses ?? [],
      effectiveLevel: levelInfo.effectiveLevel,
      tableIndex: levelInfo.tableIndex,
      ...(aggregateMultiplier !== 1 ? { aggregateMultiplier } : {}),
    },
  };
}

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
  if (effect.skillScaling) return resolveCoefficientTable(effect, context);
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

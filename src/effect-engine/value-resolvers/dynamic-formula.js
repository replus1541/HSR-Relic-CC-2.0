import { BlockedReason, CalculationStatus } from "../../data-model/schemas/index.js";

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function lookupContextValue(effect, context) {
  const maps = [
    context.dynamicFormulaValues,
    context.dynamicValues,
    context.reviewDecisionValues,
  ].filter(Boolean);
  for (const map of maps) {
    const value = map instanceof Map ? map.get(effect.effectRowId) : map[effect.effectRowId];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function trace(effect, extra = {}) {
  return {
    resolver: "dynamic_formula",
    source: "user_review_decision",
    reviewIndex: effect.userReview?.reviewIndex ?? null,
    reviewDecision: effect.userReview?.decision ?? null,
    dynamicFormulaType: effect.dynamicFormulaType ?? null,
    effectRowId: effect.effectRowId,
    ...extra,
  };
}

function isExcludeOrDeferredDecision(decision) {
  if (/Change dynamic_formula -> fixed/i.test(decision)) return false;
  return /Exclude|duplicate|Always OFF|Do not apply|Do not decide|only if later/i.test(decision);
}

function needsSourceStatContext(decision) {
  return /source_stat|actual final|final in-combat|actual ATK|source_stat_ratio|source ATK|ATK from|ATK after|Break Effect|over 120|cap from|percentage of|recursion guard|ignore ally-provided buffs|critDamage share|provider's own stat/i.test(decision);
}

function needsExplicitUiContext(decision) {
  if (/No implicit ready without stack input/i.test(decision)) return true;
  if (/UI toggle|Do not force|enemy count setting|enemyCount|configured enemyCount|below 5 stacks|6 stacks/i.test(decision)) return true;
  return /UI selectable|UI input|options|preset|stackCount|stack count/i.test(decision)
    && !/default\s+\d+|maximum|max stack|maximum stacks|Change dynamic_formula -> fixed/i.test(decision);
}

function isPartyConditional(decision) {
  return /Party-composition conditional|Apply under the shared Cyrene poem rule|When Cyrene and Cipher|specific character receiving this poem|receiver is|relevant to the current calculation|Shifu target/i.test(decision);
}

function canUseRawReviewedValue(effect, decision) {
  if (typeof effect.rawValue !== "number" || !Number.isFinite(effect.rawValue)) return false;
  if (effect.rawValue === 0 && !/\+0%|0%/.test(decision)) return false;
  if (/Change dynamic_formula -> fixed|Always ON|always ON|Fixed|Use max|default \d+|maximum|max stack|maximum stacks|Treat .* \d+ stacks|Assume .* maintained|Assume .* active|Assume .* satisfied|Always calculate at maximum|Apply .* full|\+50% only/i.test(decision)) return true;
  if (/Apply when|Apply under|Treat the selected character/i.test(decision) && !needsSourceStatContext(decision)) return true;
  return false;
}

function resolveReviewedStackFormula(effect, decision, context) {
  const eidolon = Number.isFinite(context.eidolon) ? context.eidolon : 0;
  if (effect.effectRowId === "effect:DanHengIL_00:0") {
    return { value: 0.05 * 6, resolution: "review_default_stack", stackCount: 6 };
  }
  if (effect.effectRowId === "effect:Dr_Ratio_00:0") {
    const stackCount = eidolon >= 1 ? 10 : 6;
    return { value: 0.025 * stackCount, resolution: "review_default_stack", stackCount };
  }
  if (effect.effectRowId === "effect:Dr_Ratio_00:1") {
    const stackCount = eidolon >= 1 ? 10 : 6;
    return { value: 0.05 * stackCount, resolution: "review_default_stack", stackCount };
  }
  const defaultMatch = decision.match(/default\s+(\d+)/i);
  const multiplierMatch = decision.match(/=\s*(\d+(?:\.\d+)?)%\s*\*\s*stackCount/i);
  if (defaultMatch && multiplierMatch) {
    const stackCount = Number(defaultMatch[1]);
    const unitValue = Number(multiplierMatch[1]) / 100;
    return { value: unitValue * stackCount, resolution: "review_default_stack", stackCount };
  }
  return null;
}

export function resolveDynamicFormula(effect, context = {}) {
  const decision = compactText(effect.userReview?.decision);
  if (decision) {
    const contextValue = lookupContextValue(effect, context);
    if (contextValue != null) {
      return {
        resolvedValue: contextValue,
        calculationStatus: CalculationStatus.CALCULATION_READY,
        valueTrace: trace(effect, { resolution: "context_value" }),
      };
    }

    const reviewedStack = resolveReviewedStackFormula(effect, decision, context);
    if (reviewedStack) {
      return {
        resolvedValue: reviewedStack.value,
        calculationStatus: CalculationStatus.CALCULATION_READY,
        valueTrace: trace(effect, {
          resolution: reviewedStack.resolution,
          stackCount: reviewedStack.stackCount,
        }),
      };
    }

    if (isExcludeOrDeferredDecision(decision)) {
      return {
        calculationStatus: CalculationStatus.BLOCKED,
        blockedReason: BlockedReason.CONDITION_NOT_MET,
        valueTrace: trace(effect, { resolution: "excluded_or_deferred_by_review" }),
      };
    }

    if (needsSourceStatContext(decision)) {
      return {
        calculationStatus: CalculationStatus.BLOCKED,
        blockedReason: BlockedReason.MISSING_RESOLVED_VALUE,
        valueTrace: trace(effect, { resolution: "source_stat_context_required" }),
      };
    }

    if (isPartyConditional(decision)) {
      return {
        calculationStatus: CalculationStatus.BLOCKED,
        blockedReason: BlockedReason.CONDITION_POLICY_MISSING,
        valueTrace: trace(effect, { resolution: "party_context_required" }),
      };
    }

    if (needsExplicitUiContext(decision)) {
      return {
        calculationStatus: CalculationStatus.BLOCKED,
        blockedReason: BlockedReason.CONDITION_POLICY_MISSING,
        valueTrace: trace(effect, { resolution: "ui_context_required" }),
      };
    }

    if (canUseRawReviewedValue(effect, decision)) {
      return {
        resolvedValue: effect.rawValue,
        calculationStatus: CalculationStatus.CALCULATION_READY,
        valueTrace: trace(effect, { resolution: "reviewed_raw_value" }),
      };
    }

    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: BlockedReason.CONDITION_POLICY_MISSING,
      valueTrace: trace(effect, { resolution: "review_decision_not_automatable" }),
    };
  }

  return {
    calculationStatus: CalculationStatus.BLOCKED,
    blockedReason: BlockedReason.UNSUPPORTED_DYNAMIC_FORMULA,
    valueTrace: {
      resolver: "dynamic_formula",
      reason: "dynamic formula resolver not implemented in Phase 9-B",
      effectRowId: effect.effectRowId,
    },
  };
}

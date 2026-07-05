import { BlockedReason, CalculationStatus } from "../../data-model/schemas/index.js";

export function resolveFixedValue(effect) {
  if (typeof effect.rawValue !== "number") {
    return {
      calculationStatus: CalculationStatus.BLOCKED,
      blockedReason: BlockedReason.MISSING_RESOLVED_VALUE,
      valueTrace: { resolver: "fixed", reason: "rawValue missing" },
    };
  }

  return {
    resolvedValue: effect.rawValue,
    calculationStatus: CalculationStatus.CALCULATION_READY,
    valueTrace: { resolver: "fixed", source: "rawValue" },
  };
}

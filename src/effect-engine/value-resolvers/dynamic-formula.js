import { BlockedReason, CalculationStatus } from "../../data-model/schemas/index.js";

export function resolveDynamicFormula(effect) {
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

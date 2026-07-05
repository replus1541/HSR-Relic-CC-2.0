import { BlockedReason, CalculationStatus } from "../../data-model/schemas/index.js";

export function resolveUnknownValueMode(effect) {
  return {
    calculationStatus: CalculationStatus.BLOCKED,
    blockedReason: BlockedReason.VALUE_MODE_UNKNOWN,
    valueTrace: {
      resolver: "unknown",
      reason: `unsupported valueMode: ${effect.valueMode ?? "missing"}`,
    },
  };
}

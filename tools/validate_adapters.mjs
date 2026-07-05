import { CalculationStatus, SourceKind, SourceOrigin } from "../src/data-model/schemas/index.js";
import { listAdapters } from "../src/adapters/adapter-registry.js";
import { validateAdapterResult } from "../src/adapters/adapter-validator.js";

const adapters = listAdapters();
if (!adapters.length) throw new Error("adapter registry is empty");

for (const adapter of adapters) {
  const result = {
    adapterId: adapter.adapterId,
    sourceKind: adapter.sourceKind,
    input: null,
    output: adapter.normalize(null, {}),
    report: adapter.report(null, {}),
  };
  const validation = validateAdapterResult(result);
  if (!validation.ok) {
    throw new Error(`${adapter.adapterId} output failed validation: ${validation.errors.join("; ")}`);
  }
}

const invalidManualHintResult = {
  adapterId: "invalid-manual-hint-fixture",
  sourceKind: SourceKind.LEGACY_SNAPSHOT,
  output: {
    sourceRows: [
      {
        id: "invalid:manual-hint-ready",
        sourceOrigin: SourceOrigin.MANUAL_HINT,
        sourceKind: SourceKind.LEGACY_SNAPSHOT,
        sourcePath: "data/character-effects/character-guides.json",
        sourceRecord: "guide:invalid",
        calculationStatus: CalculationStatus.CALCULATION_READY,
      },
    ],
    effectRows: [],
    coefficientRows: [],
    blockedRows: [],
  },
  report: {
    counts: {
      sourceRows: 1,
      effectRows: 0,
      coefficientRows: 0,
      blockedRows: 0,
      warnings: 0,
      errors: 0,
    },
    warnings: [],
    errors: [],
  },
};

if (validateAdapterResult(invalidManualHintResult).ok) {
  throw new Error("invalid manual_hint adapter fixture unexpectedly passed validation");
}

console.log(`adapter validation ok: adapters=${adapters.length}, invalid_manual_hint_guard=blocked`);

import {
  BlockedReason,
  CalculationStatus,
  SourceOrigin,
} from "../data-model/schemas/index.js";

export const SourcePriority = Object.freeze({
  [SourceOrigin.RAW_SOURCE]: 100,
  [SourceOrigin.CURATED_SOURCE]: 90,
  [SourceOrigin.EXTERNAL_IMPORT]: 40,
  [SourceOrigin.AUDIT_REFERENCE]: 20,
  [SourceOrigin.MANUAL_HINT]: 0,
  [SourceOrigin.MANUAL_GUIDE]: 0,
  [SourceOrigin.FALLBACK]: 0,
});

const calculationEligibleOrigins = new Set([
  SourceOrigin.RAW_SOURCE,
  SourceOrigin.CURATED_SOURCE,
]);

const manualBlockedOrigins = new Set([
  SourceOrigin.MANUAL_HINT,
  SourceOrigin.MANUAL_GUIDE,
  SourceOrigin.FALLBACK,
  SourceOrigin.AUDIT_REFERENCE,
]);

function blockedReasonForOrigin(sourceOrigin) {
  if (sourceOrigin === SourceOrigin.FALLBACK) return BlockedReason.FALLBACK_SOURCE_BLOCKED;
  if (sourceOrigin === SourceOrigin.AUDIT_REFERENCE) return BlockedReason.AUDIT_REFERENCE_ONLY;
  if (sourceOrigin === SourceOrigin.MANUAL_HINT || sourceOrigin === SourceOrigin.MANUAL_GUIDE) {
    return BlockedReason.MANUAL_SOURCE_BLOCKED;
  }
  return BlockedReason.EXTERNAL_MAPPING_UNCONFIRMED;
}

export function getSourcePriority(sourceRow) {
  return SourcePriority[sourceRow?.sourceOrigin] ?? 0;
}

export function evaluateSourceReadiness(sourceRow) {
  const sourceOrigin = sourceRow?.sourceOrigin;
  const sourcePriority = getSourcePriority(sourceRow);

  if (manualBlockedOrigins.has(sourceOrigin)) {
    return {
      sourcePriority,
      calculationReady: false,
      policyBlockedReason: blockedReasonForOrigin(sourceOrigin),
    };
  }

  if (!calculationEligibleOrigins.has(sourceOrigin)) {
    return {
      sourcePriority,
      calculationReady: false,
      policyBlockedReason: blockedReasonForOrigin(sourceOrigin),
    };
  }

  if (sourceRow?.calculationStatus !== CalculationStatus.CALCULATION_READY) {
    return {
      sourcePriority,
      calculationReady: false,
      policyBlockedReason: sourceRow?.blockedReason ?? BlockedReason.PENDING_REVIEW,
    };
  }

  return {
    sourcePriority,
    calculationReady: true,
    policyBlockedReason: null,
  };
}

export function applySourcePolicy(sourceRows = []) {
  return sourceRows.map((sourceRow) => {
    const readiness = evaluateSourceReadiness(sourceRow);
    return {
      ...sourceRow,
      sourcePriority: readiness.sourcePriority,
      calculationReady: readiness.calculationReady,
      ...(readiness.policyBlockedReason ? { policyBlockedReason: readiness.policyBlockedReason } : {}),
    };
  });
}

export function summarizeSourcePolicy(sourceRows = []) {
  const summary = {
    ready: 0,
    blocked: 0,
    byOrigin: {},
    byBlockedReason: {},
  };

  for (const row of sourceRows) {
    if (row.calculationReady) summary.ready += 1;
    else summary.blocked += 1;

    const origin = row.sourceOrigin ?? "unknown";
    summary.byOrigin[origin] = (summary.byOrigin[origin] ?? 0) + 1;

    if (row.policyBlockedReason) {
      summary.byBlockedReason[row.policyBlockedReason] = (summary.byBlockedReason[row.policyBlockedReason] ?? 0) + 1;
    }
  }

  return summary;
}

import {
  BlockedReason,
  CalculationStatus,
  SourceKind,
  SourceOrigin,
} from "./schemas/index.js";

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

function enumValues(enumObject) {
  return new Set(Object.values(enumObject));
}

function addRequired(errors, row, field) {
  if (row?.[field] == null || row[field] === "") {
    errors.push(`missing required field: ${field}`);
  }
}

function addEnum(errors, row, field, enumObject) {
  if (row?.[field] == null) return;
  if (!enumValues(enumObject).has(row[field])) {
    errors.push(`invalid ${field}: ${row[field]}`);
  }
}

export function validateSourceRow(row) {
  const errors = [];
  addRequired(errors, row, "id");
  addRequired(errors, row, "sourceOrigin");
  addRequired(errors, row, "sourceKind");
  addRequired(errors, row, "sourcePath");
  addRequired(errors, row, "sourceRecord");
  addRequired(errors, row, "calculationStatus");

  addEnum(errors, row, "sourceOrigin", SourceOrigin);
  addEnum(errors, row, "sourceKind", SourceKind);
  addEnum(errors, row, "calculationStatus", CalculationStatus);
  if (row?.blockedReason != null) addEnum(errors, row, "blockedReason", BlockedReason);

  if (row?.calculationStatus === CalculationStatus.CALCULATION_READY) {
    if (!calculationEligibleOrigins.has(row.sourceOrigin)) {
      errors.push(`sourceOrigin cannot be calculation_ready: ${row.sourceOrigin}`);
    }
    if (row.sourceOrigin === SourceOrigin.CURATED_SOURCE && !row.sourceText && !row.sourceUrl) {
      errors.push("curated_source calculation row requires sourceText or sourceUrl");
    }
    if (manualBlockedOrigins.has(row.sourceOrigin)) {
      errors.push(`manual/reference source must be blocked: ${row.sourceOrigin}`);
    }
  }

  if (manualBlockedOrigins.has(row?.sourceOrigin)) {
    if (row.calculationStatus !== CalculationStatus.BLOCKED && row.calculationStatus !== CalculationStatus.REFERENCE_ONLY) {
      errors.push(`manual/reference source must not be ${row.calculationStatus}`);
    }
    if (!row.blockedReason) {
      errors.push("manual/reference source requires blockedReason");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidSourceRow(row) {
  const result = validateSourceRow(row);
  if (!result.ok) {
    throw new Error(`Invalid SourceRow ${row?.id ?? "(unknown)"}: ${result.errors.join("; ")}`);
  }
  return row;
}


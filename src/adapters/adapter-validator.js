import {
  AttackType,
  CalculationStatus,
  SourceKind,
  TargetProfile,
  ValueMode,
} from "../data-model/schemas/index.js";
import { validateSourceRow } from "../data-model/schema-validator.js";

function enumValues(enumObject) {
  return new Set(Object.values(enumObject));
}

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function validateArray(errors, output, field) {
  if (!Array.isArray(output?.[field])) {
    errors.push(`output.${field} must be an array`);
  }
}

function validateReport(errors, result) {
  const report = result?.report;
  if (!isPlainObject(report)) {
    errors.push("report must be an object");
    return;
  }
  if (!isPlainObject(report.counts)) errors.push("report.counts must be an object");
  for (const field of ["warnings", "errors"]) {
    if (!Array.isArray(report[field])) errors.push(`report.${field} must be an array`);
  }
}

function validateEffectRow(row) {
  const errors = [];
  for (const field of ["id", "sourceId", "sourceOrigin", "effectType", "stat", "valueMode", "calculationStatus"]) {
    if (row?.[field] == null || row[field] === "") errors.push(`EffectRow missing ${field}`);
  }
  if (row?.valueMode != null && !enumValues(ValueMode).has(row.valueMode)) errors.push(`EffectRow invalid valueMode: ${row.valueMode}`);
  if (row?.calculationStatus != null && !enumValues(CalculationStatus).has(row.calculationStatus)) {
    errors.push(`EffectRow invalid calculationStatus: ${row.calculationStatus}`);
  }
  return errors;
}

function validateCoefficientRow(row) {
  const errors = [];
  for (const field of ["id", "sourceId", "characterId", "skillId", "attackType", "targetProfile", "scalingStat", "calculationStatus"]) {
    if (row?.[field] == null || row[field] === "") errors.push(`CoefficientRow missing ${field}`);
  }
  if (row?.attackType != null && !enumValues(AttackType).has(row.attackType)) errors.push(`CoefficientRow invalid attackType: ${row.attackType}`);
  if (row?.targetProfile != null && !enumValues(TargetProfile).has(row.targetProfile)) {
    errors.push(`CoefficientRow invalid targetProfile: ${row.targetProfile}`);
  }
  if (row?.calculationStatus != null && !enumValues(CalculationStatus).has(row.calculationStatus)) {
    errors.push(`CoefficientRow invalid calculationStatus: ${row.calculationStatus}`);
  }
  return errors;
}

export function validateAdapterResult(result) {
  const errors = [];
  if (!result?.adapterId) errors.push("adapterId is required");
  if (!result?.sourceKind) errors.push("sourceKind is required");
  if (result?.sourceKind != null && !enumValues(SourceKind).has(result.sourceKind)) {
    errors.push(`invalid sourceKind: ${result.sourceKind}`);
  }

  const output = result?.output;
  if (!isPlainObject(output)) {
    errors.push("output must be an object");
  } else {
    validateArray(errors, output, "sourceRows");
    validateArray(errors, output, "effectRows");
    validateArray(errors, output, "coefficientRows");
    validateArray(errors, output, "blockedRows");

    for (const row of output.sourceRows ?? []) {
      const validation = validateSourceRow(row);
      if (!validation.ok) errors.push(...validation.errors.map((error) => `SourceRow ${row?.id ?? "(unknown)"}: ${error}`));
    }
    for (const row of output.effectRows ?? []) {
      errors.push(...validateEffectRow(row));
    }
    for (const row of output.coefficientRows ?? []) {
      errors.push(...validateCoefficientRow(row));
    }
  }

  validateReport(errors, result);
  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidAdapterResult(result) {
  const validation = validateAdapterResult(result);
  if (!validation.ok) {
    throw new Error(`Invalid adapter result ${result?.adapterId ?? "(unknown)"}: ${validation.errors.join("; ")}`);
  }
  return result;
}


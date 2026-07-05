function normalizeKeyPart(value) {
  if (value == null || value === "") return "none";
  return String(value).trim().toLowerCase().replaceAll(/\s+/g, "_").replaceAll(/[^a-z0-9_.:-]/g, "_");
}

export function createCanonicalEffectKeyParts(resolvedEffect, context = {}) {
  const normalizedEffect = context.normalizedEffect ?? {};
  const sourceRow = context.sourceRow ?? {};
  const valueTrace = resolvedEffect?.valueTrace ?? {};

  return {
    providerId: normalizedEffect.effectProviderId ?? context.providerId ?? "unknown_provider",
    sourceType: normalizedEffect.sourceOrigin ?? sourceRow.sourceOrigin ?? context.sourceType ?? "unknown_source_type",
    sourceId: resolvedEffect?.sourceId ?? normalizedEffect.sourceId ?? "unknown_source",
    sourcePath: sourceRow.sourcePath ?? context.sourcePath ?? "unknown_source_path",
    effectType: normalizedEffect.effectType ?? context.effectType ?? "unknown_effect_type",
    targetScope: normalizedEffect.targetScope ?? context.targetScope ?? "unknown_target_scope",
    attackType: normalizedEffect.attackType ?? context.attackType ?? "unknown_attack_type",
    conditionKey: normalizedEffect.condition?.conditionKey ?? context.conditionKey ?? "none",
    stackGroup: normalizedEffect.stackRule?.stackKey ?? context.stackGroup ?? "none",
    scalingSourcePath: valueTrace.scalingSourcePath ?? valueTrace.sourcePath ?? context.scalingSourcePath ?? "none",
  };
}

export function createCanonicalEffectKey(resolvedEffect, context = {}) {
  const parts = createCanonicalEffectKeyParts(resolvedEffect, context);
  return [
    "effect",
    parts.providerId,
    parts.sourceType,
    parts.sourceId,
    parts.sourcePath,
    parts.effectType,
    parts.targetScope,
    parts.attackType,
    parts.conditionKey,
    parts.stackGroup,
    parts.scalingSourcePath,
  ].map(normalizeKeyPart).join("|");
}

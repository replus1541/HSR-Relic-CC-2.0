import { CalculationStatus, SourceOrigin } from "../data-model/schemas/index.js";
import { createCanonicalEffectKey } from "./canonical-effect-key.js";

const sourceOriginRank = Object.freeze({
  [SourceOrigin.RAW_SOURCE]: 100,
  [SourceOrigin.CURATED_SOURCE]: 90,
  [SourceOrigin.EXTERNAL_IMPORT]: 40,
  [SourceOrigin.AUDIT_REFERENCE]: 20,
  [SourceOrigin.MANUAL_HINT]: 0,
  [SourceOrigin.MANUAL_GUIDE]: 0,
  [SourceOrigin.FALLBACK]: 0,
});

function mapBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows ?? []) {
    const key = keyFn(row);
    if (key) map.set(key, row);
  }
  return map;
}

function compareWinner(left, right) {
  const leftReady = left.calculationStatus === CalculationStatus.CALCULATION_READY ? 1 : 0;
  const rightReady = right.calculationStatus === CalculationStatus.CALCULATION_READY ? 1 : 0;
  if (leftReady !== rightReady) return rightReady - leftReady;

  const leftRank = sourceOriginRank[left.normalizedEffect?.sourceOrigin] ?? 0;
  const rightRank = sourceOriginRank[right.normalizedEffect?.sourceOrigin] ?? 0;
  if (leftRank !== rightRank) return rightRank - leftRank;

  return left.resolvedEffect.id.localeCompare(right.resolvedEffect.id);
}

function createDedupeItem(resolvedEffect, contextMaps) {
  const normalizedEffect = contextMaps.normalizedByEffectRowId.get(resolvedEffect.effectRowId);
  const sourceRow = contextMaps.sourceById.get(resolvedEffect.sourceId);
  const canonicalEffectKey = createCanonicalEffectKey(resolvedEffect, { normalizedEffect, sourceRow });
  return { resolvedEffect, normalizedEffect, sourceRow, canonicalEffectKey };
}

export function dedupeEffects(resolvedEffects = [], context = {}) {
  const contextMaps = {
    normalizedByEffectRowId: mapBy(context.normalizedEffects, (row) => row.effectRowId),
    sourceById: mapBy(context.sourceRows, (row) => row.id),
  };
  const items = resolvedEffects.map((row) => createDedupeItem(row, contextMaps));
  const groups = new Map();

  for (const item of items) {
    const group = groups.get(item.canonicalEffectKey) ?? [];
    group.push(item);
    groups.set(item.canonicalEffectKey, group);
  }

  const winnerByKey = new Map();
  for (const [key, group] of groups.entries()) {
    const readyGroup = group.filter((item) => item.resolvedEffect.calculationStatus === CalculationStatus.CALCULATION_READY);
    if (!readyGroup.length) continue;
    winnerByKey.set(key, [...readyGroup].sort(compareWinner)[0].resolvedEffect.id);
  }

  return items.map((item) => {
    const group = groups.get(item.canonicalEffectKey) ?? [item];
    const winnerId = winnerByKey.get(item.canonicalEffectKey);
    const isReady = item.resolvedEffect.calculationStatus === CalculationStatus.CALCULATION_READY;
    const isWinner = isReady && item.resolvedEffect.id === winnerId;
    const role = !isReady ? "blocked" : isWinner ? "winner" : "loser";

    return {
      ...item.resolvedEffect,
      canonicalEffectKey: item.canonicalEffectKey,
      dedupeResult: {
        role,
        groupSize: group.length,
        winnerId: winnerId ?? null,
        reason: role === "winner" ? "selected_by_source_priority" : role === "loser" ? "duplicate_key_lower_priority" : item.resolvedEffect.blockedReason ?? "blocked_before_dedupe",
      },
    };
  });
}

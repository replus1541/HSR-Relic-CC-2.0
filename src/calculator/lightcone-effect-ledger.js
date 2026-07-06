export function buildLightConeEffectRows({
  party = [],
  lightCones = [],
  characterGetter = null,
} = {}) {
  const rows = [];
  const seen = new Set();

  for (const slot of party ?? []) {
    const characterId = slot?.characterId;
    if (!characterId) continue;
    const lightCone = findEquippedLightCone(slot, lightCones);
    if (!lightCone?.effects?.length) continue;
    const rank = clampRank(slot?.lightconeRank ?? slot?.lightConeRank ?? 1);
    const owner = characterGetter?.(characterId) ?? null;
    const ownerLabel = owner?.displayName ?? owner?.localizedName ?? owner?.officialName ?? characterId;

    lightCone.effects.forEach((effect, index) => {
      if (!shouldBuildLedgerEffect(effect)) return;
      const resolvedValue = resolveRankedEffectValue(effect, rank);
      if (!Number.isFinite(resolvedValue) || resolvedValue === 0) return;
      const targetPolicy = normalizeTargetPolicy(effect.target);
      const dedupeKey = [
        characterId,
        lightCone.id,
        effect.scope,
        targetPolicy,
        effect.stat,
        resolvedValue,
        normalizeSourceText(effect.sourceText),
      ].join("|");
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      const effectRowId = `effect:${characterId}:lightcone:${lightCone.id}:${effect.stat}:${index}`;
      rows.push({
        ledgerId: `ledger:lightcone:${characterId}:${lightCone.id}:${effect.stat}:${index}`,
        sourceId: `source:${characterId}:lightcone:${lightCone.id}`,
        sourceRowId: `source:${characterId}:lightcone:${lightCone.id}:${effect.stat}:${index}`,
        ownerId: characterId,
        subjectId: characterId,
        targetPolicy,
        targetExcludesOwner: targetPolicy === "all_allies" && isAllyOnlyForOthers(effect.sourceText),
        stat: effect.stat,
        resolvedValue,
        valueMode: effect.valueMode ?? "lightcone_superimposition_scaled",
        blockedReason: null,
        skippedReason: null,
        usedForCalculation: true,
        category: "lightcone",
        calculationStatus: "calculation_ready",
        effectType: "lightcone",
        sourceLabel: ownerLabel,
        sourceName: lightCone.name,
        metadata: {
          effectRowId,
          ownerId: characterId,
          sourceLabel: ownerLabel,
          sourceDisplayLabel: `광추 · ${lightCone.name}`,
          sourceCategory: "lightcone",
          sourceTitle: lightCone.name,
          effectType: "lightcone",
          targetPolicy,
          stat: effect.stat,
        },
        sourceTrace: {
          sourceId: `source:${characterId}:lightcone:${lightCone.id}`,
          sourceRowId: `source:${characterId}:lightcone:${lightCone.id}:${effect.stat}:${index}`,
          effectRowId,
          lightConeId: lightCone.id,
          lightConeRank: rank,
          sourceText: effect.sourceText ?? lightCone.skillText ?? "",
        },
      });
    });
  }

  return rows;
}

function findEquippedLightCone(slot, lightCones = []) {
  const id = slot?.lightconeId ?? slot?.lightConeId ?? null;
  const name = slot?.lightconeName ?? slot?.lightConeName ?? null;
  return lightCones.find((lightCone) => lightCone.id === id)
    ?? lightCones.find((lightCone) => lightCone.name === name)
    ?? null;
}

function shouldBuildLedgerEffect(effect) {
  if (!effect?.stat || effect.scope !== "team") return false;
  const status = String(effect.calculationStatus ?? "").replace(/-/g, "_");
  return status === "calculation_ready";
}

function resolveRankedEffectValue(effect, rank) {
  const rankIndex = clampRank(rank) - 1;
  const values = Array.isArray(effect.rankValues) ? effect.rankValues : effect.values;
  if (Array.isArray(values)) return Number(values[rankIndex] ?? values[0] ?? 0);
  return Number(effect.resolvedValue ?? effect.baseValue ?? 0);
}

function normalizeTargetPolicy(target) {
  const text = String(target ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  if (text === "all_allies" || text === "allallies") return "all_allies";
  if (text === "single_ally" || text === "singleally") return "single_ally";
  if (text === "enemy" || text === "enemy_all" || text === "enemyall") return "enemy_all";
  if (text === "enemy_single" || text === "enemysingle") return "enemy_single";
  return text || "unknown";
}

function isAllyOnlyForOthers(sourceText) {
  return /장착한 캐릭터 동료|착용한 캐릭터 동료/.test(String(sourceText ?? ""));
}

function normalizeSourceText(sourceText) {
  return String(sourceText ?? "").replace(/\s+/g, " ").trim();
}

function clampRank(rank) {
  const number = Number(rank);
  if (!Number.isFinite(number)) return 1;
  return Math.min(Math.max(Math.trunc(number), 1), 5);
}

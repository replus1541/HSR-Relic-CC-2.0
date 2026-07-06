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
    const effects = getLightConeEffects(lightCone);
    if (!effects.length) continue;
    const rank = clampRank(slot?.lightconeRank ?? slot?.lightConeRank ?? 1);
    const owner = characterGetter?.(characterId) ?? null;
    const ownerLabel = owner?.displayName ?? owner?.localizedName ?? owner?.officialName ?? characterId;

    effects.forEach((effect, index) => {
      if (!shouldBuildLedgerEffect(effect)) return;
      const resolvedValue = resolveRankedEffectValue(effect, rank);
      if (!Number.isFinite(resolvedValue) || resolvedValue === 0) return;
      const targetPolicy = normalizeTargetPolicy(effect.target);
      if (isSelfStatAlreadyCoveredByEquipment(lightCone, effect, targetPolicy, rank, resolvedValue)) return;
      const dedupeKey = [
        characterId,
        lightCone.id,
        effect.scope,
        targetPolicy,
        effect.stat,
        resolvedValue,
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

const supplementalLightConeEffectsById = new Map([
  ["wiki-2500", [
    {
      scope: "self",
      target: "self",
      stat: "atkRatio",
      label: "카덴차 공격력 증가",
      rankValues: [0.48, 0.6, 0.72, 0.84, 0.96],
      valueMode: "lightcone_superimposition_scaled",
      calculationStatus: "calculation-ready",
      sourceText: "[카덴차]는 장착한 캐릭터의 공격력을 48%/60%/72%/84%/96% 증가시킨다",
    },
  ]],
  ["wiki-3949", [
    {
      scope: "team",
      target: "all_allies",
      stat: "speedRatio",
      label: "공격자 속도 증가",
      rankValues: [0.1, 0.125, 0.15, 0.175, 0.2],
      valueMode: "lightcone_superimposition_scaled",
      calculationStatus: "calculation-ready",
      sourceText: "아군의 공격을 받을 시 공격자의 속도가 10%/12.5%/15%/17.5%/20% 증가한다",
    },
  ]],
  ["wiki-806", [
    {
      scope: "team",
      target: "all_allies",
      stat: "speed",
      label: "모든 아군 속도 증가",
      rankValues: [12, 14, 16, 18, 20],
      valueMode: "lightcone_superimposition_scaled",
      calculationStatus: "calculation-ready",
      sourceText: "필살기 발동 후 모든 아군의 속도가 12/14/16/18/20pt 증가한다",
    },
  ]],
  ["wiki-605", [
    {
      scope: "team",
      target: "all_allies",
      stat: "speed",
      label: "모든 아군 속도 증가",
      rankValues: [12, 14, 16, 18, 20],
      valueMode: "lightcone_superimposition_scaled",
      calculationStatus: "calculation-ready",
      sourceText: "전투 진입 시 모든 아군의 속도가 12/14/16/18/20 증가한다",
    },
  ]],
]);

function getLightConeEffects(lightCone) {
  return [
    ...(lightCone?.effects ?? []),
    ...(supplementalLightConeEffectsById.get(lightCone?.id) ?? []),
  ];
}

function findEquippedLightCone(slot, lightCones = []) {
  const id = slot?.lightconeId ?? slot?.lightConeId ?? null;
  const name = slot?.lightconeName ?? slot?.lightConeName ?? null;
  return lightCones.find((lightCone) => lightCone.id === id)
    ?? lightCones.find((lightCone) => lightCone.name === name)
    ?? null;
}

function shouldBuildLedgerEffect(effect) {
  if (!effect?.stat || !["self", "team"].includes(effect.scope)) return false;
  const status = String(effect.calculationStatus ?? "").replace(/-/g, "_");
  return status === "calculation_ready";
}

function resolveRankedEffectValue(effect, rank) {
  const rankIndex = clampRank(rank) - 1;
  const values = Array.isArray(effect.rankValues) ? effect.rankValues : effect.values;
  if (Array.isArray(values)) return Number(values[rankIndex] ?? values[0] ?? 0);
  return Number(effect.resolvedValue ?? effect.baseValue ?? 0);
}

function isSelfStatAlreadyCoveredByEquipment(lightCone, effect, targetPolicy, rank, resolvedValue) {
  if (effect?.scope !== "self" || targetPolicy !== "self" || !effect?.stat) return false;
  const equipmentBonus = resolveRankedBonusValue(lightCone?.bonusRanks, effect.stat, rank);
  const fallbackBonus = Number(lightCone?.bonus?.[effect.stat] ?? 0);
  const coveredValue = Number.isFinite(equipmentBonus) ? equipmentBonus : fallbackBonus;
  return Number.isFinite(coveredValue)
    && coveredValue !== 0
    && Math.abs(coveredValue - Number(resolvedValue ?? 0)) < 1e-9;
}

function resolveRankedBonusValue(bonusRanks = {}, stat, rank) {
  const values = bonusRanks?.[stat];
  if (!Array.isArray(values)) return Number.NaN;
  const rankIndex = clampRank(rank) - 1;
  return Number(values[rankIndex] ?? values[0] ?? 0);
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

function clampRank(rank) {
  const number = Number(rank);
  if (!Number.isFinite(number)) return 1;
  return Math.min(Math.max(Math.trunc(number), 1), 5);
}

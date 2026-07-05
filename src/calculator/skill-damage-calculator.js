const attackTypeDamageKeys = {
  basic: "basicDamage",
  skill: "skillDamage",
  ultimate: "ultimateDamage",
  follow_up: "followDamage",
  dot: "dotDamage",
};

const breakBaseDamageLevel80 = 3767.5533;
const elationLevelMultiplierLevel80 = 7535.107;
const elementBreakMultipliers = {
  physical: 2,
  fire: 2,
  wind: 1.5,
  lightning: 1,
  ice: 1,
  quantum: 0.5,
  imaginary: 0.5,
};

export function calculateSkillDamageCards({
  battleResult,
  skillRows = [],
  enemy = {},
  scenarioSettings = {},
} = {}) {
  const characterId = battleResult?.activeCharacter?.characterId;
  if (!characterId) return [];
  return skillRows
    .filter((row) => row.characterId === characterId)
    .map((row) => calculateSkillDamageCard(row, battleResult, enemy, scenarioSettings))
    .filter(Boolean)
    .sort((a, b) => attackTypeOrder(a.attackType) - attackTypeOrder(b.attackType) || b.critDamage - a.critDamage);
}

function calculateSkillDamageCard(row, battleResult, enemy, scenarioSettings = {}) {
  const eidolon = Number(battleResult?.activeSlot?.eidolon ?? 0);
  const effectiveLevel = resolveEffectiveLevel(row, eidolon);
  const coefficient = resolveCoefficient(row, effectiveLevel);
  if (!Number.isFinite(coefficient) || coefficient <= 0) return null;

  const finalStats = battleResult?.finalStats ?? {};
  const damageModifiers = battleResult?.damageModifiers ?? {};
  const enemyDebuffs = battleResult?.enemyDebuffs ?? {};
  const damageFormulaType = row.damageFormulaType ?? "normal";
  const scalingStat = row.scalingStat ?? "atk";
  const scalingValue = valueOf(finalStats[scalingStat]);
  const scopeMultiplier = resolveScopeMultiplier(row, enemy);
  const baseDamage = scalingValue * coefficient * scopeMultiplier;
  const damageBoost = calculateDamageBoost({ finalStats, damageModifiers, row, damageFormulaType });
  const vulnerability = valueOf(enemyDebuffs.vulnerability) + valueOf(damageModifiers.vulnerability);
  const defenseIgnore = clamp(valueOf(enemyDebuffs.defenseDown) + valueOf(damageModifiers.defenseIgnore), 0, 0.95);
  const resistancePen = valueOf(damageModifiers.resistancePen);
  const specialFinal = valueOf(damageModifiers.specialFinal);
  const trueDamageRatio = valueOf(damageModifiers.trueDamageRatio);
  const defenseMultiplier = calculateDefenseMultiplier(enemy.level, defenseIgnore);
  const resistanceMultiplier = calculateResistanceMultiplier(enemy.resistance, resistancePen);
  const brokenMultiplier = calculateBrokenMultiplier(enemy);
  const elationModifiers = calculateElationModifiers({ finalStats, damageModifiers, scenarioSettings });
  const nonCritDamage = calculateNonCritDamage({
    baseDamage,
    coefficient,
    damageFormulaType,
    damageBoost,
    vulnerability,
    specialFinal,
    defenseMultiplier,
    resistanceMultiplier,
    brokenMultiplier,
    finalStats,
    damageModifiers,
    enemy,
    row,
    elationModifiers,
    scenarioSettings,
  });
  const critDamageStat = valueOf(finalStats.critDamage) + valueOf(damageModifiers.dealtCritDamage) + valueOf(row.attackType === "follow_up" ? damageModifiers.followCritDamage : 0);
  const critRate = clamp(valueOf(finalStats.critRate), 0, 1);
  const usesCrit = damageFormulaUsesCrit(damageFormulaType);
  const directCritDamage = usesCrit ? nonCritDamage * (1 + critDamageStat) : nonCritDamage;
  const directExpectedDamage = usesCrit ? nonCritDamage * (1 + critRate * critDamageStat) : nonCritDamage;
  const recordedTrueDamage = calculateRecordedTrueDamage({ row, scenarioSettings });
  const trueCritDamage = directCritDamage * trueDamageRatio + recordedTrueDamage;
  const trueExpectedDamage = directExpectedDamage * trueDamageRatio + recordedTrueDamage;
  const critDamage = directCritDamage + trueCritDamage;
  const expectedDamage = directExpectedDamage + trueExpectedDamage;

  return {
    id: row.id,
    characterId: row.characterId,
    skillId: row.skillId,
    title: row.title,
    attackType: row.attackType,
    damageFormulaType,
    skillLevelType: row.skillLevelType,
    targetProfile: row.targetProfile,
    targetScope: row.targetScope,
    scalingStat,
    scalingValue,
    effectiveLevel,
    coefficient,
    coefficientPercent: coefficient * 100,
    partCount: row.parts?.length ?? 0,
    scopeMultiplier,
    baseDamage,
    nonCritDamage,
    directCritDamage,
    trueDamage: trueCritDamage,
    critDamage,
    expectedDamage,
    trace: {
      baseLevel: row.baseLevel,
      eidolon,
      eidolonLevelBonus: Math.max(0, effectiveLevel - Number(row.baseLevel ?? effectiveLevel)),
      appliedEffectRows: battleResult?.sourceTrace?.appliedRows ?? 0,
      enemyLevel: Number(enemy.level ?? 95),
      enemyResistance: Number(enemy.resistance ?? 20),
      damageBoost,
      vulnerability,
      defenseIgnore,
      resistancePen,
      trueDamageRatio,
      recordedTrueDamage,
      elationModifiers,
      defenseMultiplier,
      resistanceMultiplier,
      brokenMultiplier,
      usesCrit,
      selectedParts: row.partPolicy,
    },
  };
}

function calculateDamageBoost({ finalStats, damageModifiers, row, damageFormulaType }) {
  if (damageFormulaType === "break" || damageFormulaType === "super_break" || damageFormulaType === "elation") return 0;
  return valueOf(finalStats.allDamage)
    + valueOf(finalStats.elementDamage)
    + valueOf(finalStats[attackTypeDamageKeys[row.attackType]])
    + valueOf(damageModifiers.allDamage)
    + valueOf(damageModifiers[attackTypeDamageKeys[row.attackType]])
    + valueOf(row.attackType === "follow_up" ? damageModifiers.followDamage : 0);
}

function calculateNonCritDamage({
  baseDamage,
  coefficient,
  damageFormulaType,
  damageBoost,
  vulnerability,
  specialFinal,
  defenseMultiplier,
  resistanceMultiplier,
  brokenMultiplier,
  finalStats,
  damageModifiers,
  enemy,
  row,
  elationModifiers,
  scenarioSettings,
}) {
  if (damageFormulaType === "break") {
    const toughnessMultiplier = calculateBreakToughnessMultiplier(enemy.toughness);
    const elementMultiplier = elementBreakMultipliers[row.element] ?? 1;
    return breakBaseDamageLevel80
      * elementMultiplier
      * toughnessMultiplier
      * (1 + valueOf(finalStats.breakEffect))
      * (1 + valueOf(finalStats.breakDamage) + valueOf(damageModifiers.breakDamage))
      * (1 + vulnerability)
      * (1 + specialFinal)
      * defenseMultiplier
      * resistanceMultiplier
      * brokenMultiplier;
  }
  if (damageFormulaType === "super_break") {
    const toughnessDamage = Math.max(1, Number(enemy.toughness ?? 90) / 30);
    const conversionMultiplier = Math.max(0, valueOf(scenarioSettings?.superBreakToughnessMultiplier, 1));
    return breakBaseDamageLevel80
      * toughnessDamage
      * conversionMultiplier
      * coefficient
      * (1 + valueOf(finalStats.breakEffect))
      * (1 + valueOf(finalStats.breakDamage) + valueOf(damageModifiers.breakDamage))
      * (1 + vulnerability)
      * (1 + specialFinal)
      * defenseMultiplier
      * resistanceMultiplier
      * brokenMultiplier;
  }
  if (damageFormulaType === "elation") {
    return elationLevelMultiplierLevel80
      * coefficient
      * resolveScopeMultiplier(row, enemy)
      * (1 + valueOf(elationModifiers?.elation))
      * valueOf(elationModifiers?.punchlineMultiplier, 1)
      * (1 + valueOf(elationModifiers?.merrymake))
      * (1 + vulnerability)
      * (1 + specialFinal)
      * defenseMultiplier
      * resistanceMultiplier
      * brokenMultiplier;
  }
  return baseDamage
    * (1 + damageBoost)
    * (1 + vulnerability)
    * (1 + specialFinal)
    * defenseMultiplier
    * resistanceMultiplier
    * brokenMultiplier;
}

function calculateElationModifiers({ finalStats = {}, damageModifiers = {}, scenarioSettings = {} } = {}) {
  const certifiedBanger = Math.max(0, valueOf(scenarioSettings.elationCertifiedBangerStacks));
  const punchline = Math.max(0, valueOf(scenarioSettings.elationPunchlineStacks ?? certifiedBanger));
  const effectivePunchline = certifiedBanger > 0 ? certifiedBanger : punchline;
  return {
    certifiedBanger,
    punchline,
    effectivePunchline,
    punchlineMultiplier: 1 + (effectivePunchline * 5) / Math.max(1, effectivePunchline + 240),
    merrymake: valueOf(scenarioSettings.elationMerrymake) + valueOf(finalStats.merrymake) + valueOf(damageModifiers.merrymake),
    elation: valueOf(finalStats.elation) + valueOf(damageModifiers.elation),
  };
}

function calculateRecordedTrueDamage({ row, scenarioSettings = {} } = {}) {
  if (row?.characterId === "Cipher_00" && row?.attackType === "ultimate") {
    return Math.max(0, valueOf(scenarioSettings.cipherRecordedDamage));
  }
  return 0;
}

function damageFormulaUsesCrit(damageFormulaType) {
  return damageFormulaType === "normal" || damageFormulaType === "elation";
}

function resolveEffectiveLevel(row, eidolon) {
  const baseLevel = Number(row.baseLevel ?? 10);
  const bonus = (row.eidolonLevelBonuses ?? [])
    .filter((item) => eidolon >= Number(item.minEidolon ?? 99))
    .reduce((sum, item) => sum + Number(item.levelBonus ?? 0), 0);
  const maxLevel = Number(row.maxLevel ?? baseLevel);
  return clamp(Math.round(baseLevel + bonus), 1, Math.max(1, maxLevel));
}

function resolveCoefficient(row, level) {
  const index = Math.max(0, Number(level) - 1);
  return (row.parts ?? []).reduce((sum, part) => {
    const values = part.coefficientValues ?? [];
    const value = values[Math.min(index, values.length - 1)];
    return sum + valueOf(value);
  }, 0);
}

function calculateDefenseMultiplier(enemyLevel = 95, defenseIgnore = 0) {
  const attackerLevel = 80;
  const enemy = Number(enemyLevel ?? 95);
  const attackerTerm = attackerLevel + 20;
  const enemyTerm = (enemy + 20) * (1 - clamp(defenseIgnore, 0, 0.95));
  return attackerTerm / (attackerTerm + enemyTerm);
}

function calculateResistanceMultiplier(enemyResistance = 20, resistancePen = 0) {
  const resistance = valueOf(enemyResistance) / 100;
  return clamp(1 - resistance + valueOf(resistancePen), 0.1, 2);
}

function calculateBreakToughnessMultiplier(enemyToughness = 90) {
  return 0.5 + Math.max(0, Number(enemyToughness ?? 90)) / 120;
}

function calculateBrokenMultiplier(enemy = {}) {
  return enemy?.isBroken === false ? 0.9 : 1;
}

function resolveScopeMultiplier(row, enemy) {
  const enemyCount = clamp(Math.round(Number(enemy?.count ?? 1)), 1, 5);
  const target = String(row.targetScope ?? row.targetProfile ?? "").toLowerCase();
  const partCount = row.parts?.length ?? 0;
  if (target.includes("aoe") || target.includes("all")) return enemyCount;
  if (target.includes("blast") && partCount <= 1) return Math.min(enemyCount, 3);
  return 1;
}

function attackTypeOrder(attackType) {
  return {
    basic: 1,
    skill: 2,
    ultimate: 3,
    follow_up: 4,
    dot: 5,
  }[attackType] ?? 9;
}

function valueOf(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

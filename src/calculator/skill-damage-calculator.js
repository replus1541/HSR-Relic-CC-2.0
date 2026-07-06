const attackTypeDamageKeys = {
  basic: "basicDamage",
  skill: "skillDamage",
  ultimate: "ultimateDamage",
  elation_skill: null,
  follow_up: "followDamage",
  memosprite: null,
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

const theHertaEnhancedSkillMainStackBonus = 0.04;
const theHertaEnhancedSkillAdjacentStackBonus = 0.02;
const theHertaEruditionPartyStackBonusMultiplier = 2;
const theHertaEnhancedSkillThresholdStack = 42;
const theHertaEnhancedSkillThresholdDamageBoost = 0.5;

const skillTargetDistributionOverrides = {
  "SilverWolf999_00:Skill11": { mode: "total_shared", reason: "100-hit bounce total plus final hit shared by all enemies" },
  "SilverWolf999_00:Skill03": { mode: "total_shared", reason: "supply box damage is shared by all enemies" },
  "Phainon_00:Skill03": { mode: "total_shared", reason: "last strike damage is shared by all enemies" },
  "Phainon_00:Skill02": {
    mode: "part_roles",
    reason: "mixed blast, all-enemy counter, bounce total, and shared finisher components",
    roles: ["center", "adjacent", "aoe_each", "bounce_total", "bounce_total", "bounce_total", "shared_total"],
  },
};

export function calculateSkillDamageCards({
  battleResult,
  skillRows = [],
  enemy = {},
  scenarioSettings = {},
} = {}) {
  const characterId = battleResult?.activeCharacter?.characterId;
  if (!characterId) return [];
  return annotateBasicAttackVariants(skillRows
    .filter((row) => row.characterId === characterId)
    .map((row) => calculateSkillDamageCard(row, battleResult, enemy, scenarioSettings))
    .filter(Boolean))
    .sort((a, b) => attackTypeOrder(getDisplayAttackType(a)) - attackTypeOrder(getDisplayAttackType(b)) || b.critDamage - a.critDamage);
}

function calculateSkillDamageCard(row, battleResult, enemy, scenarioSettings = {}) {
  const eidolon = Number(battleResult?.activeSlot?.eidolon ?? 0);
  const effectiveLevel = resolveEffectiveLevel(row, eidolon);
  const attackType = resolveEffectiveAttackType(row);
  const displayAttackType = resolveDisplayAttackType(row, attackType);
  const targetProfile = resolveSkillTargetProfile(row);
  const distribution = resolveSkillTargetDistribution(row);
  const targetMultiplier = resolveSkillTargetMultiplier(row, enemy, targetProfile, distribution);
  const coefficient = resolveCoefficient(row, effectiveLevel, enemy, targetProfile, distribution, scenarioSettings);
  if (!Number.isFinite(coefficient) || coefficient <= 0) return null;

  const finalStats = battleResult?.finalStats ?? {};
  const damageModifiers = battleResult?.damageModifiers ?? {};
  const enemyDebuffs = resolveScopedEnemyDebuffs({ battleResult, row, enemy, targetProfile });
  const damageFormulaType = row.damageFormulaType ?? "normal";
  const scalingStat = row.scalingStat ?? "atk";
  const scalingValue = valueOf(finalStats[scalingStat]);
  const baseDamage = scalingValue * coefficient;
  const damageBoost = calculateDamageBoost({ finalStats, damageModifiers, row: { ...row, attackType }, damageFormulaType });
  const vulnerability = valueOf(enemyDebuffs.vulnerability) + valueOf(damageModifiers.vulnerability);
  const defenseIgnore = clamp(valueOf(enemyDebuffs.defenseDown) + valueOf(damageModifiers.defenseIgnore), 0, 0.95);
  const resistancePen = valueOf(damageModifiers.resistancePen);
  const specialFinal = valueOf(damageModifiers.specialFinal);
  const trueDamageRatio = valueOf(damageModifiers.trueDamageRatio);
  const defenseMultiplier = calculateDefenseMultiplier(enemy.level, defenseIgnore);
  const resistanceMultiplier = calculateResistanceMultiplier(enemy.resistance, resistancePen);
  const brokenMultiplier = calculateBrokenMultiplier(enemy);
  const elationModifiers = calculateElationModifiers({ finalStats, damageModifiers, scenarioSettings, row });
  const conditionalNonCritDamage = calculateConditionalNonCritDamage({
    row,
    effectiveLevel,
    scalingValue,
    damageBoost,
    vulnerability,
    specialFinal,
    defenseMultiplier,
    resistanceMultiplier,
    brokenMultiplier,
    enemy,
    battleResult,
    scenarioSettings,
  });
  const nonCritDamage = conditionalNonCritDamage?.nonCritDamage ?? calculateNonCritDamage({
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
    targetMultiplier,
    elationModifiers,
    scenarioSettings,
  });
  const critDamageStat = valueOf(finalStats.critDamage)
    + valueOf(damageModifiers.dealtCritDamage)
    + valueOf(enemyDebuffs.takenCritDamage)
    + valueOf(attackType === "follow_up" ? damageModifiers.followCritDamage : 0);
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
    title: resolveDisplayTitle(row),
    attackType,
    sourceAttackType: row.attackType,
    displayAttackType,
    basicAttackVariant: null,
    damageFormulaType,
    skillLevelType: row.skillLevelType,
    targetProfile,
    targetScope: resolveDisplayTargetScope(row, targetProfile),
    scalingStat,
    scalingStatLabel: row.scalingStatLabel ?? null,
    scalingValue,
    effectiveLevel,
    coefficient,
    coefficientPercent: coefficient * 100,
    partCount: row.parts?.length ?? 0,
    scopeMultiplier: targetMultiplier,
    targetMultiplier,
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
      takenCritDamage: valueOf(enemyDebuffs.takenCritDamage),
      trueDamageRatio,
      recordedTrueDamage,
      elationModifiers,
      defenseMultiplier,
      resistanceMultiplier,
      brokenMultiplier,
      usesCrit,
      selectedParts: row.partPolicy,
      sourceAttackType: row.attackType,
      targetProfile,
      targetMultiplier,
      targetDistribution: distribution.mode,
      targetDistributionReason: distribution.reason,
      conditionalDamage: conditionalNonCritDamage?.trace ?? null,
    },
  };
}

function annotateBasicAttackVariants(cards = []) {
  const basicCards = cards.filter((card) => card.attackType === "basic");
  if (basicCards.length <= 1) return cards;
  const normalCard = selectNormalBasicAttackCard(basicCards);
  return cards.map((card) => {
    if (card.attackType !== "basic") return card;
    const isNormal = card.id === normalCard?.id;
    return {
      ...card,
      displayAttackType: isNormal ? "basic" : "basic_enhanced",
      basicAttackVariant: isNormal ? "normal" : "enhanced",
    };
  });
}

function resolveEffectiveAttackType(row) {
  if (isSilverWolf999ElationSkill(row)) return "elation_skill";
  return row?.attackType ?? "unknown";
}

function resolveDisplayAttackType(row, attackType) {
  if (isSilverWolf999ElationSkill(row)) return "elation_skill";
  return attackType;
}

function resolveDisplayTitle(row) {
  if (getSkillDistributionKey(row) === "SilverWolf999_00:Skill03") return "최상급 보급상자";
  return row?.title;
}

function resolveDisplayTargetScope(row, targetProfile) {
  if (getSkillDistributionKey(row) === "SilverWolf999_00:Skill11") return "bounce";
  return row?.targetScope ?? targetProfile;
}

function isSilverWolf999ElationSkill(row) {
  const key = getSkillDistributionKey(row);
  return key === "SilverWolf999_00:Skill03" || key === "SilverWolf999_00:SkillP01";
}

function selectNormalBasicAttackCard(basicCards = []) {
  return [...basicCards].sort((a, b) => (
    Number(a.coefficient ?? 0) - Number(b.coefficient ?? 0)
    || Number(a.critDamage ?? 0) - Number(b.critDamage ?? 0)
    || basicSkillIdOrder(a.skillId) - basicSkillIdOrder(b.skillId)
    || String(a.id ?? "").localeCompare(String(b.id ?? ""), "ko")
  ))[0] ?? null;
}

function basicSkillIdOrder(skillId) {
  const suffix = String(skillId ?? "").split(":").pop() ?? "";
  if (suffix === "Skill01") return 0;
  const match = suffix.match(/^Skill(\d+)$/);
  return match ? Number(match[1]) : 99;
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
  targetMultiplier,
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
      * brokenMultiplier
      * targetMultiplier;
  }
  if (damageFormulaType === "super_break") {
    const toughnessDamage = Math.max(1, Number(enemy.toughness ?? 90) / 30);
    const conversionMultiplier = Math.max(0, valueOf(scenarioSettings?.superBreakToughnessMultiplier, 1));
    return breakBaseDamageLevel80
      * toughnessDamage
      * conversionMultiplier
      * coefficient
      * (1 + valueOf(finalStats.toughnessDamageRatio) + valueOf(damageModifiers.toughnessDamageRatio))
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
      * (1 + valueOf(elationModifiers?.elation) / 100)
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

function calculateElationModifiers({ finalStats = {}, damageModifiers = {}, scenarioSettings = {}, row = null } = {}) {
  const characterId = row?.characterId ?? null;
  const certifiedBanger = Math.max(0, valueOf(getCharacterScenarioSetting(scenarioSettings, "elationCertifiedBangerStacks", characterId)));
  const punchlineSetting = getCharacterScenarioSetting(scenarioSettings, "elationPunchlineStacks", characterId);
  const punchline = Math.max(0, valueOf(punchlineSetting ?? certifiedBanger));
  const effectivePunchline = certifiedBanger > 0 ? certifiedBanger : punchline;
  return {
    certifiedBanger,
    punchline,
    effectivePunchline,
    punchlineMultiplier: 1 + (effectivePunchline * 5) / Math.max(1, effectivePunchline + 240),
    merrymake: valueOf(finalStats.merrymake) + valueOf(damageModifiers.merrymake),
    elation: valueOf(finalStats.elation) + valueOf(damageModifiers.elation),
  };
}

function getCharacterScenarioSetting(scenarioSettings = {}, baseKey, characterId) {
  const characterKey = characterId ? `${baseKey}:${characterId}` : null;
  if (characterKey && Object.prototype.hasOwnProperty.call(scenarioSettings, characterKey)) {
    return scenarioSettings[characterKey];
  }
  return scenarioSettings[baseKey];
}

function calculateRecordedTrueDamage({ row, scenarioSettings = {} } = {}) {
  if (row?.characterId === "Cipher_00" && row?.attackType === "ultimate") {
    return Math.max(0, valueOf(scenarioSettings.cipherRecordedDamage));
  }
  return 0;
}

function calculateConditionalNonCritDamage({
  row,
  effectiveLevel,
  scalingValue,
  damageBoost,
  vulnerability,
  specialFinal,
  defenseMultiplier,
  resistanceMultiplier,
  brokenMultiplier,
  enemy,
  battleResult,
  scenarioSettings = {},
} = {}) {
  if (!isTheHertaEnhancedSkill(row)) return null;
  const index = Math.max(0, Number(effectiveLevel) - 1);
  const parts = row.parts ?? [];
  if (!parts.length) return null;

  const enemyCount = getEnemyCount(enemy);
  const blastTargetCount = Math.min(enemyCount, 3);
  const mainStacks = clampTheHertaInterpretationStacks(
    scenarioSettings.theHertaInterpretationMainStacks
      ?? scenarioSettings.theHertaInterpretationStacks
      ?? theHertaEnhancedSkillThresholdStack,
  );
  const adjacentStacks = clampTheHertaInterpretationStacks(
    scenarioSettings.theHertaInterpretationAdjacentStacks ?? 20,
  );
  const eruditionMultiplier = countPartyPath(battleResult, "erudition") >= 2
    ? theHertaEruditionPartyStackBonusMultiplier
    : 1;
  const mainStackBonus = mainStacks * theHertaEnhancedSkillMainStackBonus * eruditionMultiplier;
  const adjacentStackBonus = adjacentStacks * theHertaEnhancedSkillAdjacentStackBonus * eruditionMultiplier;
  const thresholdDamageBoost = mainStacks >= theHertaEnhancedSkillThresholdStack
    ? theHertaEnhancedSkillThresholdDamageBoost
    : 0;
  const commonMultiplier = (1 + vulnerability)
    * (1 + specialFinal)
    * defenseMultiplier
    * resistanceMultiplier
    * brokenMultiplier;
  const weightedDamage = parts.reduce((sum, part, partIndex) => {
    const role = resolveTheHertaEnhancedSkillPartRole(partIndex);
    const targetCount = role === "adjacent" ? Math.max(0, blastTargetCount - 1) : 1;
    if (targetCount <= 0) return sum;
    const stackBonus = role === "adjacent" ? adjacentStackBonus : mainStackBonus;
    const coefficient = resolvePartCoefficient(part, index);
    return sum + scalingValue
      * coefficient
      * targetCount
      * (1 + damageBoost + thresholdDamageBoost + stackBonus)
      * commonMultiplier;
  }, 0);

  return {
    nonCritDamage: weightedDamage,
    trace: {
      type: "theHertaEnhancedSkillInterpretationStacks",
      mainStacks,
      adjacentStacks: enemyCount >= 2 ? adjacentStacks : null,
      thresholdDamageBoost,
      mainStackBonus,
      adjacentStackBonus: enemyCount >= 2 ? adjacentStackBonus : null,
      eruditionPartyMultiplier: eruditionMultiplier,
    },
  };
}

function isTheHertaEnhancedSkill(row) {
  return row?.characterId === "TheHerta_00" && String(row?.skillId ?? "").endsWith(":Skill02");
}

function resolveTheHertaEnhancedSkillPartRole(partIndex) {
  return partIndex % 2 === 1 ? "adjacent" : "center";
}

function clampTheHertaInterpretationStacks(value) {
  return clamp(Math.round(valueOf(value, 0)), 0, theHertaEnhancedSkillThresholdStack);
}

function countPartyPath(battleResult = {}, path) {
  const normalizedPath = String(path ?? "").toLowerCase();
  return (battleResult.partySlots ?? [])
    .filter((slot) => String(slot?.path ?? "").toLowerCase() === normalizedPath)
    .length;
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

function resolveCoefficient(row, level, enemy = {}, targetProfile = resolveSkillTargetProfile(row), distribution = resolveSkillTargetDistribution(row), scenarioSettings = {}) {
  const index = Math.max(0, Number(level) - 1);
  const parts = row.parts ?? [];
  if (isSparxieSkillEnhancement(row)) {
    return resolveSparxieSkillEnhancementCoefficient(parts, index, enemy, row, scenarioSettings);
  }
  const rawCoefficient = parts.reduce((sum, part) => sum + resolvePartCoefficient(part, index), 0);
  const enemyCount = getEnemyCount(enemy);
  if (distribution.mode === "total_shared" || distribution.mode === "bounce_total") return rawCoefficient;
  if (distribution.mode === "part_roles") return resolvePartRoleCoefficient(parts, index, enemyCount, distribution.roles ?? []);
  if (targetProfile === "aoe") return rawCoefficient * enemyCount;
  if (targetProfile === "blast") {
    return resolveBlastCoefficient(parts, index, enemyCount);
  }
  return rawCoefficient;
}

function isSparxieSkillEnhancement(row) {
  if (row?.characterId !== "Sparxie_00") return false;
  const skillId = String(row?.skillId ?? "");
  return skillId.endsWith(":Skill02")
    || skillId.endsWith(":Skill04")
    || skillId.endsWith(":Skill41")
    || skillId.endsWith(":SkillP01");
}

function resolveSparxieSkillEnhancementCoefficient(parts = [], index, enemy = {}, row = {}, scenarioSettings = {}) {
  const stacks = clampSparxieSkillEnhancementStacks(scenarioSettings.sparxieSkillEnhancementStacks);
  if (String(row?.skillId ?? "").endsWith(":Skill02")) {
    return resolveBlastCoefficient(parts, index, getEnemyCount(enemy)) * stacks;
  }
  const enemyCount = getEnemyCount(enemy);
  const blastTargetCount = Math.min(enemyCount, 3);
  const main = resolvePartCoefficient(parts[0], index);
  const adjacent = resolvePartCoefficient(parts[1], index) * Math.max(0, blastTargetCount - 1);
  const extraRandom = resolvePartCoefficient(parts[2], index) * stacks;
  return main + adjacent + extraRandom;
}

function clampSparxieSkillEnhancementStacks(value) {
  const rounded = Math.round(valueOf(value, 4));
  return clamp(rounded, 4, 12);
}

function resolvePartCoefficient(part, index) {
  const values = part?.coefficientValues ?? [];
  return valueOf(values[Math.min(index, values.length - 1)]);
}

function resolveBlastCoefficient(parts = [], index, enemyCount) {
  const targetCount = Math.min(getEnemyCount({ count: enemyCount }), 3);
  if (targetCount <= 0) return 0;
  if (parts.length <= 1) return resolvePartCoefficient(parts[0], index) * targetCount;
  if (parts.length === 2) {
    return resolvePartCoefficient(parts[0], index)
      + resolvePartCoefficient(parts[1], index) * Math.max(0, targetCount - 1);
  }
  return parts
    .slice(0, targetCount)
    .reduce((sum, part) => sum + resolvePartCoefficient(part, index), 0);
}

function resolvePartRoleCoefficient(parts = [], index, enemyCount, roles = []) {
  const blastTargetCount = Math.min(getEnemyCount({ count: enemyCount }), 3);
  return parts.reduce((sum, part, partIndex) => {
    const value = resolvePartCoefficient(part, index);
    const role = roles[partIndex] ?? "total";
    if (role === "center") return sum + value;
    if (role === "adjacent") return sum + value * Math.max(0, blastTargetCount - 1);
    if (role === "aoe_each") return sum + value * getEnemyCount({ count: enemyCount });
    return sum + value;
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

function resolveSkillTargetProfile(row) {
  if (getSkillDistributionKey(row) === "SilverWolf999_00:Skill11") return "bounce";
  if (getSkillDistributionKey(row) === "SilverWolf999_00:SkillP01") return "bounce";
  const target = String(row.targetScope ?? row.targetProfile ?? "").toLowerCase();
  if (target.includes("aoe") || target.includes("all")) return "aoe";
  if (target.includes("blast")) return "blast";
  if (target.includes("bounce")) return "bounce";
  return "single";
}

function resolveSkillTargetDistribution(row) {
  return skillTargetDistributionOverrides[getSkillDistributionKey(row)] ?? { mode: "default", reason: null };
}

function getSkillDistributionKey(row) {
  return `${row?.characterId ?? ""}:${String(row?.skillId ?? "").split(":").pop()}`;
}

function resolveSkillTargetMultiplier(row, enemy, targetProfile = resolveSkillTargetProfile(row), distribution = resolveSkillTargetDistribution(row)) {
  const enemyCount = getEnemyCount(enemy);
  if (distribution.mode === "total_shared") return enemyCount;
  if (distribution.mode === "bounce_total") return enemyCount;
  if (distribution.mode === "part_roles") return enemyCount;
  if (targetProfile === "aoe") return enemyCount;
  if (targetProfile === "blast") return Math.min(enemyCount, 3);
  return 1;
}

function resolveScopedEnemyDebuffs({ battleResult, row, enemy, targetProfile = resolveSkillTargetProfile(row) } = {}) {
  const fallbackTotals = battleResult?.enemyDebuffs ?? {};
  const enemyDebuffRows = getEnemyDebuffRows(battleResult);
  if (!enemyDebuffRows.length) return fallbackTotals;

  const scopedTotals = {};
  const rowTotals = {};
  const skillTargetCount = Math.max(1, resolveSkillTargetMultiplier(row, enemy, targetProfile));
  for (const debuffRow of enemyDebuffRows) {
    const stat = debuffRow.stat;
    const value = Number(debuffRow.resolvedValue ?? debuffRow.value ?? 0);
    if (!stat || !Number.isFinite(value)) continue;
    const coverage = resolveEnemyDebuffCoverage(debuffRow, enemy, skillTargetCount);
    addScopedValue(scopedTotals, stat, value * coverage);
    addScopedValue(rowTotals, stat, value);
  }

  for (const [stat, value] of Object.entries(fallbackTotals)) {
    const residual = Number(value ?? 0) - Number(rowTotals[stat] ?? 0);
    if (Math.abs(residual) > 1e-9) addScopedValue(scopedTotals, stat, residual);
  }
  return scopedTotals;
}

function getEnemyDebuffRows(battleResult = {}) {
  if (Array.isArray(battleResult.enemyDebuffRows)) return battleResult.enemyDebuffRows;
  return (battleResult.appliedRows ?? []).filter((row) => normalizeEnemyTargetPolicy(row.targetPolicy).startsWith("enemy"));
}

function resolveEnemyDebuffCoverage(row, enemy, skillTargetCount) {
  const policy = normalizeEnemyTargetPolicy(row?.targetPolicy);
  if (policy === "enemy_single") return Math.min(1, 1 / Math.max(1, skillTargetCount));
  if (policy === "enemy_3" || policy === "enemy_three" || policy === "enemy_blast") {
    return Math.min(1, Math.min(getEnemyCount(enemy), 3) / Math.max(1, skillTargetCount));
  }
  return 1;
}

function normalizeEnemyTargetPolicy(policy) {
  const text = String(policy ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "").toLowerCase();
  if (text === "enemyall") return "enemy_all";
  if (text === "enemysingle") return "enemy_single";
  return text || "unknown";
}

function addScopedValue(target, stat, value) {
  target[stat] = Number(target[stat] ?? 0) + Number(value ?? 0);
}

function getEnemyCount(enemy = {}) {
  return clamp(Math.round(Number(enemy?.count ?? 1)), 1, 5);
}

function attackTypeOrder(attackType) {
  return {
    basic: 1,
    basic_enhanced: 2,
    skill: 3,
    elation_skill: 4,
    ultimate: 5,
    memosprite: 6,
    follow_up: 7,
    dot: 8,
  }[attackType] ?? 9;
}

function getDisplayAttackType(card) {
  return card?.displayAttackType ?? card?.attackType;
}

function valueOf(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

import { calculateSkillDamageCards } from "./skill-damage-calculator.js";

const primaryStatKeys = {
  atk: ["atkRatio", "atkFlat"],
  hp: ["hpRatio", "hpFlat"],
  def: ["defRatio", "defFlat"],
  breakEffect: ["breakEffect"],
  critDamage: ["critDamage"],
  effectHitRate: ["effectHitRate"],
  speed: ["speed", "speedRatio"],
};

const damageTemplateDefinitions = {
  crit: { usesCrit: true, usesDamageBonus: true },
  "crit-follow": { usesCrit: true, usesDamageBonus: true },
  "crit-summon": { usesCrit: true, usesDamageBonus: true },
  dot: { usesCrit: false, usesDamageBonus: true },
  break: { usesCrit: false, usesDamageBonus: false },
  support: { usesCrit: false, usesDamageBonus: false },
  utility: { usesCrit: false, usesDamageBonus: false },
};

const damageBonusRows = [
  { key: "basicDamageTotal", label: "일반공격 피해증가", attackStat: "basicDamage" },
  { key: "skillDamageTotal", label: "전스피증", attackStat: "skillDamage" },
  { key: "ultimateDamageTotal", label: "궁피증", attackStat: "ultimateDamage" },
  { key: "followDamageTotal", label: "추가공격 피해증가", attackStat: "followDamage" },
];

function getCritRateEvaluation(critRate) {
  const value = Number(critRate ?? 0);
  if (value > 1) return { level: "notice", message: "치명타 확률이 100%를 초과합니다.", compactMessage: "치확 100% 초과" };
  if (value < 0.95) return { level: "notice", message: "전투 기준 치명타 확률이 95% 미만입니다.", compactMessage: "치확 95% 미만" };
  return { level: "neutral" };
}

function getDefenseEvaluation(defensePen) {
  if (Number(defensePen ?? 0) > 1) return { level: "warning", message: "방깎/방무가 100%를 초과합니다.", compactMessage: "방무/깎 100% 초과" };
  return { level: "neutral" };
}

function getResistanceEvaluation(resistancePen, enemyResistance) {
  if (Number(resistancePen ?? 0) > Number(enemyResistance ?? 0) + 1) return { level: "warning", message: "적 속성 저항이 -100%를 초과합니다.", compactMessage: "속저 -100% 초과" };
  return { level: "neutral" };
}

export function buildBattleStatEvaluation({
  battleResult,
  customTypeProfile,
  enemy = {},
} = {}) {
  if (!battleResult?.activeCharacter) return { groups: [], sourceRows: [] };
  const finalStats = battleResult.finalStats ?? {};
  const templateKey = customTypeProfile?.uiTypeProfile?.damageTemplate ?? "crit";
  const template = damageTemplateDefinitions[templateKey] ?? damageTemplateDefinitions.crit;
  const primaryStat = normalizePrimaryStat(customTypeProfile?.uiTypeProfile?.primaryStat, templateKey);
  const sourceRows = buildEvaluationSourceRows(battleResult);
  const entriesByStat = groupRowsByStat(sourceRows);
  const hasRows = (stats) => stats.some((stat) => (entriesByStat.get(stat) ?? []).length);
  const row = (key, label, value, statKeys, evaluationResult = { level: "neutral" }, options = {}) => ({
    key,
    label,
    value,
    statKeys,
    valueStat: options.valueStat ?? null,
    status: evaluationResult.level ?? "neutral",
    message: evaluationResult.message ?? "",
    compactMessage: evaluationResult.compactMessage ?? "",
    entries: statKeys.flatMap((stat) => entriesByStat.get(stat) ?? []),
  });
  const primaryRows = [
    row("primary", primaryLabel(primaryStat), finalStats[primaryStat], primaryStatKeys[primaryStat] ?? [primaryStat], { level: "neutral" }, { valueStat: primaryStat }),
    row("speed", "속도", finalStats.speed, ["speed", "speedRatio"]),
  ];
  const showCritRows = template.usesCrit || hasRows(["critRate", "critDamage", "dealtCritDamage", "followCritDamage"]);
  const critRows = showCritRows
    ? [
        row("critRate", "치확", finalStats.critRate, ["critRate"], getCritRateEvaluation(finalStats.critRate)),
        row("critDamage", "치피", finalStats.critDamage, ["critDamage"]),
        ...(hasRows(["dealtCritDamage"]) ? [row("dealtCritDamage", "가하는 치명타 피해", finalStats.dealtCritDamage, ["dealtCritDamage"])] : []),
        ...(hasRows(["followCritDamage"]) ? [row("followCritDamage", "추가공격 치명타 피해", finalStats.followCritDamage, ["followCritDamage"])] : []),
      ]
    : [];
  const debuffRows = [
    ...(hasRows(["vulnerability"]) ? [row("vulnerability", "받피증", battleResult.enemyDebuffs?.vulnerability ?? battleResult.damageModifiers?.vulnerability ?? 0, ["vulnerability"])] : []),
    ...(hasRows(["defenseDown", "defenseIgnore"]) ? [row("defensePen", "방깎/방무", (battleResult.enemyDebuffs?.defenseDown ?? 0) + (battleResult.damageModifiers?.defenseIgnore ?? 0), ["defenseDown", "defenseIgnore"], getDefenseEvaluation((battleResult.enemyDebuffs?.defenseDown ?? 0) + (battleResult.damageModifiers?.defenseIgnore ?? 0)))] : []),
    ...(hasRows(["resistancePen"]) ? [row("resistancePen", "속성 관통/감소", battleResult.damageModifiers?.resistancePen ?? 0, ["resistancePen"], getResistanceEvaluation(battleResult.damageModifiers?.resistancePen ?? 0, Number(enemy.resistance ?? 20) / 100))] : []),
    ...(hasRows(["specialFinal"]) ? [row("specialFinal", "최종 피해", battleResult.damageModifiers?.specialFinal ?? 0, ["specialFinal"])] : []),
    ...(hasRows(["takenCritDamage"]) ? [row("takenCritDamage", "받는 치피증", battleResult.enemyDebuffs?.takenCritDamage ?? 0, ["takenCritDamage"])] : []),
  ];
  const supportRows = [
    ...(hasRows(["debuffCount"]) ? [row("debuffCount", "디버프 카운트", battleResult.damageModifiers?.debuffCount ?? battleResult.enemyDebuffs?.debuffCount ?? 0, ["debuffCount"])] : []),
    ...(hasRows(["effectHitRate"]) ? [row("effectHitRate", "효과 명중", finalStats.effectHitRate, ["effectHitRate"])] : []),
    ...(hasRows(["effectResistance"]) ? [row("effectResistance", "효과 저항", finalStats.effectResistance, ["effectResistance"])] : []),
    ...(hasRows(["energyRegen"]) ? [row("energyRegen", "에너지 회복", finalStats.energyRegen, ["energyRegen"])] : []),
    ...(hasRows(["trueDamageRatio"]) ? [row("trueDamageRatio", "확정피해", battleResult.damageModifiers?.trueDamageRatio ?? 0, ["trueDamageRatio"])] : []),
    ...(hasRows(["elation"]) ? [row("elation", "환락도", battleResult.damageModifiers?.elation ?? 0, ["elation"])] : []),
    ...(hasRows(["merrymake"]) ? [row("merrymake", "Merrymake", battleResult.damageModifiers?.merrymake ?? 0, ["merrymake"])] : []),
  ];
  const primaryGroupRows = [
    ...primaryRows,
    ...(templateKey === "dot" ? [row("dotDamage", "지속피해 증가", finalStats.dotDamage, ["dotDamage"])] : []),
    ...(templateKey === "break" ? [
      row("breakEffect", "격특", finalStats.breakEffect, ["breakEffect"], Number(finalStats.breakEffect) < 1.5 ? { level: "notice", message: "격파 특수효과가 부족합니다.", compactMessage: "격특 낮음" } : { level: "neutral" }),
      row("breakDamage", "격파피증", finalStats.breakDamage, ["breakDamage"]),
    ] : []),
    ...critRows,
    ...debuffRows,
  ];
  const groups = [
    { key: "primaryStats", label: "주요 스탯", rows: primaryGroupRows },
  ];
  if (template.usesDamageBonus) {
    const rows = damageBonusRows.map((item) => row(
      item.key,
      item.label,
      (finalStats.allDamage ?? 0) + (finalStats.elementDamage ?? 0) + (finalStats[item.attackStat] ?? 0),
      ["allDamage", "elementDamage", item.attackStat],
    ));
    if (templateKey === "dot") {
      rows.push(row("dotDamageTotal", "지속피해 피해증가", (finalStats.allDamage ?? 0) + (finalStats.elementDamage ?? 0) + (finalStats.dotDamage ?? 0), ["allDamage", "elementDamage", "dotDamage"]));
    }
    groups.push({ key: "damageBonusGroup", label: "피해증가 총합", rows });
  }
  if (supportRows.length) groups.push({ key: "supportStats", label: "보조 스탯", rows: supportRows });
  return { groups, sourceRows };
}

export function buildDamageContributionViews({
  battleResult,
  skillCards = [],
  skillRows = [],
  enemy = {},
  scenarioSettings = {},
  sourceOwnerId = null,
} = {}) {
  const sourceRows = buildEvaluationSourceRows(battleResult)
    .filter((row) => Number(row.value) !== 0)
    .filter((row) => !sourceOwnerId || row.ownerId === sourceOwnerId)
    .map((row) => ({
      ...row,
      ...calculateContributionDelta(row, { battleResult, skillCards, skillRows, enemy, scenarioSettings }),
    }));
  const characterRows = aggregateContributionRows(sourceRows, (row) => row.ownerLabel, (row) => row.contributionValue);
  const statRows = aggregateContributionRows(sourceRows, (row) => row.effectiveStat ?? row.stat, (row) => row.contributionValue);
  const totalDamage = skillCards.reduce((sum, card) => sum + Number(card.critDamage ?? 0), 0);
  return {
    totalDamage,
    characterRows,
    statRows,
    sourceRows,
  };
}

function buildEvaluationSourceRows(battleResult) {
  const baseStats = battleResult?.finalStats?.base ?? battleResult?.self?.stats?.base ?? {};
  const selfRows = (battleResult?.self?.entries ?? []).map((entry) => {
    const sourceType = entry.sourceType ?? "세팅";
    const sourceLabel = entry.source ?? sourceType;
    const isTrace = String(sourceType).includes("행적");
    return {
      id: `self:${sourceType}:${sourceLabel}:${entry.stat}`,
      stat: entry.stat,
      value: Number(entry.value ?? 0),
      effectiveValue: getEffectiveStatContribution(entry.stat, Number(entry.value ?? 0), baseStats),
      effectiveStat: getEffectiveStatKey(entry.stat),
      label: sourceLabel,
      sourceType,
      ownerId: battleResult?.activeCharacter?.characterId,
      ownerLabel: battleResult?.activeCharacter?.displayName ?? "메인 딜러",
      groupKey: isTrace ? `self:trace:${sourceLabel}` : null,
      groupLabel: isTrace ? `행적 · ${sourceLabel}` : null,
    };
  });
  const appliedRows = (battleResult?.appliedRows ?? []).map((row) => ({
    id: row.ledgerId,
    stat: row.stat,
    value: Number(row.resolvedValue ?? 0),
    effectiveValue: getEffectiveStatContribution(row.stat, Number(row.resolvedValue ?? 0), baseStats),
    effectiveStat: getEffectiveStatKey(row.stat),
    label: row.metadata?.sourceDisplayLabel ?? row.sourceLabel ?? row.sourceName ?? row.sourceId ?? row.ledgerId,
    sourceType: row.metadata?.effectType ?? row.effectType ?? "효과",
    ownerId: row.ownerId,
    ownerLabel: row.sourceLabel ?? row.ownerId ?? "출처",
    targetPolicy: row.targetPolicy,
  }));
  return [...selfRows, ...appliedRows].filter((row) => row.stat && Number.isFinite(row.value));
}

function getEffectiveStatContribution(stat, value, baseStats = {}) {
  if (!Number.isFinite(Number(value))) return 0;
  const numeric = Number(value);
  if (stat === "hpRatio") return Number(baseStats.hp ?? 0) * numeric;
  if (stat === "atkRatio") return Number(baseStats.atk ?? 0) * numeric;
  if (stat === "defRatio") return Number(baseStats.def ?? 0) * numeric;
  if (stat === "speedRatio") return Number(baseStats.speed ?? 0) * numeric;
  return numeric;
}

function getEffectiveStatKey(stat) {
  if (stat === "hpRatio" || stat === "hpFlat") return "hp";
  if (stat === "atkRatio" || stat === "atkFlat") return "atk";
  if (stat === "defRatio" || stat === "defFlat") return "def";
  if (stat === "speedRatio") return "speed";
  return stat;
}

function groupRowsByStat(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.stat)) grouped.set(row.stat, []);
    grouped.get(row.stat).push(row);
  }
  return grouped;
}

function aggregateContributionRows(rows, keyGetter, valueGetter = (row) => row.effectiveValue ?? row.value) {
  const totalMagnitude = rows.reduce((sum, row) => sum + Math.abs(Number(valueGetter(row) ?? 0)), 0);
  if (totalMagnitude <= 0) return [];
  const grouped = new Map();
  for (const row of rows) {
    const key = keyGetter(row) ?? "unknown";
    if (!grouped.has(key)) {
      grouped.set(key, { key, label: key, value: 0, statValue: 0, percent: 0, rows: [] });
    }
    const group = grouped.get(key);
    group.value += Math.abs(Number(valueGetter(row) ?? 0));
    group.statValue += Math.abs(Number(row.effectiveValue ?? row.value ?? 0));
    group.rows.push(row);
  }
  return [...grouped.values()]
    .map((group) => ({ ...group, percent: group.value / totalMagnitude }))
    .sort((a, b) => b.value - a.value || String(a.label).localeCompare(String(b.label), "ko"));
}

function calculateContributionDelta(row, { battleResult, skillCards = [], skillRows = [], enemy = {}, scenarioSettings = {} } = {}) {
  if (!battleResult || !skillCards.length || !skillRows.length) {
    const contributionValue = estimateDamageContributionValue(row, skillCards);
    return { contributionValue, skillContributions: {} };
  }
  const reducedBattleResult = removeSourceRowFromBattleResult(row, battleResult);
  const reducedCards = calculateSkillDamageCards({
    battleResult: reducedBattleResult,
    skillRows,
    enemy,
    scenarioSettings,
  });
  const reducedById = new Map(reducedCards.map((card) => [card.id, card]));
  const skillContributions = {};
  let contributionValue = 0;
  for (const card of skillCards) {
    const reducedCard = reducedById.get(card.id);
    const delta = Math.max(0, Number(card.critDamage ?? 0) - Number(reducedCard?.critDamage ?? 0));
    skillContributions[card.id] = delta;
    contributionValue += delta;
  }
  if (contributionValue <= 0) {
    contributionValue = estimateDamageContributionValue(row, skillCards);
  }
  return { contributionValue, skillContributions };
}

function removeSourceRowFromBattleResult(row, battleResult) {
  const next = {
    ...battleResult,
    finalStats: { ...(battleResult.finalStats ?? {}) },
    damageModifiers: { ...(battleResult.damageModifiers ?? {}) },
    enemyDebuffs: { ...(battleResult.enemyDebuffs ?? {}) },
    battleTotals: { ...(battleResult.battleTotals ?? {}) },
    combinedStatTotals: { ...(battleResult.combinedStatTotals ?? {}) },
  };
  const stat = row.stat;
  const value = Number(row.value ?? 0);
  const effectiveStat = row.effectiveStat ?? stat;
  const effectiveValue = Number(row.effectiveValue ?? value);
  if (!Number.isFinite(value)) return next;

  if (row.id?.startsWith("self:")) {
    subtractFinalStat(next, stat, effectiveStat, value, effectiveValue);
    return next;
  }

  if (isEnemyTargetPolicy(row.targetPolicy)) {
    subtractValue(next.enemyDebuffs, stat, value);
  } else {
    subtractFinalStat(next, stat, effectiveStat, value, effectiveValue);
    subtractValue(next.battleTotals, stat, value);
    subtractValue(next.combinedStatTotals, stat, value);
  }
  if (damageModifierStats.has(stat)) {
    subtractValue(next.damageModifiers, stat, value);
  }
  return next;
}

const damageModifierStats = new Set([
  "allDamage",
  "basicDamage",
  "skillDamage",
  "ultimateDamage",
  "followDamage",
  "dotDamage",
  "breakDamage",
  "trueDamageRatio",
  "dealtCritDamage",
  "followCritDamage",
  "specialFinal",
  "elation",
  "merrymake",
  "defenseIgnore",
  "resistancePen",
  "vulnerability",
  "defenseDown",
]);

function subtractFinalStat(target, stat, effectiveStat, value, effectiveValue) {
  const finalKey = effectiveStat ?? stat;
  if (finalKey) subtractValue(target.finalStats, finalKey, effectiveValue);
  if (stat !== finalKey && stat in (target.finalStats ?? {})) subtractValue(target.finalStats, stat, value);
}

function subtractValue(target, stat, value) {
  if (!target || !stat || !Number.isFinite(Number(value))) return;
  target[stat] = Number(target[stat] ?? 0) - Number(value);
}

function isEnemyTargetPolicy(policy) {
  const normalized = String(policy ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  return normalized.startsWith("enemy");
}

function estimateDamageContributionValue(row, skillCards = []) {
  const value = Number(row.value ?? 0);
  const effectiveValue = Number(row.effectiveValue ?? value);
  if (!Number.isFinite(value) || !skillCards.length) return Math.abs(effectiveValue);
  const stat = row.stat;
  const effectiveStat = row.effectiveStat ?? stat;
  return skillCards.reduce((sum, card) => sum + estimateSkillContributionValue({ stat, effectiveStat, value, effectiveValue, card }), 0);
}

function estimateSkillContributionValue({ stat, effectiveStat, value, effectiveValue, card }) {
  const critDamage = Number(card?.critDamage ?? 0);
  const nonCritDamage = Number(card?.nonCritDamage ?? 0);
  const scalingValue = Number(card?.scalingValue ?? 0);
  if (critDamage <= 0 && nonCritDamage <= 0) return Math.abs(effectiveValue);
  if (!isStatRelevantForFormula(stat, effectiveStat, card)) return 0;
  if (effectiveStat === card?.scalingStat && scalingValue > 0) {
    return Math.abs(critDamage * (effectiveValue / scalingValue));
  }
  if (stat === "critDamage" || stat === "dealtCritDamage" || (stat === "followCritDamage" && card?.attackType === "follow_up")) {
    return Math.abs(nonCritDamage * value);
  }
  if (stat === "critRate") {
    const critDamageStat = nonCritDamage > 0 ? Math.max(0, (critDamage / nonCritDamage) - 1) : 0;
    return Math.abs(nonCritDamage * critDamageStat * value);
  }
  if (isDamageBonusStatForCard(stat, card)) {
    return Math.abs(critDamage * value / Math.max(0.1, 1 + Number(card?.trace?.damageBoost ?? 0)));
  }
  if (stat === "vulnerability") {
    return Math.abs(critDamage * value / Math.max(0.1, 1 + Number(card?.trace?.vulnerability ?? 0)));
  }
  if (stat === "defenseDown" || stat === "defenseIgnore") {
    return Math.abs(critDamage * value * 0.65);
  }
  if (stat === "resistancePen") {
    return Math.abs(critDamage * value / Math.max(0.1, Number(card?.trace?.resistanceMultiplier ?? 1)));
  }
  if (stat === "specialFinal") {
    return Math.abs(critDamage * value);
  }
  if (stat === "trueDamageRatio") {
    return Math.abs(critDamage * value);
  }
  return Math.abs(effectiveValue);
}

function isDamageBonusStatForCard(stat, card) {
  if (card?.damageFormulaType === "break" || card?.damageFormulaType === "super_break" || card?.damageFormulaType === "elation") return false;
  if (stat === "allDamage" || stat === "elementDamage" || stat === "damageBoost") return true;
  return {
    basic: "basicDamage",
    skill: "skillDamage",
    ultimate: "ultimateDamage",
    follow_up: "followDamage",
    dot: "dotDamage",
  }[card?.attackType] === stat;
}

function isStatRelevantForFormula(stat, effectiveStat, card) {
  const formulaType = card?.damageFormulaType ?? "normal";
  const relevantStats = getRelevantStatsForSkillCard(card);
  if (relevantStats.has(stat) || relevantStats.has(effectiveStat)) return true;
  if (formulaType === "dot" || formulaType === "break" || formulaType === "super_break" || formulaType === "elation") return false;
  return true;
}

function getRelevantStatsForSkillCard(card) {
  const formulaType = card?.damageFormulaType ?? "normal";
  const relevantStats = new Set();
  const attackStat = {
    basic: "basicDamage",
    skill: "skillDamage",
    ultimate: "ultimateDamage",
    follow_up: "followDamage",
    dot: "dotDamage",
  }[card?.attackType];
  addScalingStats(relevantStats, card?.scalingStat);

  if (formulaType === "break" || formulaType === "super_break") {
    addStats(relevantStats, ["breakEffect", "breakDamage", "vulnerability", "defenseDown", "defenseIgnore", "resistancePen", "specialFinal", "trueDamageRatio"]);
    return relevantStats;
  }

  addStats(relevantStats, ["vulnerability", "defenseDown", "defenseIgnore", "resistancePen", "specialFinal", "trueDamageRatio"]);

  if (formulaType === "dot") {
    addStats(relevantStats, ["elementDamage", "allDamage", "damageBoost", "dotDamage", attackStat]);
    return relevantStats;
  }

  addStats(relevantStats, ["critRate", "critDamage", "dealtCritDamage"]);
  if (formulaType === "elation") {
    addStats(relevantStats, ["elation", "merrymake", "takenCritDamage", card?.attackType === "follow_up" ? "followCritDamage" : null]);
    return relevantStats;
  }

  addStats(relevantStats, ["elementDamage", "allDamage", "damageBoost", attackStat, card?.attackType === "follow_up" ? "followCritDamage" : null]);
  return relevantStats;
}

function addScalingStats(target, stat) {
  if (!stat) return;
  target.add(stat);
  target.add(`${stat}Ratio`);
  target.add(`${stat}Flat`);
}

function addStats(target, stats) {
  for (const stat of stats) {
    if (stat) target.add(stat);
  }
}

function normalizePrimaryStat(stat, templateKey) {
  if (stat === "hp" || stat === "def" || stat === "critDamage" || stat === "effectHitRate") return stat;
  if (templateKey === "break") return "breakEffect";
  return "atk";
}

function primaryLabel(stat) {
  return {
    atk: "공격력",
    hp: "HP",
    def: "방어력",
    breakEffect: "격파 특수효과",
    critDamage: "치명타 피해",
    effectHitRate: "효과 명중",
  }[stat] ?? stat;
}

import fs from "node:fs";
import path from "node:path";
import { calculateBattleFinalStats } from "../src/calculator/battle-final-stat-calculator.js";
import { buildLightConeEffectRows } from "../src/calculator/lightcone-effect-ledger.js";
import { calculateSelfEquipmentStats } from "../src/calculator/self-stat-calculator.js";
import battleEffectMetadata from "../data/generated/battle-effect-metadata.json" with { type: "json" };
import battleEffectSupplements from "../data/curated/battle-effect-supplements.json" with { type: "json" };
import characterIdentity from "../data/generated/character-identity.json" with { type: "json" };
import characterStateControls from "../data/curated/character-state-controls.json" with { type: "json" };
import characterStatBaseline from "../data/generated/character-stat-baseline.json" with { type: "json" };
import combatLedgerSample from "../data/generated/combat-ledger-sample.json" with { type: "json" };
import defaultCharacterBuilds from "../data/generated/default-character-builds.json" with { type: "json" };
import equipmentStatModel from "../data/generated/equipment-stat-model.json" with { type: "json" };
import hoyowikiSourceEffectSupplements from "../data/generated/hoyowiki-source-effect-supplements.json" with { type: "json" };
import lightconeCandidates from "../data/legacy-reference/game-db/lightcone-effect-candidates.json" with { type: "json" };
import skillDamageMetadata from "../data/generated/skill-damage-metadata.json" with { type: "json" };
import supportDamageProcs from "../data/curated/support-damage-procs.json" with { type: "json" };

const enemy = { count: 1, level: 95, toughness: 90, resistance: 20, isBroken: true };
const attackType = "skill";
const candidateEidolon = readNumericArg("--candidate-eidolon", 6);
const activeProfiles = [
  { key: "atk", label: "공퍼 딜러", activeCharacterId: "Seele_00", scalingStat: "atk" },
  { key: "hp", label: "체퍼 딜러", activeCharacterId: "Ren_00", scalingStat: "hp" },
];
const calculationUnavailableCharacterIds = new Set(["Gilgamesh_00", "TohsakaRin_00", "HimekoNova_00", "hoyowiki:6565", "hoyowiki:6566"]);
const supersededGeneratedEffectRowIds = new Set(hoyowikiSourceEffectSupplements.supersedesEffectRowIds ?? []);
const forceKeepGeneratedEffectRowIds = new Set([
  "effect:MortenaxBlade_00:4",
  "effect:MortenaxBlade_00:6",
]);
const excludedEffectRowIds = new Set([
  "effect:MortenaxBlade_00:0",
  "effect:Jingliu_00:hoyowiki-source:E4:?꺻뀫??꼱????α넽?뗡뀽???뚡뀻???allDamage:1",
]);
const lightCones = lightconeCandidates.lightCones ?? [];
const defaultBuildRows = Object.values(defaultCharacterBuilds.builds ?? {});
const defaultBuildByCharacterId = new Map(defaultBuildRows.map((row) => [row.characterId, row]));
const characterById = new Map((characterIdentity.rows ?? []).map((row) => [row.characterId, row]));
const metadataRows = [
  ...(battleEffectMetadata.rows ?? []).filter((row) => !shouldDropSupersededGeneratedEffect(row.effectRowId)),
  ...(hoyowikiSourceEffectSupplements.metadataRows ?? []),
  ...(battleEffectSupplements.metadataRows ?? []),
].filter((row) => !excludedEffectRowIds.has(row.effectRowId));
const metadataByEffectId = new Map(metadataRows.map((row) => [row.effectRowId, row]));
const combatLedgerRows = [
  ...(combatLedgerSample.rows ?? combatLedgerSample.ledgerRows ?? [])
    .filter((row) => !shouldDropSupersededGeneratedEffect(row.sourceTrace?.effectRowId ?? row.effectRowId)),
  ...(hoyowikiSourceEffectSupplements.ledgerRows ?? []),
  ...(battleEffectSupplements.ledgerRows ?? []),
].filter((row) => !excludedEffectRowIds.has(row.sourceTrace?.effectRowId ?? row.effectRowId));

function shouldDropSupersededGeneratedEffect(effectRowId) {
  return supersededGeneratedEffectRowIds.has(effectRowId) && !forceKeepGeneratedEffectRowIds.has(effectRowId);
}

const report = {
  generatedAt: new Date().toISOString(),
  basis: {
    candidateEidolon,
    activeEidolon: 6,
    lightConeRank: 1,
    enemy,
    attackType,
    damageMetric: "expectedDamage",
    note: "Generic coefficient 100% skill expected damage. Support true-damage and additional-damage procs from data/curated/support-damage-procs.json are included.",
  },
  profiles: {},
};

for (const profile of activeProfiles) {
  report.profiles[profile.key] = auditProfile(profile);
}

const reportSlug = `e${candidateEidolon}-support-final-damage-ranking`;
const outJson = path.join(process.cwd(), "reports", "calculation", `${reportSlug}.json`);
const outMd = path.join(process.cwd(), "reports", "calculation", `${reportSlug}.md`);
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outMd, renderMarkdown(report), "utf8");

for (const [key, profile] of Object.entries(report.profiles)) {
  console.log(`\n[${profile.label}] active=${profile.activeCharacterName} baseline=${formatNumber(profile.baselineDamage)}`);
  for (const [index, row] of profile.rows.slice(0, 10).entries()) {
    console.log(`${index + 1}. ${row.name} (${row.characterId}) +${formatPercent(row.gainRatio)} ${row.summary}`);
  }
}
console.log(`\nwrote ${outJson}`);
console.log(`wrote ${outMd}`);

function auditProfile(profile) {
  const activeCharacter = getCharacter(profile.activeCharacterId);
  const baselineParty = [createSlot(activeCharacter, "active", 6)];
  const baselineBattleResult = calculateBattleFinalStatsForParty(baselineParty, "active");
  const baselineDamage = calculateGenericExpectedDamage(baselineBattleResult, profile.scalingStat);
  const candidates = (characterIdentity.rows ?? [])
    .filter((character) => character?.characterId)
    .filter((character) => character.characterId !== profile.activeCharacterId)
    .filter((character) => !calculationUnavailableCharacterIds.has(character.characterId))
    .map((character) => auditCandidate({ profile, activeCharacter, supportCharacter: character, baselineDamage }))
    .filter((row) => row.damage > baselineDamage && row.gainRatio > 0)
    .sort((a, b) => b.gainRatio - a.gainRatio || String(a.name).localeCompare(String(b.name), "ko"));
  return {
    label: profile.label,
    activeCharacterId: profile.activeCharacterId,
    activeCharacterName: displayName(activeCharacter),
    scalingStat: profile.scalingStat,
    baselineDamage,
    rows: candidates,
  };
}

function auditCandidate({ profile, activeCharacter, supportCharacter, baselineDamage }) {
  const party = [
    createSlot(activeCharacter, "active", 6),
    createSlot(supportCharacter, "support", candidateEidolon),
  ];
  const battleResult = calculateBattleFinalStatsForParty(party, "active");
  const directExpectedDamage = calculateGenericExpectedDamage(battleResult, profile.scalingStat);
  const supportProcDamage = calculateGenericSupportProcDamage({
    supportCharacter,
    supportSlot: party[1],
    battleResult,
    directExpectedDamage,
  });
  const damage = directExpectedDamage + supportProcDamage.damage;
  const supportRows = (battleResult.appliedRows ?? [])
    .filter((row) => row.ownerId === supportCharacter.characterId)
    .map((row) => ({
      stat: row.stat,
      value: Number(row.resolvedValue ?? 0),
      targetPolicy: row.targetPolicy,
      source: metadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId)?.sourceDisplayLabel
        ?? row.sourceLabel
        ?? row.sourceId
        ?? row.ledgerId,
    }))
    .filter((row) => isDamageRelevantStat(row.stat));
  const statSummary = summarizeRows([...supportRows, ...supportProcDamage.rows]);
  return {
    characterId: supportCharacter.characterId,
    name: displayName(supportCharacter),
    damage,
    baselineDamage,
    deltaDamage: damage - baselineDamage,
    gainRatio: baselineDamage > 0 ? damage / baselineDamage - 1 : 0,
    summary: statSummary,
    stats: supportRows,
    procRows: supportProcDamage.rows,
  };
}

function calculateBattleFinalStatsForParty(party, activeSlotId) {
  return calculateBattleFinalStats({
    party,
    activeSlotId,
    characterGetter: getCharacter,
    defaultBuildGetter: getDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones,
    ledgerRows: [
      ...combatLedgerRows,
      ...buildLightConeEffectRows({ party, lightCones, characterGetter: getCharacter }),
    ],
    effectMetadataRows: metadataRows,
    scenarioSettings: {},
    stateControls: buildPartySpecificControls(party, activeSlotId),
  });
}

function calculateGenericExpectedDamage(battleResult, scalingStat) {
  const finalStats = battleResult?.finalStats ?? {};
  const damageModifiers = battleResult?.damageModifiers ?? {};
  const enemyDebuffs = battleResult?.enemyDebuffs ?? {};
  const scalingValue = Number(finalStats[scalingStat] ?? 0);
  const damageBoost = Number(finalStats.allDamage ?? 0)
    + Number(finalStats.elementDamage ?? 0)
    + Number(finalStats.skillDamage ?? 0)
    + Number(damageModifiers.allDamage ?? 0)
    + Number(damageModifiers.skillDamage ?? 0);
  const vulnerability = Number(enemyDebuffs.vulnerability ?? 0) + Number(damageModifiers.vulnerability ?? 0);
  const specialFinal = Number(damageModifiers.specialFinal ?? 0);
  const defenseIgnore = clamp(Number(enemyDebuffs.defenseDown ?? 0) + Number(damageModifiers.defenseIgnore ?? 0), 0, 0.95);
  const resistancePen = Number(damageModifiers.resistancePen ?? 0);
  const defenseMultiplier = calculateDefenseMultiplier(enemy.level, defenseIgnore);
  const resistanceMultiplier = calculateResistanceMultiplier(enemy.resistance, resistancePen);
  const brokenMultiplier = enemy.isBroken === false ? 0.9 : 1;
  const nonCritDamage = scalingValue
    * (1 + damageBoost)
    * (1 + vulnerability)
    * (1 + specialFinal)
    * defenseMultiplier
    * resistanceMultiplier
    * brokenMultiplier;
  const critRate = clamp(Number(finalStats.critRate ?? 0), 0, 1);
  const critDamage = Number(finalStats.critDamage ?? 0) + Number(damageModifiers.dealtCritDamage ?? 0);
  const directExpectedDamage = nonCritDamage * (1 + critRate * critDamage);
  return directExpectedDamage * (1 + Number(damageModifiers.trueDamageRatio ?? 0));
}

function calculateGenericSupportProcDamage({ supportCharacter, supportSlot, battleResult, directExpectedDamage }) {
  const procs = (supportDamageProcs.procs ?? [])
    .filter((proc) => proc.ownerId === supportCharacter.characterId)
    .filter((proc) => (proc.triggerAttackTypes ?? []).includes(attackType))
    .filter((proc) => Number(supportSlot.eidolon ?? 0) >= getSupportProcMinEidolon(proc));
  if (!procs.length) return { damage: 0, rows: [] };
  const supportSelf = calculateSelfEquipmentStats({
    character: supportCharacter,
    slot: supportSlot,
    defaultBuild: getDefaultBuild(supportCharacter.characterId),
    characterStatBaseline,
    equipmentStatModel,
    lightCones,
  });
  const supportStats = battleResult?.partyFinalStatsByCharacterId?.[supportCharacter.characterId] ?? supportSelf.stats ?? {};
  const activeStats = battleResult?.finalStats ?? {};
  const rows = procs.map((proc) => {
    if (proc.type === "trueDamageRatio") {
      if (isSupportProcAlreadyApplied(proc, battleResult)) return null;
      const damage = directExpectedDamage * Number(proc.ratio ?? 0);
      return { stat: "trueDamageRatio(proc)", value: Number(proc.ratio ?? 0), damage, source: proc.label };
    }
    const stats = proc.scalingOwner === "active" ? activeStats : supportStats;
    const scalingValue = Number(stats[proc.scalingStat] ?? 0);
    if (!Number.isFinite(scalingValue) || scalingValue <= 0) return null;
    const critMultiplier = resolveSupportProcCritMultiplier(proc, supportStats, activeStats, supportSlot.eidolon);
    const coefficient = resolveSupportProcCoefficient(proc, supportSlot.eidolon);
    const damageBoost = Number(stats.allDamage ?? 0) + Number(stats.elementDamage ?? 0) + Number(stats.skillDamage ?? 0);
    const damage = Math.max(0, scalingValue
      * coefficient
      * (1 + damageBoost)
      * critMultiplier
      * calculateDefenseMultiplier(enemy.level, 0)
      * calculateResistanceMultiplier(enemy.resistance, 0)
      * (enemy.isBroken === false ? 0.9 : 1));
    return { stat: "additionalDamage(proc)", value: damage, damage, source: proc.label };
  }).filter(Boolean);
  return {
    damage: rows.reduce((sum, row) => sum + Number(row.damage ?? 0), 0),
    rows,
  };
}

function resolveSupportProcCoefficient(proc, supportEidolon = 0) {
  const base = Number(proc?.coefficient ?? 0);
  const eidolon = Number(supportEidolon ?? 0);
  return (proc?.coefficientByMinEidolon ?? [])
    .filter((row) => eidolon >= Number(row?.minEidolon ?? Infinity))
    .sort((a, b) => Number(b.minEidolon ?? 0) - Number(a.minEidolon ?? 0))
    .map((row) => Number(row.coefficient))
    .find((value) => Number.isFinite(value))
    ?? base;
}

function getSupportProcMinEidolon(proc) {
  const explicit = Number(proc?.minEidolon ?? NaN);
  if (Number.isFinite(explicit)) return explicit;
  const metadata = metadataByEffectId.get(proc?.sourceEffectRowId);
  const metadataValue = Number(metadata?.minEidolon ?? 0);
  return Number.isFinite(metadataValue) ? metadataValue : 0;
}

function resolveSupportProcCritMultiplier(proc, supportStats = {}, activeStats = {}, supportEidolon = 0) {
  if (proc.critMode === "none") return 1;
  if (proc.critMode === "fixed") return resolveSupportProcFixedCritMultiplier(proc, supportEidolon);
  const stats = proc.critMode === "active" ? activeStats : supportStats;
  const critRate = Math.max(0, Math.min(1, Number(stats.critRate ?? 0)));
  return 1 + critRate * Number(stats.critDamage ?? 0);
}

function resolveSupportProcFixedCritMultiplier(proc, supportEidolon = 0) {
  const base = Number(proc?.critMultiplier ?? 1);
  const eidolon = Number(supportEidolon ?? 0);
  return (proc?.critMultiplierByMinEidolon ?? [])
    .filter((row) => eidolon >= Number(row?.minEidolon ?? Infinity))
    .sort((a, b) => Number(b.minEidolon ?? 0) - Number(a.minEidolon ?? 0))
    .map((row) => Number(row.critMultiplier))
    .find((value) => Number.isFinite(value))
    ?? base;
}

function isSupportProcAlreadyApplied(proc, battleResult) {
  const effectRowId = proc?.sourceEffectRowId;
  if (!effectRowId) return false;
  return (battleResult?.appliedRows ?? []).some((row) => (row.sourceTrace?.effectRowId ?? row.effectRowId) === effectRowId);
}

function buildPartySpecificControls(party, activeSlotId) {
  const activeSlot = party.find((slot) => slot.slotId === activeSlotId) ?? party[0] ?? null;
  const activeFormulaTypes = new Set(
    (skillDamageMetadata.rows ?? [])
      .filter((row) => row.characterId === activeSlot?.characterId)
      .map((row) => row.damageFormulaType ?? "normal"),
  );
  return (characterStateControls.controls ?? [])
    .map((control) => resolvePartySpecificControl(control, { party, activeSlot, activeFormulaTypes }))
    .filter(Boolean);
}

function resolvePartySpecificControl(control, { party, activeSlot, activeFormulaTypes }) {
  if (control.scope === "partyCharacter") {
    const targetSlot = party.find((slot) => slot.characterId === control.characterId);
    if (!targetSlot) return null;
    return buildStateControl(control, targetSlot);
  }
  if (control.scope === "activeFormula") {
    if (!activeFormulaTypes.has(control.formulaType)) return null;
    return buildStateControl(control, activeSlot);
  }
  if (control.scope === "activeCharacter") {
    if (activeSlot?.characterId !== control.characterId) return null;
    return buildStateControl(control, activeSlot);
  }
  return null;
}

function buildStateControl(control, slot) {
  if (Number.isFinite(Number(control.minEidolon)) && Number(slot?.eidolon ?? 0) < Number(control.minEidolon)) return null;
  const resolved = resolveStateControlOptions(control, slot);
  if (!resolved.options.length) return null;
  return {
    key: control.key,
    characterId: control.characterId ?? slot?.characterId ?? null,
    defaultValue: resolved.defaultValue,
    effectRowIds: control.effectRowIds ?? [],
    valueFormula: control.valueFormula ?? null,
    options: resolved.options.map((value) => ({ value })),
  };
}

function resolveStateControlOptions(control, slot) {
  const eidolon = Number(slot?.eidolon ?? 0);
  const matchedByEidolon = (control.optionsByEidolon ?? [])
    .filter((entry) => eidolon >= Number(entry.minEidolon ?? 0))
    .sort((a, b) => Number(b.minEidolon ?? 0) - Number(a.minEidolon ?? 0))[0];
  const source = matchedByEidolon ?? control;
  const options = (source.options ?? []).map(Number).filter((value) => Number.isFinite(value));
  const defaultValue = Number.isFinite(Number(source.defaultValue)) ? Number(source.defaultValue) : options[options.length - 1];
  return { options, defaultValue };
}

function createSlot(character, slotId, eidolon) {
  return {
    ...createDefaultEquipmentForCharacter(character),
    slotId,
    characterId: character?.characterId ?? null,
    eidolon,
  };
}

function createDefaultEquipmentForCharacter(character) {
  const defaultBuild = getDefaultBuild(character?.characterId);
  const lightcone = getDefaultLightCone(character, defaultBuild);
  const set4 = defaultBuild?.selectedRelics?.set4 ?? null;
  const set2 = defaultBuild?.selectedRelics?.set2 ?? null;
  return {
    lightconeId: lightcone?.id ?? null,
    lightconeName: lightcone?.name ?? null,
    lightconeRank: 1,
    relicSet4Id: set4?.id ?? null,
    relicSet4Name: set4?.name ?? null,
    relicSet2Id: set2?.id ?? null,
    relicSet2Name: set2?.name ?? null,
    relicMainStats: { ...(defaultBuild?.mainStats ?? {}) },
    relicPieces: defaultBuild?.pieces ?? {},
    relicSubStatPriority: [...(defaultBuild?.subStatPriority ?? [])],
  };
}

function getDefaultLightCone(character, defaultBuild = getDefaultBuild(character?.characterId)) {
  if (!character) return null;
  const selected = defaultBuild?.selectedLightCone ?? null;
  if (selected?.id) {
    const source = lightCones.find((lightcone) => lightcone.id === selected.id);
    return source ? { ...source, ...selected } : selected;
  }
  const characterPath = normalizeLightConePathKey(character.path);
  return lightCones.find((lightcone) => normalizeLightConePathKey(lightcone.path) === characterPath) ?? lightCones[0] ?? null;
}

function normalizeLightConePathKey(value) {
  if (value === "memory" || value === "remembrance") return "remembrance";
  return value ?? null;
}

function getCharacter(characterId) {
  return characterById.get(characterId) ?? null;
}

function getDefaultBuild(characterId) {
  return defaultBuildByCharacterId.get(characterId) ?? null;
}

function displayName(character) {
  return character?.displayName ?? character?.localizedName ?? character?.characterId ?? "-";
}

function isDamageRelevantStat(stat) {
  return new Set([
    "hpRatio",
    "hpFlat",
    "atkRatio",
    "atkFlat",
    "critRate",
    "critDamage",
    "dealtCritDamage",
    "allDamage",
    "elementDamage",
    "skillDamage",
    "vulnerability",
    "defenseDown",
    "defenseIgnore",
    "resistancePen",
    "specialFinal",
    "trueDamageRatio",
  ]).has(stat);
}

function summarizeRows(rows) {
  const entries = rows
    .map((row) => ({ stat: row.stat, value: Number(row.value ?? 0), source: row.source ?? "" }))
    .filter((row) => Math.abs(row.value) > 1e-9);
  const groupRankByStat = new Map();
  for (const row of entries) {
    groupRankByStat.set(row.stat, Math.max(groupRankByStat.get(row.stat) ?? 0, Math.abs(row.value)));
  }
  return entries
    .sort((a, b) => Number(groupRankByStat.get(b.stat) ?? 0) - Number(groupRankByStat.get(a.stat) ?? 0)
      || statOrder(a.stat) - statOrder(b.stat)
      || String(a.stat).localeCompare(String(b.stat))
      || Math.abs(b.value) - Math.abs(a.value)
      || String(a.source).localeCompare(String(b.source), "ko"))
    .map(({ stat, value }) => `${statLabel(stat)} ${formatStatValue(stat, value)}`)
    .join(", ");
}

function statOrder(stat) {
  return [
    "atkRatio",
    "hpRatio",
    "critRate",
    "critDamage",
    "dealtCritDamage",
    "allDamage",
    "elementDamage",
    "skillDamage",
    "vulnerability",
    "defenseDown",
    "defenseIgnore",
    "resistancePen",
    "specialFinal",
    "trueDamageRatio",
    "trueDamageRatio(proc)",
    "additionalDamage(proc)",
  ].indexOf(stat);
}

function statLabel(stat) {
  return {
    atkRatio: "공퍼",
    atkFlat: "공격력",
    hpRatio: "체퍼",
    hpFlat: "HP",
    critRate: "치확",
    critDamage: "치피",
    dealtCritDamage: "가하는 치피",
    allDamage: "피증",
    elementDamage: "속성 피증",
    skillDamage: "전투스킬 피증",
    vulnerability: "받피증",
    defenseDown: "방깎",
    defenseIgnore: "방무",
    resistancePen: "속관",
    specialFinal: "최종피해",
    trueDamageRatio: "확정피해",
    "trueDamageRatio(proc)": "확정피해(proc)",
    "additionalDamage(proc)": "추가피해(proc)",
  }[stat] ?? stat;
}

function formatStatValue(stat, value) {
  if (stat === "additionalDamage(proc)" || stat === "atkFlat" || stat === "hpFlat") return formatNumber(value);
  return formatPercent(value);
}

function calculateDefenseMultiplier(enemyLevel = 95, defenseIgnore = 0) {
  const attackerLevel = 80;
  const enemyValue = Number(enemyLevel ?? 95);
  const attackerTerm = attackerLevel + 20;
  const enemyTerm = (enemyValue + 20) * (1 - clamp(defenseIgnore, 0, 0.95));
  return attackerTerm / (attackerTerm + enemyTerm);
}

function calculateResistanceMultiplier(enemyResistance = 20, resistancePen = 0) {
  const resistance = Number(enemyResistance ?? 20) / 100;
  return clamp(1 - resistance + Number(resistancePen ?? 0), 0.1, 2);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value ?? 0)));
}

function formatPercent(value) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function formatNumber(value) {
  return Math.round(Number(value ?? 0)).toLocaleString("ko-KR");
}

function renderMarkdown(data) {
  const lines = [];
  lines.push("# E6 support final damage ranking");
  lines.push("");
  lines.push(`- Generated: ${data.generatedAt}`);
  lines.push("- Basis: E6 candidate, E6 active profile, default equipment, light cone rank 1.");
  lines.push("- Metric: generic 100% skill expected damage, including crit rate, buffs/debuffs, true-damage/additional-damage support procs.");
  lines.push("");
  for (const profile of Object.values(data.profiles)) {
    lines.push(`## ${profile.label}`);
    lines.push("");
    lines.push(`- Active profile: ${profile.activeCharacterName} (${profile.activeCharacterId})`);
    lines.push(`- Scaling stat: ${profile.scalingStat}`);
    lines.push(`- Baseline expected damage: ${formatNumber(profile.baselineDamage)}`);
    lines.push("");
    lines.push("| # | Character | ID | Gain | Delta | Summary |");
    lines.push("|---:|---|---|---:|---:|---|");
    for (const [index, row] of profile.rows.slice(0, 20).entries()) {
      lines.push(`| ${index + 1} | ${row.name} | \`${row.characterId}\` | ${formatPercent(row.gainRatio)} | ${formatNumber(row.deltaDamage)} | ${row.summary || "-"} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function readNumericArg(name, fallback) {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return fallback;
  const value = Number(arg.slice(prefix.length));
  return Number.isFinite(value) ? value : fallback;
}

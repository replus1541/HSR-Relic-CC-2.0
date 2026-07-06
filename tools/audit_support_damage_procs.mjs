import fs from "node:fs";
import { calculateBattleFinalStats } from "../src/calculator/battle-final-stat-calculator.js";
import { buildDamageContributionViews } from "../src/calculator/battle-stat-evaluation.js";
import { buildLightConeEffectRows } from "../src/calculator/lightcone-effect-ledger.js";
import { calculateSkillDamageCards } from "../src/calculator/skill-damage-calculator.js";
import { calculateSelfEquipmentStats } from "../src/calculator/self-stat-calculator.js";

const characterIdentity = readJson("data/generated/character-identity.json");
const characterStatBaseline = readJson("data/generated/character-stat-baseline.json");
const equipmentStatModel = readJson("data/generated/equipment-stat-model.json");
const defaultCharacterBuilds = readJson("data/generated/default-character-builds.json");
const lightconeCandidates = readJson("data/legacy-reference/game-db/lightcone-effect-candidates.json");
const combatLedgerSample = readJson("data/generated/combat-ledger-sample.json");
const battleEffectMetadata = readJson("data/generated/battle-effect-metadata.json");
const hoyowikiSourceEffectSupplements = readJson("data/generated/hoyowiki-source-effect-supplements.json");
const battleEffectSupplements = readJson("data/curated/battle-effect-supplements.json");
const skillDamageMetadata = readJson("data/generated/skill-damage-metadata.json");
const characterStateControls = readJson("data/curated/character-state-controls.json");
const supportDamageProcs = readJson("data/curated/support-damage-procs.json");

const enemy = { count: 3, level: 95, toughness: 90, resistance: 20 };
const supersededGeneratedEffectRowIds = new Set(hoyowikiSourceEffectSupplements.supersedesEffectRowIds ?? []);
const excludedEffectRowIds = new Set([
  "effect:MortenaxBlade_00:0",
  "effect:Jingliu_00:hoyowiki-source:E4:달의_검을_쥐고:allDamage:1",
  "effect:Welt_00:3",
]);
const baseLedgerRows = [
  ...((combatLedgerSample.rows ?? combatLedgerSample.ledgerRows ?? [])
    .filter((row) => !supersededGeneratedEffectRowIds.has(row.sourceTrace?.effectRowId ?? row.effectRowId))),
  ...(hoyowikiSourceEffectSupplements.ledgerRows ?? []),
  ...(battleEffectSupplements.ledgerRows ?? []),
].filter((row) => !shouldExcludeEffectRowId(row.sourceTrace?.effectRowId ?? row.effectRowId));
const baseEffectMetadataRows = [
  ...((battleEffectMetadata.rows ?? [])
    .filter((row) => !supersededGeneratedEffectRowIds.has(row.effectRowId))),
  ...(hoyowikiSourceEffectSupplements.metadataRows ?? []),
  ...(battleEffectSupplements.metadataRows ?? []),
].filter((row) => !shouldExcludeEffectRowId(row.effectRowId));

function shouldExcludeEffectRowId(effectRowId) {
  return excludedEffectRowIds.has(effectRowId) || isExcludedAshveilDuplicateDefenseDown(effectRowId);
}

function isExcludedAshveilDuplicateDefenseDown(effectRowId) {
  const id = String(effectRowId ?? "");
  return (
    id.startsWith("effect:Ashveil_00:hoyowiki-source:")
    && id.endsWith(":defenseDown:0")
  );
}

const procOwners = [...new Set((supportDamageProcs.procs ?? []).map((proc) => proc.ownerId))];
const procChecks = [];
for (const proc of supportDamageProcs.procs ?? []) {
  const supportCharacter = getCharacter(proc.ownerId);
  const activeCharacterId = pickActiveCharacterForProc(proc);
  const requiredEidolon = requiredEidolonForProc(proc);
  const result = calculateFor(activeCharacterId, [
    { characterId: activeCharacterId },
    { characterId: proc.ownerId, eidolon: requiredEidolon },
  ]);
  const compatibleCard = result.skillCards.find((card) => (proc.triggerAttackTypes ?? []).includes(card.attackType)) ?? result.skillCards[0];
  const supportRows = buildCurrentPartySupportProcRows({
    party: result.party,
    activeSlotId: "slot-1",
    skillCards: result.skillCards,
    battleResult: result.battleResult,
    enemy,
  });
  const displayCards = applySupportProcRowsToSkillCards(result.skillCards, supportRows.bySkillId);
  const ledgerHandled = isSupportProcAlreadyApplied(proc, result.battleResult);
  const baseViews = buildDamageContributionViews({
    battleResult: result.battleResult,
    skillCards: result.skillCards,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
  });
  const views = augmentContributionViewsWithSupportProcRows(baseViews, supportRows.rows, displayCards);
  const cardRows = compatibleCard ? (supportRows.bySkillId.get(compatibleCard.id) ?? []).filter((row) => row.id?.startsWith(`support-proc:${proc.key}:`)) : [];
  const displayCard = displayCards.find((card) => card.id === compatibleCard?.id);
  const sourceRows = views.sourceRows.filter((row) => row.ownerId === proc.ownerId && row.id?.startsWith(`support-proc:${proc.key}:`));
  const skillDetailRows = compatibleCard ? buildSkillSourceRows(compatibleCard, views.sourceRows)
    .filter((row) => row.ownerId === proc.ownerId && row.id?.startsWith(`support-proc:${proc.key}:`)) : [];
  const ledgerSourceRows = views.sourceRows.filter((row) => row.ownerId === proc.ownerId && row.stat === proc.type);
  const ledgerSkillRows = compatibleCard ? buildSkillSourceRows(compatibleCard, views.sourceRows)
    .filter((row) => row.ownerId === proc.ownerId && row.stat === proc.type) : [];
  const damageDelta = Number(displayCard?.critDamage ?? 0) - Number(compatibleCard?.critDamage ?? 0);
  const e0Blocked = requiredEidolon > 0 ? isProcBlockedAtE0(proc, activeCharacterId) : true;
  procChecks.push({
    key: proc.key,
    ownerId: proc.ownerId,
    ownerName: supportCharacter?.displayName ?? supportCharacter?.name ?? proc.ownerId,
    label: proc.label,
    type: proc.type,
    sourceEffectRowId: proc.sourceEffectRowId,
    requiredEidolon,
    triggerAttackTypes: proc.triggerAttackTypes ?? [],
    formula: describeProcFormula(proc),
    testActiveCharacterId: activeCharacterId,
    testSkillId: compatibleCard?.id ?? null,
    testAttackType: compatibleCard?.attackType ?? null,
    handledByLedger: ledgerHandled,
    e0Blocked,
    runtimeRows: cardRows.length,
    displayDamageDelta: round(damageDelta, 3),
    inSkillCardDamage: ledgerHandled ? Number(compatibleCard?.trueDamage ?? 0) > 0 : damageDelta > 0,
    inContributionSourceRows: ledgerHandled ? ledgerSourceRows.length > 0 : sourceRows.length > 0,
    inSkillDetailContribution: ledgerHandled ? ledgerSkillRows.length > 0 : skillDetailRows.length > 0,
    contributionValue: round((ledgerHandled ? ledgerSourceRows : sourceRows).reduce((sum, row) => sum + Number(row.contributionValue ?? 0), 0), 3),
  });
}

const trueDamageLedgerCandidates = baseEffectMetadataRows
  .filter((row) => row.stat === "trueDamageRatio")
  .filter((row) => isAllyPolicy(row.targetPolicy))
  .map((row) => ({
    ownerId: row.ownerId,
    ownerName: getCharacter(row.ownerId)?.displayName ?? getCharacter(row.ownerId)?.name ?? row.ownerId,
    effectRowId: row.effectRowId,
    sourceDisplayLabel: row.sourceDisplayLabel ?? row.sourceTitle ?? row.effectRowId,
    minEidolon: row.minEidolon ?? null,
    targetPolicy: row.targetPolicy,
  }));

const ledgerChecks = trueDamageLedgerCandidates.map((candidate) => {
  const activeCharacterId = candidate.ownerId === "Cyrene_00" ? "Seele_00" : "Seele_00";
  const eidolon = Number(candidate.minEidolon ?? 0);
  const result = calculateFor(activeCharacterId, [
    { characterId: activeCharacterId },
    { characterId: candidate.ownerId, eidolon },
  ]);
  const appliedRows = result.battleResult.appliedRows.filter((row) => (
    row.ownerId === candidate.ownerId
    && (row.sourceTrace?.effectRowId === candidate.effectRowId || row.effectRowId === candidate.effectRowId)
  ));
  const cardsWithTrueDamage = result.skillCards.filter((card) => Number(card.trueDamage ?? 0) > 0);
  const views = buildDamageContributionViews({
    battleResult: result.battleResult,
    skillCards: result.skillCards,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
  });
  const sourceRows = views.sourceRows.filter((row) => row.ownerId === candidate.ownerId && row.stat === "trueDamageRatio");
  const firstCard = cardsWithTrueDamage[0] ?? result.skillCards[0];
  const skillDetailRows = firstCard ? buildSkillSourceRows(firstCard, views.sourceRows)
    .filter((row) => row.ownerId === candidate.ownerId && row.stat === "trueDamageRatio") : [];
  return {
    ...candidate,
    testActiveCharacterId: activeCharacterId,
    testEidolon: eidolon,
    appliedRows: appliedRows.length,
    appliedValue: round(appliedRows.reduce((sum, row) => sum + Number(row.resolvedValue ?? 0), 0), 4),
    damageModifierValue: round(result.battleResult.damageModifiers?.trueDamageRatio ?? 0, 4),
    cardsWithTrueDamage: cardsWithTrueDamage.length,
    inSkillCardDamage: cardsWithTrueDamage.length > 0,
    inContributionSourceRows: sourceRows.length > 0,
    inSkillDetailContribution: skillDetailRows.length > 0,
  };
});

const modifierChecks = [
  checkRobinAdditionalDamageUsesPartyModifiers(),
  checkCerydraAdditionalDamageE6Scaling(),
];

const summary = {
  supportDamageProcRows: procChecks.length,
  supportDamageProcOwners: procOwners.length,
  trueDamageLedgerCandidates: ledgerChecks.length,
  failedProcChecks: procChecks.filter((row) => !row.e0Blocked || !row.inSkillCardDamage || !row.inContributionSourceRows || !row.inSkillDetailContribution).length,
  failedLedgerChecks: ledgerChecks.filter((row) => !row.inSkillCardDamage || !row.inContributionSourceRows || !row.inSkillDetailContribution).length,
  failedModifierChecks: modifierChecks.filter((row) => !row.pass).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  summary,
  supportDamageProcs: procChecks,
  allyTrueDamageLedgerRows: ledgerChecks,
  modifierChecks,
};

fs.mkdirSync("reports/calculation", { recursive: true });
fs.writeFileSync("reports/calculation/support-damage-proc-audit.json", `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync("reports/calculation/support-damage-proc-audit.md", buildMarkdownReport(report));

const failed = summary.failedProcChecks + summary.failedLedgerChecks + summary.failedModifierChecks;
if (failed) {
  console.error(`support damage proc audit failed: failed=${failed}`);
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(`support damage proc audit ok: procRows=${summary.supportDamageProcRows}, procOwners=${summary.supportDamageProcOwners}, trueDamageLedgerRows=${summary.trueDamageLedgerCandidates}, modifierChecks=${modifierChecks.length}`);

function checkRobinAdditionalDamageUsesPartyModifiers() {
  const base = getSupportProcDamageForParty("Robin_00", [
    { characterId: "Seele_00" },
    { characterId: "Robin_00" },
  ]);
  const withDebuffs = getSupportProcDamageForParty("Robin_00", [
    { characterId: "Seele_00" },
    { characterId: "Robin_00" },
    { characterId: "Ashveil_00", eidolon: 6 },
  ]);
  return {
    name: "Robin additional damage uses current party buffs and enemy debuffs",
    pass: Number(withDebuffs.damage ?? 0) > Number(base.damage ?? 0),
    baseDamage: round(base.damage, 3),
    withDebuffsDamage: round(withDebuffs.damage, 3),
    baseCardId: base.cardId,
    withDebuffsCardId: withDebuffs.cardId,
  };
}

function checkCerydraAdditionalDamageE6Scaling() {
  const proc = (supportDamageProcs.procs ?? []).find((item) => item.key === "cerydraMilitaryMeritAdditionalDamage");
  const e2Coefficient = resolveSupportProcCoefficient(proc, 2);
  const e5Coefficient = resolveSupportProcCoefficient(proc, 5);
  const e6Coefficient = resolveSupportProcCoefficient(proc, 6);
  const e2 = getSupportProcDamageForParty("Cerydra_00", [
    { characterId: "Seele_00" },
    { characterId: "Cerydra_00", eidolon: 2 },
  ]);
  const e6 = getSupportProcDamageForParty("Cerydra_00", [
    { characterId: "Seele_00" },
    { characterId: "Cerydra_00", eidolon: 6 },
  ]);
  return {
    name: "Cerydra Military Merit additional damage uses Lv10 and E6 coefficient",
    pass: Math.abs(e2Coefficient - 0.6) < 1e-9
      && Math.abs(e5Coefficient - 0.66) < 1e-9
      && Math.abs(e6Coefficient - 2.64) < 1e-9
      && Number(e6.damage ?? 0) > Number(e2.damage ?? 0) * 3,
    baseDamage: round(e2.damage, 3),
    withDebuffsDamage: round(e6.damage, 3),
    e2Coefficient,
    e5Coefficient,
    e6Coefficient,
  };
}

function getSupportProcDamageForParty(ownerId, partyItems) {
  const activeCharacterId = partyItems[0]?.characterId ?? "Seele_00";
  const result = calculateFor(activeCharacterId, partyItems);
  const proc = (supportDamageProcs.procs ?? []).find((item) => item.ownerId === ownerId && item.type === "additionalDamage");
  const compatibleCard = result.skillCards.find((card) => (proc?.triggerAttackTypes ?? []).includes(card.attackType)) ?? result.skillCards[0];
  const supportRows = buildCurrentPartySupportProcRows({
    party: result.party,
    activeSlotId: "slot-1",
    skillCards: result.skillCards,
    battleResult: result.battleResult,
    enemy,
  });
  const rows = compatibleCard ? (supportRows.bySkillId.get(compatibleCard.id) ?? []).filter((row) => row.ownerId === ownerId) : [];
  return {
    damage: rows.reduce((sum, row) => sum + Number(row.contributionValue ?? 0), 0),
    cardId: compatibleCard?.id ?? null,
  };
}

function calculateFor(activeCharacterId, partyItems, scenarioSettings = {}) {
  const party = partyItems.map((item, index) => {
    const character = getCharacter(item.characterId);
    return {
      slotId: `slot-${index + 1}`,
      characterId: item.characterId,
      eidolon: Number(item.eidolon ?? 0),
      lightconeId: item.lightconeId,
      lightconeRank: item.lightconeRank ?? 1,
      ...(character ? createDefaultEquipmentForCharacter(character) : {}),
      ...item,
    };
  });
  const ledgerRows = [
    ...baseLedgerRows,
    ...buildLightConeEffectRows({
      party,
      lightCones: lightconeCandidates.lightCones ?? [],
      characterGetter: getCharacter,
    }),
  ];
  const battleResult = calculateBattleFinalStats({
    party,
    activeSlotId: "slot-1",
    characterGetter: getCharacter,
    defaultBuildGetter: getDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones: lightconeCandidates.lightCones ?? [],
    ledgerRows,
    effectMetadataRows: baseEffectMetadataRows,
    scenarioSettings,
    stateControls: characterStateControls.controls ?? [],
  });
  const skillCards = calculateSkillDamageCards({
    battleResult,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings,
  });
  return { party, battleResult, skillCards };
}

function buildCurrentPartySupportProcRows({ party = [], activeSlotId, skillCards = [], battleResult, enemy } = {}) {
  const activeSlot = party.find((slot) => slot.slotId === activeSlotId) ?? party[0] ?? null;
  const rows = [];
  const bySkillId = new Map();
  if (!activeSlot?.characterId || !skillCards.length) return { rows, bySkillId };
  for (const supportSlot of party) {
    if (!supportSlot?.characterId || supportSlot.slotId === activeSlot.slotId) continue;
    const supportCharacter = getCharacter(supportSlot.characterId);
    if (!supportCharacter?.characterId) continue;
    for (const card of skillCards) {
      const procDamage = calculateCandidateSupportProcDamage({
        supportCharacter,
        supportSlot,
        activeCard: card,
        activeBattleResult: battleResult,
        enemy,
      });
      if (!procDamage.rows.length) continue;
      for (const row of procDamage.rows) {
        const nextRow = {
          ...row,
          skillContributions: { [card.id]: Number(row.contributionValue ?? 0) },
        };
        rows.push(nextRow);
        if (!bySkillId.has(card.id)) bySkillId.set(card.id, []);
        bySkillId.get(card.id).push(nextRow);
      }
    }
  }
  return { rows, bySkillId };
}

function calculateCandidateSupportProcDamage({ supportCharacter, supportSlot, activeCard, activeBattleResult, enemy }) {
  if (!supportCharacter?.characterId || !activeCard) return { damage: 0, rows: [] };
  const procs = (supportDamageProcs.procs ?? [])
    .filter((proc) => proc.ownerId === supportCharacter.characterId)
    .filter((proc) => (proc.triggerAttackTypes ?? []).includes(activeCard.attackType))
    .filter((proc) => supportProcMeetsEidolonRequirement(proc, supportSlot));
  if (!procs.length) return { damage: 0, rows: [] };

  const supportSelf = calculateSelfEquipmentStats({
    character: supportCharacter,
    slot: supportSlot,
    defaultBuild: getDefaultBuild(supportCharacter.characterId),
    characterStatBaseline,
    equipmentStatModel,
    lightCones: lightconeCandidates.lightCones ?? [],
  });
  const supportStats = activeBattleResult?.partyFinalStatsByCharacterId?.[supportCharacter.characterId] ?? supportSelf.stats ?? {};
  const activeStats = activeBattleResult?.finalStats ?? {};
  const rows = procs
    .map((proc) => {
      const damage = calculateSupportProcDamageValue({
        proc,
        supportEidolon: supportSlot?.eidolon,
        supportStats,
        activeStats,
        activeCard,
        activeBattleResult,
        enemy,
      });
      if (!Number.isFinite(damage) || damage <= 0) return null;
      const stat = proc.type === "trueDamageRatio" ? "trueDamageRatio" : "additionalDamage";
      return {
        id: `support-proc:${proc.key}:${activeCard.id}`,
        ownerId: supportCharacter.characterId,
        ownerLabel: supportCharacter.displayName ?? supportCharacter.name ?? supportCharacter.characterId,
        label: proc.label,
        stat,
        effectiveStat: stat,
        value: damage,
        effectiveValue: damage,
        contributionValue: damage,
        sourceType: "characterSkill",
        sourceTrace: proc.sourceTrace ?? null,
        sourceText: proc.sourceText ?? null,
        sourceEffectRowId: proc.sourceEffectRowId ?? null,
      };
    })
    .filter(Boolean);
  return {
    damage: rows.reduce((sum, row) => sum + Number(row.contributionValue ?? 0), 0),
    rows,
  };
}

function supportProcMeetsEidolonRequirement(proc, supportSlot) {
  return Number(supportSlot?.eidolon ?? 0) >= requiredEidolonForProc(proc);
}

function isProcBlockedAtE0(proc, activeCharacterId) {
  const result = calculateFor(activeCharacterId, [
    { characterId: activeCharacterId },
    { characterId: proc.ownerId, eidolon: 0 },
  ]);
  const supportRows = buildCurrentPartySupportProcRows({
    party: result.party,
    activeSlotId: "slot-1",
    skillCards: result.skillCards,
    battleResult: result.battleResult,
    enemy,
  });
  const hasProcRow = supportRows.rows.some((row) => row.id?.startsWith(`support-proc:${proc.key}:`));
  const hasLedgerRow = isSupportProcAlreadyApplied(proc, result.battleResult);
  return !hasProcRow && !hasLedgerRow;
}

function calculateSupportProcDamageValue({ proc, supportEidolon = 0, supportStats = {}, activeStats = {}, activeCard, activeBattleResult, enemy }) {
  if (proc.type === "trueDamageRatio") {
    if (isSupportProcAlreadyApplied(proc, activeBattleResult)) return 0;
    return Number(activeCard?.directCritDamage ?? activeCard?.critDamage ?? 0) * Number(proc.ratio ?? 0);
  }
  const stats = proc.scalingOwner === "active" ? activeStats : supportStats;
  const scalingValue = Number(stats[proc.scalingStat] ?? 0);
  if (!Number.isFinite(scalingValue) || scalingValue <= 0) return 0;
  const critMultiplier = resolveSupportProcCritMultiplier(proc, supportStats, activeStats, supportEidolon);
  const coefficient = resolveSupportProcCoefficient(proc, supportEidolon);
  const damageModifiers = activeBattleResult?.damageModifiers ?? {};
  const enemyDebuffs = activeBattleResult?.enemyDebuffs ?? {};
  const attackDamageKey = getAttackDamageStatKey(activeCard?.attackType);
  const damageBoost = calculateSupportProcDamageBoost({ stats, damageModifiers, attackDamageKey, attackType: activeCard?.attackType });
  const vulnerability = supportNumber(enemyDebuffs.vulnerability) + supportNumber(damageModifiers.vulnerability);
  const defenseIgnore = supportClamp(supportNumber(enemyDebuffs.defenseDown) + supportNumber(damageModifiers.defenseIgnore), 0, 0.95);
  const resistancePen = supportNumber(damageModifiers.resistancePen);
  const specialFinal = supportNumber(damageModifiers.specialFinal);
  return Math.max(0, scalingValue
    * coefficient
    * (1 + damageBoost)
    * (1 + vulnerability)
    * (1 + specialFinal)
    * critMultiplier
    * calculateSupportDefenseMultiplier(enemy?.level, defenseIgnore)
    * calculateSupportResistanceMultiplier(enemy?.resistance, resistancePen)
    * calculateSupportBrokenMultiplier(enemy));
}

function calculateSupportProcDamageBoost({ stats = {}, damageModifiers = {}, attackDamageKey = null, attackType = null } = {}) {
  return supportNumber(stats.allDamage)
    + supportNumber(stats.elementDamage)
    + supportNumber(stats[attackDamageKey])
    + supportNumber(damageModifiers.allDamage)
    + supportNumber(damageModifiers[attackDamageKey])
    + supportNumber(attackType === "follow_up" ? damageModifiers.followDamage : 0);
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

function applySupportProcRowsToSkillCards(skillCards = [], rowsBySkillId = new Map()) {
  return skillCards.map((card) => {
    const rows = rowsBySkillId.get(card.id) ?? [];
    const additionalDamage = rows.reduce((sum, row) => sum + Number(row.contributionValue ?? 0), 0);
    if (additionalDamage <= 0) return card;
    return {
      ...card,
      supportProcDamage: additionalDamage,
      critDamage: Number(card.critDamage ?? 0) + additionalDamage,
      expectedDamage: Number(card.expectedDamage ?? card.critDamage ?? 0) + additionalDamage,
      trace: {
        ...(card.trace ?? {}),
        supportProcDamage: additionalDamage,
      },
    };
  });
}

function augmentContributionViewsWithSupportProcRows(baseViews = {}, supportRows = [], displaySkillCards = []) {
  const sourceRows = [...(baseViews.sourceRows ?? []), ...supportRows];
  return {
    ...baseViews,
    totalDamage: displaySkillCards.reduce((sum, card) => sum + Number(card.critDamage ?? 0), 0),
    sourceRows,
    characterRows: aggregateContributionViewRows(sourceRows, (row) => row.ownerLabel, (row) => row.contributionValue),
    statRows: aggregateContributionViewRows(sourceRows, (row) => row.effectiveStat ?? row.stat, (row) => row.contributionValue),
  };
}

function aggregateContributionViewRows(rows, keyGetter, valueGetter) {
  const totalMagnitude = rows.reduce((sum, row) => sum + Math.abs(Number(valueGetter(row) ?? 0)), 0);
  if (totalMagnitude <= 0) return [];
  const grouped = new Map();
  for (const row of rows) {
    const key = keyGetter(row) ?? "unknown";
    const rowMagnitude = Math.abs(Number(valueGetter(row) ?? 0));
    if (!grouped.has(key)) {
      grouped.set(key, { key, label: key, value: 0, statValue: 0, percent: 0, rows: [] });
    }
    const group = grouped.get(key);
    group.value += rowMagnitude;
    group.statValue += Math.abs(Number(row.effectiveValue ?? row.value ?? 0));
    group.rows.push({ ...row, magnitude: rowMagnitude, percent: rowMagnitude / totalMagnitude });
  }
  return [...grouped.values()]
    .map((group) => ({ ...group, percent: group.value / totalMagnitude }))
    .sort((a, b) => b.value - a.value || String(a.label).localeCompare(String(b.label), "ko"));
}

function buildSkillSourceRows(card, sourceRows) {
  if (!card) return [];
  const rows = sourceRows
    .filter((row) => isStatRelevantForSkillCard(row.stat, row.effectiveStat, card))
    .map((row) => ({
      ...row,
      magnitude: Math.abs(getSkillSourceRowMagnitude(row, card.id)),
    }))
    .filter((row) => row.magnitude > 0);
  const total = rows.reduce((sum, row) => sum + Number(row.magnitude ?? 0), 0);
  if (total <= 0) return [];
  return rows
    .map((row) => ({ ...row, percent: row.magnitude / total }))
    .sort((a, b) => b.magnitude - a.magnitude);
}

function getSkillSourceRowMagnitude(row, cardId) {
  if (row?.skillContributions && typeof row.skillContributions === "object") {
    return Number(row.skillContributions[cardId] ?? 0);
  }
  return Number(row?.contributionValue ?? row?.effectiveValue ?? row?.value ?? 0);
}

function isStatRelevantForSkillCard(stat, effectiveStat, card) {
  const formulaType = card?.damageFormulaType ?? "normal";
  const relevantStats = getRelevantStatsForSkillCard(card);
  if (relevantStats.has(stat) || relevantStats.has(effectiveStat)) return true;
  if (stat === "additionalDamage") return true;
  if (formulaType === "dot" || formulaType === "break" || formulaType === "super_break" || formulaType === "elation") return false;
  return true;
}

function getRelevantStatsForSkillCard(card) {
  const formulaType = card?.damageFormulaType ?? "normal";
  const relevantStats = new Set();
  const attackStat = getAttackDamageStatKey(card?.attackType);
  addScalingStats(relevantStats, card?.scalingStat);
  if (formulaType === "break" || formulaType === "super_break") {
    addStats(relevantStats, ["breakEffect", "breakDamage", "vulnerability", "defenseDown", "defenseIgnore", "resistancePen", "specialFinal", "trueDamageRatio", "additionalDamage"]);
    return relevantStats;
  }
  addStats(relevantStats, ["vulnerability", "defenseDown", "defenseIgnore", "resistancePen", "specialFinal", "trueDamageRatio", "additionalDamage"]);
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

function createDefaultEquipmentForCharacter(character) {
  const build = getDefaultBuild(character.characterId);
  const selectedLightCone = build?.selectedLightCone ?? null;
  return {
    lightConeId: selectedLightCone?.id ?? "",
    lightConeName: selectedLightCone?.name ?? "",
    lightConeRank: 1,
    relicSet4Id: build?.sets?.set4?.id ?? "",
    relicSet4Name: build?.sets?.set4?.name ?? "",
    relicSet2Id: build?.sets?.set2?.id ?? "",
    relicSet2Name: build?.sets?.set2?.name ?? "",
    relicMainStats: { ...(build?.mainStats ?? {}) },
    relicPieces: build?.relicPieces ?? {},
    relicSubStatPriority: [...(build?.subStatPriority ?? ["critRate", "critDamage", "atkRatio", "speed"])],
  };
}

function pickActiveCharacterForProc(proc) {
  const preferred = ["Seele_00", "PlayerBoy_20", "DanHengPT_00", "Feixiao_00", "Topaz_00"];
  for (const characterId of preferred) {
    const attackTypes = new Set((skillDamageMetadata.rows ?? [])
      .filter((row) => row.characterId === characterId)
      .map((row) => row.attackType));
    if ((proc.triggerAttackTypes ?? []).some((type) => attackTypes.has(type))) return characterId;
  }
  return "Seele_00";
}

function requiredEidolonForProc(proc) {
  const explicit = Number(proc?.minEidolon ?? NaN);
  if (Number.isFinite(explicit)) return explicit;
  return requiredEidolonForEffect(proc?.sourceEffectRowId);
}

function requiredEidolonForEffect(effectRowId) {
  const metadata = baseEffectMetadataRows.find((row) => row.effectRowId === effectRowId);
  return Number(metadata?.minEidolon ?? 0);
}

function describeProcFormula(proc) {
  if (proc.type === "trueDamageRatio") return `directCritDamage * ${toPercent(proc.ratio)}`;
  const owner = proc.scalingOwner === "active" ? "active" : "support";
  const crit = proc.critMode === "none"
    ? "no crit"
    : proc.critMode === "fixed"
      ? `fixed crit x${resolveSupportProcFixedCritMultiplier(proc, 6)}`
      : `${proc.critMode} critDamage`;
  const coefficient = [
    toPercent(proc.coefficient),
    ...(proc.coefficientByMinEidolon ?? []).map((row) => `E${row.minEidolon}+ ${toPercent(row.coefficient)}`),
  ].join(" / ");
  return `${owner}.${proc.scalingStat} * ${coefficient} * damageBoost * ${crit} * DEF * RES * broken`;
}

function isSupportProcAlreadyApplied(proc, battleResult) {
  if (!proc.sourceEffectRowId) return false;
  return (battleResult?.appliedRows ?? []).some((row) => (
    row.ownerId === proc.ownerId
    && (row.effectRowId === proc.sourceEffectRowId || row.sourceTrace?.effectRowId === proc.sourceEffectRowId)
    && row.stat === proc.type
  ));
}

function resolveSupportProcCritMultiplier(proc, supportStats = {}, activeStats = {}, supportEidolon = 0) {
  if (proc.critMode === "none") return 1;
  if (proc.critMode === "fixed") return resolveSupportProcFixedCritMultiplier(proc, supportEidolon);
  const stats = proc.critMode === "active" ? activeStats : supportStats;
  return 1 + Number(stats.critDamage ?? 0);
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

function getAttackDamageStatKey(attackType) {
  return {
    basic: "basicDamage",
    skill: "skillDamage",
    ultimate: "ultimateDamage",
    follow_up: "followDamage",
    memosprite: null,
    dot: "dotDamage",
  }[attackType] ?? null;
}

function calculateSupportDefenseMultiplier(enemyLevel = 95, defenseIgnore = 0) {
  const attackerLevel = 80;
  const attackerTerm = attackerLevel + 20;
  const enemyTerm = (Number(enemyLevel ?? 95) + 20) * (1 - supportClamp(defenseIgnore, 0, 0.95));
  return attackerTerm / (attackerTerm + enemyTerm);
}

function calculateSupportResistanceMultiplier(enemyResistance = 20, resistancePen = 0) {
  const resistance = Number(enemyResistance ?? 20) / 100;
  return supportClamp(1 - resistance + supportNumber(resistancePen), 0.1, 2);
}

function calculateSupportBrokenMultiplier(enemy = {}) {
  return enemy?.isBroken === false ? 0.9 : 1;
}

function supportNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function supportClamp(value, min, max) {
  return Math.min(Math.max(supportNumber(value), min), max);
}

function isAllyPolicy(policy) {
  const normalized = String(policy ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  return normalized === "all_allies" || normalized === "allallies" || normalized === "single_ally" || normalized === "singleally";
}

function getCharacter(characterId) {
  return (characterIdentity.rows ?? []).find((row) => row.characterId === characterId) ?? null;
}

function getDefaultBuild(characterId) {
  return defaultCharacterBuilds.builds?.[characterId] ?? null;
}

function round(value, digits = 0) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Number(number.toFixed(digits)) : 0;
}

function toPercent(value) {
  const number = Number(value ?? 0);
  return `${round(number * 100, 1)}%`;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function buildMarkdownReport(report) {
  const lines = [
    "# Support Damage Proc Audit",
    "",
    `Generated at: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- supportDamageProcs rows: ${report.summary.supportDamageProcRows}`,
    `- supportDamageProcs owners: ${report.summary.supportDamageProcOwners}`,
    `- ally trueDamageRatio ledger rows: ${report.summary.trueDamageLedgerCandidates}`,
    `- failed proc checks: ${report.summary.failedProcChecks}`,
    `- failed ledger checks: ${report.summary.failedLedgerChecks}`,
    `- failed modifier checks: ${report.summary.failedModifierChecks}`,
    "",
    "## Explicit support-damage procs",
    "",
    "| owner | type | eidolon | trigger | formula | path | E0 blocked | skill card | contribution sourceRows | skill detail | delta | source |",
    "| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | ---: | --- |",
    ...report.supportDamageProcs.map((row) => [
      row.ownerName,
      row.type,
      row.requiredEidolon ? `E${row.requiredEidolon}+` : "E0+",
      row.triggerAttackTypes.join(", "),
      row.formula,
      row.handledByLedger ? "ledger" : "support-proc",
      row.e0Blocked ? "YES" : "NO",
      row.inSkillCardDamage ? "YES" : "NO",
      row.inContributionSourceRows ? "YES" : "NO",
      row.inSkillDetailContribution ? "YES" : "NO",
      row.displayDamageDelta,
      row.sourceEffectRowId,
    ].map(escapeMdCell).join(" | ")).map((line) => `| ${line} |`),
    "",
    "## Ally trueDamageRatio ledger rows",
    "",
    "| owner | effect | eidolon | applied | card true damage | contribution sourceRows | skill detail | value |",
    "| --- | --- | ---: | --- | --- | --- | --- | ---: |",
    ...report.allyTrueDamageLedgerRows.map((row) => [
      row.ownerName,
      row.effectRowId,
      row.testEidolon,
      row.appliedRows ? "YES" : "NO",
      row.inSkillCardDamage ? "YES" : "NO",
      row.inContributionSourceRows ? "YES" : "NO",
      row.inSkillDetailContribution ? "YES" : "NO",
      row.damageModifierValue,
    ].map(escapeMdCell).join(" | ")).map((line) => `| ${line} |`),
    "",
    "## Modifier checks",
    "",
    "| name | pass | base | with modifiers |",
    "| --- | --- | ---: | ---: |",
    ...report.modifierChecks.map((row) => [
      row.name,
      row.pass ? "YES" : "NO",
      row.baseDamage,
      row.withDebuffsDamage,
    ].map(escapeMdCell).join(" | ")).map((line) => `| ${line} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function escapeMdCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

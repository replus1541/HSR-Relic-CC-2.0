import fs from "node:fs";
import { calculateBattleFinalStats } from "../src/calculator/battle-final-stat-calculator.js";
import { buildDamageContributionViews } from "../src/calculator/battle-stat-evaluation.js";
import { calculateSkillDamageCards } from "../src/calculator/skill-damage-calculator.js";

const characterIdentity = readJson("data/generated/character-identity.json");
const characterStatBaseline = readJson("data/generated/character-stat-baseline.json");
const equipmentStatModel = readJson("data/generated/equipment-stat-model.json");
const defaultCharacterBuilds = readJson("data/generated/default-character-builds.json");
const lightconeCandidates = readJson("data/legacy-reference/game-db/lightcone-effect-candidates.json");
const combatLedgerSample = readJson("data/generated/combat-ledger-sample.json");
const battleEffectMetadata = readJson("data/generated/battle-effect-metadata.json");
const skillDamageMetadata = readJson("data/generated/skill-damage-metadata.json");
const characterStateControls = readJson("data/curated/character-state-controls.json");

const scenarios = [
  { active: "PlayerBoy_20", party: ["PlayerBoy_20", "Sparkle_00", "Sunday_10", "RuanMei_00"], owners: ["Sparkle_00"] },
  { active: "Ren_00", party: ["Ren_00", "Hyacine_00", "Sparkle_00", "Sunday_10"], owners: ["Ren_00", "Hyacine_00", "Sparkle_00"] },
  { active: "Mydeimos_00", party: ["Mydeimos_00", "Hyacine_00", "Sparkle_00", "Sunday_10"], owners: ["Mydeimos_00", "Hyacine_00", "Sparkle_00"] },
  { active: "Jingliu_00", party: ["Jingliu_00", "Sparkle_00", "Sunday_10", "RuanMei_00"], owners: ["Jingliu_00", "Sparkle_00"] },
];

for (const scenario of scenarios) {
  const result = calculateFor(scenario.active, scenario.party);
  console.log(`\n# active=${scenario.active} party=${scenario.party.join(",")}`);
  console.log(`skills=${result.skillCards.map((card) => `${card.attackType}:${card.title}:${Math.round(card.critDamage)}`).join(" | ")}`);
  for (const ownerId of scenario.owners) {
    const applied = result.battleResult.appliedRows.filter((row) => row.ownerId === ownerId);
    const skipped = result.battleResult.skippedRows.filter((row) => row.ownerId === ownerId);
    console.log(`owner=${ownerId} applied=${applied.length} skipped=${skipped.length}`);
    for (const row of applied) {
      const effectId = row.effectRowId ?? row.sourceTrace?.effectRowId;
      console.log(`  applied ${effectId} stat=${row.stat} value=${round(row.resolvedValue, 4)} target=${row.targetPolicy} label=${row.metadata?.sourceDisplayLabel ?? row.sourceLabel}`);
    }
    for (const row of skipped.slice(0, 8)) {
      const effectId = row.effectRowId ?? row.sourceTrace?.effectRowId;
      console.log(`  skipped ${effectId} stat=${row.stat} value=${round(row.resolvedValue, 4)} target=${row.targetPolicy} reason=${row.currentBattleSkippedReason}`);
    }
  }
  const contributionViews = buildDamageContributionViews({
    battleResult: result.battleResult,
    skillCards: result.skillCards,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy: { count: 3, level: 95, toughness: 90, resistance: 20 },
  });
  for (const ownerId of scenario.owners) {
    const rows = contributionViews.sourceRows.filter((row) => row.ownerId === ownerId);
    console.log(`contrib owner=${ownerId} rows=${rows.length}`);
    for (const row of rows) {
      console.log(`  contrib stat=${row.stat} value=${round(row.value, 4)} contribution=${Math.round(row.contributionValue ?? 0)} label=${row.label}`);
    }
  }
}

function calculateFor(activeCharacterId, partyCharacterIds) {
  const party = partyCharacterIds.map((characterId, index) => ({
    slotId: `slot-${index + 1}`,
    characterId,
    eidolon: characterId === "Sparkle_00" ? 6 : 0,
  }));
  const battleResult = calculateBattleFinalStats({
    party,
    activeSlotId: "slot-1",
    characterGetter: getCharacter,
    defaultBuildGetter: getDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones: lightconeCandidates.lightCones ?? [],
    ledgerRows: combatLedgerSample.rows ?? combatLedgerSample.ledgerRows ?? [],
    effectMetadataRows: battleEffectMetadata.rows ?? [],
    scenarioSettings: {},
    stateControls: characterStateControls.controls ?? [],
  });
  const skillCards = calculateSkillDamageCards({
    battleResult,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy: { count: 3, level: 95, toughness: 90, resistance: 20 },
    scenarioSettings: {},
  });
  return { battleResult, skillCards };
}

function getCharacter(characterId) {
  return (characterIdentity.rows ?? []).find((row) => row.characterId === characterId) ?? null;
}

function getDefaultBuild(characterId) {
  return defaultCharacterBuilds.builds?.[characterId] ?? null;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function round(value, digits = 2) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toFixed(digits) : "0";
}

import fs from "node:fs";
import { calculateBattleFinalStats } from "../src/calculator/battle-final-stat-calculator.js";
import { buildBattleStatEvaluation, buildDamageContributionViews } from "../src/calculator/battle-stat-evaluation.js";
import { buildLightConeEffectRows } from "../src/calculator/lightcone-effect-ledger.js";
import { calculateSkillDamageCards } from "../src/calculator/skill-damage-calculator.js";

const characterIdentity = readJson("data/generated/character-identity.json");
const characterStatBaseline = readJson("data/generated/character-stat-baseline.json");
const equipmentStatModel = readJson("data/generated/equipment-stat-model.json");
const defaultCharacterBuilds = readJson("data/generated/default-character-builds.json");
const customRelicTypeProfiles = readJson("data/curated/custom-relic-type-profiles.json");
const lightconeCandidates = readJson("data/legacy-reference/game-db/lightcone-effect-candidates.json");
const combatLedgerSample = readJson("data/generated/combat-ledger-sample.json");
const battleEffectMetadata = readJson("data/generated/battle-effect-metadata.json");
const hoyowikiSourceEffectSupplements = readJson("data/generated/hoyowiki-source-effect-supplements.json");
const battleEffectSupplements = readJson("data/curated/battle-effect-supplements.json");
const skillDamageMetadata = readJson("data/generated/skill-damage-metadata.json");
const characterStateControls = readJson("data/curated/character-state-controls.json");

const enemy = { count: 3, level: 95, toughness: 90, resistance: 20 };
const checks = [];
const samples = [];
const supersededGeneratedEffectRowIds = new Set(hoyowikiSourceEffectSupplements.supersedesEffectRowIds ?? []);
const excludedEffectRowIds = new Set([
  "effect:MortenaxBlade_00:0",
  "effect:Jingliu_00:hoyowiki-source:E4:달의_검을_쥐고:allDamage:1",
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

checkNormalFollowUp();
checkDot();
checkBreak();
checkSuperBreak();
checkSuperBreakStateMultiplier();
checkElationCertifiedBanger();
checkYaoGuangE6Merrymake();
checkElationStatSources();
checkYaoGuangInitialSpeedElationTrace();
checkElationProfilesUseElationStats();
checkSparxieSkillEnhancementStacks();
checkCharacterStateControlCatalog();
checkCharacterStateControlsResolveEffectRows();
checkCipherRecordedTrueDamage();
checkTrueDamageRatio();
checkLightConeTeamCritBuffs();
checkLightConeSelfStatsNotDuplicated();
checkSilverWolf999DefaultLightCone();
checkElationDefaultBuildMainStats();
checkEnhancedBasicAttackDisplayOrder();
checkSilverWolf999BasicAttackSplit();
checkCritBuffsVisibleForSupportProfiles();
checkTrailblazerCritBuffVisibleForAllyDealer();
checkTrailblazerMimiSupportTrueDamageVisibleForAllyDealer();
checkHyacineSpeedSources();
checkAllySpeedBuffRouting();
checkLightConeSpeedBuffRouting();
checkMortenaxBladeDefenseDownDeduped();
checkJingliuMoonlightRows();
checkAshveilDefenseDownDeduped();
checkCerydraMilitaryMeritAtkRatio();

const failed = checks.filter((check) => !check.pass);
const reportText = [
  "# Damage Formula Validation",
  "",
  `Generated at: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- checks: ${checks.length}`,
  `- failed: ${failed.length}`,
  `- formula counts: ${Object.entries(countBy(skillDamageMetadata.rows ?? [], (row) => row.damageFormulaType)).map(([key, value]) => `${key}=${value}`).join(", ")}`,
  "",
  "## Checks",
  "",
  ...checks.map((check) => `- ${check.pass ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`),
  "",
  "## Samples",
  "",
  ...samples.map((sample) => `- ${sample}`),
  "",
].join("\n");

if (process.env.WRITE_DAMAGE_FORMULA_REPORT === "1") {
  fs.mkdirSync("reports/calculation", { recursive: true });
  fs.writeFileSync("reports/calculation/damage-formula-validation.md", reportText);
}

if (failed.length) {
  console.error(`damage formula validation failed: ${failed.map((check) => check.name).join(", ")}`);
  process.exit(1);
}

console.log(`damage formula validation ok: checks=${checks.length}`);
console.log(`formula counts: ${Object.entries(countBy(skillDamageMetadata.rows ?? [], (row) => row.damageFormulaType)).map(([key, value]) => `${key}=${value}`).join(", ")}`);
for (const sample of samples) console.log(`sample: ${sample}`);

function checkNormalFollowUp() {
  const card = getCard("Feixiao_00", (row) => row.attackType === "follow_up");
  record("normal follow-up stays normal", card?.damageFormulaType === "normal", `${card?.title ?? "-"} => ${card?.damageFormulaType ?? "missing"}`);
  samples.push(`Feixiao follow-up: formula=${card?.damageFormulaType}, usesCrit=${card?.trace?.usesCrit}`);
}

function checkDot() {
  const card = getCard("Kafka_00", (row) => row.attackType === "dot" || row.attackType === "ultimate" || row.attackType === "skill");
  record("DoT skips crit", card?.damageFormulaType === "dot" && card?.trace?.usesCrit === false, `${card?.title ?? "-"} formula=${card?.damageFormulaType} usesCrit=${card?.trace?.usesCrit}`);
  samples.push(`Kafka sample: formula=${card?.damageFormulaType}, crit=${round(card?.critDamage)}, expected=${round(card?.expectedDamage)}`);
}

function checkBreak() {
  const card = getCard("Gallagher_00", (row) => row.damageFormulaType === "break");
  record("break skips crit and normal damage boost", card?.trace?.usesCrit === false && Number(card?.trace?.damageBoost ?? 0) === 0, `${card?.title ?? "-"} usesCrit=${card?.trace?.usesCrit} damageBoost=${card?.trace?.damageBoost}`);
  samples.push(`Gallagher break: formula=${card?.damageFormulaType}, damage=${round(card?.critDamage)}`);
}

function checkSuperBreak() {
  const card = getCard("Rappa_00", (row) => row.damageFormulaType === "super_break");
  record("super break mapped and skips crit", card?.damageFormulaType === "super_break" && card?.trace?.usesCrit === false, `${card?.title ?? "-"} formula=${card?.damageFormulaType} usesCrit=${card?.trace?.usesCrit}`);
  samples.push(`Rappa super_break: formula=${card?.damageFormulaType}, damage=${round(card?.critDamage)}`);
}

function checkSuperBreakStateMultiplier() {
  const base = getCard("Rappa_00", (row) => row.damageFormulaType === "super_break", { superBreakToughnessMultiplier: 1 });
  const boosted = getCard("Rappa_00", (row) => row.damageFormulaType === "super_break", { superBreakToughnessMultiplier: 1.4 });
  record(
    "super break state multiplier changes damage",
    Number(boosted?.critDamage ?? 0) > Number(base?.critDamage ?? 0),
    `${base?.title ?? "-"} x1=${round(base?.critDamage)} x1.4=${round(boosted?.critDamage)}`,
  );
  samples.push(`Rappa super_break state: x1=${round(base?.critDamage)}, x1.4=${round(boosted?.critDamage)}`);
}

function checkElationCertifiedBanger() {
  const base = getCard("Sparxie_00", (row) => row.damageFormulaType === "elation", { "elationCertifiedBangerStacks:Sparxie_00": 0 });
  const stacked = getCard("Sparxie_00", (row) => row.damageFormulaType === "elation", { "elationCertifiedBangerStacks:Sparxie_00": 500 });
  record(
    "elation Certified Banger uses per-character 0-500 stacks",
    Number(stacked?.critDamage ?? 0) > Number(base?.critDamage ?? 0),
    `${base?.title ?? "-"} 0=${round(base?.critDamage)} 500=${round(stacked?.critDamage)} multiplier=${round(stacked?.trace?.elationModifiers?.punchlineMultiplier, 3)}`,
  );
  samples.push(`Sparxie elation: 0=${round(base?.critDamage)}, 500=${round(stacked?.critDamage)}, punchlineMultiplier=${round(stacked?.trace?.elationModifiers?.punchlineMultiplier, 3)}`);
}

function checkYaoGuangE6Merrymake() {
  const e0 = calculateFor("Sparxie_00", [
    { characterId: "Sparxie_00" },
    { characterId: "YaoGuang_00", eidolon: 0 },
  ], { "elationCertifiedBangerStacks:Sparxie_00": 100 });
  const e6 = calculateFor("Sparxie_00", [
    { characterId: "Sparxie_00" },
    { characterId: "YaoGuang_00", eidolon: 6 },
  ], { "elationCertifiedBangerStacks:Sparxie_00": 100 });
  const e6Row = e6.battleResult.appliedRows.find((row) => (
    row.ownerId === "YaoGuang_00"
    && row.stat === "merrymake"
    && (row.sourceTrace?.effectRowId ?? row.effectRowId) === "effect:YaoGuang_00:supplement:E6:merrymake"
  ));
  const e0Card = e0.skillCards.find((card) => card.damageFormulaType === "elation");
  const e6Card = e6.skillCards.find((card) => card.damageFormulaType === "elation");
  record(
    "YaoGuang E6 is the only 증소 source",
    !e0.battleResult.appliedRows.some((row) => row.stat === "merrymake")
      && Number(e6Row?.resolvedValue ?? 0) === 0.25
      && Number(e6Card?.trace?.elationModifiers?.merrymake ?? 0) === 0.25
      && Number(e6Card?.critDamage ?? 0) > Number(e0Card?.critDamage ?? 0),
    `E0 rows=${e0.battleResult.appliedRows.filter((row) => row.stat === "merrymake").length} E6=${round(e6Row?.resolvedValue, 3)} damage ${round(e0Card?.critDamage)}->${round(e6Card?.critDamage)}`,
  );
  samples.push(`YaoGuang E6 증소: value=${round(e6Row?.resolvedValue, 3)}, damage ${round(e0Card?.critDamage)}->${round(e6Card?.critDamage)}`);
}

function checkElationStatSources() {
  const elationOrnament = (equipmentStatModel.relicSets ?? []).find((set) => set.id === "wiki-relic-5012");
  const elationSupportSet = (equipmentStatModel.relicSets ?? []).find((set) => set.id === "wiki-relic-4769");
  const traceElation = Object.fromEntries(["SilverWolf999_00", "Evanescia_00", "Sparxie_00", "PlayerBoy_40", "YaoGuang_00"].map((characterId) => {
    const row = (characterStatBaseline.rows ?? []).find((row) => row.characterId === characterId);
    const total = (row?.traceEntries ?? [])
      .filter((entry) => entry.stat === "elation")
      .reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);
    return [characterId, total];
  }));
  const base = calculateFor("Sparxie_00", [{ characterId: "Sparxie_00" }], { "elationCertifiedBangerStacks:Sparxie_00": 100 });
  const e2YaoGuang = calculateFor("Sparxie_00", [
    { characterId: "Sparxie_00" },
    { characterId: "YaoGuang_00", eidolon: 2 },
  ], { "elationCertifiedBangerStacks:Sparxie_00": 100 });
  const e2Row = e2YaoGuang.battleResult.appliedRows.find((row) => (
    row.ownerId === "YaoGuang_00"
    && row.stat === "elation"
    && Number(row.resolvedValue ?? 0) === 16
  ));
  const relicRow = e2YaoGuang.battleResult.appliedRows.find((row) => (
    row.ownerId === "YaoGuang_00"
    && row.stat === "elation"
    && Number(row.resolvedValue ?? 0) === 10
    && String(row.sourceTrace?.effectRowId ?? row.effectRowId ?? "").includes("wiki-relic-4769")
  ));
  const sparxieDynamicRow = base.battleResult.appliedRows.find((row) => (
    row.ownerId === "Sparxie_00"
    && row.stat === "elation"
    && (row.sourceTrace?.effectRowId ?? row.effectRowId) === "effect:Sparxie_00:supplement:P06:elationByAtk"
  ));
  const boostedCard = e2YaoGuang.skillCards.find((card) => card.damageFormulaType === "elation");
  const actualMultiplier = Number(boostedCard?.trace?.elationModifiers?.elation ?? 0);
  const expectedBaseElation = traceElation.Sparxie_00
    + Number(elationOrnament?.twoPieceStats?.elation ?? 0)
    + Number(sparxieDynamicRow?.resolvedValue ?? 0);
  const expectedBoostedElation = expectedBaseElation
    + Number(e2Row?.resolvedValue ?? 0)
    + Number(relicRow?.resolvedValue ?? 0);
  const zeroElationCard = calculateSkillDamageCards({
    battleResult: {
      ...base.battleResult,
      finalStats: { ...(base.battleResult.finalStats ?? {}), elation: 0 },
      damageModifiers: { ...(base.battleResult.damageModifiers ?? {}), elation: 0 },
    },
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings: { "elationCertifiedBangerStacks:Sparxie_00": 100 },
  }).find((card) => card.damageFormulaType === "elation");
  const fortyElationCard = calculateSkillDamageCards({
    battleResult: {
      ...base.battleResult,
      finalStats: { ...(base.battleResult.finalStats ?? {}), elation: 40 },
      damageModifiers: { ...(base.battleResult.damageModifiers ?? {}), elation: 0 },
    },
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings: { "elationCertifiedBangerStacks:Sparxie_00": 100 },
  }).find((card) => card.damageFormulaType === "elation");
  const zeroElationModifier = Number(zeroElationCard?.trace?.elationModifiers?.elation ?? 0);
  const fortyElationModifier = Number(fortyElationCard?.trace?.elationModifiers?.elation ?? 0);
  record(
    "elation stat sources use integer points",
    traceElation.SilverWolf999_00 === 10
      && traceElation.Evanescia_00 === 18
      && traceElation.Sparxie_00 === 28
      && traceElation.PlayerBoy_40 === 0
      && traceElation.YaoGuang_00 === 10
      && Number(base.battleResult.finalStats?.elation ?? 0) === expectedBaseElation
      && Number(elationOrnament?.twoPieceStats?.elation ?? 0) === 8
      && !("elation" in (elationSupportSet?.fourPieceStats ?? {}))
      && Boolean(e2Row)
      && Boolean(relicRow)
      && Boolean(sparxieDynamicRow)
      && actualMultiplier === expectedBoostedElation
      && zeroElationModifier === 0
      && fortyElationModifier === 40,
    `trace=${Object.entries(traceElation).map(([key, value]) => `${key}:${round(value)}`).join(",")} final=${round(base.battleResult.finalStats?.elation)} dynamic=${round(sparxieDynamicRow?.resolvedValue)} ornament=${elationOrnament?.twoPieceStats?.elation ?? "-"} supportSelf=${elationSupportSet?.fourPieceStats?.elation ?? 0} YaoGuangE2=${round(e2Row?.resolvedValue)} relic=${round(relicRow?.resolvedValue)} formulaElation=${round(actualMultiplier)} expected=${round(expectedBoostedElation)} synthetic=${round(zeroElationModifier)}to${round(fortyElationModifier)}`,
  );
  samples.push(`Elation integer sources: Sparxie trace=${traceElation.Sparxie_00}, dynamic=${round(sparxieDynamicRow?.resolvedValue)}, ornament=${elationOrnament?.twoPieceStats?.elation}, YaoGuang E2=${round(e2Row?.resolvedValue)}, relic4=${round(relicRow?.resolvedValue)}, formulaElation=${round(actualMultiplier)}`);
}

function checkYaoGuangInitialSpeedElationTrace() {
  const result = calculateFor("YaoGuang_00", [{ characterId: "YaoGuang_00", eidolon: 6 }]);
  const selfDynamicTraceEntry = result.battleResult.self.entries.find((entry) => (
    entry.stat === "elation"
    && entry.sourceOrigin === "curated-dynamic-trace"
  ));
  const dynamicBattleRow = result.battleResult.appliedRows.find((row) => (
    (row.sourceTrace?.effectRowId ?? row.effectRowId) === "effect:YaoGuang_00:supplement:P06:elationBySpeed"
  ));
  const profile = getCustomTypeProfile("YaoGuang_00");
  const evaluation = buildBattleStatEvaluation({ battleResult: result.battleResult, customTypeProfile: profile, enemy });
  const elationRow = evaluation.groups.flatMap((group) => group.rows).find((row) => row.key === "elation");
  const sourceEntry = elationRow?.entries?.find((entry) => entry.effectRowId === "effect:YaoGuang_00:supplement:P06:elationBySpeed");
  const e2Row = result.battleResult.appliedRows.find((row) => (
    row.ownerId === "YaoGuang_00"
    && row.stat === "elation"
    && Number(row.resolvedValue ?? 0) === 16
  ));
  const relicRow = result.battleResult.appliedRows.find((row) => (
    row.ownerId === "YaoGuang_00"
    && row.stat === "elation"
    && Number(row.resolvedValue ?? 0) === 10
    && String(row.sourceTrace?.effectRowId ?? row.effectRowId ?? "").includes("wiki-relic-4769")
  ));
  const expectedDynamic = Number(result.battleResult.self.stats?.speed ?? 0) >= 120
    ? 30 + Math.min(200, Math.floor(Math.max(0, Number(dynamicBattleRow?.runtimeResolution?.sourceStatValue ?? result.battleResult.self.stats?.speed ?? 0) - 120)))
    : 0;
  const expectedFinal = 10 + expectedDynamic + Number(e2Row?.resolvedValue ?? 0) + Number(relicRow?.resolvedValue ?? 0);
  record(
    "YaoGuang speed elation is runtime-resolved from final source stats",
    Number(result.battleResult.self.stats?.speed ?? 0) >= 200
      && !selfDynamicTraceEntry
      && Number(dynamicBattleRow?.resolvedValue ?? 0) === expectedDynamic
      && Number(result.battleResult.self.stats?.elation ?? 0) === 10
      && Number(result.battleResult.finalStats?.elation ?? 0) === expectedFinal
      && Boolean(sourceEntry)
      && dynamicBattleRow?.runtimeResolution?.sourceStat === "speed",
    `speed=${round(result.battleResult.self.stats?.speed, 1)} dynamic=${round(dynamicBattleRow?.resolvedValue)} self=${round(result.battleResult.self.stats?.elation)} final=${round(result.battleResult.finalStats?.elation)} source=${Boolean(sourceEntry)} selfDynamic=${Boolean(selfDynamicTraceEntry)}`,
  );
  samples.push(`YaoGuang speed elation: speed=${round(result.battleResult.self.stats?.speed, 1)}, dynamic=${round(dynamicBattleRow?.resolvedValue)}, final=${round(result.battleResult.finalStats?.elation)}`);
}

function checkElationProfilesUseElationStats() {
  const elationDealers = ["SilverWolf999_00", "Sparxie_00", "Evanescia_00"];
  const profilePass = elationDealers.every((characterId) => {
    const profile = getCustomTypeProfile(characterId);
    return profile?.uiTypeProfile?.roleClass === "환락 / 치확 딜러"
      && profile?.uiTypeProfile?.damageTemplate === "elation-crit"
      && profile?.uiTypeProfile?.usesDamageBonus === false;
  });
  const sparxie = calculateFor("Sparxie_00", [
    { characterId: "Sparxie_00" },
    { characterId: "YaoGuang_00", eidolon: 6 },
  ], { "elationCertifiedBangerStacks:Sparxie_00": 100 });
  const profile = getCustomTypeProfile("Sparxie_00");
  const evaluation = buildBattleStatEvaluation({ battleResult: sparxie.battleResult, customTypeProfile: profile, enemy });
  const primaryKeyOrder = evaluation.groups.find((group) => group.key === "primaryStats")?.rows.map((row) => row.key) ?? [];
  const primaryKeys = new Set(primaryKeyOrder);
  const hasDamageBonusGroup = evaluation.groups.some((group) => group.key === "damageBonusGroup");
  const supportProfile = getCustomTypeProfile("YaoGuang_00");
  record(
    "Elation profiles show elation stats instead of elemental damage",
    profilePass
      && primaryKeys.has("elation")
      && primaryKeyOrder.indexOf("atk") > primaryKeyOrder.indexOf("elation")
      && primaryKeyOrder.indexOf("atk") < primaryKeyOrder.indexOf("speed")
      && !primaryKeys.has("elementDamage")
      && !hasDamageBonusGroup
      && supportProfile?.uiTypeProfile?.damageTemplate === "elation-support"
      && supportProfile?.uiTypeProfile?.usesDamageBonus === false,
    `dealers=${profilePass} primary=${primaryKeyOrder.join(",")} damageBonusGroup=${hasDamageBonusGroup} support=${supportProfile?.uiTypeProfile?.damageTemplate}`,
  );
  samples.push(`Elation profile stats: primary=${primaryKeyOrder.join("/")}, damageBonusGroup=${hasDamageBonusGroup}`);
}

function checkSparxieSkillEnhancementStacks() {
  const low = calculateFor("Sparxie_00", [{ characterId: "Sparxie_00" }], { sparxieSkillEnhancementStacks: 4 });
  const high = calculateFor("Sparxie_00", [{ characterId: "Sparxie_00" }], { sparxieSkillEnhancementStacks: 12 });
  const lowSkill = low.skillCards.find((card) => card.skillId === "Sparxie_00:Skill02");
  const highSkill = high.skillCards.find((card) => card.skillId === "Sparxie_00:Skill02");
  const lowTalent = low.skillCards.find((card) => card.skillId === "Sparxie_00:Skill04");
  const highTalent = high.skillCards.find((card) => card.skillId === "Sparxie_00:Skill04");
  const control = (characterStateControls.controls ?? []).find((item) => item.key === "sparxieSkillEnhancementStacks");
  const hiddenScoreControl = (characterStateControls.controls ?? []).find((item) => item.key === "silverWolf999HiddenScore");
  record(
    "Sparxie and Silver Wolf stack controls are active dealer only",
    control?.scope === "activeCharacter"
      && control?.characterId === "Sparxie_00"
      && JSON.stringify(control?.options) === JSON.stringify([4, 6, 8, 10, 12])
      && hiddenScoreControl?.scope === "activeCharacter"
      && hiddenScoreControl?.characterId === "SilverWolf999_00"
      && Number(highSkill?.critDamage ?? 0) > Number(lowSkill?.critDamage ?? 0)
      && Number(highTalent?.critDamage ?? 0) > Number(lowTalent?.critDamage ?? 0),
    `Sparxie=${control?.scope}/${control?.characterId} SilverWolf=${hiddenScoreControl?.scope}/${hiddenScoreControl?.characterId} skill ${round(lowSkill?.critDamage)}->${round(highSkill?.critDamage)} talent ${round(lowTalent?.critDamage)}->${round(highTalent?.critDamage)}`,
  );
  samples.push(`Sparxie skill enhancement stacks: skill ${round(lowSkill?.critDamage)}->${round(highSkill?.critDamage)}, talent ${round(lowTalent?.critDamage)}->${round(highTalent?.critDamage)}`);
}

function checkCharacterStateControlCatalog() {
  const keys = new Set((characterStateControls.controls ?? []).map((control) => control.key));
  const requiredKeys = [
    "blackSwanArcanaStacks",
    "elationCertifiedBangerStacks",
    "sparxieSkillEnhancementStacks",
    "cipherRecordedDamage",
    "superBreakToughnessMultiplier",
    "trailblazerDestructionBreakStacks",
    "astaChargeStacks",
    "drRatioDeductionStacks",
  ];
  const missing = requiredKeys.filter((key) => !keys.has(key));
  record(
    "character state control catalog contains required controls",
    missing.length === 0,
    missing.length ? `missing=${missing.join(",")}` : `keys=${requiredKeys.join(",")}`,
  );
}

function checkCharacterStateControlsResolveEffectRows() {
  const lowAsta = calculateFor("PlayerBoy_20", ["PlayerBoy_20", "Asta_00"], { astaChargeStacks: 3 });
  const highAsta = calculateFor("PlayerBoy_20", ["PlayerBoy_20", "Asta_00"], { astaChargeStacks: 5 });
  const lowAtkRatio = Number(lowAsta.battleResult.battleTotals?.atkRatio ?? 0);
  const highAtkRatio = Number(highAsta.battleResult.battleTotals?.atkRatio ?? 0);
  const trailblazer = calculateFor("PlayerBoy_00", ["PlayerBoy_00"], { trailblazerDestructionBreakStacks: 2 });
  const trailblazerRow = trailblazer.battleResult.appliedRows.find((row) => (row.effectRowId ?? row.sourceTrace?.effectRowId) === "effect:PlayerBoy_00:0");
  record(
    "character state controls resolve dynamic effect rows",
    highAtkRatio > lowAtkRatio && Number(trailblazerRow?.resolvedValue ?? 0) === 0.2,
    `Asta atkRatio 3=${round(lowAtkRatio, 3)} 5=${round(highAtkRatio, 3)} Trailblazer=${round(trailblazerRow?.resolvedValue, 3)}`,
  );
  samples.push(`State controls: Asta 3=${round(lowAtkRatio, 3)}, Asta 5=${round(highAtkRatio, 3)}, Trailblazer stacks=${round(trailblazerRow?.resolvedValue, 3)}`);
}

function checkCipherRecordedTrueDamage() {
  const base = getCard("Cipher_00", (row) => row.attackType === "ultimate", { cipherRecordedDamage: 0 });
  const recorded = getCard("Cipher_00", (row) => row.attackType === "ultimate", { cipherRecordedDamage: 100000 });
  const delta = Number(recorded?.critDamage ?? 0) - Number(base?.critDamage ?? 0);
  record(
    "Cipher recorded damage adds ultimate true damage",
    Math.abs(delta - 100000) < 1 && Number(recorded?.trace?.recordedTrueDamage ?? 0) === 100000,
    `${base?.title ?? "-"} base=${round(base?.critDamage)} recorded=${round(recorded?.critDamage)} delta=${round(delta)} trace=${round(recorded?.trace?.recordedTrueDamage)}`,
  );
  samples.push(`Cipher recorded true damage: base=${round(base?.critDamage)}, recorded=${round(recorded?.critDamage)}, delta=${round(delta)}`);
}

function checkTrueDamageRatio() {
  const withoutCyrene = calculateFor("PlayerBoy_20", ["PlayerBoy_20"]);
  const withCyrene = calculateFor("PlayerBoy_20", ["PlayerBoy_20", "Cyrene_00"]);
  const baseCard = withoutCyrene.skillCards[0];
  const trueCard = withCyrene.skillCards.find((card) => card.id === baseCard?.id);
  const contributionViews = buildDamageContributionViews({
    battleResult: withCyrene.battleResult,
    skillCards: withCyrene.skillCards,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
  });
  const trueRows = contributionViews.sourceRows.filter((row) => row.stat === "trueDamageRatio");
  record(
    "true damage ratio adds post-final damage",
    Number(trueCard?.trueDamage ?? 0) > 0 && Number(trueCard?.critDamage ?? 0) > Number(baseCard?.critDamage ?? 0) && trueRows.some((row) => Number(row.contributionValue ?? 0) > 0),
    `base=${round(baseCard?.critDamage)} withTrue=${round(trueCard?.critDamage)} trueDamage=${round(trueCard?.trueDamage)} trueRows=${trueRows.length}`,
  );
  samples.push(`Cyrene trueDamageRatio: base=${round(baseCard?.critDamage)}, with=${round(trueCard?.critDamage)}, true=${round(trueCard?.trueDamage)}`);
}

function checkLightConeTeamCritBuffs() {
  const base = calculateFor("PlayerBoy_20", ["PlayerBoy_20", "Sparkle_00"]);
  const withSparkleLightCone = calculateFor("PlayerBoy_20", [
    "PlayerBoy_20",
    { characterId: "Sparkle_00", lightconeId: "wiki-1936", lightconeRank: 1 },
  ]);
  const critRateDelta = Number(withSparkleLightCone.battleResult.finalStats?.critRate ?? 0) - Number(base.battleResult.finalStats?.critRate ?? 0);
  const critDamageDelta = Number(withSparkleLightCone.battleResult.finalStats?.critDamage ?? 0) - Number(base.battleResult.finalStats?.critDamage ?? 0);
  const lightconeRows = withSparkleLightCone.battleResult.appliedRows.filter((row) => row.effectType === "lightcone" || row.metadata?.effectType === "lightcone");
  record(
    "Sparkle signature light cone team crit buffs apply",
    Math.abs(critRateDelta - 0.1) < 1e-6 && Math.abs(critDamageDelta - 0.28) < 1e-6 && lightconeRows.length >= 2,
    `critRateDelta=${round(critRateDelta, 3)} critDamageDelta=${round(critDamageDelta, 3)} lightconeRows=${lightconeRows.length}`,
  );
  samples.push(`Sparkle LC team crit: CR +${round(critRateDelta, 3)}, CD +${round(critDamageDelta, 3)}`);
}

function checkLightConeSelfStatsNotDuplicated() {
  const result = calculateFor("DanHengIL_00", [
    { characterId: "DanHengIL_00", lightconeId: "wiki-1398", lightconeRank: 1 },
  ]);
  const selfCritRows = result.battleResult.self.entries.filter((entry) => (
    entry.stat === "critRate"
    && String(entry.source ?? "").includes("태양보다 밝게 빛나는 것")
  ));
  const ledgerCritRows = result.battleResult.appliedRows.filter((row) => (
    row.category === "lightcone"
    && row.sourceTrace?.lightConeId === "wiki-1398"
    && row.stat === "critRate"
  ));
  const selfCritTotal = selfCritRows.reduce((sum, row) => sum + Number(row.value ?? 0), 0);
  record(
    "Light cone self stats are not duplicated between equipment and ledger",
    selfCritRows.length === 1 && Math.abs(selfCritTotal - 0.18) < 1e-6 && ledgerCritRows.length === 0,
    `selfRows=${selfCritRows.length} selfTotal=${round(selfCritTotal, 3)} ledgerRows=${ledgerCritRows.length}`,
  );
  samples.push(`Dan Heng IL LC critRate: selfRows=${selfCritRows.length}, selfTotal=${round(selfCritTotal, 3)}, ledgerRows=${ledgerCritRows.length}`);
}

function checkSilverWolf999DefaultLightCone() {
  const build = defaultCharacterBuilds.builds?.SilverWolf999_00;
  const selected = build?.selectedLightCone;
  const recommendedIds = (build?.recommendedLightCones ?? []).map((item) => item.id);
  record(
    "Silver Wolf 999 default light cone uses own Elation signature",
    selected?.id === "wiki-5218" && selected?.path === "elation" && recommendedIds[0] === "wiki-5218",
    `selected=${selected?.id}/${selected?.name} recommended=${recommendedIds.join(",")}`,
  );
  samples.push(`Silver Wolf 999 LC: ${selected?.id} ${selected?.name}`);
}

function checkElationDefaultBuildMainStats() {
  const silver = defaultCharacterBuilds.builds?.SilverWolf999_00;
  const sparxie = defaultCharacterBuilds.builds?.Sparxie_00;
  const yaoguang = defaultCharacterBuilds.builds?.YaoGuang_00;
  const silverResult = calculateFor("SilverWolf999_00", [{ characterId: "SilverWolf999_00", eidolon: 6 }]);
  const silverSelf = silverResult.battleResult.self.stats ?? {};
  record(
    "Elation default main stats match reviewed per-character builds",
    silver?.mainStats?.sphere === "hpRatio"
      && silver?.mainStats?.rope === "hpRatio"
      && sparxie?.mainStats?.sphere === "atkRatio"
      && sparxie?.mainStats?.rope === "atkRatio"
      && yaoguang?.mainStats?.sphere === "hpRatio"
      && yaoguang?.mainStats?.rope === "energyRegen"
      && Number(silverSelf.speed ?? 0) >= 200
      && Number(silverSelf.critRate ?? 0) >= 0.8
      && Number(silverSelf.critDamage ?? 0) >= 1.4,
    `Silver sphere=${silver?.mainStats?.sphere}/rope=${silver?.mainStats?.rope} speed=${round(silverSelf.speed, 1)} cr=${round(Number(silverSelf.critRate ?? 0) * 100, 1)} cd=${round(Number(silverSelf.critDamage ?? 0) * 100, 1)} Sparxie=${sparxie?.mainStats?.sphere}/${sparxie?.mainStats?.rope} YaoGuang=${yaoguang?.mainStats?.sphere}/${yaoguang?.mainStats?.rope}`,
  );
  samples.push(`Silver Wolf 999 default stats: speed=${round(silverSelf.speed, 1)}, CR=${round(Number(silverSelf.critRate ?? 0) * 100, 1)}%, CD=${round(Number(silverSelf.critDamage ?? 0) * 100, 1)}%`);
}

function checkEnhancedBasicAttackDisplayOrder() {
  const result = calculateFor("DanHengIL_00", ["DanHengIL_00"]);
  const basicCards = result.skillCards.filter((card) => card.attackType === "basic");
  const displayTypes = basicCards.map((card) => card.displayAttackType);
  record(
    "Multiple basic attacks display normal before enhanced",
    basicCards.length >= 2 && displayTypes[0] === "basic" && displayTypes[1] === "basic_enhanced",
    `displayTypes=${displayTypes.join(",")}`,
  );
  samples.push(`Dan Heng IL basic display order: ${displayTypes.join(" > ")}`);
}

function checkSilverWolf999BasicAttackSplit() {
  const result = calculateFor("SilverWolf999_00", [{ characterId: "SilverWolf999_00", eidolon: 6 }]);
  const normal = result.skillCards.find((card) => card.skillId === "SilverWolf999_00:Skill01");
  const enhanced = result.skillCards.find((card) => card.skillId === "SilverWolf999_00:Skill11");
  record(
    "Silver Wolf 999 normal basic stays single-target 110 percent at E6",
    normal?.targetProfile === "single"
      && normal?.targetScope === "single"
      && normal?.partCount === 1
      && Math.abs(Number(normal?.coefficient ?? 0) - 1.1) < 1e-9
      && Math.abs(Number(enhanced?.coefficient ?? 0) - 4.84) < 1e-9,
    `normal target=${normal?.targetProfile}/${normal?.targetScope} parts=${normal?.partCount} coeff=${round(Number(normal?.coefficient ?? 0) * 100, 1)} enhanced=${round(Number(enhanced?.coefficient ?? 0) * 100, 1)}`,
  );
  samples.push(`Silver Wolf 999 basics: normal=${round(Number(normal?.coefficient ?? 0) * 100, 1)}%, enhanced=${round(Number(enhanced?.coefficient ?? 0) * 100, 1)}%`);
}

function checkCritBuffsVisibleForSupportProfiles() {
  const result = calculateFor("PlayerBoy_20", [
    "PlayerBoy_20",
    { characterId: "Sparkle_00", lightconeId: "wiki-1936", lightconeRank: 1 },
  ]);
  const evaluation = buildBattleStatEvaluation({
    battleResult: result.battleResult,
    customTypeProfile: getCustomTypeProfile("PlayerBoy_20"),
    enemy,
  });
  const critRateRow = evaluation.groups.flatMap((group) => group.rows ?? []).find((row) => row.key === "critRate");
  const sourceLabels = (critRateRow?.entries ?? []).map((entry) => entry.label).join(" | ");
  record(
    "crit buffs are visible in major stat panel for support profiles",
    Boolean(critRateRow) && (critRateRow.entries ?? []).some((entry) => String(entry.label ?? "").includes("속세에서의 유희")),
    `critRateRow=${Boolean(critRateRow)} labels=${sourceLabels || "-"}`,
  );
}

function checkTrailblazerCritBuffVisibleForAllyDealer() {
  const result = calculateFor("Seele_00", [
    "Seele_00",
    { characterId: "PlayerBoy_20", eidolon: 1 },
  ]);
  const evaluation = buildBattleStatEvaluation({
    battleResult: result.battleResult,
    customTypeProfile: getCustomTypeProfile("Seele_00"),
    enemy,
  });
  const critRateRow = evaluation.groups.flatMap((group) => group.rows ?? []).find((row) => row.key === "critRate");
  const hasTrailblazerSource = (critRateRow?.entries ?? []).some((entry) => entry.ownerId === "PlayerBoy_20" && Number(entry.value ?? 0) > 0);
  record(
    "Remembrance Trailblazer ally crit buff is visible for active dealer",
    Boolean(critRateRow) && hasTrailblazerSource,
    `critRateRow=${Boolean(critRateRow)} trailblazerSource=${hasTrailblazerSource}`,
  );
}

function checkTrailblazerMimiSupportTrueDamageVisibleForAllyDealer() {
  const e0 = calculateFor("Seele_00", [
    "Seele_00",
    { characterId: "PlayerBoy_20", eidolon: 0 },
  ]);
  const e4 = calculateFor("Seele_00", [
    "Seele_00",
    { characterId: "PlayerBoy_20", eidolon: 4 },
  ]);
  const evaluation = buildBattleStatEvaluation({
    battleResult: e0.battleResult,
    customTypeProfile: getCustomTypeProfile("Seele_00"),
    enemy,
  });
  const trueDamageRow = evaluation.groups.flatMap((group) => group.rows ?? []).find((row) => row.key === "trueDamageRatio");
  const hasTrailblazerSource = (trueDamageRow?.entries ?? []).some((entry) => entry.ownerId === "PlayerBoy_20" && Number(entry.value ?? 0) > 0);
  const e0Ratio = Number(e0.battleResult.damageModifiers?.trueDamageRatio ?? 0);
  const e4Ratio = Number(e4.battleResult.damageModifiers?.trueDamageRatio ?? 0);
  record(
    "Remembrance Trailblazer Mimi Support true damage is visible for active dealer",
    Math.abs(e0Ratio - 0.3) < 1e-6 && Math.abs(e4Ratio - 0.36) < 1e-6 && Boolean(trueDamageRow) && hasTrailblazerSource,
    `E0=${round(e0Ratio, 3)} E4=${round(e4Ratio, 3)} trueDamageRow=${Boolean(trueDamageRow)} trailblazerSource=${hasTrailblazerSource}`,
  );
  samples.push(`Trailblazer Mimi Support trueDamageRatio: E0=${round(e0Ratio, 3)}, E4=${round(e4Ratio, 3)}`);
}

function checkHyacineSpeedSources() {
  const base = calculateFor("Hyacine_00", [{ characterId: "Hyacine_00", lightconeId: "wiki-3351", lightconeRank: 1 }]);
  const e2 = calculateFor("Hyacine_00", [{ characterId: "Hyacine_00", eidolon: 2, lightconeId: "wiki-3351", lightconeRank: 1 }]);
  const signature = calculateFor("Hyacine_00", [{ characterId: "Hyacine_00", lightconeId: "wiki-3775", lightconeRank: 1 }]);
  const e2Delta = Number(e2.battleResult.finalStats?.speed ?? 0) - Number(base.battleResult.finalStats?.speed ?? 0);
  const signatureDelta = Number(signature.battleResult.finalStats?.speed ?? 0) - Number(base.battleResult.finalStats?.speed ?? 0);
  record(
    "Hyacine speed sources apply in calculator",
    e2Delta > 20 && signatureDelta > 15,
    `E2 speedDelta=${round(e2Delta, 2)} signature speedDelta=${round(signatureDelta, 2)}`,
  );
  samples.push(`Hyacine speed: E2 +${round(e2Delta, 2)}, signature +${round(signatureDelta, 2)}`);
}

function checkAllySpeedBuffRouting() {
  const cases = [
    {
      name: "Hyacine E2",
      ownerId: "Hyacine_00",
      party: [{ characterId: "Seele_00" }, { characterId: "Hyacine_00", eidolon: 2 }],
      stat: "speedRatio",
      minValue: 0.3,
      targetPolicy: "all_allies",
    },
    {
      name: "Ruan Mei talent",
      ownerId: "RuanMei_00",
      party: [{ characterId: "Seele_00" }, { characterId: "RuanMei_00" }],
      stat: "speedRatio",
      minValue: 0.08,
      targetPolicy: "all_allies",
      targetExcludesOwner: true,
    },
    {
      name: "Jade skill",
      ownerId: "Jade_00",
      party: [{ characterId: "Seele_00" }, { characterId: "Jade_00" }],
      stat: "speed",
      minValue: 30,
      targetPolicy: "single_ally",
      targetExcludesOwner: true,
    },
    {
      name: "Bronya E2",
      ownerId: "Bronya_00",
      party: [{ characterId: "Seele_00" }, { characterId: "Bronya_00", eidolon: 2 }],
      stat: "speedRatio",
      minValue: 0.3,
      targetPolicy: "single_ally",
    },
    {
      name: "Hanya ultimate",
      ownerId: "Hanya_00",
      party: [{ characterId: "Seele_00" }, { characterId: "Hanya_00" }],
      stat: "speed",
      minValue: 1,
      targetPolicy: "single_ally",
    },
  ];
  const details = [];
  const pass = cases.every((item) => {
    const result = calculateFor("Seele_00", item.party);
    const row = result.battleResult.appliedRows.find((candidate) => (
      candidate.ownerId === item.ownerId
      && candidate.stat === item.stat
      && normalizePolicy(candidate.targetPolicy) === item.targetPolicy
      && Number(candidate.resolvedValue ?? 0) >= item.minValue - 1e-6
    ));
    const excludeMatches = item.targetExcludesOwner == null || Boolean(row?.targetExcludesOwner) === item.targetExcludesOwner;
    details.push(`${item.name}=${row ? round(row.resolvedValue, 3) : "missing"}/${row?.targetPolicy ?? "none"}`);
    return Boolean(row) && excludeMatches;
  });
  record(
    "Ally speed buffs route to ally targets",
    pass,
    details.join(", "),
  );
}

function checkLightConeSpeedBuffRouting() {
  const yaoguang = calculateFor("YaoGuang_00", [
    { characterId: "YaoGuang_00", lightconeId: "wiki-4779", lightconeRank: 1 },
  ]);
  const yaoguangSignatureSpeed = yaoguang.battleResult.self.entries.find((entry) => (
    entry.stat === "speedRatio" && String(entry.source ?? "").includes("그녀가 보기로 결심했을 때")
  ));
  const teamCases = [
    { name: "바다는 왜 노래하는가", ownerId: "Hysilens_00", lightconeId: "wiki-3949", stat: "speedRatio", minValue: 0.1 },
    { name: "관의 울림", ownerId: "Luocha_00", lightconeId: "wiki-806" },
    { name: "어울림", ownerId: "Asta_00", lightconeId: "wiki-605" },
  ];
  const details = [`효광전광=${round(yaoguangSignatureSpeed?.value ?? 0, 3)}`];
  const teamPass = teamCases.every((item) => {
    const result = calculateFor("Seele_00", [
      { characterId: "Seele_00" },
      { characterId: item.ownerId, lightconeId: item.lightconeId, lightconeRank: 1 },
    ]);
    const row = result.battleResult.appliedRows.find((candidate) => (
      candidate.category === "lightcone"
      && candidate.sourceTrace?.lightConeId === item.lightconeId
      && candidate.stat === (item.stat ?? "speed")
      && normalizePolicy(candidate.targetPolicy) === "all_allies"
      && Number(candidate.resolvedValue ?? 0) >= (item.minValue ?? 12)
    ));
    details.push(`${item.name}=${row ? round(row.resolvedValue, 1) : "missing"}`);
    return Boolean(row);
  });
  record(
    "Light cone speed buffs route correctly",
    Number(yaoguangSignatureSpeed?.value ?? 0) >= 0.18 && teamPass,
    details.join(", "),
  );
}

function checkMortenaxBladeDefenseDownDeduped() {
  const result = calculateFor("Seele_00", [
    { characterId: "Seele_00" },
    { characterId: "MortenaxBlade_00", eidolon: 6 },
  ]);
  const rows = result.battleResult.appliedRows.filter((row) => (
    row.ownerId === "MortenaxBlade_00" && row.stat === "defenseDown"
  ));
  const total = rows.reduce((sum, row) => sum + Number(row.resolvedValue ?? 0), 0);
  const hasLegacyGeneratedRow = rows.some((row) => (row.sourceTrace?.effectRowId ?? row.effectRowId) === "effect:MortenaxBlade_00:0");
  record(
    "Mortenax Blade defense down uses HoyoWiki level-scaled row only",
    rows.length === 1 && Math.abs(total - 0.32) < 1e-6 && !hasLegacyGeneratedRow,
    `rows=${rows.length} total=${round(total, 3)} legacy=${hasLegacyGeneratedRow}`,
  );
  samples.push(`Mortenax Blade defenseDown: rows=${rows.length}, total=${round(total, 3)}`);
}

function checkJingliuMoonlightRows() {
  const e3 = calculateFor("Jingliu_00", [{ characterId: "Jingliu_00", eidolon: 3 }]);
  const e4 = calculateFor("Jingliu_00", [{ characterId: "Jingliu_00", eidolon: 4 }]);
  const e3Rows = e3.battleResult.appliedRows.filter((row) => String(row.sourceTrace?.effectRowId ?? "").includes("moonlightStacksCritDamage"));
  const e4Rows = e4.battleResult.appliedRows.filter((row) => String(row.sourceTrace?.effectRowId ?? "").includes("moonlightStacksCritDamage"));
  const wrongAllDamage = e4.battleResult.appliedRows.some((row) => row.sourceTrace?.effectRowId === "effect:Jingliu_00:hoyowiki-source:E4:달의_검을_쥐고:allDamage:1");
  record(
    "Jingliu moonlight crit damage is split and E4 allDamage misread excluded",
    e3Rows.length === 1 && e4Rows.length === 2 && !wrongAllDamage,
    `E3 rows=${e3Rows.length} E4 rows=${e4Rows.length} wrongAllDamage=${wrongAllDamage}`,
  );
  samples.push(`Jingliu moonlight rows: E3=${e3Rows.length}, E4=${e4Rows.length}`);
}

function checkAshveilDefenseDownDeduped() {
  const e4 = calculateFor("Seele_00", [
    { characterId: "Seele_00" },
    { characterId: "Ashveil_00", eidolon: 4 },
  ]);
  const result = calculateFor("Seele_00", [
    { characterId: "Seele_00" },
    { characterId: "Ashveil_00", eidolon: 6 },
  ]);
  const e4Total = e4.battleResult.appliedRows
    .filter((row) => row.ownerId === "Ashveil_00" && row.stat === "defenseDown")
    .reduce((sum, row) => sum + Number(row.resolvedValue ?? 0), 0);
  const rows = result.battleResult.appliedRows.filter((row) => (
    row.ownerId === "Ashveil_00" && row.stat === "defenseDown"
  ));
  const total = rows.reduce((sum, row) => sum + Number(row.resolvedValue ?? 0), 0);
  const hasHoyoDuplicate = rows.some((row) => String(row.sourceTrace?.effectRowId ?? "").startsWith("effect:Ashveil_00:hoyowiki-source:"));
  record(
    "Ashveil defense down scales by combat skill level and is not duplicated at E6",
    Math.abs(e4Total - 0.4) < 1e-6 && rows.length === 1 && Math.abs(total - 0.44) < 1e-6 && !hasHoyoDuplicate,
    `E4=${round(e4Total, 3)} E6 rows=${rows.length} total=${round(total, 3)} hoyowikiDuplicate=${hasHoyoDuplicate}`,
  );
  samples.push(`Ashveil E6 defenseDown: rows=${rows.length}, total=${round(total, 3)}`);
}

function checkCerydraMilitaryMeritAtkRatio() {
  const e2 = calculateFor("Seele_00", [
    { characterId: "Seele_00" },
    { characterId: "Cerydra_00", eidolon: 2 },
  ]);
  const e6 = calculateFor("Seele_00", [
    { characterId: "Seele_00" },
    { characterId: "Cerydra_00", eidolon: 6 },
  ]);
  const e2Row = e2.battleResult.appliedRows.find((item) => (
    item.ownerId === "Cerydra_00"
    && item.stat === "atkFlat"
    && (item.sourceTrace?.effectRowId ?? item.effectRowId) === "effect:Cerydra_00:6"
  ));
  const e6Row = e6.battleResult.appliedRows.find((item) => (
    item.ownerId === "Cerydra_00"
    && item.stat === "atkFlat"
    && (item.sourceTrace?.effectRowId ?? item.effectRowId) === "effect:Cerydra_00:6"
  ));
  const e2SourceAtk = Number(e2.battleResult.partyFinalStatsByCharacterId?.Cerydra_00?.atk ?? 0);
  const e6SourceAtk = Number(e6.battleResult.partyFinalStatsByCharacterId?.Cerydra_00?.atk ?? 0);
  const e2Ratio = Number(e2Row?.runtimeResolution?.ratio ?? 0);
  const e6Ratio = Number(e6Row?.runtimeResolution?.ratio ?? 0);
  record(
    "Cerydra Military Merit ATK buff scales by talent level",
    Math.abs(e2Ratio - 0.24) < 1e-9
      && Math.abs(e6Ratio - 0.252) < 1e-9
      && Math.abs(Number(e2Row?.resolvedValue ?? 0) - e2SourceAtk * 0.24) < 1e-6
      && Math.abs(Number(e6Row?.resolvedValue ?? 0) - e6SourceAtk * 0.252) < 1e-6,
    `E2 ratio=${round(e2Ratio, 3)} value=${round(e2Row?.resolvedValue, 1)} E6 ratio=${round(e6Ratio, 3)} value=${round(e6Row?.resolvedValue, 1)}`,
  );
  samples.push(`Cerydra Military Merit ATK: E2 ratio=${round(e2Ratio, 3)}, E6 ratio=${round(e6Ratio, 3)}`);
}

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

function getCard(characterId, predicate, scenarioSettings = {}) {
  const result = calculateFor(characterId, [characterId], scenarioSettings);
  return result.skillCards.find((card) => predicate(card)) ?? result.skillCards[0] ?? null;
}

function calculateFor(activeCharacterId, partyCharacterIds, scenarioSettings = {}) {
  const party = partyCharacterIds.map((item, index) => {
    const slot = typeof item === "string" ? { characterId: item } : item;
    return {
    slotId: `slot-${index + 1}`,
    characterId: slot.characterId,
    eidolon: Number(slot.eidolon ?? 0),
    lightconeId: slot.lightconeId,
    lightconeRank: slot.lightconeRank ?? 1,
    };
  });
  const battleResult = calculateBattleFinalStats({
    party,
    activeSlotId: "slot-1",
    characterGetter: getCharacter,
    defaultBuildGetter: getDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones: lightconeCandidates.lightCones ?? [],
    ledgerRows: [
      ...baseLedgerRows,
      ...buildLightConeEffectRows({
        party,
        lightCones: lightconeCandidates.lightCones ?? [],
        characterGetter: getCharacter,
      }),
    ],
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
  return { battleResult, skillCards };
}

function getCharacter(characterId) {
  return (characterIdentity.rows ?? []).find((row) => row.characterId === characterId) ?? null;
}

function getDefaultBuild(characterId) {
  return defaultCharacterBuilds.builds?.[characterId] ?? null;
}

function getCustomTypeProfile(characterId) {
  return (customRelicTypeProfiles.rows ?? []).find((row) => row.characterId === characterId) ?? null;
}

function record(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail });
}

function round(value, digits = 0) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toFixed(digits) : "0";
}

function countBy(rows, getter) {
  return rows.reduce((acc, row) => {
    const key = getter(row) ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function normalizePolicy(policy) {
  const text = String(policy ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  if (text === "all_allies" || text === "allallies") return "all_allies";
  if (text === "single_ally" || text === "singleally") return "single_ally";
  return text;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

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
  "effect:Jingliu_00:hoyowiki-source:E4:달의_검을_쥐고:allDamage:1",
]);
const baseLedgerRows = [
  ...((combatLedgerSample.rows ?? combatLedgerSample.ledgerRows ?? [])
    .filter((row) => !supersededGeneratedEffectRowIds.has(row.sourceTrace?.effectRowId ?? row.effectRowId))),
  ...(hoyowikiSourceEffectSupplements.ledgerRows ?? []),
  ...(battleEffectSupplements.ledgerRows ?? []),
].filter((row) => !excludedEffectRowIds.has(row.sourceTrace?.effectRowId ?? row.effectRowId));
const baseEffectMetadataRows = [
  ...((battleEffectMetadata.rows ?? [])
    .filter((row) => !supersededGeneratedEffectRowIds.has(row.effectRowId))),
  ...(hoyowikiSourceEffectSupplements.metadataRows ?? []),
  ...(battleEffectSupplements.metadataRows ?? []),
].filter((row) => !excludedEffectRowIds.has(row.effectRowId));

checkNormalFollowUp();
checkDot();
checkBreak();
checkSuperBreak();
checkSuperBreakStateMultiplier();
checkElationCertifiedBanger();
checkCharacterStateControlCatalog();
checkCharacterStateControlsResolveEffectRows();
checkCipherRecordedTrueDamage();
checkTrueDamageRatio();
checkLightConeTeamCritBuffs();
checkCritBuffsVisibleForSupportProfiles();
checkTrailblazerCritBuffVisibleForAllyDealer();
checkTrailblazerMimiSupportTrueDamageVisibleForAllyDealer();
checkHyacineSpeedSources();
checkJingliuMoonlightRows();

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
  const base = getCard("Sparxie_00", (row) => row.damageFormulaType === "elation", { elationCertifiedBangerStacks: 0 });
  const stacked = getCard("Sparxie_00", (row) => row.damageFormulaType === "elation", { elationCertifiedBangerStacks: 240 });
  record(
    "elation Certified Banger increases damage",
    Number(stacked?.critDamage ?? 0) > Number(base?.critDamage ?? 0),
    `${base?.title ?? "-"} 0=${round(base?.critDamage)} 240=${round(stacked?.critDamage)} multiplier=${round(stacked?.trace?.elationModifiers?.punchlineMultiplier, 3)}`,
  );
  samples.push(`Sparxie elation: 0=${round(base?.critDamage)}, 240=${round(stacked?.critDamage)}, punchlineMultiplier=${round(stacked?.trace?.elationModifiers?.punchlineMultiplier, 3)}`);
}

function checkCharacterStateControlCatalog() {
  const keys = new Set((characterStateControls.controls ?? []).map((control) => control.key));
  const requiredKeys = [
    "blackSwanArcanaStacks",
    "elationCertifiedBangerStacks",
    "elationMerrymake",
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

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

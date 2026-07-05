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

const enemy = { count: 3, level: 95, toughness: 90, resistance: 20 };
const checks = [];
const samples = [];

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

function getCard(characterId, predicate, scenarioSettings = {}) {
  const result = calculateFor(characterId, [characterId], scenarioSettings);
  return result.skillCards.find((card) => predicate(card)) ?? result.skillCards[0] ?? null;
}

function calculateFor(activeCharacterId, partyCharacterIds, scenarioSettings = {}) {
  const party = partyCharacterIds.map((characterId, index) => ({
    slotId: `slot-${index + 1}`,
    characterId,
    eidolon: 0,
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

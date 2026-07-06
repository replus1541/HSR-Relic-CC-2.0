import fs from "node:fs";
import path from "node:path";
import { calculateBattleFinalStats } from "../src/calculator/battle-final-stat-calculator.js";
import { buildDamageContributionViews } from "../src/calculator/battle-stat-evaluation.js";
import { calculateSkillDamageCards } from "../src/calculator/skill-damage-calculator.js";

const root = process.cwd();
const outPath = path.join(root, "reports", "audit", "all-e6-virtual-party-effects.md");
const enemy = { count: 3, level: 95, toughness: 90, resistance: 20, isBroken: true };

const characterIdentity = readJson("data/generated/character-identity.json");
const characterStatBaseline = readJson("data/generated/character-stat-baseline.json");
const equipmentStatModel = readJson("data/generated/equipment-stat-model.json");
const defaultCharacterBuilds = readJson("data/generated/default-character-builds.json");
const lightconeCandidates = readJson("data/legacy-reference/game-db/lightcone-effect-candidates.json");
const combatLedgerSample = readJson("data/generated/combat-ledger-sample.json");
const battleEffectMetadata = readJson("data/generated/battle-effect-metadata.json");
const skillDamageMetadata = readJson("data/generated/skill-damage-metadata.json");
const characterStateControls = readJson("data/curated/character-state-controls.json");
const disconnectedSupplements = readOptionalJson("data/curated/battle-effect-supplements.json");

const characters = (characterIdentity.rows ?? [])
  .filter((character) => character?.characterId)
  .sort((a, b) => String(a.displayName ?? a.characterId).localeCompare(String(b.displayName ?? b.characterId), "ko"));
const characterById = new Map(characters.map((character) => [character.characterId, character]));
const ledgerRows = combatLedgerSample.rows ?? combatLedgerSample.ledgerRows ?? [];
const metadataRows = battleEffectMetadata.rows ?? [];
const metadataByEffectId = new Map(metadataRows.map((row) => [row.effectRowId, row]));
const intentionallyInactiveEffectRowIds = new Set([
  "effect:Cipher_00:2",
  "effect:Herta_00:0",
  "effect:Pela_00:0",
  "effect:Welt_00:0",
]);
const virtualParty = characters.map((character, index) => ({
  slotId: `slot-${index + 1}`,
  characterId: character.characterId,
  eidolon: 6,
}));

const lines = [];
lines.push("# 전체 캐릭터 E6 가상 파티 버프 수신 감사");
lines.push("");
lines.push(`- 생성일: ${new Date().toISOString()}`);
lines.push("- 기준: 현재 스탯 / 데미지 계산 탭이 사용하는 generated combat ledger + battle effect metadata");
lines.push("- 가상 파티: 현재 character identity 전체 캐릭터를 한 파티에 배치");
lines.push("- 돌파 기준: 전원 E6");
lines.push(`- 캐릭터 수: ${characters.length}`);
lines.push(`- ledger rows: ${ledgerRows.length}`);
lines.push(`- metadata rows: ${metadataRows.length}`);
lines.push(`- 적 기준: ${enemy.count}인 / Lv.${enemy.level} / 강인도 ${enemy.toughness} / 속성 저항 ${enemy.resistance}% / 격파 상태`);
lines.push("");
lines.push("> 이 보고서는 UI 표시값이 아니라 계산 엔진 입력과 결과를 직접 호출한 감사 파일입니다. `미수신 후보`는 전원 E6, 전체 파티 조건에서 active 캐릭터가 받아야 할 범위로 보이지만 계산에 적용되지 않은 row입니다.");
lines.push("");

const summaries = [];
const detailSections = [];
const globalMissedByEffectId = new Map();

for (const [index, activeCharacter] of characters.entries()) {
  const activeSlotId = `slot-${index + 1}`;
  const battleResult = calculateBattleFinalStats({
    party: virtualParty,
    activeSlotId,
    characterGetter: getCharacter,
    defaultBuildGetter: getDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones: lightconeCandidates.lightCones ?? [],
    ledgerRows,
    effectMetadataRows: metadataRows,
    scenarioSettings: {},
    stateControls: characterStateControls.controls ?? [],
  });
  const skillCards = calculateSkillDamageCards({
    battleResult,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings: {},
  });
  const contributionViews = buildDamageContributionViews({
    battleResult,
    skillCards,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings: {},
  });
  const contributionByLedgerId = new Map((contributionViews.sourceRows ?? []).map((row) => [row.id, row]));
  const receivedRows = (battleResult.appliedRows ?? [])
    .filter((row) => isBattleRelevantRow(row))
    .map((row) => ({ ...row, contribution: contributionByLedgerId.get(row.ledgerId) }))
    .sort(compareEffectRows);
  const missedRelevantRows = buildMissedRelevantRows(battleResult, activeCharacter.characterId);
  for (const row of missedRelevantRows) {
    const effectRowId = row.sourceTrace?.effectRowId ?? row.effectRowId ?? row.ledgerId;
    if (!globalMissedByEffectId.has(effectRowId)) {
      globalMissedByEffectId.set(effectRowId, { row, count: 0, characters: [] });
    }
    const item = globalMissedByEffectId.get(effectRowId);
    item.count += 1;
    item.characters.push(activeCharacter.displayName ?? activeCharacter.characterId);
  }
  const skillTotal = skillCards.reduce((sum, card) => sum + Number(card.critDamage ?? 0), 0);
  summaries.push({
    character: activeCharacter,
    received: receivedRows.length,
    missed: missedRelevantRows.length,
    damage: skillTotal,
    applied: battleResult.appliedRows?.length ?? 0,
    skipped: battleResult.skippedRows?.length ?? 0,
  });
  detailSections.push(renderCharacterSection({
    index: index + 1,
    character: activeCharacter,
    battleResult,
    skillCards,
    receivedRows,
    missedRelevantRows,
  }));
}

lines.push("## 전체 요약");
lines.push("");
lines.push("| # | 캐릭터 | ID | 수신 효과 | 미수신 후보 | 총 스킬 피해 | applied/skipped |");
lines.push("|---:|---|---|---:|---:|---:|---:|");
for (const [index, summary] of summaries.entries()) {
  lines.push(`| ${index + 1} | ${escapeMd(summary.character.displayName ?? summary.character.characterId)} | \`${summary.character.characterId}\` | ${summary.received} | ${summary.missed} | ${formatNumber(summary.damage)} | ${summary.applied}/${summary.skipped} |`);
}
lines.push("");
lines.push("## 전역 미수신 후보");
lines.push("");
const globalMissedRows = [...globalMissedByEffectId.values()]
  .sort((a, b) => b.count - a.count || String(a.row.ownerId).localeCompare(String(b.row.ownerId), "ko"));
if (globalMissedRows.length) {
  lines.push("| effectRowId | 제공자 | 출처 | 스탯 | 대상 | 사유 | 발생 캐릭터 수 | 예시 캐릭터 |");
  lines.push("|---|---|---|---|---|---|---:|---|");
  for (const item of globalMissedRows) {
    const row = item.row;
    const metadata = row.metadata ?? metadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId);
    lines.push(`| \`${row.sourceTrace?.effectRowId ?? row.effectRowId ?? row.ledgerId}\` | ${escapeMd(ownerLabel(row.ownerId))} | ${escapeMd(metadata?.sourceDisplayLabel ?? row.sourceLabel ?? row.sourceId ?? "-")} | ${statLabel(row.stat)} | ${targetLabel(row.targetPolicy)} | ${row.currentBattleSkippedReason ?? row.skippedReason ?? row.blockedReason ?? "-"} / ${row.calculationStatus ?? "-"} | ${item.count} | ${escapeMd(item.characters.slice(0, 5).join(", "))}${item.characters.length > 5 ? " 외" : ""} |`);
  }
} else {
  lines.push("- 없음");
}
lines.push("");
lines.push("## 계산 탭 미연결 보강 파일");
lines.push("");
if (disconnectedSupplements?.ledgerRows?.length) {
  lines.push("- `data/curated/battle-effect-supplements.json` 파일은 존재하지만, 현재 `CalculatorRoute.jsx`의 계산 탭 입력에는 import/merge되어 있지 않습니다.");
  lines.push("- 아래 row는 이 감사 계산에도 포함하지 않았습니다. 현재 화면 기준과 맞추기 위해서입니다.");
  lines.push("");
  lines.push("| effectRowId | 제공자 | 출처 | 스탯 | 값 | 대상 |");
  lines.push("|---|---|---|---|---:|---|");
  const supplementMetadataByEffectId = new Map((disconnectedSupplements.metadataRows ?? []).map((row) => [row.effectRowId, row]));
  for (const row of disconnectedSupplements.ledgerRows ?? []) {
    const metadata = supplementMetadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId);
    lines.push(`| \`${row.sourceTrace?.effectRowId ?? row.effectRowId ?? row.ledgerId}\` | ${escapeMd(ownerLabel(row.ownerId))} | ${escapeMd(metadata?.sourceDisplayLabel ?? row.sourceId ?? "-")} | ${statLabel(row.stat)} | ${formatValueByStat(row.stat, row.resolvedValue)} | ${targetLabel(row.targetPolicy)} |`);
  }
} else {
  lines.push("- 없음");
}
lines.push("");
lines.push("## 상세");
lines.push("");
lines.push(...detailSections);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`wrote ${outPath}`);
console.log(`characters=${characters.length} ledgerRows=${ledgerRows.length} metadataRows=${metadataRows.length}`);

function renderCharacterSection({ index, character, battleResult, skillCards, receivedRows, missedRelevantRows }) {
  const section = [];
  section.push(`### ${index}. ${escapeMd(character.displayName ?? character.characterId)} (\`${character.characterId}\`)`);
  section.push("");
  section.push(`- 속성/운명의길: ${character.element ?? "-"} / ${character.path ?? "-"}`);
  section.push(`- 적용 row: ${battleResult.appliedRows?.length ?? 0}`);
  section.push(`- 스킵 row: ${battleResult.skippedRows?.length ?? 0}`);
  section.push(`- 수신 효과 row: ${receivedRows.length}`);
  section.push(`- 미수신 후보 row: ${missedRelevantRows.length}`);
  section.push("");
  section.push("#### 최종 스탯 요약");
  section.push("");
  section.push("| HP | 공격력 | 방어력 | 속도 | 치확 | 치피 | 격특 | 에충 |");
  section.push("|---:|---:|---:|---:|---:|---:|---:|---:|");
  section.push(`| ${formatNumber(battleResult.finalStats?.hp)} | ${formatNumber(battleResult.finalStats?.atk)} | ${formatNumber(battleResult.finalStats?.def)} | ${formatNumber(battleResult.finalStats?.speed)} | ${formatPercent(battleResult.finalStats?.critRate)} | ${formatPercent(battleResult.finalStats?.critDamage)} | ${formatPercent(battleResult.finalStats?.breakEffect)} | ${formatPercent(battleResult.finalStats?.energyRegen)} |`);
  section.push("");
  section.push("#### 스킬 피해 요약");
  section.push("");
  if (skillCards.length) {
    section.push("| 공격 타입 | 스킬 | 계수 스탯 | 계수 | 치명/기준 피해 | 기대 피해 | 공식 타입 |");
    section.push("|---|---|---|---:|---:|---:|---|");
    for (const card of skillCards) {
      section.push(`| ${attackTypeLabel(card.attackType)} | ${escapeMd(card.title ?? card.skillId ?? "-")} | ${statLabel(card.scalingStat)} | ${formatPercent(card.coefficient)} | ${formatNumber(card.critDamage)} | ${formatNumber(card.expectedDamage)} | ${card.damageFormulaType ?? "normal"} |`);
    }
  } else {
    section.push("- 계산 가능한 스킬 피해 row 없음");
  }
  section.push("");
  section.push("#### 수신 효과");
  section.push("");
  if (receivedRows.length) {
    section.push("| 제공자 | 출처 | 스탯 | 값 | 대상 | 피해 기여 | effectRowId |");
    section.push("|---|---|---|---:|---|---:|---|");
    for (const row of receivedRows) {
      const metadata = row.metadata ?? metadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId);
      section.push(`| ${escapeMd(ownerLabel(row.ownerId))} | ${escapeMd(metadata?.sourceDisplayLabel ?? row.sourceLabel ?? row.sourceId ?? "-")} | ${statLabel(row.stat)} | ${formatValueByStat(row.stat, row.resolvedValue)} | ${targetLabel(row.targetPolicy)} | ${formatNumber(row.contribution?.contributionValue)} | \`${row.sourceTrace?.effectRowId ?? row.effectRowId ?? row.ledgerId}\` |`);
    }
  } else {
    section.push("- 수신 효과 없음");
  }
  section.push("");
  section.push("#### 미수신 후보");
  section.push("");
  if (missedRelevantRows.length) {
    section.push("| 제공자 | 출처 | 스탯 | 값 | 대상 | 스킵 사유 | 상태 | effectRowId |");
    section.push("|---|---|---|---:|---|---|---|---|");
    for (const row of missedRelevantRows) {
      const metadata = row.metadata ?? metadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId);
      section.push(`| ${escapeMd(ownerLabel(row.ownerId))} | ${escapeMd(metadata?.sourceDisplayLabel ?? row.sourceLabel ?? row.sourceId ?? "-")} | ${statLabel(row.stat)} | ${formatValueByStat(row.stat, row.resolvedValue)} | ${targetLabel(row.targetPolicy)} | ${row.currentBattleSkippedReason ?? row.skippedReason ?? row.blockedReason ?? "-"} | ${row.calculationStatus ?? "-"} | \`${row.sourceTrace?.effectRowId ?? row.effectRowId ?? row.ledgerId}\` |`);
    }
  } else {
    section.push("- 없음");
  }
  section.push("");
  return section.join("\n");
}

function buildMissedRelevantRows(battleResult, activeCharacterId) {
  return (battleResult.skippedRows ?? [])
    .filter((row) => isBattleRelevantRow(row))
    .filter((row) => !intentionallyInactiveEffectRowIds.has(row.sourceTrace?.effectRowId ?? row.effectRowId ?? row.ledgerId))
    .filter((row) => isRowRelevantToActive(row, activeCharacterId))
    .filter((row) => characterById.has(row.ownerId))
    .filter((row) => row.currentBattleSkippedReason !== "owner_not_in_party")
    .filter((row) => row.currentBattleSkippedReason !== "self_effect_for_other_character")
    .filter((row) => row.currentBattleSkippedReason !== "single_ally_self_target_not_assumed")
    .filter((row) => row.currentBattleSkippedReason !== "runtime_target_for_other_character")
    .filter((row) => row.currentBattleSkippedReason !== "branch_not_selected")
    .sort(compareEffectRows);
}

function isBattleRelevantRow(row) {
  return Boolean(row?.ownerId && row?.stat && row?.category !== "ignored");
}

function isRowRelevantToActive(row, activeCharacterId) {
  const policy = normalizeTargetPolicy(row.targetPolicy);
  if (policy === "self") return row.ownerId === activeCharacterId;
  if (policy === "all_allies") return true;
  if (policy === "single_ally") return row.ownerId !== activeCharacterId;
  if (policy.startsWith("enemy")) return true;
  return true;
}

function compareEffectRows(a, b) {
  return String(ownerLabel(a.ownerId)).localeCompare(String(ownerLabel(b.ownerId)), "ko")
    || String(a.stat ?? "").localeCompare(String(b.stat ?? ""), "ko")
    || String(a.sourceTrace?.effectRowId ?? a.effectRowId ?? a.ledgerId).localeCompare(String(b.sourceTrace?.effectRowId ?? b.effectRowId ?? b.ledgerId), "ko");
}

function getCharacter(characterId) {
  return characterById.get(characterId) ?? null;
}

function getDefaultBuild(characterId) {
  return defaultCharacterBuilds.builds?.[characterId] ?? null;
}

function ownerLabel(characterId) {
  return characterById.get(characterId)?.displayName ?? characterId ?? "-";
}

function normalizeTargetPolicy(policy) {
  const text = String(policy ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  if (text === "all_allies" || text === "allallies") return "all_allies";
  if (text === "single_ally" || text === "singleally") return "single_ally";
  if (text === "enemy_single" || text === "enemysingle") return "enemy_single";
  if (text === "enemy_all" || text === "enemyall") return "enemy_all";
  return text || "unknown";
}

function targetLabel(policy) {
  return {
    self: "본인",
    all_allies: "아군 전체",
    single_ally: "단일 아군",
    enemy_single: "단일 적",
    enemy_all: "모든 적",
  }[normalizeTargetPolicy(policy)] ?? policy ?? "-";
}

function attackTypeLabel(type) {
  return {
    basic: "일반공격",
    skill: "전투스킬",
    ultimate: "필살기",
    follow_up: "추가공격",
    dot: "지속피해",
  }[type] ?? type ?? "-";
}

function statLabel(stat) {
  return {
    hp: "HP",
    hpRatio: "HP%",
    hpFlat: "HP",
    atk: "공격력",
    atkRatio: "공격력%",
    atkFlat: "공격력",
    def: "방어력",
    defRatio: "방어력%",
    defFlat: "방어력",
    speed: "속도",
    speedRatio: "속도%",
    critRate: "치확",
    critDamage: "치피",
    breakEffect: "격특",
    effectHitRate: "효과 명중",
    effectResistance: "효과 저항",
    energyRegen: "에너지 회복",
    outgoingHealingBoost: "치유량",
    elementDamage: "속성 피해",
    allDamage: "가피증",
    basicDamage: "일반공격 피해",
    skillDamage: "전투스킬 피해",
    ultimateDamage: "필살기 피해",
    followDamage: "추가공격 피해",
    dotDamage: "지속피해",
    breakDamage: "격파 피해",
    vulnerability: "받피증",
    defenseDown: "방깎",
    defenseIgnore: "방무",
    resistancePen: "속저관",
    trueDamageRatio: "확정피해",
    dealtCritDamage: "가하는 치명타 피해",
    followCritDamage: "추가공격 치피",
    specialFinal: "최종 피해",
    elation: "환락도",
    merrymake: "Merrymake",
  }[stat] ?? stat ?? "-";
}

function formatValueByStat(stat, value) {
  const percentStats = new Set([
    "hpRatio",
    "atkRatio",
    "defRatio",
    "speedRatio",
    "critRate",
    "critDamage",
    "breakEffect",
    "effectHitRate",
    "effectResistance",
    "energyRegen",
    "outgoingHealingBoost",
    "elementDamage",
    "allDamage",
    "basicDamage",
    "skillDamage",
    "ultimateDamage",
    "followDamage",
    "dotDamage",
    "breakDamage",
    "vulnerability",
    "defenseDown",
    "defenseIgnore",
    "resistancePen",
    "trueDamageRatio",
    "dealtCritDamage",
    "followCritDamage",
    "specialFinal",
    "merrymake",
  ]);
  return percentStats.has(stat) ? formatPercent(value) : formatNumber(value);
}

function formatPercent(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "-";
  return `${(number * 100).toFixed(1)}%`;
}

function formatNumber(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "-";
  return Math.round(number).toLocaleString("ko-KR");
}

function escapeMd(value) {
  return String(value ?? "-").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readOptionalJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

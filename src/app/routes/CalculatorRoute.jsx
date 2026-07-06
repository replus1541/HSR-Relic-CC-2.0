import { useEffect, useMemo, useRef, useState } from "react";
import battleEffectMetadata from "../../../data/generated/battle-effect-metadata.json";
import battleEffectSupplements from "../../../data/curated/battle-effect-supplements.json";
import characterStateControls from "../../../data/curated/character-state-controls.json";
import characterIdentity from "../../../data/generated/character-identity.json";
import characterStatBaseline from "../../../data/generated/character-stat-baseline.json";
import combatLedgerSample from "../../../data/generated/combat-ledger-sample.json";
import customRelicTypeProfiles from "../../../data/curated/custom-relic-type-profiles.json";
import defaultCharacterBuilds from "../../../data/generated/default-character-builds.json";
import equipmentStatModel from "../../../data/generated/equipment-stat-model.json";
import hoyowikiSourceEffectSupplements from "../../../data/generated/hoyowiki-source-effect-supplements.json";
import skillDamageMetadata from "../../../data/generated/skill-damage-metadata.json";
import lightconeCandidates from "../../../data/legacy-reference/game-db/lightcone-effect-candidates.json";
import supportDamageProcs from "../../../data/curated/support-damage-procs.json";
import { buildBattleStatEvaluation, buildDamageContributionViews } from "../../calculator/battle-stat-evaluation.js";
import { calculateBattleFinalStats } from "../../calculator/battle-final-stat-calculator.js";
import { calculateSkillDamageCards } from "../../calculator/skill-damage-calculator.js";
import { calculateSelfEquipmentStats, formatSelfStatValue } from "../../calculator/self-stat-calculator.js";
import { Badge } from "../../ui/components/index.js";

const appTabs = [
  { key: "characters", label: "캐릭터 세팅" },
  { key: "buffs", label: "스탯 / 데미지 계산" },
  { key: "conditionCompare", label: "조건부 비교" },
];

const defaultPartyIds = ["PlayerBoy_20", "Sparkle_00", "Sunday_10", "RuanMei_00"];
const appVersionName = "2.006";
const calculatorStateCookieName = "hsr_relic_cc_v2_calculator_state";
const calculatorStateStorageName = "hsr_relic_cc_v2_calculator_state_v1";
const calculatorStateVersion = 1;
const cookieMaxAgeSeconds = 60 * 60 * 24 * 180;
const lightCones = lightconeCandidates.lightCones ?? [];
const supersededGeneratedEffectRowIds = new Set(hoyowikiSourceEffectSupplements.supersedesEffectRowIds ?? []);
const generatedCombatLedgerRows = (combatLedgerSample.rows ?? combatLedgerSample.ledgerRows ?? [])
  .filter((row) => !supersededGeneratedEffectRowIds.has(row.sourceTrace?.effectRowId ?? row.effectRowId));
const generatedBattleEffectMetadataRows = (battleEffectMetadata.rows ?? [])
  .filter((row) => !supersededGeneratedEffectRowIds.has(row.effectRowId));
const combatLedgerRows = [
  ...generatedCombatLedgerRows,
  ...(hoyowikiSourceEffectSupplements.ledgerRows ?? []),
  ...(battleEffectSupplements.ledgerRows ?? []),
];
const battleEffectMetadataRows = [
  ...generatedBattleEffectMetadataRows,
  ...(hoyowikiSourceEffectSupplements.metadataRows ?? []),
  ...(battleEffectSupplements.metadataRows ?? []),
];
const defaultBuildRows = Object.values(defaultCharacterBuilds.builds ?? {});
const defaultBuildByCharacterId = new Map(defaultBuildRows.map((row) => [row.characterId, row]));
const customTypeRows = customRelicTypeProfiles.rows ?? [];
const customTypeByCharacterId = new Map(customTypeRows.map((row) => [row.characterId, row]).filter(([id]) => id));
const calculationUnavailableCharacterIds = ["Gilgamesh_00", "TohsakaRin_00", "HimekoNova_00", "hoyowiki:6565", "hoyowiki:6566"];
const unavailableCharacterIds = new Set(
  calculationUnavailableCharacterIds,
);
const relicPieces = [
  { key: "head", name: "머리", setKey: "set4", pieceIndex: 1 },
  { key: "hands", name: "손", setKey: "set4", pieceIndex: 2 },
  { key: "body", name: "몸통", setKey: "set4", pieceIndex: 3 },
  { key: "feet", name: "신발", setKey: "set4", pieceIndex: 4 },
  { key: "sphere", name: "차원 구체", setKey: "set2", pieceIndex: 1 },
  { key: "rope", name: "연결 매듭", setKey: "set2", pieceIndex: 2 },
];
const relicSubStats = ["critRate", "critDamage", "atkRatio", "speed"];
const relicMainStatOptions = ["hpFlat", "atkFlat", "hpRatio", "atkRatio", "defRatio", "speed", "critRate", "critDamage", "elementDamage", "energyRegen", "breakEffect", "effectHitRate", "outgoingHealingBoost"];
const relicMainStatOptionsByPiece = {
  head: ["hpFlat"],
  hands: ["atkFlat"],
  body: ["hpRatio", "atkRatio", "defRatio", "critRate", "critDamage", "outgoingHealingBoost", "effectHitRate"],
  feet: ["hpRatio", "atkRatio", "defRatio", "speed"],
  sphere: ["hpRatio", "atkRatio", "defRatio", "elementDamage"],
  rope: ["hpRatio", "atkRatio", "defRatio", "breakEffect", "energyRegen"],
};
const relicSubStatOptions = ["critRate", "critDamage", "atkRatio", "defRatio", "hpRatio", "speed", "breakEffect", "effectHitRate", "effectResistance", "atkFlat", "defFlat", "hpFlat"];
const relicSubStatRollValues = equipmentStatModel.relicSubStatRollValues ?? {};
const relicRollOptions = [0, 1, 2, 3, 4];
const enemyLevelOptions = createNumberRange(5, 120, 5);
const enemyToughnessOptions = createNumberRange(5, 300, 5);
const enemyResistanceOptions = createNumberRange(0, 100, 10);
const elementLabels = {
  physical: "물리",
  fire: "화염",
  ice: "얼음",
  lightning: "번개",
  wind: "바람",
  quantum: "양자",
  imaginary: "허수",
};

const pathLabels = {
  destruction: "파멸",
  hunt: "수렵",
  erudition: "지식",
  harmony: "화합",
  nihility: "공허",
  preservation: "보존",
  abundance: "풍요",
  memory: "기억",
  elation: "환락",
};

const pathFilterIcons = [
  { key: "destruction", name: pathLabels.destruction, iconFile: "Icon_Destruction 1.png" },
  { key: "hunt", name: pathLabels.hunt, iconFile: "Icon_The_Hunt 1.png" },
  { key: "erudition", name: pathLabels.erudition, iconFile: "Icon_Erudition 1.png" },
  { key: "harmony", name: pathLabels.harmony, iconFile: "Icon_Harmony 1.png" },
  { key: "nihility", name: pathLabels.nihility, iconFile: "Icon_Nihility 1.png" },
  { key: "preservation", name: pathLabels.preservation, iconFile: "Icon_Preservation 1.png" },
  { key: "abundance", name: pathLabels.abundance, iconFile: "Icon_Abundance 1.png" },
  { key: "memory", name: pathLabels.memory, iconFile: "Icon_Remembrance 1.png" },
  { key: "elation", name: pathLabels.elation, iconFile: "Icon_Elation.png" },
];

const elementFilterIcons = [
  { key: "physical", name: elementLabels.physical, iconFile: "Type_Physical_Small 1.png" },
  { key: "fire", name: elementLabels.fire, iconFile: "Type_Fire_Small 1.png" },
  { key: "ice", name: elementLabels.ice, iconFile: "Type_Ice_Small 1.png" },
  { key: "lightning", name: elementLabels.lightning, iconFile: "Type_Lightning_Small 1.png" },
  { key: "wind", name: elementLabels.wind, iconFile: "Type_Wind_Small 1.png" },
  { key: "quantum", name: elementLabels.quantum, iconFile: "Type_Quantum_Small 1.png" },
  { key: "imaginary", name: elementLabels.imaginary, iconFile: "Type_Imaginary_Small 1.png" },
];

const statLabels = {
  hpFlat: "HP",
  atkFlat: "공격력",
  defFlat: "방어력",
  hpRatio: "HP %",
  atkRatio: "공격력 %",
  defRatio: "방어력 %",
  speedRatio: "속도",
  elementDamage: "속성 피해",
  energyRegen: "에너지 회복효율",
  breakEffect: "격파 특수효과",
  effectHitRate: "효과 명중",
  effectResistance: "효과 저항",
  outgoingHealingBoost: "치유량 보너스",
  hp: "HP",
  atk: "공격력",
  def: "방어력",
  speed: "속도",
  critRate: "치확",
  critDamage: "치피",
  damageBoost: "피증",
  allDamage: "피증",
  basicDamage: "일반공격 피증",
  skillDamage: "전투스킬 피증",
  ultimateDamage: "필살기 피증",
  followDamage: "추가공격 피증",
  dotDamage: "지속피해 피증",
  breakDamage: "격파피해 피증",
  trueDamageRatio: "확정피해",
  elation: "환락도",
  merrymake: "Merrymake",
  resistancePenetration: "속저관",
  resistancePen: "속저관",
  defenseIgnore: "방무",
  defenseDown: "방깎",
  vulnerability: "받피증",
  additionalDamage: "추가피해",
};

const primaryStatLabels = {
  atk: "공격력",
  hp: "HP",
  def: "방어력",
  speed: "속도",
  breakEffect: "격파 특수효과",
  critRate: "치명타 확률",
  critDamage: "치피",
  effectHitRate: "효과 명중",
};

const fallbackCharacters = characterIdentity.rows.slice(0, 4);

function createInitialCalculatorState() {
  const fallback = {
    activeTab: "characters",
    calculationView: "stats",
    party: createInitialParty(),
    activeSlotId: "slot-1",
    enemy: { count: 3, level: 95, toughness: 90, resistance: 20 },
    partySpecificSettings: {},
    ownedCharacterEidolon: 0,
    compareConditions: [],
    compareKeepSlotIds: [],
  };
  const persisted = readPersistedCalculatorState();
  if (!persisted) return fallback;
  const party = restorePersistedParty(persisted.party, fallback.party);
  const activeSlotId = party.some((slot) => slot.slotId === persisted.activeSlotId)
    ? persisted.activeSlotId
    : party[0]?.slotId ?? fallback.activeSlotId;
  const restoredActiveTab = sanitizeActiveTab(persisted.activeTab, fallback.activeTab);
  return {
    activeTab: restoredActiveTab,
    calculationView: persisted.activeTab === "conditionCompare"
      ? "conditionCompare"
      : sanitizeCalculationView(persisted.calculationView, fallback.calculationView),
    party,
    activeSlotId,
    enemy: sanitizeEnemy(persisted.enemy, fallback.enemy),
    partySpecificSettings: sanitizePartySpecificSettings(persisted.partySpecificSettings),
    ownedCharacterEidolon: sanitizeEidolonPreset(persisted.ownedCharacterEidolon, fallback.ownedCharacterEidolon),
    compareConditions: sanitizeCompareConditions(persisted.compareConditions, party, activeSlotId),
    compareKeepSlotIds: sanitizeCompareKeepSlotIds(persisted.compareKeepSlotIds, party),
  };
}

function createInitialParty() {
  const byId = new Map(characterIdentity.rows.map((character) => [character.characterId, character]));
  const selected = defaultPartyIds.map((id) => byId.get(id)).filter(Boolean);
  const characters = selected.length === 4 ? selected : fallbackCharacters;
  return Array.from({ length: 4 }, (_, index) => ({
    ...createDefaultEquipmentForCharacter(characters[index]),
    slotId: `slot-${index + 1}`,
    characterId: characters[index]?.characterId ?? null,
    eidolon: 0,
  }));
}

function createDefaultEquipmentForCharacter(character) {
  const defaultBuild = getDefaultBuild(character?.characterId);
  const lightcone = getDefaultLightCone(character, defaultBuild);
  const set4 = defaultBuild?.selectedRelics?.set4 ?? null;
  const set2 = defaultBuild?.selectedRelics?.set2 ?? null;
  return {
    lightconeId: lightcone?.id ?? null,
    lightconeName: lightcone?.name ?? "미선택",
    lightconeRank: 1,
    lightconeIconFile: lightcone ? getLightConeIconFile(lightcone, "png") : null,
    relicSet4Id: set4?.id ?? null,
    relicSet4Name: set4?.name ?? "터널 유물",
    relicSet2Id: set2?.id ?? null,
    relicSet2Name: set2?.name ?? "차원 장신구",
    relicMainStats: { ...(defaultBuild?.mainStats ?? {}) },
    relicPieces: defaultBuild?.pieces ?? {},
    relicSubStatPriority: [...(defaultBuild?.subStatPriority ?? relicSubStats)],
    defaultBuildSourceStatus: defaultBuild?.sourceStatus ?? null,
  };
}

function readPersistedCalculatorState() {
  const value = readStorageValue(calculatorStateStorageName) ?? readCookieValue(calculatorStateCookieName);
  if (!value) return null;
  try {
    const payload = JSON.parse(decodeURIComponent(value));
    if (payload?.version !== calculatorStateVersion) return null;
    return payload;
  } catch (error) {
    console.warn("[calculator-state-cookie-restore-failed]", error);
    return null;
  }
}

function writePersistedCalculatorState({ activeTab, calculationView, party, activeSlotId, enemy, partySpecificSettings, ownedCharacterEidolon, compareConditions, compareKeepSlotIds }) {
  const payload = {
    version: calculatorStateVersion,
    activeTab: sanitizeActiveTab(activeTab, "characters"),
    calculationView: sanitizeCalculationView(calculationView, "stats"),
    activeSlotId,
    enemy: sanitizeEnemy(enemy),
    partySpecificSettings: sanitizePartySpecificSettings(partySpecificSettings),
    ownedCharacterEidolon: sanitizeEidolonPreset(ownedCharacterEidolon, 0),
    compareConditions: sanitizeCompareConditions(compareConditions, party, activeSlotId).map(serializeCompareCondition),
    compareKeepSlotIds: sanitizeCompareKeepSlotIds(compareKeepSlotIds, party),
    party: party.map(serializePartySlot),
  };
  const encodedPayload = encodeURIComponent(JSON.stringify(payload));
  writeStorageValue(calculatorStateStorageName, encodedPayload);
  writeCookieValue(calculatorStateCookieName, encodeURIComponent(JSON.stringify(createCompactPersistedState(payload))), cookieMaxAgeSeconds);
}

function createCompactPersistedState(payload) {
  return {
    version: payload.version,
    activeTab: payload.activeTab,
    calculationView: payload.calculationView,
    activeSlotId: payload.activeSlotId,
    enemy: payload.enemy,
    partySpecificSettings: payload.partySpecificSettings,
    ownedCharacterEidolon: payload.ownedCharacterEidolon,
    compareKeepSlotIds: payload.compareKeepSlotIds,
    party: (payload.party ?? []).map((slot) => ({
      slotId: slot.slotId,
      characterId: slot.characterId,
      eidolon: slot.eidolon,
      lightconeId: slot.lightconeId,
      lightconeRank: slot.lightconeRank,
      relicSet4Name: slot.relicSet4Name,
      relicSet2Name: slot.relicSet2Name,
      relicMainStats: slot.relicMainStats,
      relicSubStatPriority: slot.relicSubStatPriority,
    })),
  };
}

function serializePartySlot(slot) {
  return {
    slotId: slot.slotId,
    characterId: slot.characterId,
    eidolon: clampInteger(slot.eidolon, 0, 6),
    lightconeId: slot.lightconeId,
    lightconeRank: clampInteger(slot.lightconeRank ?? 1, 1, 5),
    relicSet4Name: slot.relicSet4Name,
    relicSet2Name: slot.relicSet2Name,
    relicMainStats: sanitizeRelicMainStats(slot.relicMainStats),
    relicSubStatPriority: sanitizeRelicSubStatPriority(slot.relicSubStatPriority),
    relicPieces: sanitizeRelicPieces(slot.relicPieces, slot.relicMainStats, {}, slot.relicSubStatPriority),
  };
}

function restorePersistedParty(persistedParty, fallbackParty) {
  if (!Array.isArray(persistedParty)) return fallbackParty;
  const usedCharacterIds = new Set();
  return fallbackParty.map((fallbackSlot, index) => {
    const persistedSlot = persistedParty[index] ?? {};
    const character = getCharacter(persistedSlot.characterId);
    if (!character || unavailableCharacterIds.has(character.characterId) || usedCharacterIds.has(character.characterId)) {
      usedCharacterIds.add(fallbackSlot.characterId);
      return fallbackSlot;
    }
    usedCharacterIds.add(character.characterId);
    const defaults = createDefaultEquipmentForCharacter(character);
    const lightcone = lightCones.find((row) => row.id === persistedSlot.lightconeId);
    const set4 = findRelicSetByName(persistedSlot.relicSet4Name, "set4");
    const set2 = findRelicSetByName(persistedSlot.relicSet2Name, "set2");
    const relicMainStats = {
      ...defaults.relicMainStats,
      ...sanitizeRelicMainStats(persistedSlot.relicMainStats),
    };
    const relicSubStatPriority = sanitizeRelicSubStatPriority(persistedSlot.relicSubStatPriority, defaults.relicSubStatPriority);
    return {
      ...defaults,
      slotId: fallbackSlot.slotId,
      characterId: character.characterId,
      eidolon: clampInteger(persistedSlot.eidolon, 0, 6),
      ...(lightcone ? {
        lightconeId: lightcone.id,
        lightconeName: lightcone.name,
        lightconeRank: clampInteger(persistedSlot.lightconeRank ?? 1, 1, 5),
        lightconeIconFile: getLightConeIconFile(lightcone, "png"),
      } : {}),
      ...(set4 ? {
        relicSet4Id: set4.id,
        relicSet4Name: set4.name,
      } : {}),
      ...(set2 ? {
        relicSet2Id: set2.id,
        relicSet2Name: set2.name,
      } : {}),
      relicMainStats,
      relicSubStatPriority,
      relicPieces: sanitizeRelicPieces(persistedSlot.relicPieces, relicMainStats, defaults.relicPieces, relicSubStatPriority),
    };
  });
}

function sanitizeEnemy(enemy = {}, fallback = { count: 3, level: 95, toughness: 90, resistance: 20 }) {
  return {
    count: clampInteger(enemy.count ?? fallback.count, 1, 5),
    level: clampToAllowedNumber(enemy.level ?? fallback.level, enemyLevelOptions, fallback.level),
    toughness: clampToAllowedNumber(enemy.toughness ?? fallback.toughness, enemyToughnessOptions, fallback.toughness),
    resistance: clampToAllowedNumber(enemy.resistance ?? fallback.resistance, enemyResistanceOptions, fallback.resistance),
  };
}

function sanitizeRelicMainStats(mainStats = {}) {
  const allowedPieces = new Set(relicPieces.map((piece) => piece.key));
  return Object.fromEntries(
    Object.entries(mainStats ?? {})
      .filter(([piece, stat]) => allowedPieces.has(piece) && getRelicMainStatOptionsForPiece(piece).includes(stat)),
  );
}

function getRelicMainStatOptionsForPiece(pieceKey) {
  return relicMainStatOptionsByPiece[pieceKey] ?? relicMainStatOptions;
}

function normalizeRelicMainStatForPiece(pieceKey, stat) {
  const options = getRelicMainStatOptionsForPiece(pieceKey);
  return options.includes(stat) ? stat : options[0] ?? "";
}

function sanitizeRelicSubStatPriority(priority = [], fallback = relicSubStats) {
  const allowedStats = new Set(relicSubStatOptions);
  const values = Array.isArray(priority) ? priority : fallback;
  const sanitized = values.filter((stat) => allowedStats.has(stat)).slice(0, 4);
  return sanitized.length ? sanitized : fallback.slice(0, 4);
}

function getPieceMainStat(pieceKey, mainStats = {}, pieces = {}) {
  if (pieceKey === "head") return "hpFlat";
  if (pieceKey === "hands") return "atkFlat";
  return normalizeRelicMainStatForPiece(pieceKey, mainStats?.[pieceKey] ?? pieces?.[pieceKey]?.mainStat);
}

function getAvailableRelicSubStatOptions(mainStat) {
  return relicSubStatOptions.filter((stat) => stat !== mainStat);
}

function normalizeRelicRollBudget(rows, priorityIndex = null) {
  const normalized = rows.slice(0, 4).map((row) => ({
    stat: row.stat,
    rolls: clampInteger(row.rolls ?? 0, 0, 4),
  }));
  const order = Number.isInteger(priorityIndex)
    ? [priorityIndex, ...normalized.map((_, index) => index).filter((index) => index !== priorityIndex)]
    : normalized.map((_, index) => index);
  const next = normalized.map((row) => ({ ...row, rolls: 0 }));
  let remaining = 4;
  for (const index of order) {
    const rolls = Math.min(normalized[index]?.rolls ?? 0, remaining);
    next[index].rolls = rolls;
    remaining -= rolls;
  }
  return next;
}

function normalizeRelicSubStatRows(subStats = [], mainStat = "", fallbackPriority = relicSubStats) {
  const allowedStats = new Set(getAvailableRelicSubStatOptions(mainStat));
  const usedStats = new Set();
  const rows = [];
  for (const subStat of Array.isArray(subStats) ? subStats : []) {
    const stat = typeof subStat === "string" ? subStat : subStat?.stat;
    if (!allowedStats.has(stat) || usedStats.has(stat)) continue;
    rows.push({ stat, rolls: clampInteger(subStat?.rolls ?? 0, 0, 4) });
    usedStats.add(stat);
  }
  const fallbackStats = sanitizeRelicSubStatPriority(fallbackPriority);
  for (const stat of fallbackStats) {
    if (!allowedStats.has(stat) || usedStats.has(stat)) continue;
    rows.push({ stat, rolls: rows.length === 0 ? 2 : rows.length === 1 ? 1 : 0 });
    usedStats.add(stat);
    if (rows.length >= 4) break;
  }
  for (const stat of relicSubStatOptions) {
    if (!allowedStats.has(stat) || usedStats.has(stat)) continue;
    rows.push({ stat, rolls: 0 });
    usedStats.add(stat);
    if (rows.length >= 4) break;
  }
  return normalizeRelicRollBudget(rows);
}

function sanitizeRelicPieces(pieces = {}, mainStats = {}, fallbackPieces = {}, fallbackPriority = relicSubStats) {
  return Object.fromEntries(
    relicPieces.map((piece) => {
      const mainStat = getPieceMainStat(piece.key, mainStats, pieces) || getPieceMainStat(piece.key, mainStats, fallbackPieces);
      const sourcePiece = pieces?.[piece.key] ?? {};
      const fallbackPiece = fallbackPieces?.[piece.key] ?? {};
      const sourceSubStats = sourcePiece.subStats?.length ? sourcePiece.subStats : fallbackPiece.subStats;
      return [piece.key, {
        ...fallbackPiece,
        ...sourcePiece,
        mainStat,
        subStats: normalizeRelicSubStatRows(sourceSubStats, mainStat, fallbackPriority),
      }];
    }),
  );
}

function buildRelicSubStatPriorityFromPieces(pieces = {}, fallback = relicSubStats) {
  const usedStats = new Set();
  const values = [];
  for (const piece of relicPieces) {
    for (const subStat of pieces?.[piece.key]?.subStats ?? []) {
      if (!relicSubStatOptions.includes(subStat.stat) || usedStats.has(subStat.stat)) continue;
      values.push(subStat.stat);
      usedStats.add(subStat.stat);
      if (values.length >= 4) return values;
    }
  }
  for (const stat of sanitizeRelicSubStatPriority(fallback)) {
    if (usedStats.has(stat)) continue;
    values.push(stat);
    usedStats.add(stat);
    if (values.length >= 4) break;
  }
  return values;
}

function sanitizePartySpecificSettings(settings = {}) {
  const allowedKeys = new Set((characterStateControls.controls ?? []).map((control) => control.key));
  return Object.fromEntries(
    Object.entries(settings ?? {})
      .filter(([key, value]) => allowedKeys.has(key) && Number.isFinite(Number(value)))
      .map(([key, value]) => [key, Number(value)]),
  );
}

function createCompareConditionId() {
  return `compare-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeCompareCondition(condition) {
  return {
    id: condition.id,
    type: condition.type,
    slotId: condition.slotId,
    baseEidolon: condition.baseEidolon,
    eidolon: condition.eidolon,
    characterId: condition.characterId,
    baseLightconeId: condition.baseLightconeId,
    baseLightconeRank: condition.baseLightconeRank,
    lightconeId: condition.lightconeId,
    lightconeRank: condition.lightconeRank,
    relicPatch: condition.relicPatch,
  };
}

function sanitizeCompareKeepSlotIds(slotIds = [], party = []) {
  if (!Array.isArray(slotIds)) return [];
  const validSlotIds = new Set(party.map((slot) => slot.slotId));
  return [...new Set(slotIds.filter((slotId) => validSlotIds.has(slotId)))];
}

function sanitizeCompareConditions(conditions = [], party = [], mainDealerSlotId = null) {
  if (!Array.isArray(conditions)) return [];
  return conditions
    .map((condition) => normalizeCompareCondition(condition, party, mainDealerSlotId))
    .filter(Boolean);
}

function normalizeCompareCondition(condition, party = [], mainDealerSlotId = null) {
  if (!condition || typeof condition !== "object") return null;
  const slot = party.find((item) => item.slotId === condition.slotId);
  if (!slot?.characterId) return null;
  const id = typeof condition.id === "string" ? condition.id : createCompareConditionId();
  const type = condition.type;

  if (type === "character") {
    return {
      id,
      type,
      slotId: slot.slotId,
      baseEidolon: clampInteger(condition.baseEidolon ?? slot.eidolon ?? 0, 0, 6),
      eidolon: clampInteger(condition.eidolon ?? slot.eidolon ?? 0, 0, 6),
    };
  }

  if (type === "partyMember") {
    if (slot.slotId === mainDealerSlotId) return null;
    const character = getCharacter(condition.characterId);
    if (!character || unavailableCharacterIds.has(character.characterId)) return null;
    const defaults = createDefaultEquipmentForCharacter(character);
    return {
      id,
      type,
      slotId: slot.slotId,
      characterId: character.characterId,
      eidolon: clampInteger(condition.eidolon ?? 0, 0, 6),
      lightconeId: condition.lightconeId ?? defaults.lightconeId,
      lightconeRank: clampInteger(condition.lightconeRank ?? defaults.lightconeRank ?? 1, 1, 5),
      relicPatch: sanitizeRelicPatch(condition.relicPatch ?? defaults),
    };
  }

  if (type === "lightCone") {
    const character = getCharacter(slot.characterId);
    const baseLightcone = lightCones.find((item) => item.id === (condition.baseLightconeId ?? slot.lightconeId));
    const lightcone = lightCones.find((item) => item.id === condition.lightconeId);
    if (!baseLightcone || !lightcone) return null;
    const characterPath = normalizeLightConePathKey(character?.path);
    if (characterPath && normalizeLightConePathKey(lightcone.path) !== characterPath) return null;
    return {
      id,
      type,
      slotId: slot.slotId,
      baseLightconeId: baseLightcone.id,
      baseLightconeRank: clampInteger(condition.baseLightconeRank ?? slot.lightconeRank ?? 1, 1, 5),
      lightconeId: lightcone.id,
      lightconeRank: clampInteger(condition.lightconeRank ?? 1, 1, 5),
    };
  }

  if (type === "relic") {
    return {
      id,
      type,
      slotId: slot.slotId,
      relicPatch: sanitizeRelicPatch(condition.relicPatch ?? slot),
    };
  }

  return null;
}

function sanitizeRelicPatch(source = {}) {
  const relicMainStats = sanitizeRelicMainStats(source.relicMainStats);
  const relicSubStatPriority = sanitizeRelicSubStatPriority(source.relicSubStatPriority);
  return {
    relicSet4Id: source.relicSet4Id ?? null,
    relicSet4Name: source.relicSet4Name ?? "터널 유물",
    relicSet2Id: source.relicSet2Id ?? null,
    relicSet2Name: source.relicSet2Name ?? "차원 장신구",
    relicMainStats,
    relicSubStatPriority,
    relicPieces: sanitizeRelicPieces(source.relicPieces, relicMainStats, {}, relicSubStatPriority),
  };
}

function createDefaultCompareConditionDraft(party, slotId, type = "character", mainDealerSlotId = null) {
  const slot = party.find((item) => item.slotId === slotId) ?? party.find((item) => item.characterId) ?? party[0];
  const targetType = type === "character" && slot?.slotId !== mainDealerSlotId ? "partyMember" : type;
  const character = getCharacter(slot?.characterId);
  const defaultLightcone = getDefaultLightCone(character);
  const base = {
    id: createCompareConditionId(),
    type: targetType,
    slotId: slot?.slotId ?? "slot-1",
    baseEidolon: clampInteger(slot?.eidolon ?? 0, 0, 6),
    eidolon: clampInteger(slot?.eidolon ?? 0, 0, 6),
    baseLightconeId: slot?.lightconeId ?? defaultLightcone?.id ?? null,
    baseLightconeRank: clampInteger(slot?.lightconeRank ?? 1, 1, 5),
    lightconeId: slot?.lightconeId ?? defaultLightcone?.id ?? null,
    lightconeRank: clampInteger(slot?.lightconeRank ?? 1, 1, 5),
    relicPatch: sanitizeRelicPatch(slot),
  };
  if (targetType === "partyMember") {
    return {
      ...base,
      characterId: null,
      eidolon: 0,
    };
  }
  return base;
}

function applyCompareBaseConditionsToParty(party = [], conditions = []) {
  const normalized = sanitizeCompareConditions(conditions, party);
  return party.map((slot) => {
    let next = { ...slot };
    for (const condition of normalized) {
      if (condition.slotId !== slot.slotId) continue;
      if (condition.type === "character") {
        next = { ...next, eidolon: condition.baseEidolon };
      }
      if (condition.type === "lightCone") {
        const lightcone = lightCones.find((item) => item.id === condition.baseLightconeId);
        next = {
          ...next,
          lightconeId: condition.baseLightconeId,
          lightconeName: lightcone?.name ?? next.lightconeName,
          lightconeRank: condition.baseLightconeRank,
          lightconeIconFile: lightcone ? getLightConeIconFile(lightcone, "png") : next.lightconeIconFile,
        };
      }
    }
    return next;
  });
}

function applyCompareConditionsToParty(party = [], conditions = [], mainDealerSlotId = null) {
  const normalized = sanitizeCompareConditions(conditions, party, mainDealerSlotId);
  return party.map((slot) => {
    let next = { ...slot };
    for (const condition of normalized) {
      if (condition.slotId !== slot.slotId) continue;
      if (condition.type === "character") {
        next = { ...next, eidolon: condition.eidolon };
      } else if (condition.type === "partyMember") {
        const character = getCharacter(condition.characterId);
        if (!character) continue;
        const defaults = createDefaultEquipmentForCharacter(character);
        const lightcone = lightCones.find((item) => item.id === condition.lightconeId);
        next = {
          ...defaults,
          ...(condition.relicPatch ?? {}),
          slotId: slot.slotId,
          characterId: character.characterId,
          eidolon: condition.eidolon,
          lightconeId: condition.lightconeId ?? defaults.lightconeId,
          lightconeName: lightcone?.name ?? defaults.lightconeName,
          lightconeRank: condition.lightconeRank ?? defaults.lightconeRank,
          lightconeIconFile: lightcone ? getLightConeIconFile(lightcone, "png") : defaults.lightconeIconFile,
        };
      } else if (condition.type === "lightCone") {
        const lightcone = lightCones.find((item) => item.id === condition.lightconeId);
        next = {
          ...next,
          lightconeId: condition.lightconeId,
          lightconeName: lightcone?.name ?? next.lightconeName,
          lightconeRank: condition.lightconeRank,
          lightconeIconFile: lightcone ? getLightConeIconFile(lightcone, "png") : next.lightconeIconFile,
        };
      } else if (condition.type === "relic") {
        next = {
          ...next,
          ...(condition.relicPatch ?? {}),
        };
      }
    }
    return next;
  });
}

function getCompareConditionTitle(condition, party = []) {
  const slotIndex = party.findIndex((slot) => slot.slotId === condition.slotId);
  const slotLabel = slotIndex >= 0 ? `${slotIndex + 1}번` : "파티";
  if (condition.type === "character") return `${slotLabel} 돌파 변경`;
  if (condition.type === "partyMember") return `${slotLabel} 파티원 변경`;
  if (condition.type === "lightCone") return `${slotLabel} 광추 변경`;
  if (condition.type === "relic") return `${slotLabel} 유물 변경`;
  return "비교 조건";
}

function getCompareConditionDetail(condition, party = []) {
  const slot = party.find((item) => item.slotId === condition.slotId);
  const baseCharacter = getCharacter(slot?.characterId);
  if (condition.type === "character") {
    return `${baseCharacter?.displayName ?? "캐릭터"} E${condition.baseEidolon} -> E${condition.eidolon}`;
  }
  if (condition.type === "partyMember") {
    const nextCharacter = getCharacter(condition.characterId);
    return `${baseCharacter?.displayName ?? "파티원"} -> ${nextCharacter?.displayName ?? "캐릭터"} E${condition.eidolon}`;
  }
  if (condition.type === "lightCone") {
    const baseLightcone = lightCones.find((item) => item.id === condition.baseLightconeId);
    const nextLightcone = lightCones.find((item) => item.id === condition.lightconeId);
    return `${baseLightcone?.name ?? "광추"} S${condition.baseLightconeRank} -> ${nextLightcone?.name ?? "광추"} S${condition.lightconeRank}`;
  }
  if (condition.type === "relic") {
    const relic = condition.relicPatch ?? {};
    return `4셋 ${relic.relicSet4Name ?? "유물"} / 2셋 ${relic.relicSet2Name ?? "장신구"}`;
  }
  return "-";
}

function readCookieValue(name) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const row = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return row ? row.slice(prefix.length) : null;
}

function writeCookieValue(name, value, maxAge) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function readStorageValue(name) {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(name);
  } catch (error) {
    console.warn("[calculator-state-storage-read-failed]", error);
    return null;
  }
}

function writeStorageValue(name, value) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(name, value);
  } catch (error) {
    console.warn("[calculator-state-storage-write-failed]", error);
  }
}

function createNumberRange(start, end, step) {
  return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => start + index * step);
}

function clampToAllowedNumber(value, allowedValues, fallback) {
  const number = Number(value);
  if (allowedValues.includes(number)) return number;
  const fallbackNumber = Number(fallback);
  const target = Number.isFinite(number) ? number : fallbackNumber;
  return allowedValues.reduce((closest, candidate) => {
    if (!Number.isFinite(target)) return closest;
    return Math.abs(candidate - target) < Math.abs(closest - target) ? candidate : closest;
  }, allowedValues.includes(fallbackNumber) ? fallbackNumber : allowedValues[0]);
}

function clampInteger(value, min, max) {
  if (!Number.isFinite(Number(value))) return min;
  return Math.min(Math.max(Math.round(Number(value)), min), max);
}

function sanitizeEidolonPreset(value, fallback = 0) {
  const number = Number(value);
  return partyRecommendationEidolonOptions.some((option) => option.value === number) ? number : fallback;
}

function sanitizeActiveTab(value, fallback = "characters") {
  return appTabs.some((tab) => tab.key === value) ? value : fallback;
}

function sanitizeCalculationView(value, fallback = "stats") {
  return value === "conditionCompare" || value === "stats" ? value : fallback;
}

function getCharacter(characterId) {
  return characterIdentity.rows.find((character) => character.characterId === characterId) ?? null;
}

function getDefaultBuild(characterId) {
  return defaultBuildByCharacterId.get(characterId) ?? null;
}

function getCustomTypeProfile(characterId) {
  return customTypeByCharacterId.get(characterId) ?? null;
}

function normalizeLightConePathKey(path) {
  if (path === "memory" || path === "remembrance") return "remembrance";
  return path ?? null;
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

function findRelicSetByName(name, setKey = null) {
  if (!name) return null;
  for (const row of defaultBuildRows) {
    const candidates = setKey === "set2"
      ? [row.selectedRelics?.set2]
      : setKey === "set4"
        ? [row.selectedRelics?.set4, row.selectedRelics?.set4Alt]
        : [row.selectedRelics?.set4, row.selectedRelics?.set4Alt, row.selectedRelics?.set2];
    const match = candidates.find((relicSet) => relicSet?.name === name);
    if (match) return match;
  }
  return null;
}

function getLightConeIconFile(lightcone, extension = "png") {
  if (!lightcone) return null;
  const name = String(lightcone.name ?? "").replace(/\s+/g, " ").trim();
  return `${lightcone.entryPageId}-${name}.${extension}`;
}

function normalizeRelicId(relicSet) {
  const rawId = relicSet?.id ?? relicSet?.entryPageId ?? "";
  return String(rawId).replace(/^wiki-relic-/, "").trim();
}

function getRelicIconFile(relicSet, pieceIndex = null) {
  const relicId = normalizeRelicId(relicSet);
  const name = String(relicSet?.name ?? "").replace(/\s+/g, " ").trim();
  if (!relicId || !name) return null;
  return pieceIndex ? `${relicId}-${name}-${pieceIndex}-piece-${pieceIndex}.png` : `${relicId}-${name}.png`;
}

function RelicPieceIcon({ piece, set4, set2 }) {
  const relicSet = piece.setKey === "set2" ? set2 : set4;
  const primary = getRelicIconFile(relicSet, piece.pieceIndex);
  const fallback = getRelicIconFile(relicSet);
  const generic = `/relic-piece-icons/${piece.key}.svg`;
  return (
    <img
      src={primary ? encodeURI(`/relic-icons/${primary}`) : generic}
      alt=""
      onError={(event) => {
        if (fallback && event.currentTarget.dataset.fallback !== "set") {
          event.currentTarget.dataset.fallback = "set";
          event.currentTarget.src = encodeURI(`/relic-icons/${fallback}`);
          return;
        }
        event.currentTarget.src = generic;
      }}
    />
  );
}

function RelicSetIcon({ relicSet, fallbackPiece = "head" }) {
  const primary = getRelicIconFile(relicSet);
  const generic = `/relic-piece-icons/${fallbackPiece}.svg`;
  return (
    <img
      src={primary ? encodeURI(`/relic-icons/${primary}`) : generic}
      alt=""
      onError={(event) => {
        event.currentTarget.src = generic;
      }}
    />
  );
}

function LightConeThumb({ lightcone, iconFile, rank = 1, showRank = true }) {
  const primary = iconFile ?? getLightConeIconFile(lightcone, "png");
  if (!primary) {
    return (
      <span className="calc-lightcone-thumb is-empty">
        <span>LC</span>
        {showRank ? <b>S{rank}</b> : null}
      </span>
    );
  }
  return (
    <span className="calc-lightcone-thumb">
      <img
        src={encodeURI(`/lightcone-icons/${primary}`)}
        alt=""
        onError={(event) => {
          const jpg = getLightConeIconFile(lightcone, "jpg");
          if (lightcone && event.currentTarget.dataset.fallback !== "jpg") {
            event.currentTarget.dataset.fallback = "jpg";
            event.currentTarget.src = encodeURI(`/lightcone-icons/${jpg}`);
            return;
          }
          event.currentTarget.style.display = "none";
        }}
      />
      {showRank ? <b>S{rank}</b> : null}
    </span>
  );
}

function formatNumber(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(Number(value));
}

function formatDamageNumber(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.trunc(Number(value)));
}

function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return `${formatNumber(Number(value) * 100)}%`;
}

function renderRankedLightConeText(text, rank) {
  const source = String(text ?? "");
  const selectedRankIndex = clampInteger(rank, 1, 5) - 1;
  const rankedValuePattern = /\d+(?:\.\d+)?%?(?:\s*\/\s*\d+(?:\.\d+)?%?){1,4}/g;
  const pieces = [];
  let lastIndex = 0;
  let match;

  while ((match = rankedValuePattern.exec(source))) {
    if (match.index > lastIndex) pieces.push(source.slice(lastIndex, match.index));
    const values = match[0].split("/").map((value) => value.trim()).filter(Boolean);
    const selectedValue = values[Math.min(selectedRankIndex, values.length - 1)] ?? match[0];
    pieces.push(<mark className="calc-rank-highlight" key={`${match.index}-${selectedValue}`}>{selectedValue}</mark>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < source.length) pieces.push(source.slice(lastIndex));
  return pieces.length ? pieces : source;
}

const percentStatKeys = new Set([
  "critRate",
  "critDamage",
  "damageBoost",
  "allDamage",
  "basicDamage",
  "skillDamage",
  "ultimateDamage",
  "followDamage",
  "dotDamage",
  "breakDamage",
  "elementDamage",
  "energyRegen",
  "breakEffect",
  "effectHitRate",
  "effectResistance",
  "outgoingHealingBoost",
  "speedRatio",
  "resistancePenetration",
  "resistancePen",
  "defenseIgnore",
  "defenseDown",
  "vulnerability",
  "dealtCritDamage",
  "followCritDamage",
  "specialFinal",
  "trueDamageRatio",
  "elation",
  "merrymake",
]);

function formatStatValue(stat, value) {
  if (percentStatKeys.has(stat)) {
    return formatPercent(value);
  }
  return formatNumber(value);
}

function formatRelicSubStatRollValue(stat, rolls) {
  const baseValue = Number(relicSubStatRollValues[stat] ?? 0);
  const value = baseValue * (clampInteger(rolls, 0, 4) + 1);
  return formatSelfStatValue(stat, value);
}

function formatStatLabel(stat) {
  return statLabels[stat] ?? stat ?? "-";
}

function formatStatList(stats = [], limit = 4) {
  const values = stats.filter(Boolean).slice(0, limit).map(formatStatLabel);
  return values.length ? values.join(" / ") : "-";
}

function formatElementDamageLabel(character) {
  return `${elementLabels[character?.element] ?? character?.element ?? "속성"} 피해`;
}

function normalizePrimaryStatKey(stat) {
  if (stat === "atk") return "atkRatio";
  if (stat === "hp") return "hpRatio";
  if (stat === "def") return "defRatio";
  if (stat === "break") return "breakEffect";
  if (stat === "critDamage") return "critDamage";
  if (stat === "critRate") return "critRate";
  return stat ?? null;
}

function normalizePrimaryFinalStatKey(stat) {
  if (stat === "atk") return "atk";
  if (stat === "hp") return "hp";
  if (stat === "def") return "def";
  if (stat === "break") return "breakEffect";
  if (stat === "critDamage") return "critDamage";
  if (stat === "critRate") return "critRate";
  return stat ?? null;
}

function formatPrimaryStatProfile(profile) {
  const primaryStat = profile?.uiTypeProfile?.primaryStat ?? profile?.uiTypeProfile?.statProfile ?? null;
  const normalized = normalizePrimaryStatKey(primaryStat);
  return primaryStatLabels[primaryStat] ?? formatStatLabel(normalized) ?? "-";
}

function formatCalculatedSelfStat(stats, stat) {
  if (!stat) return "-";
  return formatSelfStatValue(stat, stats?.[stat]);
}

function formatFinalStatLabel(stat) {
  if (stat === "atk") return "공격력";
  if (stat === "hp") return "HP";
  if (stat === "def") return "방어력";
  return formatStatLabel(stat);
}

function normalizeRecommendedFinalStatKey(stat) {
  if (stat === "atkRatio" || stat === "atkFlat") return "atk";
  if (stat === "hpRatio" || stat === "hpFlat") return "hp";
  if (stat === "defRatio" || stat === "defFlat") return "def";
  return normalizePrimaryFinalStatKey(stat);
}

function pushUniqueStatSpec(specs, label, stat) {
  if (!stat || specs.some(([, existing]) => existing === stat)) return;
  specs.push([label, stat]);
}

function getRecommendedStatSpecs(slot, profile) {
  const primary = normalizePrimaryFinalStatKey(profile?.uiTypeProfile?.primaryStat);
  const specs = [];
  pushUniqueStatSpec(specs, "속도", "speed");
  if (slot.relicMainStats?.rope === "energyRegen") pushUniqueStatSpec(specs, "에너지 회복", "energyRegen");
  const recommendedStats = [
    ...(slot.relicMainStats ? Object.values(slot.relicMainStats) : []),
    ...(slot.relicSubStatPriority ?? []),
  ]
    .map(normalizeRecommendedFinalStatKey)
    .filter((stat) => stat && !["hpFlat", "atkFlat", "defFlat"].includes(stat));
  for (const stat of recommendedStats) {
    if (stat === primary || stat === "speed" || stat === "energyRegen") continue;
    pushUniqueStatSpec(specs, formatFinalStatLabel(stat), stat);
    if (specs.length >= 4) break;
  }
  return specs;
}

function getProfileStatSpecs(character, profile, slot) {
  const template = profile?.uiTypeProfile?.damageTemplate;
  const typeLabel = profile?.uiTypeProfile?.displayTypeLabel ?? "";
  const primary = normalizePrimaryFinalStatKey(profile?.uiTypeProfile?.primaryStat);
  if (template === "break") {
    return [
      ["격특", "breakEffect"],
      ["속도", "speed"],
      ["효과 명중", "effectHitRate"],
    ];
  }
  if (template === "dot") {
    return [
      ["공격력", "atk"],
      ["효과 명중", "effectHitRate"],
      [formatElementDamageLabel(character), "elementDamage"],
      ["속도", "speed"],
    ];
  }
  if (template === "support" || template === "utility" || /서포터|힐러|탱커|디버퍼/.test(typeLabel)) {
    return getRecommendedStatSpecs(slot, profile);
  }
  return [
    ["치확", "critRate"],
    ["치피", "critDamage"],
    [formatElementDamageLabel(character), "elementDamage"],
    ["속도", "speed"],
  ];
}

function buildCharacterProfileRows(character, slot, selfStats) {
  const profile = getCustomTypeProfile(character.characterId);
  const typeLabel = profile?.uiTypeProfile?.displayTypeLabel ?? `${elementLabels[character.element] ?? character.element ?? "-"} / ${pathLabels[character.path] ?? character.path ?? "-"}`;
  const primaryStat = normalizePrimaryFinalStatKey(profile?.uiTypeProfile?.primaryStat ?? profile?.uiTypeProfile?.statProfile) ?? "speed";
  const primaryLabel = formatPrimaryStatProfile(profile);
  const rows = [
    { label: "타입", value: typeLabel, kind: "role" },
    { label: `주요스탯 : ${primaryLabel}`, value: formatCalculatedSelfStat(selfStats?.stats, primaryStat), kind: "primary" },
  ];
  for (const [label, stat] of getProfileStatSpecs(character, profile, slot)) {
    if (stat === primaryStat) continue;
    rows.push({ label, value: formatCalculatedSelfStat(selfStats?.stats, stat), kind: stat === "speed" ? "speed" : "metric" });
  }
  return rows;
}

function formatMainStatList(mainStats = {}) {
  return ["body", "feet", "sphere", "rope"]
    .map((key) => mainStats[key])
    .filter(Boolean)
    .map(formatStatLabel)
    .join(" / ") || "-";
}

function normalizeProfileNameKey(value) {
  return String(value ?? "").replace(/[•·\s]/g, "");
}

function getProfileAssetName(character) {
  if (!character) return null;
  return [
    ...(character.aliasNames ?? []),
    character.displayName,
    character.localizedName,
    character.officialName,
    ...(character.sourceNames ?? []),
  ].filter(Boolean)[0];
}

function characterProfileUrl(character, variant = "imageOnly") {
  const candidate = getProfileAssetName(character);
  if (!candidate) return null;
  const folder = variant === "withText" ? "character-profile-with-text" : "character-profile-image-only";
  return encodeURI(`/${folder}/${candidate}.png`);
}

function filterIconUrl(iconFile) {
  return encodeURI(`/filter-icons/${iconFile}`);
}

function CharacterAvatar({ character, variant = "imageOnly" }) {
  const localProfileUrl = characterProfileUrl(character, variant);
  if (localProfileUrl) {
    return (
      <img
        src={localProfileUrl}
        alt=""
        loading="lazy"
        onError={(event) => {
          const fallback = character?.iconPath;
          if (fallback && event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
        }}
      />
    );
  }
  if (character?.iconPath) {
    return <img src={character.iconPath} alt="" loading="lazy" />;
  }
  return <span className="calc-avatar-fallback" aria-hidden="true">{normalizeProfileNameKey(character?.displayName).slice(0, 1) || "+"}</span>;
}

function getCharacterTypeLabel(character) {
  const profile = getCustomTypeProfile(character?.characterId);
  return profile?.uiTypeProfile?.displayTypeLabel
    ?? profile?.uiTypeProfile?.roleClass
    ?? profile?.relicTypeProfile?.presetLabel
    ?? "타입 미지정";
}

function getElementIconFile(elementKey) {
  return elementFilterIcons.find((item) => item.key === elementKey)?.iconFile ?? "Type_Physical_Small 1.png";
}

function MainDealerOptionContent({ slot, fallbackLabel = "캐릭터 미선택" }) {
  const character = getCharacter(slot?.characterId);
  return (
    <span className="calc-main-dealer-option">
      <span className="calc-party-face">
        <CharacterAvatar character={character} />
      </span>
      <span className="calc-main-dealer-copy">
        <strong>
          <span>{character?.displayName ?? fallbackLabel}</span>
          <small className="calc-main-dealer-eidolon">E{slot?.eidolon ?? 0}</small>
        </strong>
        <small>{character ? getCharacterTypeLabel(character) : "-"}</small>
      </span>
      <span className="calc-main-dealer-icons" aria-hidden="true">
        {character?.element && <img src={filterIconUrl(getElementIconFile(character.element))} alt="" />}
        {character?.path && <img src={filterIconUrl(getPathIconFile(character.path))} alt="" />}
      </span>
    </span>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-2.1a7.7 7.7 0 0 0 0-2.8l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-2.4-1.4L14.2 2h-4.4l-.4 3.2A7.8 7.8 0 0 0 7 6.6l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 0 0 0 2.8l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 2.4 1.4l.4 3.2h4.4l.4-3.2a7.8 7.8 0 0 0 2.4-1.4l2.4 1 2-3.5-2-1.5Z"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
        d="M12 5v14M5 12h14"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 3v12m0-12 4.5 4.5M12 3 7.5 7.5M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"
      />
    </svg>
  );
}

function PartySlot({ slot, active, onSelect }) {
  const character = getCharacter(slot.characterId);
  return (
    <button className={`calc-party-slot ${active ? "is-active" : ""} ${character ? "" : "is-empty"}`} type="button" onClick={onSelect}>
      <span className="calc-party-face">
        <CharacterAvatar character={character} variant="withText" />
      </span>
      <strong>{character?.displayName ?? "빈 슬롯"}</strong>
      <span>E{slot.eidolon}</span>
    </button>
  );
}

function CharacterStatusCard({ slot, active, onSelect, onEidolonChange, onOpenLightCone, onOpenRelic }) {
  const character = getCharacter(slot.characterId);
  if (!character) {
    return (
      <article className="calc-status-card is-empty">
        <button type="button" onClick={onSelect}>캐릭터 선택</button>
      </article>
    );
  }

  const set4 = { id: slot.relicSet4Id, name: slot.relicSet4Name };
  const set2 = { id: slot.relicSet2Id, name: slot.relicSet2Name };
  const defaultBuild = getDefaultBuild(character.characterId);
  const selfStats = calculateSelfEquipmentStats({
    character,
    slot,
    defaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones,
  });
  const statRows = buildCharacterProfileRows(character, slot, selfStats);

  return (
    <article className={`calc-status-card ${active ? "is-active" : ""}`}>
      <div className="calc-status-head">
        <button className="calc-profile-button" type="button" onClick={onSelect}>
          <CharacterAvatar character={character} />
        </button>
        <div className="calc-status-title-line">
          <strong>{character.displayName}</strong>
          <label className="calc-eidolon-control">
            <select value={slot.eidolon} onChange={(event) => onEidolonChange(Number(event.target.value))} aria-label={`${character.displayName} 성혼`}>
              {[0, 1, 2, 3, 4, 5, 6].map((level) => (
                <option key={level} value={level}>E{level}</option>
              ))}
            </select>
          </label>
          <button className="calc-lightcone-button" type="button" title={slot.lightconeName} aria-label={`${character.displayName} 광추 선택`} onClick={onOpenLightCone}>
            <LightConeThumb lightcone={lightCones.find((lightcone) => lightcone.id === slot.lightconeId)} iconFile={slot.lightconeIconFile} rank={slot.lightconeRank ?? 1} />
          </button>
        </div>
      </div>

      <button className="calc-equipment-button" type="button" aria-label={`${character.displayName} 유물 선택`} onClick={onOpenRelic}>
        <div className="calc-relic-parts" title={`${slot.relicSet4Name} / ${slot.relicSet2Name}`}>
          {relicPieces.map((piece) => (
            <span key={piece.key} title={piece.name}>
              <RelicPieceIcon piece={piece} set4={set4} set2={set2} />
            </span>
          ))}
        </div>
      </button>

      <div className="calc-precombat-stats">
        {statRows.map(({ label, value, kind }) => {
          const [groupLabel, detailLabel] = [label, ""];
          return (
          <span key={label} className={`calc-precombat-stat-cell is-${kind}`}>
            <small className="calc-stat-row-label">
              <span>{groupLabel}</span>
              {detailLabel && <span>{detailLabel}</span>}
            </small>
            <b className="calc-precombat-stat-value">{value}</b>
          </span>
          );
        })}
      </div>
    </article>
  );
}

function LightConePickerSheet({ slot, onClose, onApply }) {
  const [query, setQuery] = useState("");
  const [rank, setRank] = useState(slot.lightconeRank ?? 1);
  const character = getCharacter(slot.characterId);
  const normalizedQuery = query.trim().toLowerCase();
  const characterPath = normalizeLightConePathKey(character?.path);
  const sourceOptions = characterPath
    ? lightCones.filter((lightcone) => normalizeLightConePathKey(lightcone.path) === characterPath)
    : lightCones;
  const options = sourceOptions
    .filter((lightcone) => {
      if (!normalizedQuery) return true;
      return lightcone.name.toLowerCase().includes(normalizedQuery);
    })
    .slice(0, 80);

  return (
    <div className="calc-modal-backdrop is-lightcone-editor" role="dialog" aria-modal="true" aria-label="광추 선택" onClick={onClose}>
      <aside className="calc-picker-sheet calc-lightcone-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="calc-sheet-head calc-lightcone-sheet-head">
          <label className="calc-search-field">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="광추 검색" />
          </label>
          <label className="calc-rank-field" aria-label="광추 중첩">
            <select value={rank} onChange={(event) => setRank(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}중첩</option>)}
            </select>
          </label>
          <button className="calc-icon-button calc-close-button" type="button" onClick={onClose} aria-label="닫기">
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="calc-lightcone-grid">
          {options.length === 0 && (
            <div className="calc-empty-lightcone-result">검색 결과가 없습니다</div>
          )}
          {options.map((lightcone) => {
            const applyLightCone = () => {
              onApply({
                lightconeId: lightcone.id,
                lightconeName: lightcone.name,
                lightconeRank: rank,
                lightconeIconFile: getLightConeIconFile(lightcone, "png"),
              });
              onClose();
            };
            return (
              <div
                key={lightcone.id}
                className={`calc-lightcone-choice ${slot.lightconeId === lightcone.id ? "is-active" : ""}`}
                role="button"
                tabIndex={0}
                onClick={applyLightCone}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  applyLightCone();
                }}
              >
                <LightConeThumb lightcone={lightcone} rank={rank} showRank={false} />
                <span className="calc-lightcone-copy">
                  <strong>{lightcone.name}</strong>
                  <small>HP {formatNumber(lightcone.base?.hp)} / 공격력 {formatNumber(lightcone.base?.atk)} / 방어력 {formatNumber(lightcone.base?.def)}</small>
                  <p>{renderRankedLightConeText(lightcone.effects?.[0]?.sourceText ?? "광추 효과 정보", rank)}</p>
                </span>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function RelicEditorSheet({ slot, onClose, onApply }) {
  const [set4Name, setSet4Name] = useState(slot.relicSet4Name ?? "터널 유물");
  const [set2Name, setSet2Name] = useState(slot.relicSet2Name ?? "차원 장신구");
  const [openSetPicker, setOpenSetPicker] = useState(null);
  const [mainStats, setMainStats] = useState(() => ({ ...(slot.relicMainStats ?? {}) }));
  const [pieceBuilds, setPieceBuilds] = useState(() => sanitizeRelicPieces(
    slot.relicPieces,
    slot.relicMainStats,
    slot.relicPieces,
    slot.relicSubStatPriority,
  ));
  const [subStatPriority, setSubStatPriority] = useState(() => {
    const values = slot.relicSubStatPriority?.length ? slot.relicSubStatPriority : relicSubStats;
    return Array.from({ length: 4 }, (_, index) => values[index] ?? relicSubStats[index] ?? "");
  });
  const tunnelOptions = uniqueOptions([
    set4Name,
    ...defaultBuildRows.map((row) => row.selectedRelics?.set4?.name),
  ]);
  const ornamentOptions = uniqueOptions([
    set2Name,
    ...defaultBuildRows.map((row) => row.selectedRelics?.set2?.name),
  ]);
  const set4 = findRelicSetByName(set4Name, "set4") ?? { id: slot.relicSet4Id, name: set4Name };
  const set2 = findRelicSetByName(set2Name, "set2") ?? { id: slot.relicSet2Id, name: set2Name };

  function closeAndApply() {
    const sanitizedPieces = sanitizeRelicPieces(pieceBuilds, mainStats, slot.relicPieces, subStatPriority);
    onApply({
      relicSet4Id: set4?.id ?? null,
      relicSet4Name: set4Name,
      relicSet2Id: set2?.id ?? null,
      relicSet2Name: set2Name,
      relicMainStats: mainStats,
      relicPieces: sanitizedPieces,
      relicSubStatPriority: buildRelicSubStatPriorityFromPieces(sanitizedPieces, subStatPriority),
    });
    onClose();
  }

  function updateMainStat(pieceKey, nextMainStat) {
    const normalizedMainStat = normalizeRelicMainStatForPiece(pieceKey, nextMainStat);
    setMainStats((current) => ({ ...current, [pieceKey]: normalizedMainStat }));
    setPieceBuilds((current) => ({
      ...current,
      [pieceKey]: {
        ...(current[pieceKey] ?? {}),
        mainStat: normalizedMainStat,
        subStats: normalizeRelicSubStatRows(current[pieceKey]?.subStats, normalizedMainStat, subStatPriority),
      },
    }));
  }

  function updatePieceSubStat(pieceKey, rowIndex, patch) {
    setPieceBuilds((current) => {
      const mainStat = getPieceMainStat(pieceKey, mainStats, current);
      const currentRows = current[pieceKey]?.subStats?.length
        ? current[pieceKey].subStats
        : normalizeRelicSubStatRows([], mainStat, subStatPriority);
      const nextRows = currentRows.map((row, index) => (index === rowIndex ? { ...row, ...patch } : row));
      const normalizedRows = patch.stat
        ? normalizeRelicSubStatRows(nextRows, mainStat, nextRows.map((row) => row.stat))
        : normalizeRelicRollBudget(nextRows, rowIndex);
      const nextPiece = {
        ...(current[pieceKey] ?? {}),
        mainStat,
        subStats: normalizedRows,
      };
      const next = { ...current, [pieceKey]: nextPiece };
      setSubStatPriority(buildRelicSubStatPriorityFromPieces(next, subStatPriority));
      return next;
    });
  }

  return (
    <div className="calc-modal-backdrop is-relic-editor" role="dialog" aria-modal="true" aria-label="유물 설정" onClick={closeAndApply}>
      <aside className="calc-relic-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="calc-sheet-head calc-relic-sheet-head">
          <div className="calc-sheet-title">유물</div>
          <button className="calc-icon-button calc-close-button" type="button" onClick={closeAndApply} aria-label="닫기">
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="calc-relic-scroll">
          <div className="calc-relic-set-grid">
            <div className={`calc-relic-set-field ${openSetPicker === "set4" ? "is-open" : ""}`}>
              <button type="button" className="calc-relic-set-trigger" onClick={() => setOpenSetPicker((current) => (current === "set4" ? null : "set4"))}>
                <span className="calc-relic-set-thumb">
                  <RelicSetIcon relicSet={set4} fallbackPiece="head" />
                </span>
                <span className="calc-relic-set-copy">
                  <span>4셋 유물</span>
                  <strong>{set4Name}</strong>
                </span>
              </button>
              {openSetPicker === "set4" ? (
                <div className="calc-relic-set-menu">
                  {tunnelOptions.map((option) => {
                    const relicSet = findRelicSetByName(option, "set4") ?? { name: option };
                    return (
                      <button
                        type="button"
                        className={option === set4Name ? "is-active" : ""}
                        key={option}
                        onClick={() => {
                          setSet4Name(option);
                          setOpenSetPicker(null);
                        }}
                      >
                        <span className="calc-relic-set-thumb">
                          <RelicSetIcon relicSet={relicSet} fallbackPiece="head" />
                        </span>
                        <strong>{option}</strong>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className={`calc-relic-set-field ${openSetPicker === "set2" ? "is-open" : ""}`}>
              <button type="button" className="calc-relic-set-trigger" onClick={() => setOpenSetPicker((current) => (current === "set2" ? null : "set2"))}>
                <span className="calc-relic-set-thumb">
                  <RelicSetIcon relicSet={set2} fallbackPiece="sphere" />
                </span>
                <span className="calc-relic-set-copy">
                  <span>2셋 장신구</span>
                  <strong>{set2Name}</strong>
                </span>
              </button>
              {openSetPicker === "set2" ? (
                <div className="calc-relic-set-menu">
                  {ornamentOptions.map((option) => {
                    const relicSet = findRelicSetByName(option, "set2") ?? { name: option };
                    return (
                      <button
                        type="button"
                        className={option === set2Name ? "is-active" : ""}
                        key={option}
                        onClick={() => {
                          setSet2Name(option);
                          setOpenSetPicker(null);
                        }}
                      >
                        <span className="calc-relic-set-thumb">
                          <RelicSetIcon relicSet={relicSet} fallbackPiece="sphere" />
                        </span>
                        <strong>{option}</strong>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
          <div className="calc-piece-editor-grid">
            {relicPieces.map((piece) => (
              <section className="calc-piece-editor-card" key={piece.key}>
                {(() => {
                  const mainStat = getPieceMainStat(piece.key, mainStats, pieceBuilds);
                const pieceSubStats = pieceBuilds[piece.key]?.subStats?.length
                  ? pieceBuilds[piece.key].subStats
                  : normalizeRelicSubStatRows([], mainStat, subStatPriority);
                const subStatOptions = getAvailableRelicSubStatOptions(mainStat);
                const mainStatOptions = getRelicMainStatOptionsForPiece(piece.key);
                const fixedMainStat = piece.key === "head" || piece.key === "hands";
                return (
                  <>
              <div className="calc-piece-editor-head">
                <label className={`calc-piece-main-field ${fixedMainStat ? "is-fixed" : ""}`}>
                  <span className="calc-piece-main-thumb">
                    <RelicPieceIcon piece={piece} set4={set4} set2={set2} />
                  </span>
                  <strong>{piece.name} : {formatStatLabel(mainStat)}</strong>
                  {!fixedMainStat ? (
                    <select
                      value={mainStat}
                      onChange={(event) => updateMainStat(piece.key, event.target.value)}
                    aria-label={`${piece.name} 주옵`}
                  >
                      {mainStatOptions.map((stat) => (
                        <option key={stat} value={stat}>{formatStatLabel(stat)}</option>
                      ))}
                    </select>
                  ) : null}
                </label>
              </div>
              <div className="calc-piece-substat-list">
                {pieceSubStats.map((subStat, index) => (
                  <div className="calc-piece-substat-card" key={`${piece.key}-${index}`}>
                    <label className="calc-substat-field">
                      <span>부옵 {index + 1}</span>
                      <span className="calc-substat-control">
                        <strong>{formatStatLabel(subStat.stat)}</strong>
                      </span>
                      <select
                        value={subStat.stat}
                        onChange={(event) => updatePieceSubStat(piece.key, index, { stat: event.target.value })}
                        aria-label={`${piece.name} 부옵 ${index + 1}`}
                      >
                        {subStatOptions.map((option) => (
                          <option key={option} value={option}>{formatStatLabel(option)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="calc-roll-field">
                      <span>ROLL</span>
                      <span className="calc-roll-control">
                        <b>+{subStat.rolls}</b>
                        <strong>{formatRelicSubStatRollValue(subStat.stat, subStat.rolls)}</strong>
                      </span>
                      <select
                        value={subStat.rolls}
                        onChange={(event) => updatePieceSubStat(piece.key, index, { rolls: Number(event.target.value) })}
                        aria-label={`${piece.name} 부옵 ${index + 1} ROLL`}
                      >
                        {relicRollOptions.map((roll) => (
                          <option key={roll} value={roll}>+{roll} / {formatRelicSubStatRollValue(subStat.stat, roll)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
                    </>
                  );
                })()}
              </section>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean))];
}

function MainDealerCard({ party, activeSlotId, onChange }) {
  const [open, setOpen] = useState(false);
  const activeSlot = party.find((slot) => slot.slotId === activeSlotId) ?? party[0];
  const activeCharacter = getCharacter(activeSlot?.characterId);

  const renderOption = (slot) => {
    return <MainDealerOptionContent slot={slot} />;
  };

  return (
    <section className="calc-current-party-summary-row calc-party-summary-select" aria-label="현재 선택된 파티">
      <div className="calc-main-dealer-select">
        <button
          className="calc-main-dealer-trigger"
          type="button"
          aria-expanded={open}
          aria-label={`메인 딜러 ${activeCharacter?.displayName ?? "캐릭터 미선택"} 선택`}
          onClick={() => setOpen((current) => !current)}
        >
          {renderOption(activeSlot)}
          <span className="calc-main-dealer-chevron" aria-hidden="true" />
        </button>
        {open && (
          <div className="calc-main-dealer-menu" role="listbox" aria-label="메인 딜러 선택">
            {party.map((slot) => (
              <button
                key={slot.slotId}
                className={slot.slotId === activeSlotId ? "is-active" : ""}
                type="button"
                role="option"
                aria-selected={slot.slotId === activeSlotId}
                onClick={() => {
                  onChange(slot.slotId);
                  setOpen(false);
                }}
              >
                {renderOption(slot)}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function IconFilterRow({ items, value, onChange, label }) {
  return (
    <div className="calc-icon-filter-row" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.key}
          className={`calc-filter-icon ${value === item.key ? "is-active" : ""}`}
          type="button"
          title={item.name}
          aria-label={item.name}
          onClick={() => onChange(value === item.key ? null : item.key)}
        >
          <img src={filterIconUrl(item.iconFile)} alt="" />
        </button>
      ))}
    </div>
  );
}

function CharacterPickerSheet({ value, selectedIds, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [pathFilter, setPathFilter] = useState(null);
  const [elementFilter, setElementFilter] = useState(null);
  const options = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return characterIdentity.rows
      .filter((character) => {
        if (unavailableCharacterIds.has(character.characterId)) return false;
        if (pathFilter && character.path !== pathFilter) return false;
        if (elementFilter && character.element !== elementFilter) return false;
        if (!normalized) return true;
        const text = [character.displayName, character.characterId, ...(character.aliasNames ?? [])].join(" ").toLowerCase();
        return text.includes(normalized);
      });
  }, [elementFilter, pathFilter, query]);

  return (
    <div className="calc-modal-backdrop is-picker" role="dialog" aria-modal="true" aria-label="캐릭터 선택" onClick={onClose}>
      <aside className="calc-picker-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="calc-sheet-head calc-character-picker-head">
          <label className="calc-search-field calc-character-search-field">
            <span className="calc-search-mark" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색" />
          </label>
          <button className="calc-icon-button calc-close-button" type="button" onClick={onClose} aria-label="닫기">
            <span aria-hidden="true" />
          </button>
        </div>
        <IconFilterRow items={pathFilterIcons} value={pathFilter} onChange={setPathFilter} label="운명의 길 필터" />
        <IconFilterRow items={elementFilterIcons} value={elementFilter} onChange={setElementFilter} label="속성 필터" />
        <div className="calc-character-grid">
          {options.map((character) => {
            const disabled = selectedIds.includes(character.characterId) && character.characterId !== value;
            return (
              <button
                key={character.characterId}
                className={character.characterId === value ? "is-active" : ""}
                type="button"
                title={character.displayName}
                aria-label={character.displayName}
                disabled={disabled}
                onClick={() => {
                  onSelect(character.characterId);
                  onClose();
                }}
              >
                <CharacterAvatar character={character} variant="withText" />
                <strong>{character.displayName}</strong>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function EnemyEditor({ enemy, onChange }) {
  return (
    <section className="calc-enemy-card" aria-label="적 설정">
      <label>
        적 수
        <select value={enemy.count} onChange={(event) => onChange({ ...enemy, count: Number(event.target.value) })}>
          {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
        </select>
      </label>
      <label>
        레벨
        <select value={enemy.level} onChange={(event) => onChange({ ...enemy, level: Number(event.target.value) })}>
          {enemyLevelOptions.map((level) => <option key={level} value={level}>Lv.{level}</option>)}
        </select>
      </label>
      <label>
        강인도
        <select value={enemy.toughness} onChange={(event) => onChange({ ...enemy, toughness: Number(event.target.value) })}>
          {enemyToughnessOptions.map((toughness) => <option key={toughness} value={toughness}>{toughness}</option>)}
        </select>
      </label>
      <label>
        속성 저항
        <select value={enemy.resistance} onChange={(event) => onChange({ ...enemy, resistance: Number(event.target.value) })}>
          {enemyResistanceOptions.map((value) => <option key={value} value={value}>{value}%</option>)}
        </select>
      </label>
    </section>
  );
}

const finalStatDisplayOrder = ["hp", "atk", "def", "speed", "critRate", "critDamage", "elementDamage", "breakEffect", "effectHitRate", "energyRegen"];
const attackTypeLabels = {
  basic: "일반 공격",
  skill: "전투 스킬",
  ultimate: "필살기",
  follow_up: "추가 공격",
  dot: "지속 피해",
};

const contributionTabs = [
  { key: "character", label: "캐릭터별" },
  { key: "stat", label: "스탯별" },
  { key: "party", label: "파티원 추천" },
];
const partyRecommendationPreviewCount = 5;
const partyRecommendationEidolonOptions = [
  { value: 0, label: "명함" },
  { value: 1, label: "1돌" },
  { value: 2, label: "2돌" },
  { value: 6, label: "6돌" },
];

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
  const character = getCharacter(control.characterId ?? slot?.characterId);
  return {
    key: control.key,
    characterId: character?.characterId ?? control.characterId ?? slot?.characterId ?? null,
    characterLabel: character?.displayName ?? character?.localizedName ?? control.characterId ?? null,
    label: control.label,
    note: resolved.note ?? control.note,
    defaultValue: resolved.defaultValue,
    effectRowIds: control.effectRowIds ?? [],
    valueFormula: control.valueFormula ?? null,
    options: resolved.options.map((value) => ({
      value,
      label: formatStateControlOptionLabel(value, control),
    })),
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
  return { options, defaultValue, note: source.note };
}

function formatStateControlOptionLabel(value, control) {
  if (control.format === "toggle") return Number(value) >= 1 ? "ON" : "OFF";
  if (control.format === "percent") return `${formatNumber(Number(value) * 100)}%`;
  if (control.format === "number") return formatDamageNumber(value);
  if (control.format === "count") return `${formatNumber(value)}명`;
  if (String(control.key ?? "").toLowerCase().includes("stack")) return `${formatNumber(value)}스택`;
  return formatNumber(value);
}

function PartySpecificSettingPanel({ controls, values, onChange, title = "캐릭터 스택 / 상태 설정" }) {
  if (!controls.length) return null;
  return (
    <section className="calc-party-settings-panel" aria-label={title}>
      <div className="calc-party-settings-head">
        <strong>{title}</strong>
      </div>
      <div className="calc-party-settings-controls">
        {controls.map((control) => {
          const character = getCharacter(control.characterId);
          return (
          <label key={control.key} className="calc-party-settings-card">
            <span className="calc-party-settings-owner">
              <span className="calc-party-face">
                <CharacterAvatar character={character} />
              </span>
              <span>
                <b>{control.characterLabel ?? "전투 조건"}</b>
                <em>{control.label}</em>
              </span>
            </span>
            <select value={values[control.key] ?? control.defaultValue} onChange={(event) => onChange(control.key, Number(event.target.value))}>
              {control.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <small>{control.note}</small>
          </label>
          );
        })}
      </div>
    </section>
  );
}

function BattleStatEvaluationPanel({ evaluation }) {
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const toggle = (key) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  if (!evaluation?.groups?.length) return null;
  return (
    <section className="calc-evaluation-panel" aria-label="스탯 평가">
      {evaluation.groups.map((group) => (
        <article key={group.key} className="calc-evaluation-group">
          <h3>{group.label}</h3>
          <div className="calc-evaluation-list">
            {group.rows.map((row) => {
              const rowKey = `${group.key}:${row.key}`;
              const expanded = expandedRows.has(rowKey);
              return (
                <div key={rowKey} className={`calc-evaluation-card is-${row.status ?? "neutral"} ${expanded ? "is-expanded" : ""}`}>
                  <button type="button" className="calc-evaluation-row" aria-expanded={expanded} onClick={() => toggle(rowKey)}>
                    <span>
                      <i aria-hidden="true">{row.status === "warning" || row.status === "notice" ? "!" : ""}</i>
                      <small>{row.label}</small>
                      <b>{formatEvaluationValue(row)}</b>
                    </span>
                    <em>
                      {row.compactMessage || `${row.entries?.length ?? 0}개 출처`}
                      <span className="calc-evaluation-chevron" aria-hidden="true" />
                    </em>
                  </button>
                  {expanded && (
                    <ul className="calc-evaluation-source-list">
                      {row.entries?.length ? groupEvaluationEntriesByOwner(row.entries).slice(0, 8).map((ownerGroup) => {
                        const ownerCharacter = getCharacter(ownerGroup.ownerId);
                        return (
                          <li key={`${rowKey}:${ownerGroup.key}`} className="calc-evaluation-source-group">
                            <div className="calc-evaluation-source-owner">
                              <span className="calc-party-face">
                                <CharacterAvatar character={ownerCharacter} />
                              </span>
                              <strong>{ownerGroup.ownerLabel}</strong>
                            </div>
                            <ul>
                              {ownerGroup.entries.slice(0, 8).map((entry) => {
                                const parts = getNamedEvaluationValueParts(entry);
                                return (
                                  <li key={`${rowKey}:${ownerGroup.key}:${entry.id}:${entry.stat}`}>
                                    <span className="calc-evaluation-source-stat">{parts.label}</span>
                                    <span className={`calc-evaluation-source-amount ${parts.toneClass}`}>{parts.sign}{parts.value}{parts.flatText}</span>
                                    <span className="calc-evaluation-source-mark" title={entry.sourceType ?? "출처"}>
                                      <SourceTypeMark entry={entry} ownerCharacter={ownerCharacter} />
                                    </span>
                                    <span className="calc-evaluation-source-label" title={entry.label ?? ""}>
                                      <EvaluationSourceLabel label={entry.label} />
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        );
                      }) : (
                        <li><span>표시할 출처 항목이 없습니다.</span></li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}

function groupEvaluationEntriesByOwner(entries = []) {
  const groups = new Map();
  let totalMagnitude = 0;
  for (const entry of entries) {
    const ownerKey = entry.groupKey ?? entry.ownerId ?? entry.ownerLabel ?? "unknown";
    if (!groups.has(ownerKey)) {
      groups.set(ownerKey, {
        key: ownerKey,
        ownerId: entry.ownerId,
        ownerLabel: entry.groupLabel ?? entry.ownerLabel ?? entry.ownerId ?? "출처",
        totalMagnitude: 0,
        entries: [],
      });
    }
    const group = groups.get(ownerKey);
    group.entries.push(entry);
    const magnitude = Math.abs(Number(entry.effectiveValue ?? entry.value ?? 0));
    group.totalMagnitude += magnitude;
    totalMagnitude += magnitude;
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      percent: totalMagnitude > 0 ? group.totalMagnitude / totalMagnitude : 0,
      entries: group.entries.sort((a, b) => Math.abs(Number(b.effectiveValue ?? b.value ?? 0)) - Math.abs(Number(a.effectiveValue ?? a.value ?? 0)) || String(a.label).localeCompare(String(b.label), "ko")),
    }))
    .sort((a, b) => b.totalMagnitude - a.totalMagnitude || String(a.ownerLabel).localeCompare(String(b.ownerLabel), "ko"));
}

function formatNamedEvaluationValue(entry) {
  const parts = getNamedEvaluationValueParts(entry);
  return `${parts.label} ${parts.sign}${parts.value}`;
}

function getNamedEvaluationValueParts(entry) {
  const rawStat = entry?.stat;
  const stat = entry?.effectiveStat ?? rawStat;
  const displayStat = shouldDisplayRawRatioStat(rawStat) ? rawStat : stat;
  const displayValue = shouldDisplayRawRatioStat(rawStat) ? entry?.value : (entry?.effectiveValue ?? entry?.value);
  const statLabel = statLabels[displayStat] ?? statLabels[stat] ?? stat ?? "스탯";
  const value = formatStatValue(displayStat, displayValue);
  const numericValue = Number(displayValue ?? 0);
  const sign = numericValue > 0 ? "+" : "";
  const toneClass = numericValue > 0 ? "is-positive-stat" : numericValue < 0 ? "is-negative-stat" : "";
  const flatText = shouldShowFlatContribution(rawStat, displayStat, stat, entry)
    ? ` (${Number(entry?.effectiveValue ?? 0) > 0 ? "+" : ""}${formatStatValue(stat, entry?.effectiveValue)})`
    : "";
  return { label: statLabel, sign, value, flatText, toneClass };
}

function shouldShowFlatContribution(rawStat, displayStat, effectiveStat, entry) {
  return (rawStat === "hpRatio" || rawStat === "atkRatio" || rawStat === "defRatio" || rawStat === "speedRatio")
    && displayStat === rawStat
    && (effectiveStat === "hp" || effectiveStat === "atk" || effectiveStat === "def" || effectiveStat === "speed")
    && Number.isFinite(Number(entry?.effectiveValue));
}

function shouldDisplayRawRatioStat(stat) {
  return stat === "hpRatio"
    || stat === "atkRatio"
    || stat === "defRatio"
    || stat === "speedRatio"
    || stat === "critRate"
    || stat === "critDamage"
    || stat === "elementDamage"
    || stat === "energyRegen"
    || stat === "breakEffect"
    || stat === "effectHitRate"
    || stat === "effectResistance"
    || stat === "outgoingHealingBoost"
    || stat === "resistancePenetration"
    || stat === "resistancePen"
    || stat === "defenseIgnore"
    || stat === "defenseDown"
    || stat === "vulnerability"
    || stat === "damageBoost"
    || stat === "allDamage"
    || stat === "basicDamage"
    || stat === "skillDamage"
    || stat === "ultimateDamage"
    || stat === "followDamage"
    || stat === "dotDamage"
    || stat === "breakDamage"
    || stat === "dealtCritDamage"
    || stat === "followCritDamage"
    || stat === "specialFinal";
}

function SourceTypeMark({ entry, ownerCharacter }) {
  const iconUrl = getEntryIconUrl(entry, ownerCharacter);
  if (iconUrl) return <img className={iconUrl.startsWith("/filter-icons/") ? "is-path-icon" : ""} src={iconUrl} alt="" />;
  return <b>{getCompactSourceTypeLabel(entry?.sourceType)}</b>;
}

function EvaluationSourceLabel({ label }) {
  const text = String(label ?? "");
  const match = text.match(/^(.*?)(\s*\(.+\))$/);
  if (!match) return <small>{text}</small>;
  return (
    <small>
      {match[1]}
      <span className="calc-evaluation-source-set-name">{match[2]}</span>
    </small>
  );
}

function getSourceTypeIconUrl(sourceType, ownerCharacter) {
  const normalized = String(sourceType ?? "").toLowerCase();
  if (normalized.includes("relic") || normalized.includes("ornament") || normalized.includes("유물")) {
    return null;
  }
  if (normalized.includes("light") || normalized.includes("cone") || normalized.includes("광추")) return null;
  if (ownerCharacter?.path && (normalized.includes("trace") || normalized.includes("행적") || normalized.includes("eidolon") || normalized.includes("성혼") || normalized.includes("buff") || normalized.includes("debuff"))) {
    return filterIconUrl(getPathIconFile(ownerCharacter.path));
  }
  return null;
}

function getEntryIconUrl(entry, ownerCharacter) {
  const sourceType = String(entry?.sourceType ?? "");
  const label = String(entry?.label ?? "");
  const normalizedSourceType = sourceType.toLowerCase();
  if (normalizedSourceType.includes("relic") || normalizedSourceType.includes("ornament") || sourceType.includes("유물") || isRelicSourceLabel(label)) return getRelicSourceIconUrl(label);
  if (sourceType.includes("광추")) return getLightConeIconUrl(label, ownerCharacter);
  return getSourceTypeIconUrl(sourceType, ownerCharacter);
}

function isRelicSourceLabel(label) {
  return label.includes("주옵")
    || label.includes("주 옵션")
    || label.includes("부옵")
    || label.includes("부 옵션")
    || label.includes("유물")
    || label.includes("셋효과")
    || label.includes("세트")
    || label.includes("머리")
    || label.includes("손")
    || label.includes("몸통")
    || label.includes("신발")
    || label.includes("구체")
    || label.includes("매듭");
}

function getRelicSourceIconUrl(label) {
  const setName = String(label.match(/\((.+)\)/)?.[1] ?? "").trim();
  if (setName) {
    const relicSet = findRelicSetByName(setName);
    const iconFile = getRelicIconFile(relicSet);
    if (iconFile) return encodeURI(`/relic-icons/${iconFile}`);
  }
  return getRelicPieceIconUrl(label) ?? "/relic-piece-icons/head.svg";
}

function getRelicPieceIconUrl(label) {
  if (label.includes("머리")) return "/relic-piece-icons/head.svg";
  if (label.includes("손")) return "/relic-piece-icons/hands.svg";
  if (label.includes("몸통")) return "/relic-piece-icons/body.svg";
  if (label.includes("신발")) return "/relic-piece-icons/feet.svg";
  if (label.includes("구체")) return "/relic-piece-icons/sphere.svg";
  if (label.includes("매듭")) return "/relic-piece-icons/rope.svg";
  return null;
}

function getLightConeIconUrl(label, ownerCharacter) {
  const lightCone = lightCones.find((item) => label.includes(item.name));
  if (lightCone) {
    const iconFile = lightCone.iconFile ?? getLightConeIconFile(lightCone, "png");
    if (iconFile) return encodeURI(`/lightcone-icons/${iconFile}`);
  }
  return ownerCharacter?.path ? filterIconUrl(getPathIconFile(ownerCharacter.path)) : null;
}

function getPathIconFile(pathKey) {
  return pathFilterIcons.find((item) => item.key === pathKey)?.iconFile ?? "Icon_Destruction 1.png";
}

function getCompactSourceTypeLabel(sourceType) {
  const normalized = String(sourceType ?? "").toLowerCase();
  if (normalized.includes("light") || normalized.includes("cone") || normalized.includes("광추")) return "광추";
  if (normalized.includes("relic") || normalized.includes("ornament") || normalized.includes("유물")) return "유물";
  if (normalized.includes("trace") || normalized.includes("행적")) return "행적";
  if (normalized.includes("eidolon") || normalized.includes("성혼")) return "성혼";
  if (normalized.includes("debuff")) return "디버프";
  if (normalized.includes("buff")) return "버프";
  return "효과";
}

function ContributionTabs({ value, onChange }) {
  return (
    <div className="calc-contribution-tabs" role="tablist" aria-label="기여도 표시 방식">
      {contributionTabs.map((tab) => (
        <button key={tab.key} className={value === tab.key ? "is-active" : ""} type="button" role="tab" aria-selected={value === tab.key} onClick={() => onChange(tab.key)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ContributionPanel({
  viewMode,
  contributionViews,
  skillCards,
  partyRecommendationGroups = [],
  partyRecommendationEidolon = 0,
  onPartyRecommendationEidolonChange,
}) {
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const eidolonsByCharacterId = useMemo(() => buildEidolonMap(contributionViews?.battleResult), [contributionViews?.battleResult]);
  const toggle = (key) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleGroup = (key) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  if (viewMode === "party") {
    const recommendationGroups = partyRecommendationGroups.length
      ? partyRecommendationGroups
      : buildPartyRecommendationGroups(skillCards, contributionViews);
    return (
      <section className="calc-contribution-panel" aria-label="파티원 추천">
        <div className="calc-party-recommendation-toolbar" aria-label="추천 후보 성혼 기준">
          <span>추천 기준</span>
          <div className="calc-party-recommendation-eidolon-tabs">
            {partyRecommendationEidolonOptions.map((option) => (
              <button
                key={option.value}
                className={Number(partyRecommendationEidolon) === option.value ? "is-active" : ""}
                type="button"
                onClick={() => onPartyRecommendationEidolonChange?.(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="calc-damage-analysis-list">
          {recommendationGroups.length ? recommendationGroups.map((group) => (
            <article key={group.key} className="calc-damage-skill-card calc-party-recommendation-card">
              <div className="calc-damage-skill-head">
                <div>
                  <strong className="calc-damage-skill-title-line">
                    <span>{group.label}</span>
                    <b><span>{formatDamageNumber(group.baseDamage)}</span><small>DMG</small></b>
                  </strong>
                  <small>{group.rows.length}명 후보 기준</small>
                </div>
              </div>
              <div className="calc-contribution-list calc-damage-source-list">
                {(expandedGroups.has(group.key) ? group.rows : group.rows.slice(0, partyRecommendationPreviewCount)).map((row, index) => {
                  const rowKey = `${group.key}:party:${row.ownerId}`;
                  const expanded = expandedRows.has(rowKey);
                  const ownerCharacter = getCharacter(row.ownerId);
                  return (
                    <article key={rowKey} className={`calc-contribution-card ${expanded ? "is-expanded" : ""} ${index === 0 ? "is-top-contributor" : ""}`}>
                      <button type="button" className="calc-contribution-row calc-party-recommendation-row" aria-expanded={expanded} onClick={() => toggle(rowKey)}>
                        <span className="calc-contribution-rank">{index + 1}</span>
                        <div className="calc-contribution-owner">
                          <span className="calc-party-face">
                            <CharacterAvatar character={ownerCharacter} />
                          </span>
                          <div className="calc-contribution-label">
                            <strong>
                              <span>{row.ownerLabel}</span>
                              <small className="calc-contribution-eidolon">E{row.eidolon ?? getOwnerEidolon(eidolonsByCharacterId, row.ownerId)}</small>
                            </strong>
                          </div>
                        </div>
                        <em className="is-damage-gain">
                          {formatSignedDamageNumber(row.deltaDamage)} DMG <small>({formatSignedPercent(row.gainRatio)})</small>
                        </em>
                        <i aria-hidden="true"><span style={{ width: `${Math.max(3, Math.min(100, row.percent * 100))}%` }} /></i>
                        <span className="calc-contribution-chevron" aria-hidden="true" />
                      </button>
                      {expanded && (
                        <ul className="calc-contribution-detail-list is-character-detail">
                          {row.rows.slice(0, 12).map((entry) => {
                            const parts = getNamedEvaluationValueParts(entry);
                            return (
                              <li key={`${rowKey}:${entry.id}:${entry.stat}`}>
                                <span className="calc-evaluation-source-stat">{parts.label}</span>
                                <span className={`calc-evaluation-source-amount ${parts.toneClass}`}>{parts.sign}{parts.value}{parts.flatText}</span>
                                <span className="calc-evaluation-source-mark" title={entry.sourceType ?? "출처"}>
                                  <SourceTypeMark entry={entry} ownerCharacter={getCharacter(entry.ownerId)} />
                                </span>
                                <span className="calc-evaluation-source-label" title={entry.label ?? ""}>
                                  <EvaluationSourceLabel label={entry.label} />
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </article>
                  );
                })}
                {group.rows.length > partyRecommendationPreviewCount && (
                  <button className="calc-party-recommendation-more" type="button" onClick={() => toggleGroup(group.key)}>
                    {expandedGroups.has(group.key) ? "접기" : `더보기 ${group.rows.length - partyRecommendationPreviewCount}명`}
                  </button>
                )}
              </div>
            </article>
          )) : (
            <article className="calc-damage-skill-card">
              <p>파티원 추천에 사용할 피해 스킬 row가 없습니다.</p>
            </article>
          )}
        </div>
      </section>
    );
  }
  const rows = viewMode === "stat" ? contributionViews.statRows : contributionViews.characterRows;
  return (
    <section className="calc-contribution-panel" aria-label="피해 기여도">
      <div className="calc-contribution-list">
        {rows.length ? rows.slice(0, 10).map((row, index) => {
          const rowKey = `${viewMode}:${row.key}`;
          const expanded = expandedRows.has(rowKey);
          const ownerCharacter = viewMode === "character" ? getCharacter(row.rows?.[0]?.ownerId) : null;
          return (
            <article key={rowKey} className={`calc-contribution-card ${expanded ? "is-expanded" : ""} ${index === 0 ? "is-top-contributor" : ""}`}>
              <button type="button" className="calc-contribution-row" aria-expanded={expanded} onClick={() => toggle(rowKey)}>
                <span className="calc-contribution-rank">{index + 1}</span>
                <div className={`calc-contribution-owner ${viewMode === "stat" ? "calc-contribution-stat-owner" : ""}`}>
                  {viewMode === "character" && (
                    <span className="calc-party-face">
                      <CharacterAvatar character={ownerCharacter} />
                    </span>
                  )}
                  <div className="calc-contribution-label">
                    <strong>
                      <span>{viewMode === "stat" ? (statLabels[row.label] ?? row.label) : row.label}</span>
                      {viewMode === "character" && <small className="calc-contribution-eidolon">E{getOwnerEidolon(eidolonsByCharacterId, row.rows?.[0]?.ownerId)}</small>}
                      {viewMode === "stat" && <small className="calc-contribution-unit">{formatContributionUnit(row)}</small>}
                    </strong>
                  </div>
                </div>
                <em>{formatPercent(row.percent)}</em>
                <i aria-hidden="true"><span style={{ width: `${Math.max(3, Math.min(100, row.percent * 100))}%` }} /></i>
                <span className="calc-contribution-chevron" aria-hidden="true" />
              </button>
              {expanded && (
                <ul className={`calc-contribution-detail-list ${viewMode === "stat" ? "is-stat-detail" : "is-character-detail"}`}>
                  {row.rows.slice(0, 12).map((entry) => {
                    const parts = getNamedEvaluationValueParts(entry);
                    return (
                      <li key={`${rowKey}:${entry.id}:${entry.stat}`}>
                        <span className="calc-evaluation-source-stat">{parts.label}</span>
                        <span className={`calc-evaluation-source-amount ${parts.toneClass}`}>{parts.sign}{parts.value}{parts.flatText}</span>
                        <span className="calc-evaluation-source-mark" title={entry.sourceType ?? "출처"}>
                          <SourceTypeMark entry={entry} ownerCharacter={getCharacter(entry.ownerId)} />
                        </span>
                        <span className="calc-evaluation-source-label" title={entry.label ?? ""}>
                          <EvaluationSourceLabel label={entry.label} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        }) : (
          <article className="calc-damage-skill-card">
            <p>표시할 기여도 row가 없습니다.</p>
          </article>
        )}
      </div>
    </section>
  );
}

function buildPartyRecommendationGroups(skillCards = [], contributionViews = {}) {
  const sourceRows = contributionViews?.sourceRows ?? [];
  const activeCharacterId = contributionViews?.battleResult?.activeCharacter?.characterId;
  const partyCharacterIds = new Set((contributionViews?.battleResult?.partySlots ?? []).map((slot) => slot.characterId).filter(Boolean));
  return skillCards.slice(0, 10).map((card) => {
    const rows = groupSkillSourceRowsByOwner(buildSkillSourceRows(card, sourceRows))
      .filter((row) => row.ownerId && row.ownerId !== activeCharacterId && partyCharacterIds.has(row.ownerId))
      .map((row) => ({
        ...row,
        deltaDamage: Number(card.critDamage ?? 0) * Number(row.percent ?? 0),
        gainRatio: Number(card.critDamage ?? 0) > 0 ? Number(row.percent ?? 0) : 0,
      }))
      .filter((row) => row.deltaDamage > 0)
      .sort((a, b) => b.deltaDamage - a.deltaDamage || String(a.ownerLabel).localeCompare(String(b.ownerLabel), "ko"));
    return {
      key: `party-rec:${card.id}`,
      label: getDamageSkillDisplayLabel(card),
      baseDamage: Number(card.critDamage ?? 0),
      rows,
    };
  }).filter((group) => group.rows.length);
}

function buildPartyCandidateRecommendationGroups({ party = [], activeSlotId, enemy, baseSkillCards = [], scenarioSettings = {}, candidateEidolon = 0 } = {}) {
  const baseBySkillId = new Map(baseSkillCards.map((card) => [card.id, card]));
  const activeSlot = party.find((slot) => slot.slotId === activeSlotId) ?? party[0] ?? null;
  if (!activeSlot?.characterId || !baseSkillCards.length) return [];
  const replacementSlots = party.filter((slot) => slot.slotId !== activeSlot.slotId);
  const candidateReplacementSlots = replacementSlots.length ? replacementSlots : [activeSlot];
  const selectedIds = new Set(party.map((slot) => slot.characterId).filter(Boolean));
  const candidates = characterIdentity.rows
    .filter((character) => character?.characterId && character.characterId !== activeSlot.characterId)
    .filter((character) => !unavailableCharacterIds.has(character.characterId))
    .map((character) => buildCandidateDamageDelta({
      character,
      party,
      activeSlotId,
      replacementSlots: candidateReplacementSlots,
      enemy,
      baseBySkillId,
      alreadySelected: selectedIds.has(character.characterId),
      scenarioSettings,
      candidateEidolon,
    }))
    .filter(Boolean);

  return baseSkillCards.slice(0, 10).map((baseCard) => {
    const rows = candidates
      .map((candidate) => candidate.skillRows.get(baseCard.id))
      .filter(Boolean)
      .sort((a, b) => b.deltaDamage - a.deltaDamage || String(a.ownerLabel).localeCompare(String(b.ownerLabel), "ko"));
    return {
      key: `party-candidate:${baseCard.id}`,
      label: getDamageSkillDisplayLabel(baseCard),
      baseDamage: Number(baseCard.critDamage ?? 0),
      rows,
    };
  }).filter((group) => group.rows.length);
}

function buildCandidateDamageDelta({ character, party, activeSlotId, replacementSlots = [], enemy, baseBySkillId, alreadySelected, scenarioSettings = {}, candidateEidolon = 0 }) {
  const skillRows = new Map();
  for (const replacementSlot of replacementSlots) {
    const candidateSlot = {
      ...createDefaultEquipmentForCharacter(character),
      slotId: replacementSlot.slotId,
      characterId: character.characterId,
      eidolon: candidateEidolon,
    };
    const candidateParty = party.map((slot) => (slot.slotId === replacementSlot.slotId ? candidateSlot : slot));
    const candidateStateControls = buildPartySpecificControls(candidateParty, activeSlotId);
    const candidateBattleResult = calculateBattleFinalStats({
      party: candidateParty,
      activeSlotId,
      characterGetter: getCharacter,
      defaultBuildGetter: getDefaultBuild,
      characterStatBaseline,
      equipmentStatModel,
      lightCones,
      ledgerRows: combatLedgerRows,
      effectMetadataRows: battleEffectMetadataRows,
      scenarioSettings,
      stateControls: candidateStateControls,
    });
    const candidateSkillCards = calculateSkillDamageCards({
      battleResult: candidateBattleResult,
      skillRows: skillDamageMetadata.rows ?? [],
      enemy,
      scenarioSettings,
    });
    const contributionViews = {
      ...buildDamageContributionViews({
        battleResult: candidateBattleResult,
        skillCards: candidateSkillCards,
        skillRows: skillDamageMetadata.rows ?? [],
        enemy,
        scenarioSettings,
        sourceOwnerId: character.characterId,
      }),
      battleResult: candidateBattleResult,
    };
    for (const candidateCard of candidateSkillCards) {
      const baseCard = baseBySkillId.get(candidateCard.id);
      if (!baseCard) continue;
      const supportProcDamage = calculateCandidateSupportProcDamage({
        supportCharacter: character,
        supportSlot: candidateSlot,
        activeCard: candidateCard,
        activeBattleResult: candidateBattleResult,
        enemy,
      });
      const adjustedCandidateDamage = Number(candidateCard.critDamage ?? 0) + supportProcDamage.damage;
      const deltaDamage = adjustedCandidateDamage - Number(baseCard.critDamage ?? 0);
      const sourceRows = buildSkillSourceRows(candidateCard, contributionViews.sourceRows ?? [])
        .filter((row) => row.ownerId === character.characterId)
        .sort(sortSourceRowsByContribution);
      if (supportProcDamage.rows.length) {
        sourceRows.unshift(...supportProcDamage.rows);
      }
      const gainRatio = Number(baseCard.critDamage ?? 0) > 0 ? deltaDamage / Number(baseCard.critDamage ?? 0) : 0;
      const nextRow = {
        key: `${candidateCard.id}:${character.characterId}`,
        ownerId: character.characterId,
        ownerLabel: character.displayName ?? character.name ?? character.characterId,
        replacementSlotId: replacementSlot.slotId,
        eidolon: candidateEidolon,
        deltaDamage,
        gainRatio,
        percent: gainRatio,
        alreadySelected,
        rows: sourceRows,
      };
      const current = skillRows.get(candidateCard.id);
      if (!current || nextRow.deltaDamage > current.deltaDamage) {
        skillRows.set(candidateCard.id, nextRow);
      }
    }
  }
  return { characterId: character.characterId, skillRows };
}

function calculateCandidateSupportProcDamage({ supportCharacter, supportSlot, activeCard, activeBattleResult, enemy }) {
  if (!supportCharacter?.characterId || !activeCard) return { damage: 0, rows: [] };
  const procs = (supportDamageProcs.procs ?? [])
    .filter((proc) => proc.ownerId === supportCharacter.characterId)
    .filter((proc) => (proc.triggerAttackTypes ?? []).includes(activeCard.attackType));
  if (!procs.length) return { damage: 0, rows: [] };

  const supportSelf = calculateSelfEquipmentStats({
    character: supportCharacter,
    slot: supportSlot,
    defaultBuild: getDefaultBuild(supportCharacter.characterId),
    characterStatBaseline,
    equipmentStatModel,
    lightCones,
  });
  const supportStats = supportSelf.stats ?? {};
  const activeStats = activeBattleResult?.finalStats ?? {};
  const rows = procs
    .map((proc) => {
      const damage = calculateSupportProcDamageValue({
        proc,
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
      };
    })
    .filter(Boolean);
  return {
    damage: rows.reduce((sum, row) => sum + Number(row.contributionValue ?? 0), 0),
    rows,
  };
}

function calculateSupportProcDamageValue({ proc, supportStats = {}, activeStats = {}, activeCard, activeBattleResult, enemy }) {
  if (proc.type === "trueDamageRatio") {
    if (isSupportProcAlreadyApplied(proc, activeBattleResult)) return 0;
    return Number(activeCard?.directCritDamage ?? activeCard?.critDamage ?? 0) * Number(proc.ratio ?? 0);
  }
  const stats = proc.scalingOwner === "active" ? activeStats : supportStats;
  const scalingValue = Number(stats[proc.scalingStat] ?? 0);
  if (!Number.isFinite(scalingValue) || scalingValue <= 0) return 0;
  const critMultiplier = resolveSupportProcCritMultiplier(proc, supportStats, activeStats);
  const attackDamageKey = getAttackDamageStatKey(activeCard?.attackType);
  const damageBoost = Number(stats.allDamage ?? 0)
    + Number(stats.elementDamage ?? 0)
    + Number(stats[attackDamageKey] ?? 0);
  return Math.max(0, scalingValue
    * Number(proc.coefficient ?? 0)
    * (1 + damageBoost)
    * critMultiplier
    * calculateSupportDefenseMultiplier(enemy?.level)
    * calculateSupportResistanceMultiplier(enemy?.resistance)
    * calculateSupportBrokenMultiplier(enemy));
}

function resolveSupportProcCritMultiplier(proc, supportStats = {}, activeStats = {}) {
  if (proc.critMode === "none") return 1;
  if (proc.critMode === "fixed") return Number(proc.critMultiplier ?? 1);
  const stats = proc.critMode === "active" ? activeStats : supportStats;
  return 1 + Number(stats.critDamage ?? 0);
}

function getAttackDamageStatKey(attackType) {
  return {
    basic: "basicDamage",
    skill: "skillDamage",
    ultimate: "ultimateDamage",
    follow_up: "followDamage",
    dot: "dotDamage",
  }[attackType] ?? null;
}

function isSupportProcAlreadyApplied(proc, battleResult) {
  if (!proc.sourceEffectRowId) return false;
  return (battleResult?.appliedRows ?? []).some((row) => (
    row.ownerId === proc.ownerId
    && (row.effectRowId === proc.sourceEffectRowId || row.sourceTrace?.effectRowId === proc.sourceEffectRowId)
    && row.stat === proc.type
  ));
}

function calculateSupportDefenseMultiplier(enemyLevel = 95) {
  const attackerLevel = 80;
  const attackerTerm = attackerLevel + 20;
  const enemyTerm = Number(enemyLevel ?? 95) + 20;
  return attackerTerm / (attackerTerm + enemyTerm);
}

function calculateSupportResistanceMultiplier(enemyResistance = 20) {
  const resistance = Number(enemyResistance ?? 20) / 100;
  return Math.min(Math.max(1 - resistance, 0.1), 2);
}

function calculateSupportBrokenMultiplier(enemy = {}) {
  return enemy?.isBroken === false ? 0.9 : 1;
}

function formatContributionUnit(row) {
  const stat = row?.key ?? row?.label;
  return formatStatValue(stat, row?.statValue ?? row?.value ?? 0);
}

function formatSignedPercent(value) {
  const numeric = Number(value ?? 0);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${formatPercent(numeric)}`;
}

function formatSignedDamageNumber(value) {
  const numeric = Number(value ?? 0);
  const sign = numeric > 0 ? "+" : numeric < 0 ? "-" : "";
  return `${sign}${formatDamageNumber(Math.abs(numeric))}`;
}

function buildEidolonMap(battleResult) {
  return new Map((battleResult?.partySlots ?? []).map((slot) => [slot.characterId, Number(slot.eidolon ?? 0)]));
}

function getOwnerEidolon(eidolonsByCharacterId, ownerId) {
  const value = eidolonsByCharacterId?.get(ownerId);
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function formatContributionEntryPercent(entry, groupValue) {
  const value = Math.abs(Number(entry?.contributionValue ?? entry?.effectiveValue ?? entry?.value ?? 0));
  const total = Math.abs(Number(groupValue ?? 0));
  if (total <= 0) return "-";
  return formatPercent(value / total);
}

function buildStatSensitivityRows(skillCards) {
  const totalDamage = skillCards.reduce((sum, card) => sum + Number(card.critDamage ?? 0), 0);
  if (totalDamage <= 0) return [];
  const rows = [
    {
      key: "primaryFlat",
      label: "계수 스탯",
      unitLabel: "+100",
      delta: skillCards.reduce((sum, card) => sum + (Number(card.scalingValue) > 0 ? Number(card.critDamage) * (100 / Number(card.scalingValue)) : 0), 0),
    },
    {
      key: "critDamage",
      label: "치명타 피해",
      unitLabel: "+10%",
      delta: skillCards.reduce((sum, card) => sum + Number(card.nonCritDamage ?? 0) * 0.1, 0),
    },
    {
      key: "damageBoost",
      label: "피해 증가",
      unitLabel: "+10%",
      delta: skillCards.reduce((sum, card) => sum + Number(card.critDamage ?? 0) * (0.1 / Math.max(0.1, 1 + Number(card.trace?.damageBoost ?? 0))), 0),
    },
    {
      key: "vulnerability",
      label: "받는 피해 증가",
      unitLabel: "+10%",
      delta: skillCards.reduce((sum, card) => sum + Number(card.critDamage ?? 0) * (0.1 / Math.max(0.1, 1 + Number(card.trace?.vulnerability ?? 0))), 0),
    },
  ].filter((row) => row.delta > 0);
  return rows
    .map((row) => ({ ...row, ratio: row.delta / totalDamage }))
    .sort((a, b) => b.delta - a.delta);
}

function DamageResultPanel({ battleResult, skillCards = [], contributionViews, viewMode = "character" }) {
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const eidolonsByCharacterId = useMemo(() => buildEidolonMap(battleResult), [battleResult]);
  const toggle = (key) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  return (
    <section className="calc-damage-analysis-panel" aria-label="계산 결과">
      <div className="calc-damage-analysis-list">
        {skillCards.length ? skillCards.slice(0, 10).map((card) => {
          const sourceRows = buildSkillSourceRows(card, contributionViews?.sourceRows ?? []);
          const sourceGroups = viewMode === "stat"
            ? groupSkillSourceRowsByStat(sourceRows)
            : groupSkillSourceRowsByOwner(sourceRows);
          return (
          <article key={card.id} className="calc-damage-skill-card">
            <div className="calc-damage-skill-head">
              <div>
                <strong className="calc-damage-skill-title-line">
                  <span>{getDamageSkillDisplayLabel(card)}</span>
                  <b><span>{formatDamageNumber(card.critDamage)}</span><small>DMG</small></b>
                </strong>
                <small>계수: {formatNumber(card.coefficientPercent, 1)}% {formatDamageTargetLabel(card)}</small>
              </div>
            </div>
            <div className="calc-contribution-list calc-damage-source-list">
              {sourceGroups.length ? sourceGroups.map((row, index) => {
                const rowKey = `${card.id}:source:${row.key}`;
                const expanded = expandedRows.has(rowKey);
                const ownerCharacter = viewMode === "character" ? getCharacter(row.ownerId) : null;
                return (
                  <article key={rowKey} className={`calc-contribution-card ${expanded ? "is-expanded" : ""} ${index === 0 ? "is-top-contributor" : ""}`}>
                    <button type="button" className="calc-contribution-row" aria-expanded={expanded} onClick={() => toggle(rowKey)}>
                      <span className="calc-contribution-rank">{index + 1}</span>
                      <div className={`calc-contribution-owner ${viewMode === "stat" ? "calc-contribution-stat-owner" : ""}`}>
                        {viewMode === "character" && (
                          <span className="calc-party-face">
                            <CharacterAvatar character={ownerCharacter} />
                          </span>
                        )}
                        <div className="calc-contribution-label">
                          <strong>
                            <span>{row.ownerLabel}</span>
                            {viewMode === "character" && <small className="calc-contribution-eidolon">E{getOwnerEidolon(eidolonsByCharacterId, row.ownerId)}</small>}
                            {viewMode === "stat" && <small className="calc-contribution-unit">{formatContributionUnit(row)}</small>}
                          </strong>
                        </div>
                      </div>
                      <em>{formatPercent(row.percent)}</em>
                      <i aria-hidden="true"><span style={{ width: `${Math.max(3, Math.min(100, row.percent * 100))}%` }} /></i>
                      <span className="calc-contribution-chevron" aria-hidden="true" />
                    </button>
                    {expanded && (
                      <ul className={`calc-contribution-detail-list ${viewMode === "stat" ? "is-stat-detail" : "is-character-detail"}`}>
                        {row.rows.slice(0, 12).map((entry) => {
                          const parts = getNamedEvaluationValueParts(entry);
                          return (
                            <li key={`${rowKey}:${entry.id}:${entry.stat}`}>
                              <span className="calc-evaluation-source-stat">{parts.label}</span>
                              <span className={`calc-evaluation-source-amount ${parts.toneClass}`}>{parts.sign}{parts.value}{parts.flatText}</span>
                              <span className="calc-evaluation-source-mark" title={entry.sourceType ?? "출처"}>
                                <SourceTypeMark entry={entry} ownerCharacter={getCharacter(entry.ownerId)} />
                              </span>
                              <span className="calc-evaluation-source-label" title={entry.label ?? ""}>
                                <EvaluationSourceLabel label={entry.label} />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </article>
                );
              }) : <p className="calc-damage-empty-note">이 스킬에 연결할 수 있는 출처 row가 없습니다.</p>}
            </div>
          </article>
          );
        }) : (
          <article className="calc-damage-skill-card">
            <div className="calc-damage-skill-head">
              <div>
                <strong>스킬 계수 없음</strong>
                <small>현재 선택 캐릭터의 계산 가능한 피해 계수 row가 없습니다.</small>
              </div>
              <b>0개</b>
            </div>
          </article>
        )}

      </div>
    </section>
  );
}

function getDamageSkillDisplayLabel(card) {
  return attackTypeLabels[card?.attackType] ?? card?.attackType ?? "피해";
}

function formatDamageTargetLabel(card) {
  const raw = String(card?.targetScope ?? card?.targetProfile ?? "").trim();
  if (!raw) return "-";
  const normalized = raw.toLowerCase();
  if (normalized.includes("single")) return "단일 공격";
  if (normalized.includes("blast")) return "확산 공격";
  if (normalized.includes("aoe") || normalized.includes("all")) return "전체 공격";
  return raw;
}

function groupSkillSourceRowsByOwner(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const ownerCharacter = getCharacter(row.ownerId);
    const key = row.ownerId ?? row.ownerLabel ?? "unknown";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        ownerId: row.ownerId,
        ownerLabel: ownerCharacter?.displayName ?? row.ownerLabel ?? row.ownerId ?? "출처",
        percent: 0,
        rows: [],
      });
    }
    const group = groups.get(key);
    group.percent += Number(row.percent ?? 0);
    group.rows.push(row);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      rows: group.rows.sort(sortSourceRowsByContribution),
    }))
    .sort((a, b) => b.percent - a.percent || String(a.ownerLabel).localeCompare(String(b.ownerLabel), "ko"));
}

function groupSkillSourceRowsByStat(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.effectiveStat ?? row.stat ?? "unknown";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        ownerId: null,
        ownerLabel: statLabels[key] ?? key,
        value: 0,
        statValue: 0,
        percent: 0,
        rows: [],
      });
    }
    const group = groups.get(key);
    group.percent += Number(row.percent ?? 0);
    group.value += Math.abs(Number(row.value ?? 0));
    group.statValue += Math.abs(Number(row.effectiveValue ?? row.value ?? 0));
    group.rows.push(row);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      rows: group.rows.sort(sortSourceRowsByContribution),
    }))
    .sort((a, b) => b.percent - a.percent || String(a.ownerLabel).localeCompare(String(b.ownerLabel), "ko"));
}

function sortSourceRowsByContribution(a, b) {
  return Math.abs(Number(b.contributionValue ?? b.effectiveValue ?? b.value ?? 0))
    - Math.abs(Number(a.contributionValue ?? a.effectiveValue ?? a.value ?? 0))
    || String(a.label).localeCompare(String(b.label), "ko");
}

function getRelevantStatsForSkillCard(card) {
  const attackStat = {
    basic: "basicDamage",
    skill: "skillDamage",
    ultimate: "ultimateDamage",
    follow_up: "followDamage",
    dot: "dotDamage",
  }[card?.attackType];
  const formulaType = card?.damageFormulaType ?? "normal";
  const scalingStat = card?.scalingStat;
  const relevantStats = new Set();
  addScalingStats(relevantStats, scalingStat);

  if (formulaType === "break" || formulaType === "super_break") {
    addStats(relevantStats, [
      "breakEffect",
      "breakDamage",
      "vulnerability",
      "defenseDown",
      "defenseIgnore",
      "resistancePen",
      "specialFinal",
      "trueDamageRatio",
    ]);
    return relevantStats;
  }

  addStats(relevantStats, [
    "vulnerability",
    "defenseDown",
    "defenseIgnore",
    "resistancePen",
    "specialFinal",
    "trueDamageRatio",
  ]);

  if (formulaType === "dot") {
    addStats(relevantStats, ["elementDamage", "allDamage", "damageBoost", "dotDamage", attackStat]);
    return relevantStats;
  }

  addStats(relevantStats, ["critRate", "critDamage", "dealtCritDamage"]);
  if (formulaType === "elation") {
    addStats(relevantStats, ["elation", "merrymake", "takenCritDamage", card?.attackType === "follow_up" ? "followCritDamage" : null]);
    return relevantStats;
  }

  addStats(relevantStats, [
    "elementDamage",
    "allDamage",
    "damageBoost",
    attackStat,
    card?.attackType === "follow_up" ? "followCritDamage" : null,
  ]);
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

function buildSkillSourceRows(card, sourceRows) {
  const relevantStats = getRelevantStatsForSkillCard(card);
  const rows = sourceRows
    .filter((row) => relevantStats.has(row.stat) || relevantStats.has(row.effectiveStat))
    .map((row) => ({
      ...row,
      magnitude: Math.abs(Number(row.skillContributions?.[card.id] ?? row.contributionValue ?? row.effectiveValue ?? row.value ?? 0)),
    }));
  const total = rows.reduce((sum, row) => sum + row.magnitude, 0);
  if (total <= 0) return [];
  return rows
    .map((row) => ({ ...row, percent: row.magnitude / total }))
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 6);
}

function formatEvaluationValue(row) {
  const stat = row.statKeys?.[0] ?? row.key;
  return formatStatValue(stat, row.value);
}

function AppliedEffectPanel({ battleResult }) {
  const rows = battleResult?.appliedRows ?? [];
  return (
    <section className="calc-ledger-panel" aria-label="적용 효과">
      <div className="calc-section-head">
        <div>
          <span>적용 효과</span>
          <h2>현재 파티 기준</h2>
        </div>
        <Badge tone="neutral">{rows.length}개</Badge>
      </div>
      <div className="calc-trace-list">
        {rows.slice(0, 12).map((row) => (
          <article key={row.ledgerId} className={row.usedForCalculation ? "" : "is-blocked"}>
            <strong>{row.sourceLabel ?? row.sourceName ?? row.sourceId ?? row.ledgerId}</strong>
            <span>{statLabels[row.stat] ?? row.stat ?? "-"} {formatStatValue(row.stat, row.resolvedValue)}</span>
            <small>{row.targetPolicy ?? "target"} / {row.ownerId ?? "owner"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsSheet({ onClose, ownedCharacterEidolon = 0, onOwnedCharacterEidolonChange }) {
  const links = [
    { label: "데이터 검증", note: "스킬, 성혼, 계수, 효과 추출 현황", href: "/extraction" },
    { label: "효과 원장", note: "계산 적용/미적용 효과 추적", href: "/ledger" },
    { label: "v2 작업 대시보드", note: "파이프라인 개발 상태 확인", href: "/dashboard" },
    { label: "Legacy 비교", note: "기존 계산 결과와 v2 결과 비교", href: "/legacy-diff" },
  ];

  return (
    <div className="calc-modal-backdrop is-settings-drawer" role="dialog" aria-modal="true" aria-label="설정" onClick={onClose}>
      <aside className="calc-settings-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="calc-sheet-head">
          <strong>설정</strong>
          <button className="calc-icon-button calc-close-button" type="button" onClick={onClose} aria-label="닫기">
            <span aria-hidden="true" />
          </button>
        </div>

        <div className="calc-settings-list">
          <section className="calc-settings-control-card" aria-label="보유 캐릭터 성혼 기준">
            <div>
              <strong>보유 캐릭터 성혼 기준</strong>
              <small>현재 파티와 파티원 추천 후보를 같은 성혼 기준으로 계산</small>
            </div>
            <div className="calc-settings-segmented">
              {partyRecommendationEidolonOptions.map((option) => (
                <button
                  key={option.value}
                  className={Number(ownedCharacterEidolon) === option.value ? "is-active" : ""}
                  type="button"
                  onClick={() => onOwnedCharacterEidolonChange?.(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
          {links.map((link) => (
            <button key={link.href} className="calc-settings-action" type="button" onClick={() => window.location.assign(link.href)}>
              <span aria-hidden="true">D</span>
              <strong>
                {link.label}
                <small>{link.note}</small>
              </strong>
            </button>
          ))}
        </div>
        <footer className="calc-settings-version">
          <span>HSR RELIC CC 2.0</span>
          <strong>v{appVersionName}</strong>
        </footer>
      </aside>
    </div>
  );
}

function LegacyConditionComparePanel({ party, activeSlotId, onMainDealerChange, enemy, onEnemyChange }) {
  const activeSlot = party.find((slot) => slot.slotId === activeSlotId) ?? party[0];
  const activeCharacter = getCharacter(activeSlot?.characterId);
  const conditionRows = [
    { id: "enemy", label: "적 설정", value: `적 ${enemy.count}명 / Lv.${enemy.level}` },
    { id: "eidolon", label: "성혼 비교", value: `${activeCharacter?.displayName ?? "캐릭터"} E${activeSlot?.eidolon ?? 0}` },
  ];

  return (
    <section className="calc-condition-compare" aria-label="조건부 비교">
      <MainDealerCard party={party} activeSlotId={activeSlotId} onChange={onMainDealerChange} />
      <EnemyEditor enemy={enemy} onChange={onEnemyChange} />

      <div className="calc-condition-grid">
        <article className="calc-condition-side">
          <div className="calc-section-head">
            <div>
              <span>조건 목록</span>
              <h2>비교 기준</h2>
            </div>
          </div>
          <div className="calc-condition-list">
            {conditionRows.map((row, index) => (
              <button key={row.id} className="calc-condition-row-main" type="button">
                <span>{index + 1}</span>
                <div>
                  <strong>{row.label}</strong>
                  <small>{row.value}</small>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="calc-condition-editor">
          <div className="calc-condition-editor-head">
            <h3>조건 편집</h3>
            <button className="calc-text-action-button" type="button">조건 추가</button>
          </div>
          <div className="calc-condition-delta-strip">
            <span><small>기준 피해</small><b>100%</b></span>
            <span><small>비교 피해</small><b>100%</b></span>
            <span><small>변화량</small><b>0%</b></span>
          </div>
        </article>
      </div>
    </section>
  );
}

function calculateConditionDamageSummary({ party, activeSlotId, enemy, scenarioSettings = {}, stateControls = [] }) {
  const battleResult = calculateBattleFinalStats({
    party,
    activeSlotId,
    characterGetter: getCharacter,
    defaultBuildGetter: getDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones,
    ledgerRows: combatLedgerRows,
    effectMetadataRows: battleEffectMetadataRows,
    scenarioSettings,
    stateControls,
  });
  const cards = calculateSkillDamageCards({
    battleResult,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings,
  });
  const totalDamage = cards.reduce((sum, card) => sum + Number(card.critDamage ?? 0), 0);
  return { battleResult, cards, totalDamage };
}

function ConditionComparePanel({
  party,
  activeSlotId,
  enemy,
  baseScenarioSettings,
  compareConditions,
  compareKeepSlotIds,
  ownedCharacterEidolon,
  onAddCondition,
  onEditCondition,
  onRemoveCondition,
  onAutoRecommend,
  onToggleKeepSlot,
  compareFeedback,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compareOverrides, setCompareOverrides] = useState({});
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const sanitizedConditions = useMemo(
    () => sanitizeCompareConditions(compareConditions, party, activeSlotId),
    [activeSlotId, compareConditions, party],
  );
  const baseParty = useMemo(
    () => applyCompareBaseConditionsToParty(party, sanitizedConditions),
    [party, sanitizedConditions],
  );
  const compareParty = useMemo(
    () => applyCompareConditionsToParty(party, sanitizedConditions, activeSlotId),
    [activeSlotId, party, sanitizedConditions],
  );
  const baseStateControls = useMemo(() => buildPartySpecificControls(baseParty, activeSlotId), [activeSlotId, baseParty]);
  const compareStateControls = useMemo(() => buildPartySpecificControls(compareParty, activeSlotId), [activeSlotId, compareParty]);
  const compareScenarioSettings = useMemo(
    () => ({ ...baseScenarioSettings, ...compareOverrides }),
    [baseScenarioSettings, compareOverrides],
  );
  const baseSummary = useMemo(() => calculateConditionDamageSummary({
    party: baseParty,
    activeSlotId,
    enemy,
    scenarioSettings: baseScenarioSettings,
    stateControls: baseStateControls,
  }), [activeSlotId, baseParty, baseScenarioSettings, baseStateControls, enemy]);
  const compareSummary = useMemo(() => calculateConditionDamageSummary({
    party: compareParty,
    activeSlotId,
    enemy,
    scenarioSettings: compareScenarioSettings,
    stateControls: compareStateControls,
  }), [activeSlotId, compareParty, compareScenarioSettings, compareStateControls, enemy]);
  const baseCardById = useMemo(() => new Map(baseSummary.cards.map((card) => [card.id, card])), [baseSummary.cards]);
  const conditionRows = compareSummary.cards.map((compareCard) => {
    const baseCard = baseCardById.get(compareCard.id);
    const deltaDamage = Number(compareCard.critDamage ?? 0) - Number(baseCard?.critDamage ?? 0);
    const gainRatio = Number(baseCard?.critDamage ?? 0) > 0 ? deltaDamage / Number(baseCard.critDamage) : 0;
    return { baseCard, compareCard, deltaDamage, gainRatio };
  });
  const totalDelta = compareSummary.totalDamage - baseSummary.totalDamage;
  const totalRatio = baseSummary.totalDamage > 0 ? totalDelta / baseSummary.totalDamage : 0;
  const keepSet = new Set(sanitizeCompareKeepSlotIds(compareKeepSlotIds, party));
  const hasConditions = sanitizedConditions.length > 0;
  const compareContributionViews = useMemo(() => buildDamageContributionViews({
    battleResult: compareSummary.battleResult,
    skillCards: compareSummary.cards,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings: compareScenarioSettings,
  }), [compareScenarioSettings, compareSummary.battleResult, compareSummary.cards, enemy]);
  const eidolonsByCharacterId = useMemo(() => buildEidolonMap(compareSummary.battleResult), [compareSummary.battleResult]);
  const toggleExpandedRow = (key) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="calc-condition-compare" aria-label="조건부 비교">
      <article className="calc-condition-editor">
        <div className="calc-condition-editor-head">
          <h3>비교 조건</h3>
          <div className="calc-condition-actions-row">
            <button className="calc-text-action-button is-primary" type="button" onClick={onAddCondition}>
              <PlusIcon />
              <span>비교조건 추가</span>
            </button>
            <button className="calc-text-action-button" type="button" onClick={onAutoRecommend}>자동추천</button>
            <button
              className="calc-text-action-button calc-condition-recommend-settings-button"
              type="button"
              aria-label="자동추천 설정"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((current) => !current)}
            >
              <span className="calc-condition-settings-mark" aria-hidden="true" />
            </button>
            {settingsOpen && (
              <div className="calc-auto-recommend-settings-popover">
                <div className="calc-auto-recommend-party-row">
                  {party.map((slot) => {
                    const character = getCharacter(slot.characterId);
                    const active = slot.slotId === activeSlotId;
                    const keep = active || keepSet.has(slot.slotId);
                    return (
                      <button
                        key={slot.slotId}
                        className={`calc-auto-recommend-party-slot ${active ? "is-main-dealer" : ""} ${keep ? "is-keep" : "is-replace"}`}
                        type="button"
                        disabled={active}
                        aria-pressed={keep}
                        onClick={() => onToggleKeepSlot(slot.slotId)}
                      >
                        <span className="calc-party-face">
                          <CharacterAvatar character={character} />
                        </span>
                        <span className="calc-auto-recommend-keep-badge">{keep ? "고정" : "교체"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="calc-condition-list">
          {hasConditions ? sanitizedConditions.map((condition, index) => (
            <div className="calc-condition-row-wrap" key={condition.id}>
              <button className="calc-condition-row-main" type="button" onClick={() => onEditCondition(condition.id)}>
                <span>{index + 1}</span>
                <div>
                  <strong>{getCompareConditionTitle(condition, party)}</strong>
                  <small>{getCompareConditionDetail(condition, party)}</small>
                </div>
              </button>
              <button className="calc-condition-remove-button" type="button" onClick={() => onRemoveCondition(condition.id)} aria-label="비교 조건 삭제">
                <span aria-hidden="true" />
              </button>
            </div>
          )) : (
            <p className="calc-condition-empty-note">비교 조건을 추가하면 현재 파티 대비 데미지 차이를 계산합니다.</p>
          )}
        </div>
        <PartySpecificSettingPanel
          controls={compareStateControls}
          values={compareScenarioSettings}
          onChange={(key, value) => setCompareOverrides((current) => ({ ...current, [key]: value }))}
          title="비교 상태값"
        />
        {hasConditions ? (
          <>
            <div className="calc-condition-delta-strip">
              <span><small>기준 피해</small><b>{formatDamageNumber(baseSummary.totalDamage)}</b></span>
              <span><small>비교 피해</small><b>{formatDamageNumber(compareSummary.totalDamage)}</b></span>
              <span><small>변화량</small><b className={totalDelta >= 0 ? "is-positive" : "is-negative"}>{formatSignedDamageNumber(totalDelta)} <em>({formatSignedPercent(totalRatio)})</em></b></span>
            </div>
            <div className="calc-condition-result-list">
              {conditionRows.length ? conditionRows.slice(0, 10).map(({ baseCard, compareCard, deltaDamage, gainRatio }, index) => {
                const rowKey = `condition-result:${compareCard.id}`;
                const expanded = expandedRows.has(rowKey);
                const sourceGroups = groupSkillSourceRowsByOwner(buildSkillSourceRows(compareCard, compareContributionViews?.sourceRows ?? []));
                return (
                  <article key={compareCard.id} className={`calc-condition-result-card ${deltaDamage >= 0 ? "is-up" : "is-down"} ${expanded ? "is-expanded" : ""}`}>
                    <button className="calc-condition-result-head" type="button" aria-expanded={expanded} onClick={() => toggleExpandedRow(rowKey)}>
                      <span>{index + 1}</span>
                      <div>
                        <strong>{getDamageSkillDisplayLabel(compareCard)}</strong>
                        <small>{formatDamageTargetLabel(compareCard)}</small>
                      </div>
                      <b>{formatDamageNumber(compareCard.critDamage)} <em>DMG</em></b>
                      <i className="calc-contribution-chevron" aria-hidden="true" />
                    </button>
                    <div className="calc-condition-result-detail">
                      <span><small>기준</small><b>{formatDamageNumber(baseCard?.critDamage ?? 0)}</b></span>
                      <span><small>차이</small><b className={deltaDamage >= 0 ? "is-positive" : "is-negative"}>{formatSignedDamageNumber(deltaDamage)}</b></span>
                      <span><small>증감률</small><b className={deltaDamage >= 0 ? "is-positive" : "is-negative"}>{formatSignedPercent(gainRatio)}</b></span>
                    </div>
                    {expanded && (
                      <div className="calc-condition-source-list">
                        {sourceGroups.length ? sourceGroups.slice(0, 4).map((group, groupIndex) => {
                          const ownerCharacter = getCharacter(group.ownerId);
                          return (
                            <article key={`${rowKey}:${group.key}`} className="calc-condition-source-group">
                              <div className="calc-condition-source-head">
                                <span className="calc-contribution-rank">{groupIndex + 1}</span>
                                <span className="calc-party-face">
                                  <CharacterAvatar character={ownerCharacter} />
                                </span>
                                <strong>{group.ownerLabel}<small>E{getOwnerEidolon(eidolonsByCharacterId, group.ownerId)}</small></strong>
                                <em>{formatPercent(group.percent)}</em>
                              </div>
                              <ul className="calc-contribution-detail-list is-character-detail">
                                {group.rows.slice(0, 4).map((entry) => {
                                  const parts = getNamedEvaluationValueParts(entry);
                                  return (
                                    <li key={`${rowKey}:${group.key}:${entry.id}:${entry.stat}`}>
                                      <span className="calc-evaluation-source-stat">{parts.label}</span>
                                      <span className={`calc-evaluation-source-amount ${parts.toneClass}`}>{parts.sign}{parts.value}{parts.flatText}</span>
                                      <span className="calc-evaluation-source-mark" title={entry.sourceType ?? "출처"}>
                                        <SourceTypeMark entry={entry} ownerCharacter={getCharacter(entry.ownerId)} />
                                      </span>
                                      <span className="calc-evaluation-source-label" title={entry.label ?? ""}>
                                        <EvaluationSourceLabel label={entry.label} />
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </article>
                          );
                        }) : <p className="calc-condition-empty-note">이 스킬에 연결할 수 있는 출처 row가 없습니다.</p>}
                      </div>
                    )}
                  </article>
                );
              }) : (
                <p className="calc-condition-empty-note">계산 가능한 스킬 피해 데이터가 없습니다.</p>
              )}
            </div>
          </>
        ) : null}
        {compareFeedback && <p className="calc-condition-feedback">{compareFeedback}</p>}
        <p className="calc-condition-meta-note">자동추천 기준: 보유 캐릭터 E{ownedCharacterEidolon}, 고정 슬롯 제외</p>
      </article>
    </section>
  );
}

function CompareConditionEditorModal({
  party,
  activeSlotId,
  condition,
  ownedCharacterEidolon,
  onClose,
  onApply,
}) {
  const [draft, setDraft] = useState(() => ({
    ...createDefaultCompareConditionDraft(party, condition?.slotId ?? activeSlotId, condition?.type ?? "character", activeSlotId),
    ...(condition ?? {}),
  }));
  const [replacementPickerOpen, setReplacementPickerOpen] = useState(false);
  const [lightconePickerOpen, setLightconePickerOpen] = useState(false);
  const [relicEditorOpen, setRelicEditorOpen] = useState(false);
  const targetSlot = party.find((slot) => slot.slotId === draft.slotId) ?? party[0];
  const targetCharacter = getCharacter(targetSlot?.characterId);
  const replacementCharacter = getCharacter(draft.characterId);
  const baseLightcone = lightCones.find((item) => item.id === draft.baseLightconeId);
  const nextLightcone = lightCones.find((item) => item.id === draft.lightconeId);
  const isCharacterType = draft.type === "character" || draft.type === "partyMember";
  const targetIsMainDealer = draft.slotId === activeSlotId;
  const selectedIds = party
    .filter((slot) => slot.slotId !== draft.slotId)
    .map((slot) => slot.characterId)
    .filter(Boolean);
  const typeTabs = [
    { key: "character", label: "캐릭터" },
    { key: "lightCone", label: "광추" },
    { key: "relic", label: "유물" },
  ];

  function patchDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function changeType(type) {
    setDraft((current) => ({
      ...createDefaultCompareConditionDraft(party, current.slotId, type, activeSlotId),
      id: current.id,
    }));
  }

  function changeTargetSlot(slotId) {
    const nextType = isCharacterType && slotId !== activeSlotId ? "partyMember" : isCharacterType ? "character" : draft.type;
    setDraft((current) => ({
      ...createDefaultCompareConditionDraft(party, slotId, nextType, activeSlotId),
      id: current.id,
      type: nextType,
    }));
  }

  function apply() {
    const normalized = normalizeCompareCondition(draft, party, activeSlotId);
    if (!normalized) return;
    onApply(normalized);
    onClose();
  }

  return (
    <div className="calc-modal-backdrop is-condition-editor" role="dialog" aria-modal="true" aria-label="비교조건 편집" onClick={onClose}>
      <aside className="calc-condition-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="calc-sheet-head">
          <strong>{condition ? "비교조건 수정" : "비교조건 추가"}</strong>
          <button className="calc-icon-button calc-close-button" type="button" onClick={onClose} aria-label="닫기">
            <span aria-hidden="true" />
          </button>
        </div>

        <div className="calc-condition-type-tabs" role="tablist" aria-label="조건 종류">
          {typeTabs.map((tab) => (
            <button
              key={tab.key}
              className={(tab.key === "character" ? isCharacterType : draft.type === tab.key) ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={tab.key === "character" ? isCharacterType : draft.type === tab.key}
              onClick={() => changeType(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="calc-condition-target-field">
          <span>대상</span>
          <select value={draft.slotId} onChange={(event) => changeTargetSlot(event.target.value)}>
            {party.map((slot, index) => {
              const character = getCharacter(slot.characterId);
              return (
                <option key={slot.slotId} value={slot.slotId}>
                  {index + 1}번 · {slot.slotId === activeSlotId ? "메인딜러" : "파티원"} · {character?.displayName ?? "빈 슬롯"}
                </option>
              );
            })}
          </select>
        </label>

        {isCharacterType ? (
          <div className="calc-condition-compare-cards">
            <CompareCharacterMiniCard
              character={targetCharacter}
              label={targetIsMainDealer ? "기준 돌파" : "기준 파티원"}
              eidolon={targetIsMainDealer ? draft.baseEidolon : targetSlot?.eidolon ?? 0}
              onEidolonChange={targetIsMainDealer ? (baseEidolon) => patchDraft({ baseEidolon }) : null}
            />
            <span className="calc-condition-arrow">-&gt;</span>
            <CompareCharacterMiniCard
              character={targetIsMainDealer ? targetCharacter : replacementCharacter}
              label={targetIsMainDealer ? "비교 돌파" : "교체 파티원"}
              eidolon={draft.eidolon}
              onPickCharacter={targetIsMainDealer ? null : () => setReplacementPickerOpen(true)}
              onEidolonChange={(eidolon) => patchDraft({ eidolon })}
            />
          </div>
        ) : null}

        {draft.type === "lightCone" ? (
          <div className="calc-condition-compare-cards">
            <CompareLightConeMiniCard
              label="기준 광추"
              lightcone={baseLightcone}
              rank={draft.baseLightconeRank}
              onRankChange={(baseLightconeRank) => patchDraft({ baseLightconeRank })}
            />
            <span className="calc-condition-arrow">-&gt;</span>
            <CompareLightConeMiniCard
              label="비교 광추"
              lightcone={nextLightcone}
              rank={draft.lightconeRank}
              editable
              onPick={() => setLightconePickerOpen(true)}
              onRankChange={(lightconeRank) => patchDraft({ lightconeRank })}
            />
          </div>
        ) : null}

        {draft.type === "relic" ? (
          <div className="calc-condition-relic-edit">
            <CompareRelicSummaryCard slot={{ ...targetSlot, ...(draft.relicPatch ?? {}) }} />
            <button className="calc-text-action-button is-primary" type="button" onClick={() => setRelicEditorOpen(true)}>유물 설정</button>
          </div>
        ) : null}

        <button className="calc-text-action-button is-primary calc-condition-apply-button" type="button" onClick={apply}>
          확인
        </button>
      </aside>

      {replacementPickerOpen && (
        <div onClick={(event) => event.stopPropagation()}>
          <CharacterPickerSheet
            value={draft.characterId}
            selectedIds={selectedIds}
            onSelect={(characterId) => {
              const character = getCharacter(characterId);
              const defaults = createDefaultEquipmentForCharacter(character);
              patchDraft({
                characterId,
                eidolon: ownedCharacterEidolon,
                lightconeId: defaults.lightconeId,
                lightconeRank: defaults.lightconeRank,
                relicPatch: sanitizeRelicPatch(defaults),
              });
            }}
            onClose={() => setReplacementPickerOpen(false)}
          />
        </div>
      )}
      {lightconePickerOpen && (
        <div onClick={(event) => event.stopPropagation()}>
          <LightConePickerSheet
            slot={{
              ...targetSlot,
              lightconeId: draft.lightconeId,
              lightconeRank: draft.lightconeRank,
            }}
            onClose={() => setLightconePickerOpen(false)}
            onApply={(patch) => patchDraft({
              lightconeId: patch.lightconeId,
              lightconeRank: patch.lightconeRank,
            })}
          />
        </div>
      )}
      {relicEditorOpen && (
        <div onClick={(event) => event.stopPropagation()}>
          <RelicEditorSheet
            slot={{ ...targetSlot, ...(draft.relicPatch ?? {}) }}
            onClose={() => setRelicEditorOpen(false)}
            onApply={(patch) => patchDraft({ relicPatch: sanitizeRelicPatch(patch) })}
          />
        </div>
      )}
    </div>
  );
}

function CompareCharacterMiniCard({ character, label, eidolon, onPickCharacter, onEidolonChange }) {
  return (
    <article className="calc-condition-mini-card">
      <button className="calc-condition-mini-profile" type="button" onClick={onPickCharacter} disabled={!onPickCharacter}>
        <span className="calc-party-face">
          <CharacterAvatar character={character} />
        </span>
        <span>
          <small>{label}</small>
          <strong>{character?.displayName ?? "선택"}</strong>
        </span>
      </button>
      <select value={clampInteger(eidolon, 0, 6)} onChange={(event) => onEidolonChange?.(Number(event.target.value))} disabled={!onEidolonChange}>
        {[0, 1, 2, 3, 4, 5, 6].map((level) => (
          <option key={level} value={level}>E{level}</option>
        ))}
      </select>
    </article>
  );
}

function CompareLightConeMiniCard({ label, lightcone, rank, editable = false, onPick, onRankChange }) {
  return (
    <article className="calc-condition-mini-card">
      <button className="calc-condition-mini-profile" type="button" onClick={onPick} disabled={!editable}>
        <LightConeThumb lightcone={lightcone} rank={rank} />
        <span>
          <small>{label}</small>
          <strong>{lightcone?.name ?? "선택"}</strong>
        </span>
      </button>
      <select value={clampInteger(rank, 1, 5)} onChange={(event) => onRankChange?.(Number(event.target.value))}>
        {[1, 2, 3, 4, 5].map((level) => (
          <option key={level} value={level}>S{level}</option>
        ))}
      </select>
    </article>
  );
}

function CompareRelicSummaryCard({ slot }) {
  const set4 = findRelicSetByName(slot.relicSet4Name, "set4") ?? { name: slot.relicSet4Name };
  const set2 = findRelicSetByName(slot.relicSet2Name, "set2") ?? { name: slot.relicSet2Name };
  return (
    <article className="calc-condition-relic-card">
      <span>
        <small>4셋</small>
        <strong>{slot.relicSet4Name ?? "터널 유물"}</strong>
      </span>
      <span>
        <small>2셋</small>
        <strong>{slot.relicSet2Name ?? "차원 장신구"}</strong>
      </span>
      <div className="calc-condition-relic-pieces">
        {relicPieces.map((piece) => (
          <span key={piece.key} title={piece.name}>
            <RelicPieceIcon piece={piece} set4={set4} set2={set2} />
          </span>
        ))}
      </div>
    </article>
  );
}

export function CalculatorRoute() {
  const [initialState] = useState(createInitialCalculatorState);
  const [activeTab, setActiveTab] = useState(initialState.activeTab);
  const [calculationView, setCalculationView] = useState(initialState.calculationView);
  const [contributionViewMode, setContributionViewMode] = useState("character");
  const [party, setParty] = useState(initialState.party);
  const [activeSlotId, setActiveSlotId] = useState(initialState.activeSlotId);
  const [enemy, setEnemy] = useState(initialState.enemy);
  const [partySpecificSettings, setPartySpecificSettings] = useState(initialState.partySpecificSettings);
  const [ownedCharacterEidolon, setOwnedCharacterEidolon] = useState(initialState.ownedCharacterEidolon);
  const [compareConditions, setCompareConditions] = useState(initialState.compareConditions);
  const [compareKeepSlotIds, setCompareKeepSlotIds] = useState(initialState.compareKeepSlotIds);
  const [compareEditorConditionId, setCompareEditorConditionId] = useState(null);
  const [compareFeedback, setCompareFeedback] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightconeSlotId, setLightconeSlotId] = useState(null);
  const [relicSlotId, setRelicSlotId] = useState(null);
  const templateInputRef = useRef(null);
  const activeSlot = party.find((slot) => slot.slotId === activeSlotId) ?? party[0];
  const compareEditorCondition = compareEditorConditionId === "__new__"
    ? null
    : compareConditions.find((condition) => condition.id === compareEditorConditionId) ?? null;
  const lightconeSlot = party.find((slot) => slot.slotId === lightconeSlotId) ?? null;
  const relicSlot = party.find((slot) => slot.slotId === relicSlotId) ?? null;
  const selectedIds = party.map((slot) => slot.characterId).filter(Boolean);
  const partySpecificControls = useMemo(() => buildPartySpecificControls(party, activeSlotId), [activeSlotId, party]);
  const battleResult = useMemo(() => calculateBattleFinalStats({
    party,
    activeSlotId,
    characterGetter: getCharacter,
    defaultBuildGetter: getDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones,
    ledgerRows: combatLedgerRows,
    effectMetadataRows: battleEffectMetadataRows,
    scenarioSettings: partySpecificSettings,
    stateControls: partySpecificControls,
  }), [activeSlotId, party, partySpecificControls, partySpecificSettings]);
  const skillCards = useMemo(() => calculateSkillDamageCards({
    battleResult,
    skillRows: skillDamageMetadata.rows ?? [],
    enemy,
    scenarioSettings: partySpecificSettings,
  }), [battleResult, enemy, partySpecificSettings]);
  const activeCustomTypeProfile = getCustomTypeProfile(battleResult?.activeCharacter?.characterId);
  const statEvaluation = useMemo(() => buildBattleStatEvaluation({
    battleResult,
    customTypeProfile: activeCustomTypeProfile,
    enemy,
  }), [activeCustomTypeProfile, battleResult, enemy]);
  const contributionViews = useMemo(() => ({
    ...buildDamageContributionViews({
      battleResult,
      skillCards,
      skillRows: skillDamageMetadata.rows ?? [],
      enemy,
      scenarioSettings: partySpecificSettings,
    }),
    battleResult,
  }), [battleResult, enemy, partySpecificSettings, skillCards]);
  const partyRecommendationGroups = useMemo(() => buildPartyCandidateRecommendationGroups({
    party,
    activeSlotId,
    enemy,
    baseSkillCards: skillCards,
    scenarioSettings: partySpecificSettings,
    candidateEidolon: ownedCharacterEidolon,
  }), [activeSlotId, enemy, ownedCharacterEidolon, party, partySpecificSettings, skillCards]);

  useEffect(() => {
    writePersistedCalculatorState({ activeTab, calculationView, party, activeSlotId, enemy, partySpecificSettings, ownedCharacterEidolon, compareConditions, compareKeepSlotIds });
  }, [activeSlotId, activeTab, calculationView, compareConditions, compareKeepSlotIds, enemy, ownedCharacterEidolon, party, partySpecificSettings]);

  function patchActiveSlot(patch) {
    setParty((current) => current.map((slot) => (slot.slotId === activeSlotId ? { ...slot, ...patch } : slot)));
  }

  function patchSlot(slotId, patch) {
    setParty((current) => current.map((slot) => (slot.slotId === slotId ? { ...slot, ...patch } : slot)));
  }

  function changeMainDealer(slotId) {
    setActiveSlotId((previousSlotId) => {
      if (previousSlotId && previousSlotId !== slotId) {
        setCompareConditions((current) => current.filter((condition) => condition.slotId !== previousSlotId));
      }
      return slotId;
    });
  }

  function changeActiveTab(tabKey) {
    const nextTab = sanitizeActiveTab(tabKey, activeTab);
    setActiveTab(nextTab);
    if (nextTab === "buffs" || nextTab === "conditionCompare") {
      setCalculationView(nextTab === "conditionCompare" ? "conditionCompare" : "stats");
      const firstSlotId = party[0]?.slotId;
      if (firstSlotId) changeMainDealer(firstSlotId);
    }
  }

  function changeCalculationView(nextView) {
    setCalculationView(sanitizeCalculationView(nextView, calculationView));
  }

  function applyCompareCondition(condition) {
    setCompareFeedback("");
    setCompareConditions((current) => {
      const normalized = normalizeCompareCondition(condition, party, activeSlotId);
      if (!normalized) return current;
      const exists = current.some((item) => item.id === normalized.id);
      return exists
        ? current.map((item) => (item.id === normalized.id ? normalized : item))
        : [...current, normalized];
    });
  }

  function toggleCompareKeepSlot(slotId) {
    if (slotId === activeSlotId) return;
    const nextIsKeep = !compareKeepSlotIds.includes(slotId);
    setCompareKeepSlotIds((current) => (
      current.includes(slotId)
        ? current.filter((item) => item !== slotId)
        : [...current, slotId]
    ));
    if (nextIsKeep) {
      setCompareConditions((current) => current.filter((condition) => condition.slotId !== slotId));
    }
    const slotIndex = party.findIndex((slot) => slot.slotId === slotId);
    setCompareFeedback(`${slotIndex >= 0 ? slotIndex + 1 : ""}번 슬롯을 ${nextIsKeep ? "고정" : "교체 후보"}으로 설정했습니다.`);
  }

  function buildAutoCompareConditions() {
    const activeCharacter = getCharacter(activeSlot?.characterId);
    const recommendations = [];
    const defaultLightcone = getDefaultLightCone(activeCharacter);
    if (defaultLightcone?.id && activeSlot?.lightconeId && defaultLightcone.id !== activeSlot.lightconeId) {
      recommendations.push(normalizeCompareCondition({
        id: createCompareConditionId(),
        type: "lightCone",
        slotId: activeSlot.slotId,
        baseLightconeId: activeSlot.lightconeId,
        baseLightconeRank: activeSlot.lightconeRank,
        lightconeId: defaultLightcone.id,
        lightconeRank: 1,
      }, party, activeSlotId));
    }

    const keepSet = new Set(sanitizeCompareKeepSlotIds(compareKeepSlotIds, party));
    const usedSlots = new Set([activeSlotId]);
    const usedCharacters = new Set(party.map((slot) => slot.characterId).filter(Boolean));
    const candidateRows = partyRecommendationGroups
      .flatMap((group) => group.rows ?? [])
      .filter((row) => Number(row.deltaDamage ?? 0) > 0)
      .filter((row) => row.replacementSlotId && !keepSet.has(row.replacementSlotId))
      .sort((a, b) => Number(b.deltaDamage ?? 0) - Number(a.deltaDamage ?? 0));

    for (const row of candidateRows) {
      if (recommendations.length >= 4) break;
      if (usedSlots.has(row.replacementSlotId) || usedCharacters.has(row.ownerId)) continue;
      const character = getCharacter(row.ownerId);
      if (!character) continue;
      const defaults = createDefaultEquipmentForCharacter(character);
      const condition = normalizeCompareCondition({
        id: createCompareConditionId(),
        type: "partyMember",
        slotId: row.replacementSlotId,
        characterId: character.characterId,
        eidolon: ownedCharacterEidolon,
        lightconeId: defaults.lightconeId,
        lightconeRank: defaults.lightconeRank,
        relicPatch: sanitizeRelicPatch(defaults),
      }, party, activeSlotId);
      if (!condition) continue;
      recommendations.push(condition);
      usedSlots.add(row.replacementSlotId);
      usedCharacters.add(character.characterId);
    }

    return recommendations.filter(Boolean);
  }

  function applyAutoCompareRecommendations() {
    const recommendations = buildAutoCompareConditions();
    if (!recommendations.length) {
      setCompareFeedback("자동추천 가능한 비교조건이 없습니다. 고정 슬롯을 줄이거나 직접 비교조건을 추가해 주세요.");
      return;
    }
    if (compareConditions.length && !window.confirm("기존 비교 조건을 자동추천 조건으로 교체할까요?")) return;
    setCompareConditions(recommendations);
    setCompareFeedback(`${recommendations.length}개 비교조건을 자동추천으로 적용했습니다.`);
  }

  function applyOwnedCharacterEidolon(value) {
    const eidolon = sanitizeEidolonPreset(value, ownedCharacterEidolon);
    setOwnedCharacterEidolon(eidolon);
    setParty((current) => current.map((slot) => ({ ...slot, eidolon })));
  }

  return (
    <main className="calculator-shell">
      <header className="calc-topbar">
        <nav className="calc-top-tabs" aria-label="계산기 화면 탭">
          {appTabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? "is-active" : ""} type="button" onClick={() => changeActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="calc-top-actions">
          <button className="calc-icon-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="설정">
            <SettingsIcon />
          </button>
        </div>
      </header>
      <input
        ref={templateInputRef}
        className="calc-visually-hidden"
        type="file"
        accept=".json,application/json"
        tabIndex={-1}
        onChange={(event) => {
          event.currentTarget.value = "";
        }}
      />

      {activeTab === "characters" && (
        <>
          <section className="calc-party-row" aria-label="파티 4명">
            {party.map((slot) => (
              <PartySlot
                key={slot.slotId}
                slot={slot}
                active={slot.slotId === activeSlotId}
                onSelect={() => {
                  changeMainDealer(slot.slotId);
                  setPickerOpen(true);
                }}
              />
            ))}
          </section>
          <section className="calc-status-grid" aria-label="캐릭터별 전투 전 상태">
            {party.map((slot) => (
              <CharacterStatusCard
                key={slot.slotId}
                slot={slot}
                active={slot.slotId === activeSlotId}
                onSelect={() => {
                  changeMainDealer(slot.slotId);
                  setPickerOpen(true);
                }}
                onEidolonChange={(eidolon) => {
                  changeMainDealer(slot.slotId);
                  setParty((current) => current.map((item) => (item.slotId === slot.slotId ? { ...item, eidolon } : item)));
                }}
                onOpenLightCone={() => {
                  changeMainDealer(slot.slotId);
                  setLightconeSlotId(slot.slotId);
                }}
                onOpenRelic={() => {
                  changeMainDealer(slot.slotId);
                  setRelicSlotId(slot.slotId);
                }}
              />
            ))}
          </section>
          <button className="calc-template-import-button" type="button" onClick={() => templateInputRef.current?.click()}>
            <UploadIcon />
            템플릿 불러오기
          </button>
        </>
      )}

      {(activeTab === "buffs" || activeTab === "conditionCompare") && (
        <section className="calc-party-evaluation" aria-label="스탯 / 데미지 계산">
          {activeTab === "conditionCompare" ? (
            <>
              <MainDealerCard party={party} activeSlotId={activeSlotId} onChange={changeMainDealer} />
              <EnemyEditor enemy={enemy} onChange={setEnemy} />
              <ConditionComparePanel
                party={party}
                activeSlotId={activeSlotId}
                enemy={enemy}
                baseScenarioSettings={partySpecificSettings}
                compareConditions={compareConditions}
                compareKeepSlotIds={compareKeepSlotIds}
                ownedCharacterEidolon={ownedCharacterEidolon}
                onAddCondition={() => {
                  setCompareFeedback("");
                  setCompareEditorConditionId("__new__");
                }}
                onEditCondition={setCompareEditorConditionId}
                onRemoveCondition={(conditionId) => setCompareConditions((current) => current.filter((condition) => condition.id !== conditionId))}
                onAutoRecommend={applyAutoCompareRecommendations}
                onToggleKeepSlot={toggleCompareKeepSlot}
                compareFeedback={compareFeedback}
              />
            </>
          ) : (
            <>
              <MainDealerCard party={party} activeSlotId={activeSlotId} onChange={changeMainDealer} />
              <EnemyEditor enemy={enemy} onChange={setEnemy} />
              <PartySpecificSettingPanel
                controls={partySpecificControls}
                values={partySpecificSettings}
                onChange={(key, value) => setPartySpecificSettings((current) => ({ ...current, [key]: value }))}
              />
              {statEvaluation?.groups?.length ? (
                <section className="calc-evaluation-shell" aria-label="전투 스탯 평가">
                  <BattleStatEvaluationPanel evaluation={statEvaluation} />
                </section>
              ) : null}
              <ContributionTabs value={contributionViewMode} onChange={setContributionViewMode} />
              {contributionViewMode === "party" ? (
                <ContributionPanel
                  viewMode={contributionViewMode}
                  contributionViews={contributionViews}
                  skillCards={skillCards}
                  partyRecommendationGroups={partyRecommendationGroups}
                  partyRecommendationEidolon={ownedCharacterEidolon}
                  onPartyRecommendationEidolonChange={applyOwnedCharacterEidolon}
                />
              ) : (
                <DamageResultPanel battleResult={battleResult} skillCards={skillCards} contributionViews={contributionViews} viewMode={contributionViewMode} />
              )}
            </>
          )}
        </section>
      )}
      {compareEditorConditionId && (
        <CompareConditionEditorModal
          party={party}
          activeSlotId={activeSlotId}
          condition={compareEditorCondition}
          ownedCharacterEidolon={ownedCharacterEidolon}
          onClose={() => setCompareEditorConditionId(null)}
          onApply={applyCompareCondition}
        />
      )}
      {settingsOpen && (
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          ownedCharacterEidolon={ownedCharacterEidolon}
          onOwnedCharacterEidolonChange={applyOwnedCharacterEidolon}
        />
      )}
      {pickerOpen && (
        <CharacterPickerSheet
          value={activeSlot.characterId}
          selectedIds={selectedIds}
          onSelect={(characterId) => {
            const character = getCharacter(characterId);
            patchActiveSlot({ characterId, ...createDefaultEquipmentForCharacter(character) });
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {lightconeSlot && (
        <LightConePickerSheet
          slot={lightconeSlot}
          onClose={() => setLightconeSlotId(null)}
          onApply={(patch) => patchSlot(lightconeSlot.slotId, patch)}
        />
      )}
      {relicSlot && (
        <RelicEditorSheet
          slot={relicSlot}
          onClose={() => setRelicSlotId(null)}
          onApply={(patch) => patchSlot(relicSlot.slotId, patch)}
        />
      )}
    </main>
  );
}

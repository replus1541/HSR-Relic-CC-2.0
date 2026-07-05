import fs from "node:fs";
import path from "node:path";
import characterIdentity from "../data/generated/character-identity.json" with { type: "json" };

const root = path.resolve(".");
const legacyRoot = "C:\\CODEX\\HSR RELIC CC";
const legacyStatPath = path.join(legacyRoot, "data", "game-db", "character-stat-baseline.json");
const legacyRelicPath = path.join(legacyRoot, "src", "generated-relics.json");
const characterOutPath = path.join(root, "data", "generated", "character-stat-baseline.json");
const equipmentOutPath = path.join(root, "data", "generated", "equipment-stat-model.json");
const reportPath = path.join(root, "reports", "calculation", "self-stat-source-report.md");

const legacyStats = readJson(legacyStatPath);
const legacyRelics = readJson(legacyRelicPath);
const identityIndex = buildIdentityIndex(characterIdentity.rows ?? []);

const statRows = [];
const unmatchedStats = [];
for (const record of legacyStats.characters ?? []) {
  const identity = findIdentity(record);
  if (!identity) unmatchedStats.push(record.nameKo ?? record.officialName ?? record.avatar);
  statRows.push({
    characterId: identity?.characterId ?? record.avatar ?? null,
    avatarId: identity?.internalId ?? record.avatarId ?? null,
    displayName: identity?.displayName ?? record.nameKo ?? record.officialName ?? record.avatar,
    sourceCharacter: record.nameKo ?? record.officialName ?? record.avatar,
    sourceStatus: identity ? "matched_identity" : "unmatched_identity",
    baseStats: getBaseStats(record),
    traceEntries: getTraceEntries(record),
    traceStatus: record.traceAdditionalStats?.status ?? "unknown",
  });
}

const relicRows = (legacyRelics.relics ?? []).map(mapGeneratedRelic);
const manualRows = getManualRelicRows();
const allRelics = relicRows.concat(manualRows).sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));

const characterOutput = {
  app: "hsr-relic-cc-character-stat-baseline-v2",
  version: 1,
  generatedAt: new Date().toISOString(),
  source: {
    legacyCharacterStatBaseline: legacyStatPath,
    identity: "data/generated/character-identity.json",
  },
  policy: {
    level: 80,
    critDefaultsIncluded: true,
    traceAdditionalStatsIncluded: true,
    combatBuffsExcluded: true,
  },
  summary: {
    characters: statRows.length,
    matchedIdentity: statRows.filter((row) => row.sourceStatus === "matched_identity").length,
    unmatchedIdentity: unmatchedStats.length,
    traceEntries: statRows.reduce((total, row) => total + row.traceEntries.length, 0),
  },
  unmatchedSourceCharacters: unmatchedStats,
  rows: statRows,
};

const equipmentOutput = {
  app: "hsr-relic-cc-equipment-stat-model",
  version: 1,
  generatedAt: new Date().toISOString(),
  source: {
    legacyGeneratedRelics: legacyRelicPath,
    legacyModelLogic: "C:\\CODEX\\HSR RELIC CC\\src\\sample-data.js",
  },
  policy: {
    relicLevel: 15,
    subStatValueMode: "average_roll_assumption_for_default_recommendations",
    combatConditionalSetEffectsExcluded: true,
    teamSetEffectsExcluded: true,
  },
  relicMainStatOptions: getRelicMainStatOptions(),
  relicSubStatRollValues: getRelicSubStatRollValues(),
  relicSets: allRelics,
};

fs.mkdirSync(path.dirname(characterOutPath), { recursive: true });
fs.writeFileSync(characterOutPath, `${JSON.stringify(characterOutput, null, 2)}\n`);
fs.writeFileSync(equipmentOutPath, `${JSON.stringify(equipmentOutput, null, 2)}\n`);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, renderReport(characterOutput, equipmentOutput));
console.log(`self stat sources generated: characters=${characterOutput.summary.characters} relicSets=${allRelics.length}`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[.·•ㆍ・&]/g, "")
    .toLowerCase();
}

function buildIdentityIndex(rows) {
  const index = new Map();
  for (const row of rows) {
    for (const key of [row.characterId, row.internalName, row.displayName, row.localizedName, row.officialName, ...(row.aliasNames ?? []), ...(row.sourceNames ?? [])].filter(Boolean)) {
      index.set(normalizeKey(key), row);
    }
  }
  return index;
}

function findIdentity(record) {
  const aliases = {
    기억척자: "개척자 • 기억",
    보존척자: "개척자 • 보존",
    파멸척자: "개척자 • 파멸",
    화척자: "개척자 • 화합",
    환락척자: "개척자 • 환락",
    등황: "단항 • 등황",
    길가메쉬: "길가메시",
    "히메코 노바": "히메코 • 노바",
  };
  const keys = [record.avatar, record.nameKo, record.officialName, record.localName].filter(Boolean);
  for (const key of keys) {
    const found = identityIndex.get(normalizeKey(key)) ?? identityIndex.get(normalizeKey(aliases[key]));
    if (found) return found;
  }
  return null;
}

function getBaseStats(record) {
  const base = record.baseCombatDefaults ?? {};
  return {
    hp: numberOrNull(base.hp?.value),
    atk: numberOrNull(base.atk?.value),
    def: numberOrNull(base.def?.value),
    speed: numberOrNull(base.speed?.value),
    critRate: numberOrDefault(base.critRate?.value, 0.05),
    critDamage: numberOrDefault(base.critDamage?.value, 0.5),
  };
}

function getTraceEntries(record) {
  return (record.traceAdditionalStats?.confirmedBonuses ?? [])
    .map((bonus) => {
      const stat = normalizeTraceStatKey(bonus);
      const value = Number(bonus.value);
      if (!stat || !Number.isFinite(value) || value === 0) return null;
      return {
        stat,
        value,
        sourceType: "행적 추가스탯",
        sourceKind: "trace",
        source: getRepresentativeTraceSource(bonus),
        label: bonus.label ?? stat,
        sourceOrigin: "hoyowiki-trace-stats",
        sourceRecord: `${record.nameKo ?? record.officialName ?? record.avatar}:${bonus.stat}:${bonus.valueText ?? bonus.value}`,
        conditionStatus: "always-on",
      };
    })
    .filter(Boolean);
}

function getRepresentativeTraceSource(bonus) {
  const source = String(bonus?.source || bonus?.label || "행적 추가스탯");
  return source.split(/\s+\/\s+/).map((part) => part.trim()).filter(Boolean)[0] || source;
}

function normalizeTraceStatKey(bonus) {
  const stat = bonus?.stat;
  if (bonus?.unit === "percent") {
    if (stat === "hp") return "hpRatio";
    if (stat === "atk") return "atkRatio";
    if (stat === "def") return "defRatio";
  }
  if (bonus?.unit === "flat") {
    if (stat === "hp") return "hpFlat";
    if (stat === "atk") return "atkFlat";
    if (stat === "def") return "defFlat";
  }
  return stat;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeRelicText(text) {
  return String(text ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeRelicCategory(category) {
  const text = normalizeRelicText(category);
  if (/차원|장신구|ornament/i.test(text)) return "ornament";
  return "tunnel";
}

function extractPercentNear(text, keywords) {
  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const after = new RegExp(`${escaped}[^%]{0,40}?(\\d+(?:\\.\\d+)?)\\s*%`, "i").exec(text);
    if (after) return Number(after[1]) / 100;
    const before = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%[^%]{0,18}?${escaped}`, "i").exec(text);
    if (before) return Number(before[1]) / 100;
  }
  return 0;
}

function addRelicStat(stats, stat, value) {
  if (Number.isFinite(value) && value > 0) stats[stat] = value;
}

function inferRelicStats(relic, effectTypes = null) {
  const effects = effectTypes ? (relic.effects ?? []).filter((effect) => effectTypes.includes(effect.type)) : (relic.effects ?? []);
  const text = normalizeRelicText(effects.map((effect) => effect.desc).join(" "));
  const stats = {};
  addRelicStat(stats, "speedRatio", extractPercentNear(text, ["속도"]));
  addRelicStat(stats, "atkRatio", extractPercentNear(text, ["공격력"]));
  addRelicStat(stats, "hpRatio", extractPercentNear(text, ["HP 최대치", "최대 HP", "HP", "체력"]));
  addRelicStat(stats, "defRatio", extractPercentNear(text, ["방어력이", "방어력 증가", "방어력은"]));
  addRelicStat(stats, "critRate", extractPercentNear(text, ["치명타 확률"]));
  addRelicStat(stats, "critDamage", extractPercentNear(text, ["치명타 피해"]));
  addRelicStat(stats, "breakEffect", extractPercentNear(text, ["격파 특수효과", "격파 특수 효과"]));
  addRelicStat(stats, "breakDamage", extractPercentNear(text, ["격파 피해", "슈퍼 격파 피해"]));
  addRelicStat(stats, "dotDamage", extractPercentNear(text, ["지속 피해"]));
  addRelicStat(stats, "vulnerability", extractPercentNear(text, ["받는 피해"]));
  addRelicStat(stats, "defenseDown", extractPercentNear(text, ["방어력을", "방어력 감소", "방어력 무시"]));
  addRelicStat(stats, "resistancePen", extractPercentNear(text, ["저항 관통", "속성 저항 관통", "저항 감소"]));
  addRelicStat(stats, "elementDamage", extractPercentNear(text, ["속성 피해"]));
  addRelicStat(stats, "allDamage", extractPercentNear(text, ["가하는 피해", "주는 피해", "스킬 피해", "일반 공격 피해", "전투 스킬 피해", "필살기 피해", "추가 공격 피해"]));
  return stats;
}

function getRelicSetModelOverrides() {
  return {
  "wiki-relic-144": { stats: { hpRatio: 0.12 }, twoPieceStats: { hpRatio: 0.12 } },
  "wiki-relic-1235": { stats: { effectResistance: 0.1 }, twoPieceStats: { effectResistance: 0.1 } },
  "wiki-relic-1237": { stats: { speedRatio: 0.06 }, twoPieceStats: { speedRatio: 0.06 }, fourPieceStats: {} },
  "wiki-relic-1598": { stats: { energyRegen: 0.05 }, twoPieceStats: { energyRegen: 0.05 } },
  "wiki-relic-1601": { fourPieceStats: {} },
  "wiki-relic-1925": { stats: { allDamage: 0.12, critRate: 0.04 }, twoPieceStats: { allDamage: 0.12 }, fourPieceStats: { critRate: 0.04 } },
  "wiki-relic-1926": { stats: { breakEffect: 0.16 }, twoPieceStats: { breakEffect: 0.16 }, fourPieceStats: {} },
  "wiki-relic-2650": { stats: { critDamage: 0.25 }, twoPieceStats: { critDamage: 0.25 } },
  "wiki-relic-3064": { stats: { energyRegen: 0.05 }, twoPieceStats: { energyRegen: 0.05 } },
  "wiki-relic-3162": { stats: { speedRatio: 0.06 }, twoPieceStats: { speedRatio: 0.06 }, fourPieceStats: {} },
  "wiki-relic-3783": { stats: { speedRatio: 0.12 }, twoPieceStats: { speedRatio: 0.06 }, fourPieceStats: { speedRatio: 0.06 } },
  "wiki-relic-4012": { stats: { critRate: 0.08, hpRatio: 0.24 }, twoPieceStats: { critRate: 0.08 }, fourPieceStats: { hpRatio: 0.24 } },
  "wiki-relic-4013": { stats: {}, twoPieceStats: {}, fourPieceStats: {} },
  "wiki-relic-4068": { stats: { critRate: 0.08 }, twoPieceStats: { critRate: 0.08 } },
  "wiki-relic-5009": { stats: { atkRatio: 0.24 }, twoPieceStats: { atkRatio: 0.24 } },
  };
}

function mapGeneratedRelic(relic) {
  const mapped = {
    id: relic.id,
    entryPageId: relic.entryPageId,
    name: normalizeRelicText(relic.name),
    category: normalizeRelicCategory(relic.category),
    stats: inferRelicStats(relic),
    twoPieceStats: inferRelicStats(relic, [2]),
    fourPieceStats: inferRelicStats(relic, [4]),
  };
  const override = getRelicSetModelOverrides()[mapped.id];
  if (override) {
    mapped.stats = override.stats ?? mapped.stats;
    mapped.twoPieceStats = override.twoPieceStats ?? mapped.twoPieceStats;
    mapped.fourPieceStats = override.fourPieceStats ?? mapped.fourPieceStats;
  }
  if (mapped.id === "wiki-relic-3343") {
    mapped.twoPieceStats = { elementDamage: 0.1 };
    mapped.fourPieceStats = {};
    mapped.stats = { elementDamage: 0.1 };
  }
  if (mapped.id === "wiki-relic-1238") {
    mapped.twoPieceStats = { critRate: 0.08, basicDamage: 0.2, skillDamage: 0.2 };
    mapped.fourPieceStats = {};
    mapped.stats = { critRate: 0.08, basicDamage: 0.2, skillDamage: 0.2 };
  }
  return mapped;
}

function getManualRelicRows() {
  return [
    {
      id: "manual-navigator-ajip",
      entryPageId: "honeyhunter-as-navigator-isee-sees-it",
      name: "별을 갈망하는 항법사 아집",
      category: "tunnel",
      stats: { atkRatio: 0.12, skillDamage: 0.18, ultimateDamage: 0.18 },
      twoPieceStats: { atkRatio: 0.12 },
      fourPieceStats: { skillDamage: 0.18, ultimateDamage: 0.18 },
    },
    {
      id: "manual-myeongjang",
      entryPageId: "honeyhunter-divine-querying-master-smith",
      name: "신공을 탐구하는 명장",
      category: "tunnel",
      stats: { hpRatio: 0.12, critDamage: 0.28 },
      twoPieceStats: { hpRatio: 0.12 },
      fourPieceStats: { critDamage: 0.28 },
    },
  ];
}

function getRelicMainStatOptions() {
  return {
    hpFlat: { label: "HP", value: 705, percent: false },
    atkFlat: { label: "공격력", value: 352, percent: false },
    atkRatio: { label: "공격력", value: 0.432, percent: true },
    hpRatio: { label: "HP", value: 0.432, percent: true },
    defRatio: { label: "방어력", value: 0.54, percent: true },
    critRate: { label: "치확", value: 0.324, percent: true },
    critDamage: { label: "치피", value: 0.648, percent: true },
    outgoingHealingBoost: { label: "치유량", value: 0.345, percent: true },
    elementDamage: { label: "속성피해", value: 0.388, percent: true },
    breakEffect: { label: "격특", value: 0.648, percent: true },
    effectHitRate: { label: "효과명중", value: 0.432, percent: true },
    energyRegen: { label: "에너지", value: 0.194, percent: true },
    speed: { label: "속도", value: 25, percent: false },
  };
}

function getRelicSubStatRollValues() {
  return {
    hpFlat: 38.103755,
    atkFlat: 19.051877,
    defFlat: 19.051877,
    hpRatio: 0.03888,
    atkRatio: 0.03888,
    defRatio: 0.0486,
    speed: 2.3,
    critRate: 0.02916,
    critDamage: 0.05832,
    effectHitRate: 0.03888,
    effectResistance: 0.03888,
    breakEffect: 0.05832,
  };
}

function renderReport(characterOutput, equipmentOutput) {
  return [
    "# Self Stat Sources",
    "",
    "캐릭터 세팅 화면의 본인 기준 스탯 계산에 쓰는 원천입니다.",
    "파티 버프, 적 디버프, 전투 조건부 효과는 제외합니다.",
    "",
    "## Summary",
    "",
    `- characters: ${characterOutput.summary.characters}`,
    `- matchedIdentity: ${characterOutput.summary.matchedIdentity}`,
    `- unmatchedIdentity: ${characterOutput.summary.unmatchedIdentity}`,
    `- traceEntries: ${characterOutput.summary.traceEntries}`,
    `- relicSets: ${equipmentOutput.relicSets.length}`,
    "",
  ].join("\n");
}

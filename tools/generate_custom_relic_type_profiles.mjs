import fs from "node:fs";
import path from "node:path";
import characterIdentity from "../data/generated/character-identity.json" with { type: "json" };
import defaultCharacterBuilds from "../data/generated/default-character-builds.json" with { type: "json" };

const root = path.resolve(".");
const legacyRoot = "C:\\CODEX\\HSR RELIC CC";
const guidePath = path.join(legacyRoot, "data", "character-effects", "character-guides.json");
const defaultBuildPath = path.join(legacyRoot, "data", "character-effects", "default-builds.json");
const v2DefaultBuildPath = path.join(root, "data", "generated", "default-character-builds.json");
const outPath = path.join(root, "data", "curated", "custom-relic-type-profiles.json");
const reportPath = path.join(root, "reports", "import", "custom-relic-type-profiles.md");

const guides = readJson(guidePath);
const defaultBuilds = readJson(defaultBuildPath).builds ?? {};
const v2DefaultBuildRows = Object.values(defaultCharacterBuilds.builds ?? {});

const manualSupplements = [
  {
    characterId: "Yunli_00",
    sourceCharacter: "운리",
    roleClass: "치확 / 치피 딜러",
    damageTemplate: "crit-follow",
    statProfile: "atk",
    primaryStat: "atk",
    relicProfile: "critFollow",
    sourceRole: "follow_up_crit_dps",
    note: "v1 커스텀 타입 데이터에 없던 운리를 v2 사용자 검수 기본 세팅 기준으로 보강",
  },
];

const relicPresetDefinitions = {
  crit: { label: "치명 세팅", description: "치확/치피 기반 직접 피해 프리셋" },
  dot: { label: "DoT 세팅", description: "지속 피해 기반 프리셋" },
  break: { label: "격파 세팅", description: "격파 특수효과/격파 피해 기반 프리셋" },
  def: { label: "방어 계수 세팅", description: "방어력 계수 캐릭터 프리셋" },
  hp: { label: "체력 계수 세팅", description: "HP 계수 캐릭터 프리셋" },
  support: { label: "지원 세팅", description: "속도/생존/지원 계수 중심 프리셋" },
};

const damageTemplateDefinitions = {
  crit: { evaluationKey: "crit", usesCrit: true, usesDamageBonus: true },
  "crit-follow": { evaluationKey: "elation", usesCrit: true, usesDamageBonus: true },
  "crit-summon": { evaluationKey: "crit", usesCrit: true, usesDamageBonus: true },
  dot: { evaluationKey: "dot", usesCrit: false, usesDamageBonus: true },
  break: { evaluationKey: "break", usesCrit: false, usesDamageBonus: false },
  support: { evaluationKey: "utility", usesCrit: false, usesDamageBonus: false },
  utility: { evaluationKey: "utility", usesCrit: false, usesDamageBonus: false },
};

const statProfileDefinitions = {
  atk: { label: "공격력 기반", primaryFallback: "atk" },
  hp: { label: "체력 기반", primaryFallback: "hp" },
  def: { label: "방어력 기반", primaryFallback: "def" },
  break: { label: "격파 기반", primaryFallback: "breakEffect" },
  support: { label: "지원 기반", primaryFallback: "speed" },
};

const identityIndex = buildIdentityIndex(characterIdentity.rows ?? []);
const sourceNames = [...new Set([...Object.keys(guides), ...Object.keys(defaultBuilds)])].sort((a, b) => a.localeCompare(b, "ko-KR"));
const rows = [];
const unmatched = [];

for (const sourceCharacter of sourceNames) {
  const guide = guides[sourceCharacter] ?? null;
  const defaultBuild = defaultBuilds[sourceCharacter] ?? null;
  const identity = findIdentity(sourceCharacter);
  if (!identity) {
    unmatched.push(sourceCharacter);
  }
  const relicProfile = defaultBuild?.relicProfile ?? getGuideRelicProfile(guide);
  const presetId = getRelicPresetId(relicProfile);
  const displayTypeLabel = getDisplayTypeLabel(guide);
  const damageTemplate = guide?.damageTemplate ?? null;
  rows.push({
    characterId: identity?.characterId ?? null,
    displayName: identity?.displayName ?? sourceCharacter,
    sourceCharacter,
    sourceStatus: identity ? "matched_identity" : "unmatched_identity",
    customDataSource: "user_curated_v1",
    customDataSourcePaths: [
      "C:\\CODEX\\HSR RELIC CC\\data\\character-effects\\character-guides.json",
      "C:\\CODEX\\HSR RELIC CC\\data\\character-effects\\default-builds.json",
      "C:\\CODEX\\HSR RELIC CC\\src\\calculator\\character-role.jsx",
      "C:\\CODEX\\HSR RELIC CC\\src\\calculator\\equipment\\relic-builds.js",
    ],
    calculationUse: "ui_and_default_profile_metadata_only",
    sourceBackedCombatEffect: false,
    uiTypeProfile: {
      roleClass: guide?.roleClass ?? defaultBuild?.sourceRole ?? null,
      damageTemplate,
      statProfile: guide?.statProfile ?? null,
      primaryStat: guide?.primaryStat ?? null,
      displayTypeLabel,
      evaluationTemplateKey: damageTemplateDefinitions[damageTemplate]?.evaluationKey ?? null,
      usesCrit: damageTemplateDefinitions[damageTemplate]?.usesCrit ?? null,
      usesDamageBonus: damageTemplateDefinitions[damageTemplate]?.usesDamageBonus ?? null,
    },
    relicTypeProfile: {
      relicProfile,
      presetId,
      presetLabel: relicPresetDefinitions[presetId]?.label ?? presetId,
      sourceRole: defaultBuild?.sourceRole ?? null,
      set4Id: defaultBuild?.relicBuild?.set4Id ?? null,
      set4AltId: defaultBuild?.relicBuild?.set4AltId ?? null,
      set4Mode: defaultBuild?.relicBuild?.set4Mode ?? "4",
      set2Id: defaultBuild?.relicBuild?.set2Id ?? null,
      mainStats: defaultBuild?.relicBuild?.mainStats ?? {},
      subStatPriority: inferSubStatPriority(defaultBuild?.relicBuild),
      missingItems: defaultBuild?.missingItems ?? [],
    },
  });
}

addManualSupplementRows(rows);

const output = {
  app: "hsr-relic-cc-custom-relic-type-profiles",
  version: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    roleTypeProfilesAreUserCurated: true,
    sourceBackedCombatEffect: false,
    defaultBuildsRemainSeparate: true,
    hoyowikiRecommendationSource: false,
  },
  sources: {
    legacyCharacterGuides: guidePath,
    legacyDefaultBuilds: defaultBuildPath,
    v2DefaultBuilds: v2DefaultBuildPath,
    legacyTypeLogic: "C:\\CODEX\\HSR RELIC CC\\src\\calculator\\character-role.jsx",
    legacyRelicProfileLogic: "C:\\CODEX\\HSR RELIC CC\\src\\calculator\\equipment\\relic-builds.js",
  },
  definitions: {
    damageTemplates: damageTemplateDefinitions,
    statProfiles: statProfileDefinitions,
    relicPresets: relicPresetDefinitions,
    relicProfileToPresetId: buildRelicProfileMap(rows),
  },
  summary: {
    characters: rows.length,
    matchedIdentity: rows.filter((row) => row.characterId).length,
    unmatchedIdentity: rows.filter((row) => !row.characterId).length,
    bySourceStatus: countBy(rows, (row) => row.sourceStatus),
    byRoleClass: countBy(rows, (row) => row.uiTypeProfile.roleClass),
    byDamageTemplate: countBy(rows, (row) => row.uiTypeProfile.damageTemplate),
    byStatProfile: countBy(rows, (row) => row.uiTypeProfile.statProfile),
    byRelicProfile: countBy(rows, (row) => row.relicTypeProfile.relicProfile),
    byPresetId: countBy(rows, (row) => row.relicTypeProfile.presetId),
  },
  unmatchedSourceCharacters: unmatched,
  rows,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, renderReport(output));
console.log(`custom relic type profiles generated: characters=${rows.length} matched=${output.summary.matchedIdentity} unmatched=${unmatched.length}`);

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
    const keys = [
      row.characterId,
      row.displayName,
      row.localizedName,
      row.officialName,
      ...(row.aliasNames ?? []),
      ...(row.sourceNames ?? []),
    ];
    for (const key of keys.filter(Boolean)) {
      index.set(normalizeKey(key), row);
    }
  }
  return index;
}

function findIdentity(sourceCharacter) {
  const aliases = {
    길가메쉬: "길가메시",
    등황: "단항 • 등황",
    환락척자: "환락 척자",
    "히메코 노바": "히메코 • 노바",
  };
  return identityIndex.get(normalizeKey(sourceCharacter)) ?? identityIndex.get(normalizeKey(aliases[sourceCharacter])) ?? null;
}

function addManualSupplementRows(rows) {
  const existingIds = new Set(rows.map((row) => row.characterId).filter(Boolean));
  for (const supplement of manualSupplements) {
    if (existingIds.has(supplement.characterId)) continue;
    const identity = characterIdentity.rows.find((row) => row.characterId === supplement.characterId) ?? findIdentity(supplement.sourceCharacter);
    const defaultBuild = v2DefaultBuildRows.find((row) => row.characterId === supplement.characterId) ?? null;
    const damageTemplate = supplement.damageTemplate;
    const relicProfile = supplement.relicProfile;
    const presetId = getRelicPresetId(relicProfile);
    rows.push({
      characterId: identity?.characterId ?? supplement.characterId,
      displayName: identity?.displayName ?? supplement.sourceCharacter,
      sourceCharacter: supplement.sourceCharacter,
      sourceStatus: "manual_v2_user_curated",
      customDataSource: "user_curated_v2_manual",
      customDataSourcePaths: [
        "C:\\CODEX\\HSR RELIC CC\\data\\character-effects\\character-guides.json",
        "C:\\CODEX\\HSR RELIC CC 2.0\\data\\generated\\default-character-builds.json",
      ],
      calculationUse: "ui_and_default_profile_metadata_only",
      sourceBackedCombatEffect: false,
      uiTypeProfile: {
        roleClass: supplement.roleClass,
        damageTemplate,
        statProfile: supplement.statProfile,
        primaryStat: supplement.primaryStat,
        displayTypeLabel: getDisplayTypeLabel(supplement),
        evaluationTemplateKey: damageTemplateDefinitions[damageTemplate]?.evaluationKey ?? null,
        usesCrit: damageTemplateDefinitions[damageTemplate]?.usesCrit ?? null,
        usesDamageBonus: damageTemplateDefinitions[damageTemplate]?.usesDamageBonus ?? null,
      },
      relicTypeProfile: {
        relicProfile,
        presetId,
        presetLabel: relicPresetDefinitions[presetId]?.label ?? presetId,
        sourceRole: supplement.sourceRole,
        set4Id: defaultBuild?.selectedRelics?.set4?.id ?? null,
        set4AltId: defaultBuild?.selectedRelics?.set4Alt?.id ?? null,
        set4Mode: defaultBuild?.selectedRelics?.set4Mode ?? "4",
        set2Id: defaultBuild?.selectedRelics?.set2?.id ?? null,
        mainStats: defaultBuild?.mainStats ?? {},
        subStatPriority: defaultBuild?.subStatPriority ?? [],
        missingItems: [],
      },
      notes: [supplement.note],
    });
  }
}

function getRelicPresetId(profile = "crit") {
  if (profile === "dotEhr") return "dot";
  if (["speedHpSupport", "atkSpeedSupport", "atk2pcSupport", "cerydraAtk2pcSupport", "hpSpeedSupport", "speedDebufferCrit", "speedDebufferEhr"].includes(profile)) return "support";
  if (profile === "hpCrit") return "hp";
  if (profile === "crit95" || profile === "critSelfBuffed") return "crit";
  return Object.hasOwn(relicPresetDefinitions, profile) ? profile : "crit";
}

function getGuideRelicProfile(guide) {
  if (!guide) return "crit";
  if (guide.damageTemplate === "dot") return "dot";
  if (guide.damageTemplate === "break") return "break";
  if (guide.statProfile === "hp") return "hp";
  if (guide.statProfile === "def") return "def";
  if (guide.damageTemplate === "support" || guide.damageTemplate === "utility") return "support";
  return "crit";
}

function getDisplayTypeLabel(guide) {
  if (!guide) return null;
  const roleClass = guide.roleClass ?? "";
  if (/치확\s*\/\s*치피\s*딜러|체퍼기반\s*딜러|체력\s*기반\s*치확|방어\s*기반\s*치확/.test(roleClass)) {
    if (guide.primaryStat === "hp") return "체퍼 / 치확 딜러";
    if (guide.primaryStat === "def") return "방퍼 / 치확 딜러";
    if (guide.primaryStat === "critDamage") return "치피 / 치확 딜러";
    return "공퍼 / 치확 딜러";
  }
  return roleClass;
}

function inferSubStatPriority(relicBuild) {
  const seen = new Map();
  for (const piece of Object.values(relicBuild?.pieces ?? {})) {
    for (const subStat of piece.subStats ?? []) {
      const stat = subStat.stat;
      if (!stat) continue;
      seen.set(stat, (seen.get(stat) ?? 0) + 1 + Number(subStat.rolls ?? 0) / 10);
    }
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([stat]) => stat);
}

function countBy(rows, pick) {
  const counts = {};
  for (const row of rows) {
    const key = pick(row) ?? "missing";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function buildRelicProfileMap(rows) {
  const map = {};
  for (const row of rows) {
    const profile = row.relicTypeProfile.relicProfile;
    if (profile) map[profile] = row.relicTypeProfile.presetId;
  }
  return Object.fromEntries(Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])));
}

function renderCountList(counts) {
  return Object.entries(counts).map(([key, count]) => `- ${key}: ${count}`).join("\n");
}

function renderReport(output) {
  const lines = [
    "# Custom Relic Type Profiles",
    "",
    "v1에서 사용자가 직접 구성한 캐릭터 타입/유물 프리셋 메타데이터입니다.",
    "HoYoWiki 추천 세트 원천이나 계산 가능한 전투 효과 원천으로 취급하지 않고, UI 타입 표시와 기본 프리셋 선택 보조 데이터로만 사용합니다.",
    "",
    "## Summary",
    "",
    `- characters: ${output.summary.characters}`,
    `- matchedIdentity: ${output.summary.matchedIdentity}`,
    `- unmatchedIdentity: ${output.summary.unmatchedIdentity}`,
    "",
    "## Role Classes",
    "",
    renderCountList(output.summary.byRoleClass),
    "",
    "## Damage Templates",
    "",
    renderCountList(output.summary.byDamageTemplate),
    "",
    "## Stat Profiles",
    "",
    renderCountList(output.summary.byStatProfile),
    "",
    "## Relic Profiles",
    "",
    renderCountList(output.summary.byRelicProfile),
    "",
    "## Preset Buckets",
    "",
    renderCountList(output.summary.byPresetId),
    "",
    "## Characters",
    "",
    "| character | source | type label | roleClass | damageTemplate | statProfile | primaryStat | relicProfile | presetId | main stats | substats | status |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const row of output.rows) {
    lines.push([
      row.displayName,
      row.sourceCharacter,
      row.uiTypeProfile.displayTypeLabel,
      row.uiTypeProfile.roleClass,
      row.uiTypeProfile.damageTemplate,
      row.uiTypeProfile.statProfile,
      row.uiTypeProfile.primaryStat,
      row.relicTypeProfile.relicProfile,
      row.relicTypeProfile.presetId,
      Object.entries(row.relicTypeProfile.mainStats).map(([key, value]) => `${key}:${value}`).join(", "),
      row.relicTypeProfile.subStatPriority.slice(0, 6).join(", "),
      row.sourceStatus,
    ].map((value) => String(value ?? "-").replace(/\|/g, "/")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
  if (output.unmatchedSourceCharacters.length) {
    lines.push("## Unmatched", "");
    for (const name of output.unmatchedSourceCharacters) lines.push(`- ${name}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

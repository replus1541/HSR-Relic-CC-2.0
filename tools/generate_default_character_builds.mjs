import fs from "node:fs";
import path from "node:path";
import { buildCharacterIdentityDataset, normalizeIdentityKey, normalizeName } from "../src/identity/character-identity.js";

const root = process.cwd();
const legacyRoot = "C:\\CODEX\\HSR RELIC CC";
const outPath = path.join(root, "data", "generated", "default-character-builds.json");
const reviewPath = path.join(root, "reports", "import", "default-character-builds-review.md");

const legacyBuilds = readJson(path.join(legacyRoot, "data", "character-effects", "default-builds.json")).builds ?? {};
const legacyGuides = readJson(path.join(legacyRoot, "data", "character-effects", "character-guides.json"));
const lightCones = readJson(path.join(legacyRoot, "src", "generated-lightcones.json")).lightcones ?? [];
const relicSets = readJson(path.join(legacyRoot, "src", "generated-relics.json")).relics ?? [];
const identityRows = buildCharacterIdentityDataset({ root }).rows;

const lightConeById = new Map(lightCones.map((item) => [item.id, item]));
const relicById = new Map(relicSets.map((item) => [item.id, item]));
const buildByName = new Map(Object.entries(legacyBuilds).map(([name, build]) => [normalizeIdentityKey(name), { ...build, sourceCharacter: name }]));
const guideByName = new Map(Object.entries(legacyGuides).map(([name, guide]) => [normalizeIdentityKey(name), { ...guide, sourceCharacter: name }]));

const reviewedBuildOverrides = {
  "\uC740\uB791 LV 999": {
    sourceCharacter: "\uC740\uB791 LV 999",
    sourceReview: "user-reviewed-hoyowiki-default",
    lightConeIds: ["wiki-5218"],
    lightConeRank: 1,
    relicProfile: "elationDps",
    relicBuild: {
      set4Id: "wiki-relic-4770",
      set2Id: "wiki-relic-5012",
      mainStats: {
        body: "critRate",
        feet: "speed",
        sphere: "hpRatio",
        rope: "hpRatio",
      },
      pieces: makePiecesFromSpec({
        head: { mainStat: "hpFlat", subStats: [["speed", 3], ["critRate", 1], ["critDamage", 1], ["hpRatio", 1]] },
        hands: { mainStat: "atkFlat", subStats: [["speed", 3], ["critDamage", 2], ["critRate", 1], ["hpRatio", 1]] },
        body: { mainStat: "critRate", subStats: [["speed", 2], ["critDamage", 1], ["hpRatio", 1], ["defRatio", 0]] },
        feet: { mainStat: "speed", subStats: [["critDamage", 2], ["critRate", 1], ["hpRatio", 1], ["defRatio", 0]] },
        sphere: { mainStat: "hpRatio", subStats: [["speed", 1], ["critRate", 2], ["critDamage", 1], ["defRatio", 0]] },
        rope: { mainStat: "hpRatio", subStats: [["speed", 2], ["critDamage", 2], ["critRate", 1], ["defRatio", 0]] },
      }),
    },
    missingItems: [],
  },
  "\uC2A4\uD30C\uD0A4": {
    sourceCharacter: "\uC2A4\uD30C\uD0A4",
    sourceReview: "user-reviewed-hoyowiki-default",
    lightConeIds: ["wiki-4778"],
    lightConeRank: 1,
    relicProfile: "elationDps",
    relicBuild: {
      set4Id: "wiki-relic-4770",
      set2Id: "wiki-relic-5012",
      mainStats: {
        body: "critRate",
        feet: "speed",
        sphere: "atkRatio",
        rope: "atkRatio",
      },
      pieces: makePiecesFromPriority(
        { body: "critRate", feet: "speed", sphere: "atkRatio", rope: "atkRatio" },
        ["critDamage", "atkRatio", "speed", "critRate"],
      ),
    },
    missingItems: [],
  },
  "\uD6A8\uAD11": {
    sourceCharacter: "\uD6A8\uAD11",
    sourceReview: "user-reviewed-hoyowiki-default",
    lightConeIds: ["wiki-4779", "wiki-5008"],
    lightConeRank: 1,
    relicProfile: "elationSupport",
    relicBuild: {
      set4Id: "wiki-relic-4769",
      set2Id: "wiki-relic-137",
      mainStats: {
        body: "hpRatio",
        feet: "speed",
        sphere: "hpRatio",
        rope: "energyRegen",
      },
      pieces: makePiecesFromSpec({
        head: { mainStat: "hpFlat", subStats: [["hpRatio", 2], ["defRatio", 1], ["speed", 0], ["breakEffect", 1]] },
        hands: { mainStat: "atkFlat", subStats: [["hpRatio", 2], ["defRatio", 1], ["speed", 0], ["breakEffect", 1]] },
        body: { mainStat: "hpRatio", subStats: [["defRatio", 2], ["critDamage", 1], ["hpFlat", 1], ["breakEffect", 0]] },
        feet: { mainStat: "speed", subStats: [["hpRatio", 2], ["defRatio", 1], ["critDamage", 1], ["breakEffect", 0]] },
        sphere: { mainStat: "hpRatio", subStats: [["defRatio", 2], ["critDamage", 1], ["hpFlat", 1], ["breakEffect", 0]] },
        rope: { mainStat: "energyRegen", subStats: [["hpRatio", 2], ["defRatio", 1], ["critDamage", 1], ["breakEffect", 0]] },
      }),
    },
    missingItems: [],
  },
  "운리": {
    sourceCharacter: "운리",
    sourceReview: "user-reviewed-hoyowiki-default",
    lightConeIds: ["wiki-2956"],
    lightConeRank: 1,
    relicProfile: "critFollow",
    relicBuild: {
      set4Id: "wiki-relic-2655",
      set2Id: "wiki-relic-2650",
      mainStats: {
        body: "critRate",
        feet: "speed",
        sphere: "elementDamage",
        rope: "atkRatio",
      },
      pieces: makePiecesFromPriority(
        { body: "critRate", feet: "speed", sphere: "elementDamage", rope: "atkRatio" },
        ["critRate", "critDamage", "atkRatio", "speed"],
      ),
    },
    missingItems: [],
  },
};

for (const [name, build] of Object.entries(reviewedBuildOverrides)) {
  buildByName.set(normalizeIdentityKey(name), build);
}

const fallbackLightConeByPath = {
  destruction: "wiki-76",
  hunt: "wiki-77",
  erudition: "wiki-66",
  harmony: "wiki-64",
  nihility: "wiki-45",
  preservation: "wiki-72",
  abundance: "wiki-1928",
  remembrance: "wiki-3574",
  elation: "wiki-5008",
};

const fallbackRelicByProfile = {
  break: { set4Id: "wiki-relic-2649", set2Id: "wiki-relic-2651" },
  dotEhr: { set4Id: "wiki-relic-1600", set2Id: "wiki-relic-1599" },
  def: { set4Id: "wiki-relic-142", set2Id: "wiki-relic-151" },
  hpCrit: { set4Id: "wiki-relic-1236", set2Id: "wiki-relic-3566" },
  support: { set4Id: "wiki-relic-1237", set2Id: "wiki-relic-1235" },
  critFollow: { set4Id: "wiki-relic-1601", set2Id: "wiki-relic-152" },
  crit95: { set4Id: "wiki-relic-3161", set2Id: "wiki-relic-1238" },
};

const fallbackMainStatsByProfile = {
  break: { body: "atkRatio", feet: "speed", sphere: "elementDamage", rope: "breakEffect" },
  dotEhr: { body: "effectHitRate", feet: "speed", sphere: "elementDamage", rope: "atkRatio" },
  def: { body: "critRate", feet: "defRatio", sphere: "elementDamage", rope: "defRatio" },
  hpCrit: { body: "critRate", feet: "hpRatio", sphere: "hpRatio", rope: "hpRatio" },
  support: { body: "hpRatio", feet: "speed", sphere: "hpRatio", rope: "energyRegen" },
  critFollow: { body: "critRate", feet: "speed", sphere: "elementDamage", rope: "atkRatio" },
  crit95: { body: "critRate", feet: "speed", sphere: "elementDamage", rope: "atkRatio" },
};

const fallbackSubStatsByProfile = {
  break: ["breakEffect", "speed", "atkRatio", "hpRatio"],
  dotEhr: ["effectHitRate", "speed", "atkRatio", "breakEffect"],
  def: ["critRate", "critDamage", "defRatio", "speed"],
  hpCrit: ["critRate", "critDamage", "hpRatio", "speed"],
  support: ["speed", "hpRatio", "defRatio", "atkRatio"],
  critFollow: ["critRate", "critDamage", "atkRatio", "speed"],
  crit95: ["critRate", "critDamage", "atkRatio", "speed"],
};

const manualRelics = new Map([
  ["manual-myeongjang", { id: "manual-myeongjang", name: "신공을 탐구하는 명장", category: "터널 유물" }],
  ["manual-navigator-ajip", { id: "manual-navigator-ajip", name: "별을 갈망하는 항법사 아집", category: "터널 유물" }],
]);

const builds = {};
const reviewRows = [];

for (const identity of identityRows) {
  const matched = findLegacyBuild(identity);
  const guide = findLegacyGuide(identity);
  const profile = matched?.relicProfile ?? inferProfile(identity, guide);
  const fallback = makeFallbackBuild(identity, guide, profile);
  const rawBuild = matched ?? fallback;
  const relicBuild = rawBuild.relicBuild ?? fallback.relicBuild;
  const lightConeIds = rawBuild.lightConeIds?.length ? rawBuild.lightConeIds : fallback.lightConeIds;
  const selectedLightConeId = lightConeIds[0] ?? fallback.lightConeIds[0] ?? null;
  const sourceStatus = matched ? "hoyowiki_reviewed_default" : guide ? "hoyowiki_guide_profile_fallback" : "profile_fallback_missing_hoyowiki_recommendation";
  const guideLightCones = (guide?.recommendedLightCones ?? []).map((name) => resolveLightConeByName(name)).filter(Boolean);
  const guideRelics = (guide?.recommendedRelics ?? []).map((name) => resolveRelicByName(name)).filter(Boolean);
  const selectedLightCone = decorateLightCone(selectedLightConeId);
  const selectedSet4 = decorateRelic(relicBuild.set4Id);
  const selectedSet4Alt = relicBuild.set4AltId ? decorateRelic(relicBuild.set4AltId) : null;
  const selectedSet2 = decorateRelic(relicBuild.set2Id);

  const normalizedBuild = {
    characterId: identity.characterId,
    avatarId: identity.internalId ?? identity.identifiers?.coefficientAvatarId ?? null,
    displayName: identity.displayName,
    sourceCharacter: rawBuild.sourceCharacter ?? identity.displayName,
    sourceStatus,
    recommendedLightCones: guideLightCones.length ? guideLightCones : [selectedLightCone].filter(Boolean),
    recommendedRelics: guideRelics.length ? guideRelics : [selectedSet4, selectedSet2].filter(Boolean),
    selectedLightCone,
    selectedRelics: {
      set4: selectedSet4,
      set4Alt: selectedSet4Alt,
      set4Mode: relicBuild.set4Mode ?? "4",
      set2: selectedSet2,
    },
    mainStats: {
      head: "hpFlat",
      hands: "atkFlat",
      ...(relicBuild.mainStats ?? fallback.relicBuild.mainStats),
    },
    subStatPriority: inferSubStatPriority(relicBuild, profile),
    pieces: relicBuild.pieces ?? fallback.relicBuild.pieces,
    notes: rawBuild.missingItems?.length ? rawBuild.missingItems : [],
  };

  builds[identity.characterId] = normalizedBuild;
  reviewRows.push(normalizedBuild);
}

const output = {
  app: "hsr-relic-cc-default-character-builds",
  version: 1,
  generatedAt: new Date().toISOString(),
  source: {
    defaultBuilds: "C:\\CODEX\\HSR RELIC CC\\data\\character-effects\\default-builds.json",
    characterGuides: "C:\\CODEX\\HSR RELIC CC\\data\\character-effects\\character-guides.json",
    lightCones: "C:\\CODEX\\HSR RELIC CC\\src\\generated-lightcones.json",
    relics: "C:\\CODEX\\HSR RELIC CC\\src\\generated-relics.json",
  },
  policy: {
    defaultBuildsUseHoyoWikiIds: true,
    freesrNumericIdsAreImportOnly: true,
    missingCharactersUseProfileFallback: true,
  },
  summary: {
    characters: reviewRows.length,
    reviewedDefaults: reviewRows.filter((row) => row.sourceStatus === "hoyowiki_reviewed_default").length,
    guideFallbacks: reviewRows.filter((row) => row.sourceStatus === "hoyowiki_guide_profile_fallback").length,
    profileFallbacks: reviewRows.filter((row) => row.sourceStatus === "profile_fallback_missing_hoyowiki_recommendation").length,
    selectedLightCones: reviewRows.filter((row) => row.selectedLightCone?.id).length,
    selectedRelicSets: reviewRows.filter((row) => row.selectedRelics.set4?.id && row.selectedRelics.set2?.id).length,
    reviewPath: "reports/import/default-character-builds-review.md",
  },
  builds,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
writeReview(output, reviewRows);

console.log(
  `default character builds generated: characters=${output.summary.characters} reviewed=${output.summary.reviewedDefaults} profileFallbacks=${output.summary.profileFallbacks}`,
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function findLegacyBuild(identity) {
  return buildByName.get(normalizeIdentityKey(identity.displayName))
    ?? buildByName.get(normalizeIdentityKey(identity.officialName))
    ?? (identity.aliasNames ?? []).map((alias) => buildByName.get(normalizeIdentityKey(alias))).find(Boolean)
    ?? null;
}

function findLegacyGuide(identity) {
  return guideByName.get(normalizeIdentityKey(identity.displayName))
    ?? guideByName.get(normalizeIdentityKey(identity.officialName))
    ?? (identity.aliasNames ?? []).map((alias) => guideByName.get(normalizeIdentityKey(alias))).find(Boolean)
    ?? null;
}

function inferProfile(identity, guide = null) {
  const text = `${guide?.roleClass ?? ""} ${guide?.damageTemplate ?? ""} ${guide?.statProfile ?? ""} ${identity.path ?? ""}`;
  if (/break|격파/i.test(text)) return "break";
  if (/dot|지속/i.test(text)) return "dotEhr";
  if (/def|보존|탱커|preservation/i.test(text)) return "def";
  if (/hp|체력|체퍼|abundance/i.test(text)) return "hpCrit";
  if (/support|지원|화합|harmony|remembrance/i.test(text)) return "support";
  if (/follow|추가|추공/i.test(text)) return "critFollow";
  return "crit95";
}

function makeFallbackBuild(identity, guide, profile) {
  const pathKey = normalizeName(identity.path).toLowerCase();
  const relicFallback = fallbackRelicByProfile[profile] ?? fallbackRelicByProfile.crit95;
  const mainStats = fallbackMainStatsByProfile[profile] ?? fallbackMainStatsByProfile.crit95;
  const subStats = fallbackSubStatsByProfile[profile] ?? fallbackSubStatsByProfile.crit95;
  const pieces = makePiecesFromPriority(mainStats, subStats);
  return {
    sourceCharacter: identity.displayName,
    lightConeIds: [resolveRecommendedLightConeId(guide) ?? fallbackLightConeByPath[pathKey] ?? fallbackLightConeByPath.destruction],
    lightConeRank: 1,
    relicProfile: profile,
    relicBuild: {
      ...relicFallback,
      mainStats,
      pieces,
    },
    missingItems: guide ? [] : ["HoYoWiki recommended build source missing; profile fallback applied"],
  };
}

function makePiecesFromPriority(mainStats, subStats) {
  const pieces = {};
  for (const piece of ["head", "hands", "body", "feet", "sphere", "rope"]) {
    const mainStat = piece === "head" ? "hpFlat" : piece === "hands" ? "atkFlat" : mainStats[piece];
    pieces[piece] = {
      mainStat,
      subStats: subStats.filter((stat) => stat !== mainStat).slice(0, 4).map((stat, index) => ({ stat, rolls: index === 0 ? 2 : index === 1 ? 1 : 0 })),
    };
  }
  return pieces;
}

function makePiecesFromSpec(spec) {
  return Object.fromEntries(Object.entries(spec).map(([piece, row]) => [
    piece,
    {
      mainStat: row.mainStat,
      subStats: (row.subStats ?? []).map(([stat, rolls]) => ({ stat, rolls })),
    },
  ]));
}

function resolveRecommendedLightConeId(guide) {
  const name = guide?.recommendedLightCones?.[0];
  return name ? resolveLightConeByName(name)?.id ?? null : null;
}

function resolveLightConeByName(name) {
  const key = normalizeIdentityKey(name);
  const item = lightCones.find((lightCone) => normalizeIdentityKey(lightCone.name) === key);
  return item ? decorateLightCone(item.id) : null;
}

function resolveRelicByName(name) {
  const key = normalizeIdentityKey(name);
  const item = relicSets.find((relic) => normalizeIdentityKey(relic.name) === key);
  return item ? decorateRelic(item.id) : null;
}

function decorateLightCone(id) {
  if (!id) return null;
  const item = lightConeById.get(id);
  return {
    id,
    name: item?.name ?? id,
    path: item?.path ?? null,
  };
}

function decorateRelic(id) {
  if (!id) return null;
  const item = relicById.get(id) ?? manualRelics.get(id);
  return {
    id,
    name: item?.name ?? id,
    category: item?.category ?? null,
  };
}

function inferSubStatPriority(relicBuild, profile) {
  const seen = [];
  for (const piece of Object.values(relicBuild.pieces ?? {})) {
    for (const subStat of piece.subStats ?? []) {
      const stat = subStat.stat;
      if (stat && !seen.includes(stat)) seen.push(stat);
    }
  }
  return seen.length ? seen : fallbackSubStatsByProfile[profile] ?? fallbackSubStatsByProfile.crit95;
}

function formatList(items, mapper = (item) => item?.name ?? item?.id ?? "") {
  const values = (items ?? []).map(mapper).filter(Boolean);
  return values.length ? values.join(", ") : "-";
}

function formatMainStats(mainStats) {
  return ["body", "feet", "sphere", "rope"].map((slot) => `${slot}:${mainStats?.[slot] ?? "-"}`).join(", ");
}

function writeReview(output, rows) {
  const lines = [
    "# Default Character Builds Review",
    "",
    "HoYoWiki/reviewed guide 기준 기본 광추/유물 세팅 검수용 문서입니다. FreeSR 숫자 ID는 import 전용이므로 이 표에는 넣지 않습니다.",
    "",
    `- generatedAt: ${output.generatedAt}`,
    `- characters: ${output.summary.characters}`,
    `- reviewedDefaults: ${output.summary.reviewedDefaults}`,
    `- profileFallbacks: ${output.summary.profileFallbacks}`,
    "",
    "| Character | Status | Light Cone | 4pc Relic | 2pc Relic | Main Stats | Substat Priority | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    lines.push([
      row.displayName,
      row.sourceStatus,
      row.selectedLightCone?.name ?? row.selectedLightCone?.id ?? "-",
      row.selectedRelics.set4?.name ?? row.selectedRelics.set4?.id ?? "-",
      row.selectedRelics.set2?.name ?? row.selectedRelics.set2?.id ?? "-",
      formatMainStats(row.mainStats),
      formatList(row.subStatPriority, (item) => item),
      formatList(row.notes, (item) => item),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  fs.mkdirSync(path.dirname(reviewPath), { recursive: true });
  fs.writeFileSync(reviewPath, `${lines.join("\n")}\n`, "utf8");
}

import fs from "node:fs";

const coefficientRowsPath = "data/generated/coefficient-rows.json";
const characterIdentityPath = "data/generated/character-identity.json";
const hoyowikiSkillsPath = "data/legacy-reference/game-db/hoyowiki-character-skills.json";
const customTypeProfilesPath = "data/curated/custom-relic-type-profiles.json";
const formulaOverridesPath = "data/curated/skill-damage-formula-overrides.json";
const outPath = "data/generated/skill-damage-metadata.json";
const reportPath = "reports/calculation/skill-damage-metadata-report.md";

const coefficientRows = readJson(coefficientRowsPath).rows ?? [];
const identityRows = readJson(characterIdentityPath).rows ?? [];
const hoyowikiCharacters = readJson(hoyowikiSkillsPath).characters ?? [];
const customTypeRows = readJson(customTypeProfilesPath).rows ?? [];
const formulaOverrideRules = readJsonIfExists(formulaOverridesPath).rules ?? [];

const identityById = new Map(identityRows.map((row) => [row.characterId, row]));
const customTypeById = new Map(customTypeRows.map((row) => [row.characterId, row]));
const hoyowikiByEntryId = new Map(hoyowikiCharacters.map((row) => [String(row.entryPageId), row]));
const hoyowikiByName = new Map(hoyowikiCharacters.map((row) => [row.nameKo, row]));
const groups = new Map();

for (const row of coefficientRows) {
  if (!row.characterId || !row.skillId || row.attackType === "support") continue;
  if (!identityById.has(row.characterId)) continue;
  if (!Array.isArray(row.coefficientValues) || !row.coefficientValues.length) continue;
  if (row.calculationStatus && row.calculationStatus !== "calculation_ready") continue;
  const key = [row.characterId, row.skillId, row.attackType].join("|");
  if (!groups.has(key)) {
    groups.set(key, {
      characterId: row.characterId,
      skillId: row.skillId,
      attackType: row.attackType,
      targetProfile: row.targetProfile ?? row.targetScope ?? "unknown",
      targetScope: row.targetScope ?? row.targetProfile ?? "unknown",
      mainRows: [],
      partRows: [],
    });
  }
  const group = groups.get(key);
  if (String(row.id).includes(":row:")) group.partRows.push(row);
  else group.mainRows.push(row);
}

const skillSequenceIndex = new Map();
const rows = [...groups.values()]
  .map((group) => {
    const identity = identityById.get(group.characterId);
    const hoyowiki = findHoyowikiCharacter(identity);
    const skillLevelType = attackTypeToSkillLevelType(group.attackType);
    const skillIndexKey = [group.characterId, skillLevelType].join("|");
    const sequenceIndex = skillSequenceIndex.get(skillIndexKey) ?? 0;
    skillSequenceIndex.set(skillIndexKey, sequenceIndex + 1);
    const sourceSkill = findSourceSkill(hoyowiki, skillLevelType, sequenceIndex);
    const selectedRows = group.partRows.length ? group.partRows : group.mainRows;
    const parts = selectedRows.map((row, index) => ({
      coefficientRowId: row.id,
      sourceId: row.sourceId,
      partIndex: index,
      coefficientValues: row.coefficientValues.map((value) => Number(value)),
      reviewStatus: row.reviewStatus,
    }));
    const profile = customTypeById.get(group.characterId);
    const primaryStat = normalizeScalingStat(profile?.uiTypeProfile?.primaryStat);
    const rowSourceText = selectedRows.map((row) => row.sourceText).filter(Boolean).join("\n");
    const formulaSourceText = [
      sourceSkill?.title,
      sourceSkill?.description,
      rowSourceText,
    ].filter(Boolean).join("\n");
    const damageFormulaType = resolveDamageFormulaType({
      characterId: group.characterId,
      attackType: group.attackType,
      damageTemplate: profile?.uiTypeProfile?.damageTemplate,
      evaluationTemplateKey: profile?.uiTypeProfile?.evaluationTemplateKey,
      sourceText: formulaSourceText,
      rowSourceText,
    });
    const attackType = resolveDamageAttackType({
      baseAttackType: group.attackType,
      identity,
      sourceText: formulaSourceText,
      rowSourceText,
    });
    const levelBonuses = buildLevelBonuses(hoyowiki, skillLevelType);
    const scalingStatLabel = inferScalingStatLabel({ sourceSkill, rowSourceText, scalingStat: primaryStat });
    return applySkillDamageMetadataOverrides({
      id: [group.characterId, group.skillId, group.attackType].join(":"),
      characterId: group.characterId,
      displayName: identity?.displayName ?? group.characterId,
      element: identity?.element ?? null,
      skillId: group.skillId,
      title: sourceSkill?.title ?? fallbackSkillTitle(group.attackType, group.skillId),
      attackType,
      damageFormulaType,
      formulaClassificationSource: classifyFormulaSource(damageFormulaType, formulaSourceText, profile?.uiTypeProfile),
      skillLevelType,
      targetProfile: group.targetProfile,
      targetScope: group.targetScope,
      scalingStat: primaryStat,
      ...(scalingStatLabel ? { scalingStatLabel } : {}),
      damageTemplate: profile?.uiTypeProfile?.damageTemplate ?? "crit",
      baseLevel: skillLevelType === "basicAttack" ? 6 : 10,
      maxLevel: Math.max(...parts.flatMap((part) => part.coefficientValues.length)),
      sourceSkillTitle: sourceSkill?.title ?? null,
      sourceSkillCategory: sourceSkill?.category ?? null,
      eidolonLevelBonuses: levelBonuses,
      partPolicy: group.partRows.length ? "row_parts_preferred_over_main" : "main_row_fallback",
      parts,
    });
  })
  .sort((a, b) => a.displayName.localeCompare(b.displayName, "ko") || a.skillId.localeCompare(b.skillId) || a.attackType.localeCompare(b.attackType));

const output = {
  app: "hsr-relic-cc-skill-damage-metadata",
  version: 1,
  generatedAt: new Date().toISOString(),
  source: {
    coefficientRows: coefficientRowsPath,
    characterIdentity: characterIdentityPath,
    hoyowikiSkills: hoyowikiSkillsPath,
    customTypeProfiles: customTypeProfilesPath,
    formulaOverrides: formulaOverridesPath,
  },
  policy: {
    uiBundleSlimMetadataOnly: true,
    sourceTextExcluded: true,
    supportRowsExcludedFromDamageCards: true,
    rowPartsPreferredOverMain: true,
    defaultBaseLevels: {
      basicAttack: 6,
      combatSkill: 10,
      ultimate: 10,
      talent: 10,
    },
  },
  summary: {
    rows: rows.length,
    characters: new Set(rows.map((row) => row.characterId)).size,
    coefficientParts: rows.reduce((sum, row) => sum + row.parts.length, 0),
    withEidolonLevelBonuses: rows.filter((row) => row.eidolonLevelBonuses.length).length,
    byDamageFormulaType: countBy(rows, (row) => row.damageFormulaType),
  },
  rows,
};

fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
fs.mkdirSync("reports/calculation", { recursive: true });
fs.writeFileSync(reportPath, [
  "# Skill Damage Metadata",
  "",
  "Slim UI metadata generated from coefficient rows, HoYoWiki skill titles, E3/E5 level bonuses, and custom type scaling profiles.",
  "",
  `- rows: ${output.summary.rows}`,
  `- characters: ${output.summary.characters}`,
  `- coefficient parts: ${output.summary.coefficientParts}`,
  `- with eidolon level bonuses: ${output.summary.withEidolonLevelBonuses}`,
  `- damage formula types: ${Object.entries(output.summary.byDamageFormulaType).map(([key, value]) => `${key}=${value}`).join(", ")}`,
  "",
].join("\n"));

console.log(`skill damage metadata generated: rows=${output.summary.rows}, characters=${output.summary.characters}, parts=${output.summary.coefficientParts}`);

function applySkillDamageMetadataOverrides(row) {
  if (row.characterId === "SilverWolf999_00" && row.skillId === "SilverWolf999_00:Skill01") {
    return {
      ...row,
      targetProfile: "single",
      targetScope: "single",
      partPolicy: "manual_basic_attack_single_part",
      parts: (row.parts ?? []).slice(0, 1),
    };
  }
  return row;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function readJsonIfExists(path) {
  return fs.existsSync(path) ? readJson(path) : {};
}

function findHoyowikiCharacter(identity) {
  if (!identity) return null;
  const entryId = identity.identifiers?.hoyowikiEntryPageId;
  return hoyowikiByEntryId.get(String(entryId)) ?? hoyowikiByName.get(identity.displayName) ?? hoyowikiByName.get(identity.officialName) ?? null;
}

function findSourceSkill(hoyowiki, skillLevelType, sequenceIndex) {
  const skills = (hoyowiki?.skills ?? []).filter((skill) => skill.category === skillLevelType);
  return skills[sequenceIndex] ?? skills[0] ?? null;
}

function buildLevelBonuses(hoyowiki, skillLevelType) {
  return (hoyowiki?.eidolons ?? [])
    .filter((eidolon) => eidolon.extraLevels?.[skillLevelType])
    .map((eidolon) => ({
      minEidolon: Number(eidolon.rank),
      skillLevelType,
      levelBonus: Number(eidolon.extraLevels[skillLevelType]),
      sourceTitle: eidolon.title ?? null,
    }))
    .filter((row) => Number.isFinite(row.minEidolon) && Number.isFinite(row.levelBonus));
}

function attackTypeToSkillLevelType(attackType) {
  if (attackType === "basic") return "basicAttack";
  if (attackType === "skill") return "combatSkill";
  if (attackType === "ultimate") return "ultimate";
  return "talent";
}

function resolveDamageAttackType({ baseAttackType, identity, sourceText, rowSourceText }) {
  const text = [sourceText, rowSourceText].filter(Boolean).join("\n");
  const isMemoryCharacter = String(identity?.path ?? "").toLowerCase() === "memory";
  const hasMemospriteDamage =
    /기억\s*정령[^\n]*(피해|공격력|HP\s*최대치)/.test(text)
    || /미미\s*공격력/.test(text)
    || (isMemoryCharacter && /memosprite/i.test(text));
  if (hasMemospriteDamage) return "memosprite";
  return baseAttackType;
}

function resolveDamageFormulaType({ characterId, attackType, damageTemplate, evaluationTemplateKey, sourceText, rowSourceText }) {
  const override = findFormulaOverride({ characterId, attackType, sourceText });
  if (override) return override.damageFormulaType;
  if (/확정\s*피해|확정피해|true\s*dmg|true\s*damage/i.test(rowSourceText)) return "true_damage";
  if (/슈퍼\s*격파|super\s*break/i.test(sourceText)) return "super_break";
  if (/환락\s*피해|elation\s*dmg/i.test(sourceText)) return "elation";
  if (attackType === "dot" || damageTemplate === "dot" || evaluationTemplateKey === "dot") return "dot";
  if (damageTemplate === "break" || evaluationTemplateKey === "break") return "break";
  return "normal";
}

function findFormulaOverride({ characterId, attackType, sourceText }) {
  return formulaOverrideRules.find((rule) => {
    if (rule.characterId && rule.characterId !== characterId) return false;
    if (rule.attackType && rule.attackType !== attackType) return false;
    if (rule.matchText && !String(sourceText ?? "").includes(rule.matchText)) return false;
    return rule.damageFormulaType;
  }) ?? null;
}

function classifyFormulaSource(damageFormulaType, sourceText, profile = {}) {
  if (/슈퍼\s*격파|super\s*break/i.test(sourceText)) return "source_text:super_break";
  if (/환락\s*피해|elation\s*dmg/i.test(sourceText)) return "source_text:elation";
  if (damageFormulaType === "true_damage" || /확정\s*피해|확정피해|true\s*dmg|true\s*damage/i.test(sourceText)) return "source_text:true_damage";
  if (damageFormulaType === "dot") return "template:dot";
  if (damageFormulaType === "break") return "template:break";
  return `template:${profile.damageTemplate ?? "normal"}`;
}

function fallbackSkillTitle(attackType, skillId) {
  const labels = {
    basic: "일반 공격",
    skill: "전투 스킬",
    ultimate: "필살기",
    follow_up: "추가 공격",
    dot: "지속 피해",
  };
  return `${labels[attackType] ?? attackType} ${String(skillId ?? "").split(":").pop() ?? ""}`.trim();
}

function normalizeScalingStat(stat) {
  if (stat === "hp" || stat === "def") return stat;
  if (stat === "breakEffect") return "breakEffect";
  return "atk";
}

function inferScalingStatLabel({ sourceSkill, rowSourceText, scalingStat }) {
  const text = [sourceSkill?.description, rowSourceText].filter(Boolean).join("\n");
  if (/미미\s*공격력/.test(text)) return "미미 공격력";
  if (/기억\s*정령[^\n]*공격력/.test(text)) return "기억정령 공격력";
  return null;
}

function countBy(rows, getter) {
  return rows.reduce((acc, row) => {
    const key = getter(row) ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

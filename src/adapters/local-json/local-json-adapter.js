import fs from "node:fs";
import path from "node:path";
import {
  AttackType,
  BlockedReason,
  CalculationStatus,
  EffectType,
  ReviewStatus,
  SourceKind,
  SourceOrigin,
  TargetProfile,
  TargetScope,
  ValueMode,
} from "../../data-model/schemas/index.js";

const manifestPath = "data/legacy-reference/manifest.json";
const dynamicFormulaReviewProgressPath = "reports/extraction/dynamic-formula-user-review-progress.md";
const primarySkillCategories = new Set(["basicAttack", "combatSkill", "ultimate", "talent"]);
const baseLevelByCategory = Object.freeze({
  basicAttack: 6,
  combatSkill: 10,
  ultimate: 10,
  talent: 10,
});
const skillLabelByCategory = Object.freeze({
  basicAttack: "일반 공격",
  combatSkill: "전투 스킬",
  ultimate: "필살기",
  talent: "특성",
});
const statLabelNeedles = Object.freeze({
  atkRatio: ["공격력"],
  atkFlat: ["공격력"],
  hpRatio: ["HP", "체력"],
  critRate: ["치명타 확률"],
  critDamage: ["치명타 피해"],
  allDamage: ["피해 증가", "가하는 피해", "피해량 증가", "피해 배율"],
  basicDamage: ["일반 공격 피해"],
  combatSkillDamage: ["전투 스킬 피해", "스킬 피해"],
  skillDamage: ["스킬 피해"],
  ultimateDamage: ["필살기 피해", "피해 증가"],
  followDamage: ["추가 공격 피해"],
  vulnerability: ["받는 피해", "취약"],
  defenseDown: ["방어력 감소", "방어력"],
  defenseIgnore: ["방어력", "무시"],
  resistancePen: ["저항 관통", "저항"],
  breakEffect: ["격파 특수효과"],
  breakDamage: ["격파 피해"],
  toughnessDamageRatio: ["강인성"],
  speed: ["속도"],
});

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readTextIfExists(root, relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
}

function findManifestEntry(manifest, id) {
  return manifest.entries.find((entry) => entry.id === id) ?? null;
}

function normalizeValueMode(valueMode) {
  const allowed = new Set(Object.values(ValueMode));
  return allowed.has(valueMode) ? valueMode : ValueMode.UNKNOWN;
}

function createDynamicFormulaReviewIndex(root) {
  const content = readTextIfExists(root, dynamicFormulaReviewProgressPath);
  const decisions = new Map();
  if (!content) return decisions;

  const sectionPattern = /^###\s+(\d+)\.\s+(.+?)\s+-\s+(effect:[^\s]+)\s*$/gm;
  const matches = [...content.matchAll(sectionPattern)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const sectionStart = match.index + match[0].length;
    const sectionEnd = matches[index + 1]?.index ?? content.length;
    const section = content.slice(sectionStart, sectionEnd);
    const decision = section.match(/^- decision:\s*(.+)$/m)?.[1]?.trim();
    if (!decision || decision === "pending") continue;
    const relatedModelingNotes = [...section.matchAll(/^- related modeling note:\s*(.+)$/gm)].map((note) => note[1].trim());
    decisions.set(match[3], {
      reviewIndex: Number(match[1]),
      reviewLabel: match[2],
      status: "user_decided",
      decision,
      ...(relatedModelingNotes.length ? { relatedModelingNotes } : {}),
      sourcePath: dynamicFormulaReviewProgressPath,
    });
  }
  return decisions;
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parseHoyoWikiSourceId(sourceId) {
  const parts = String(sourceId ?? "").split(":");
  if (parts[0] !== "HoyoWiki") return null;
  return {
    entryPageId: parts[1] ?? null,
    category: parts[2] ?? null,
    title: parts[3] ?? null,
    stat: parts[4] ?? null,
    suffix: parts.slice(5).join(":"),
  };
}

function parseCoefficientLabel(sourceId) {
  const match = String(sourceId ?? "").match(/coefficientRows\[([^\]]+)\]/);
  return match?.[1] ?? null;
}

function createHoyoWikiIndex(skillPayload) {
  return new Map((skillPayload?.characters ?? []).map((character) => [String(character.entryPageId), character]));
}

function findHoyoWikiSkill(skillIndex, trace) {
  if (!trace?.entryPageId) return null;
  const character = skillIndex.get(String(trace.entryPageId));
  if (!character) return null;
  const skills = character.skills ?? [];
  const skill = skills.find((item) => item.category === trace.category && item.title === trace.title)
    ?? skills.find((item) => item.title === trace.title)
    ?? skills.find((item) => item.category === trace.category);
  return skill ? { character, skill } : { character, skill: null };
}

function parseEidolonLevelBonuses(character, category) {
  const skillLabel = skillLabelByCategory[category];
  if (!skillLabel) return [];
  const bonuses = [];
  const pattern = new RegExp(`${skillLabel}\\s*레벨\\s*\\+\\s*(\\d+)\\s*,\\s*최대\\s*Lv\\.?\\s*(\\d+)`, "g");
  for (const eidolon of character?.eidolons ?? []) {
    const text = compactText(eidolon.description);
    for (const match of text.matchAll(pattern)) {
      bonuses.push({
        minEidolon: Number(eidolon.rank),
        levelBonus: Number(match[1]),
        levelCap: Number(match[2]),
        sourceTitle: eidolon.title ?? null,
      });
    }
  }
  return bonuses.sort((a, b) => a.minEidolon - b.minEidolon);
}

function isSourceStatFormula(effect) {
  const source = `${effect.sourceId ?? ""} ${effect.sourcePath ?? ""} ${effect.sourceRecord ?? ""} ${effect.valueFormula ?? ""} ${effect.scalingSource ?? ""}`;
  return /sourceCombat|sourceAtk|targetAtk|source-atk|overcap|threshold|breakeffect/i.test(source);
}

function requiresDynamicStackResolution(effect) {
  if (normalizeValueMode(effect.valueMode) !== ValueMode.DYNAMIC_FORMULA) return false;
  const source = `${effect.sourceId ?? ""} ${effect.sourcePath ?? ""} ${effect.sourceRecord ?? ""}`.toLowerCase();
  const text = compactText(effect.sourceText);
  return /stack|stacks|nobility|ashenroast|overcap|enemydebuffcount/.test(source)
    || /스택당|최대\s*중첩|최대\s*중첩수|최대\s*\d+\s*스택|중첩\s*가능|보유할 때마다|1스택\s*보유할 때마다/.test(text);
}

function isAggregatedDynamicValue(effect, coefficientRow) {
  if (valueInRow(coefficientRow, effect.value)) return false;
  const firstValue = coefficientRow?.values?.[0];
  if (typeof effect.value !== "number" || typeof firstValue !== "number") return false;
  return effect.value > firstValue + 0.00001 && Math.abs(effect.value - firstValue) > 0.00001;
}

function isFixedHoyoWikiTrace(trace) {
  return /(?:^|:)fixed\d*$/i.test(trace?.suffix ?? "");
}

function coefficientAtLevel(row, level) {
  const values = row?.values ?? [];
  if (values.length === 0) return null;
  const index = Math.max(0, Math.min(values.length, level) - 1);
  return values[index] ?? null;
}

function inferAggregateMultiplier(effect, coefficientRow, baseLevel) {
  if (typeof effect.value !== "number" || !Number.isFinite(effect.value)) return null;
  const baseValue = coefficientAtLevel(coefficientRow, baseLevel);
  if (typeof baseValue !== "number" || !Number.isFinite(baseValue) || baseValue === 0) return null;
  const ratio = effect.value / baseValue;
  const rounded = Math.round(ratio);
  if (rounded >= 2 && Math.abs(ratio - rounded) < 0.00001) return rounded;
  const stackMatch = compactText(effect.sourceText).match(/최대\s*중첩수\s*:\s*(\d+)\s*스택/);
  return stackMatch ? Number(stackMatch[1]) : null;
}

function blockedSkillScalingPatch({ effect, found, skill, matching, baseLevel, hardCap, eidolonLevelBonuses, missingReason }) {
  return {
    valueMode: ValueMode.SKILL_LEVEL_SCALED,
    calculationStatus: CalculationStatus.BLOCKED,
    blockedReason: BlockedReason.MISSING_RESOLVED_VALUE,
    skillScaling: {
      source: matching?.row ? "blocked_hoyowiki_coefficient_row" : "missing_hoyowiki_coefficient_row",
      entryPageId: found.character.entryPageId,
      skillTitle: skill.title,
      skillCategory: skill.category,
      skillPointKey: skill.pointKey ?? null,
      coefficientLabel: matching?.row?.label ?? null,
      coefficientRowIndex: matching?.rowIndex ?? null,
      coefficientValues: matching?.row?.values ?? [],
      matchType: matching?.matchType ?? "missing",
      baseLevel,
      hardCap,
      eidolonLevelBonuses,
      missingReason,
    },
  };
}

function isAdditionalAbility(effect, skill) {
  return effect.sourceKind === "추가 능력"
    || compactText(effect.sourceText).startsWith("<추가 능력>");
}

function valueInRow(row, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return (row.values ?? []).some((candidate) => Math.abs(Number(candidate) - value) < 0.00001);
}

function labelMatchesStat(label, stat) {
  const text = compactText(label);
  const needles = statLabelNeedles[stat] ?? [];
  return needles.some((needle) => text.includes(needle));
}

function findMatchingCoefficientRow(skill, effect) {
  const rows = skill?.coefficientRows ?? [];
  const explicitLabel = parseCoefficientLabel(effect.sourceTrace)
    ?? parseCoefficientLabel(effect.sourceId)
    ?? parseCoefficientLabel(effect.sourcePath)
    ?? parseCoefficientLabel(effect.sourceRecord);
  if (explicitLabel) {
    const explicitMatch = rows.find((row) => row.label === explicitLabel);
    if (explicitMatch) return { row: explicitMatch, rowIndex: rows.indexOf(explicitMatch), matchType: "explicit_label" };
  }

  const valueMatches = rows.filter((row) => valueInRow(row, effect.value));
  const valueAndLabelMatches = valueMatches.filter((row) => labelMatchesStat(row.label, effect.stat));
  if (valueAndLabelMatches.length === 1) return { row: valueAndLabelMatches[0], rowIndex: rows.indexOf(valueAndLabelMatches[0]), matchType: "value+label" };

  const labelMatches = rows.filter((row) => labelMatchesStat(row.label, effect.stat));
  if (labelMatches.length === 1) return { row: labelMatches[0], rowIndex: rows.indexOf(labelMatches[0]), matchType: "label" };

  const needles = statLabelNeedles[effect.stat] ?? [];
  if (needles.length === 0 && valueMatches.length === 1) return { row: valueMatches[0], rowIndex: rows.indexOf(valueMatches[0]), matchType: "value" };

  return null;
}

function hasNumericDamageModifier(effect) {
  const text = compactText(effect.sourceText);
  return /\d+(?:\.\d+)?\s*(?:%|pt)/.test(text)
    && /공격력|치명타|피해|방어력|저항|속도|격파|HP|체력|취약/.test(text);
}

function createSkillScalingPatch(effect, skillIndex) {
  const trace = parseHoyoWikiSourceId(effect.sourceTrace)
    ?? parseHoyoWikiSourceId(effect.sourceId)
    ?? parseHoyoWikiSourceId(effect.sourcePath)
    ?? parseHoyoWikiSourceId(effect.sourceRecord);
  const found = findHoyoWikiSkill(skillIndex, trace);
  const skill = found?.skill;
  if (!trace || !found?.character || !skill) return null;
  if (isFixedHoyoWikiTrace(trace)) return null;
  if (!primarySkillCategories.has(skill.category)) return null;
  if (isSourceStatFormula(effect)) return null;
  if (requiresDynamicStackResolution(effect)) return null;
  if (isAdditionalAbility(effect, skill)) return null;

  const matching = findMatchingCoefficientRow(skill, effect);
  const baseLevel = baseLevelByCategory[skill.category] ?? 10;
  const eidolonLevelBonuses = parseEidolonLevelBonuses(found.character, skill.category);
  const fallbackHardCap = skill.coefficientRows?.[0]?.values?.length ?? baseLevel;

  if (matching?.row) {
    const hardCap = matching.row.values.length;
    const aggregateMultiplier = isAggregatedDynamicValue(effect, matching.row)
      ? inferAggregateMultiplier(effect, matching.row, baseLevel)
      : null;
    return {
      valueMode: ValueMode.SKILL_LEVEL_SCALED,
      calculationStatus: CalculationStatus.CALCULATION_READY,
      blockedReason: null,
      skillScaling: {
        source: "hoyowiki-character-skills.coefficientRows",
        entryPageId: found.character.entryPageId,
        skillTitle: skill.title,
        skillCategory: skill.category,
        skillPointKey: skill.pointKey ?? null,
        coefficientLabel: matching.row.label ?? null,
        coefficientRowIndex: matching.rowIndex,
        coefficientValues: matching.row.values,
        matchType: matching.matchType,
        baseLevel,
        hardCap,
        eidolonLevelBonuses,
        ...(aggregateMultiplier ? { aggregateMultiplier } : {}),
      },
    };
  }

  const explicitlyClaimedCoefficientRow = Boolean(parseCoefficientLabel(effect.sourceTrace)
    ?? parseCoefficientLabel(effect.sourceId)
    ?? parseCoefficientLabel(effect.sourcePath)
    ?? parseCoefficientLabel(effect.sourceRecord));
  if (explicitlyClaimedCoefficientRow && hasNumericDamageModifier(effect)) {
    const hardCap = fallbackHardCap;
    return blockedSkillScalingPatch({
      effect,
      found,
      skill,
      matching: null,
      baseLevel,
      hardCap,
      eidolonLevelBonuses,
      missingReason: "primary_leveled_ability_numeric_effect_without_matching_coefficient_row",
    });
  }

  return null;
}

function inferEffectType(effect) {
  const targetText = [effect.target, effect.targetScope, effect.effectScopeCategory?.group].filter(Boolean).join(" ");
  if (/enemy/i.test(targetText)) return EffectType.DEBUFF;
  if (effect.kind === "triggeredAdditionalDamage") return EffectType.TRIGGERED_DAMAGE;
  return EffectType.BUFF;
}

function dynamicFormulaType(effect) {
  if (normalizeValueMode(effect.valueMode) !== ValueMode.DYNAMIC_FORMULA) return null;
  const source = [effect.sourceText, effect.sourceRecord, effect.sourcePath, effect.sourceId, effect.stat].filter(Boolean).join(" ").toLowerCase();
  if (source.includes("debuffcount")) return "enemy_debuff_count";
  if (source.includes("stack") || source.includes("nobility") || source.includes("ashenroast") || source.includes("overcap")) return "stack_condition";
  if (source.includes("sourcecombatatkratio") || source.includes("targetatkratio") || source.includes("source-atk") || source.includes("atk-threshold") || source.includes("breakeffect")) return "source_stat_ratio";
  if (source.includes("basicattack") || source.includes("selfenhancedskill") || ["followDamage", "ultimateDamage", "basicDamage", "combatSkillDamage"].includes(effect.stat)) return "attack_type_condition";
  if (effect.minEidolon != null) return "eidolon_condition";
  if (source.includes("level") || source.includes("fixed")) return "level_scaled_value";
  return "parser_type_unresolved";
}

function makeSourceRow({ entry, character, effect, index }) {
  const sourceRecord = effect.sourceId ?? effect.sourceRecord ?? effect.sourcePath ?? `${character.avatar ?? character.name}:effect:${index}`;
  return {
    id: `source:${character.avatar ?? character.name}:${index}`,
    kind: "source_row",
    version: 1,
    createdBy: "local-json-adapter",
    sourceOrigin: SourceOrigin.RAW_SOURCE,
    sourceKind: SourceKind.GAME_DB_GENERATED,
    sourcePath: entry.snapshotPath,
    sourceRecord,
    characterId: character.avatar ?? character.name,
    sourceText: effect.sourceText ?? effect.text ?? effect.description ?? null,
    calculationStatus: CalculationStatus.CALCULATION_READY,
  };
}

function makeEffectRow({ sourceRow, character, effect, index, skillIndex, reviewDecisionIndex }) {
  const valueMode = normalizeValueMode(effect.valueMode);
  const skillScalingPatch = createSkillScalingPatch(effect, skillIndex);
  const calculationStatus = skillScalingPatch?.calculationStatus ?? CalculationStatus.CALCULATION_READY;
  const patchedValueMode = skillScalingPatch?.valueMode ?? valueMode;
  const id = `effect:${character.avatar ?? character.name}:${index}`;
  const userReview = reviewDecisionIndex?.get(id) ?? null;
  return {
    id,
    sourceId: sourceRow.id,
    sourceOrigin: sourceRow.sourceOrigin,
    sourcePath: sourceRow.sourcePath,
    sourceText: sourceRow.sourceText,
    sourceType: sourceRow.sourceKind,
    effectType: inferEffectType(effect),
    stat: effect.stat,
    rawValue: effect.value ?? null,
    valueMode: patchedValueMode,
    dynamicFormulaType: dynamicFormulaType(effect),
    effectProviderId: character.avatar ?? character.name,
    characterName: character.name ?? character.avatar,
    minEidolon: effect.minEidolon ?? null,
    sourceTrace: effect.sourceRecord ?? effect.sourcePath ?? effect.sourceId ?? sourceRow.sourceRecord,
    targetScope: effect.targetScope ?? effect.target ?? TargetScope.UNKNOWN,
    effectTargetPolicy: effect.targetScope ?? effect.target ?? "unknown",
    calculationSubjectPolicy: effect.targetScope ?? effect.target ?? "unknown",
    reviewStatus: ReviewStatus.SOURCE_CONFIRMED,
    calculationStatus,
    ...(userReview ? { userReview } : {}),
    ...(skillScalingPatch?.blockedReason ? { blockedReason: skillScalingPatch.blockedReason } : {}),
    ...(skillScalingPatch?.skillScaling ? { skillScaling: skillScalingPatch.skillScaling } : {}),
  };
}

function normalizeAttackType(category) {
  const value = String(category ?? "").toLowerCase();
  if (value.includes("basic")) return AttackType.BASIC;
  if (value.includes("skill")) return AttackType.SKILL;
  if (value.includes("ultimate")) return AttackType.ULTIMATE;
  if (value.includes("follow") || value.includes("talent")) return AttackType.FOLLOW_UP;
  return AttackType.SUPPORT;
}

function normalizeTargetProfile(targetProfile) {
  const type = String(targetProfile?.type ?? targetProfile ?? "").toLowerCase();
  const allowed = new Set(Object.values(TargetProfile));
  return allowed.has(type) ? type : TargetProfile.UNKNOWN;
}

function makeCoefficientSourceRow({ entry, character, slot, index }) {
  const values = slot.confirmedCoefficient?.values ?? slot.confirmedCoefficient?.rows?.flatMap((row) => row.values ?? []) ?? [];
  return {
    id: `source:coefficient:${character.avatar}:${slot.key}:${index}`,
    kind: "source_row",
    version: 1,
    createdBy: "local-json-adapter",
    sourceOrigin: SourceOrigin.RAW_SOURCE,
    sourceKind: SourceKind.GAME_DB_GENERATED,
    sourcePath: entry.snapshotPath,
    sourceRecord: slot.confirmedCoefficient?.sourceRecord ?? `${character.avatar}:${slot.key}`,
    characterId: character.avatar,
    sourceText: `${character.nameKo ?? character.avatar} ${slot.key} ${slot.category} confirmedCoefficient=${values.join(",")}`,
    calculationStatus: CalculationStatus.CALCULATION_READY,
  };
}

function makeCoefficientRows({ sourceRow, character, slot }) {
  const rows = [];
  const confirmed = slot.confirmedCoefficient;
  if (!confirmed) return rows;
  if (Array.isArray(confirmed.values) && confirmed.values.length > 0) {
    rows.push({
      id: `coefficient:game-db:${character.avatar}:${slot.key}:main`,
      sourceId: sourceRow.id,
      sourceOrigin: sourceRow.sourceOrigin,
      sourcePath: sourceRow.sourcePath,
      sourceText: sourceRow.sourceText,
      sourceType: sourceRow.sourceKind,
      characterId: character.avatar,
      skillId: `${character.avatar}:${slot.key}`,
      attackType: normalizeAttackType(slot.category),
      targetProfile: normalizeTargetProfile(slot.targetProfile),
      targetScope: slot.targetProfile?.type ?? TargetScope.UNKNOWN,
      scalingStat: "unknown",
      coefficientValues: confirmed.values,
      reviewStatus: confirmed.review?.status === "confirmed" ? ReviewStatus.SOURCE_CONFIRMED : ReviewStatus.UNREVIEWED,
      calculationStatus: CalculationStatus.CALCULATION_READY,
    });
  }
  for (const [rowIndex, coefficientRow] of (confirmed.rows ?? []).entries()) {
    if (!Array.isArray(coefficientRow.values) || coefficientRow.values.length === 0) continue;
    rows.push({
      id: `coefficient:game-db:${character.avatar}:${slot.key}:row:${rowIndex}`,
      sourceId: sourceRow.id,
      sourceOrigin: sourceRow.sourceOrigin,
      sourcePath: sourceRow.sourcePath,
      sourceText: sourceRow.sourceText,
      sourceType: sourceRow.sourceKind,
      characterId: character.avatar,
      skillId: `${character.avatar}:${slot.key}`,
      attackType: normalizeAttackType(slot.category),
      targetProfile: normalizeTargetProfile(slot.targetProfile),
      targetScope: slot.targetProfile?.type ?? TargetScope.UNKNOWN,
      scalingStat: "unknown",
      coefficientValues: coefficientRow.values,
      reviewStatus: ReviewStatus.SOURCE_CONFIRMED,
      calculationStatus: CalculationStatus.CALCULATION_READY,
    });
  }
  return rows;
}

export const localJsonAdapter = Object.freeze({
  adapterId: "local-json",
  sourceKind: SourceKind.LEGACY_SNAPSHOT,
  load(context = {}) {
    const root = context.root ?? process.cwd();
    const manifest = readJson(root, manifestPath);
    const effectEntry = findManifestEntry(manifest, "legacy:character-effect-candidates");
    const skillEntry = findManifestEntry(manifest, "legacy:hoyowiki-character-skills");
    const coefficientEntry = findManifestEntry(manifest, "legacy:attack-coefficient-candidates");
    if (!effectEntry) throw new Error("legacy:character-effect-candidates manifest entry missing");
    const effectPayload = readJson(root, effectEntry.snapshotPath);
    const skillPayload = skillEntry ? readJson(root, skillEntry.snapshotPath) : null;
    const coefficientPayload = coefficientEntry ? readJson(root, coefficientEntry.snapshotPath) : null;
    return { manifest, effectEntry, skillEntry, coefficientEntry, effectPayload, skillPayload, coefficientPayload };
  },
  normalize(input, context = {}) {
    const loaded = input ?? this.load(context);
    const root = context.root ?? process.cwd();
    const skillIndex = createHoyoWikiIndex(loaded.skillPayload);
    const reviewDecisionIndex = createDynamicFormulaReviewIndex(root);
    const characterLimit = Number.isFinite(context.characterLimit) ? context.characterLimit : null;
    const allCharacters = (loaded.effectPayload.characters ?? []).filter((character) => (character.activeEffects ?? []).length > 0);
    const characters = characterLimit == null ? allCharacters : allCharacters.slice(0, characterLimit);
    const sourceRows = [];
    const effectRows = [];
    const coefficientRows = [];
    const blockedRows = [];

    for (const character of characters) {
      for (const [index, effect] of (character.activeEffects ?? []).entries()) {
        if (!effect.sourceText && !effect.sourcePath && !effect.sourceId) {
          blockedRows.push({
            id: `blocked:${character.avatar ?? character.name}:${index}`,
            blockedReason: "missing_source",
            character: character.name,
          });
          continue;
        }
        const sourceRow = makeSourceRow({ entry: loaded.effectEntry, character, effect, index });
        sourceRows.push(sourceRow);
        effectRows.push(makeEffectRow({ sourceRow, character, effect, index, skillIndex, reviewDecisionIndex }));
      }
    }

    for (const character of loaded.coefficientPayload?.characters ?? []) {
      for (const [slotIndex, slot] of (character.slots ?? []).entries()) {
        if (!slot.confirmedCoefficient) continue;
        const sourceRow = makeCoefficientSourceRow({ entry: loaded.coefficientEntry, character, slot, index: slotIndex });
        sourceRows.push(sourceRow);
        coefficientRows.push(...makeCoefficientRows({ sourceRow, character, slot }));
      }
    }

    return {
      sourceRows,
      effectRows,
      coefficientRows,
      blockedRows,
      metadata: {
        datasetMode: characterLimit == null ? "full" : "sample",
        sampledCharacters: characters.map((character) => character.avatar ?? character.name),
        totalCharactersAvailable: allCharacters.length,
        skillCharactersAvailable: loaded.skillPayload?.characters?.length ?? 0,
        coefficientCharactersAvailable: loaded.coefficientPayload?.characters?.length ?? 0,
        baselineSnapshotAvailable: false,
        dynamicFormulaReviewDecisions: reviewDecisionIndex.size,
      },
    };
  },
  report(result) {
    const output = result?.output ?? result ?? { sourceRows: [], effectRows: [], coefficientRows: [], blockedRows: [] };
    return {
      adapterId: "local-json",
      sourceKind: SourceKind.LEGACY_SNAPSHOT,
      status: "ok",
      counts: {
        sourceRows: output.sourceRows?.length ?? 0,
        effectRows: output.effectRows?.length ?? 0,
        coefficientRows: output.coefficientRows?.length ?? 0,
        blockedRows: output.blockedRows?.length ?? 0,
        warnings: output.metadata?.baselineSnapshotAvailable === false ? 1 : 0,
        errors: 0,
      },
      warnings: output.metadata?.baselineSnapshotAvailable === false ? ["character baseline snapshot is not present in Phase 4-B manifest"] : [],
      errors: [],
    };
  },
});

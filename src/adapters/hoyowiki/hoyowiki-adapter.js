import fs from "node:fs";
import path from "node:path";
import {
  AttackType,
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
const supplementalEffectEntryPageIds = new Set([
  "23",
  "2511",
  "1924",
  "17",
  "18",
  "1228",
  "2494",
  "29",
  "21",
  "791",
  "1389",
  "7",
]);

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function findManifestEntry(manifest, id) {
  return manifest.entries.find((entry) => entry.id === id) ?? null;
}

function normalizeAttackType(category) {
  const value = String(category ?? "").toLowerCase();
  if (value.includes("basic")) return AttackType.BASIC;
  if (value.includes("skill")) return AttackType.SKILL;
  if (value.includes("ultimate")) return AttackType.ULTIMATE;
  if (value.includes("talent") || value.includes("follow")) return AttackType.FOLLOW_UP;
  if (value.includes("technique")) return AttackType.TECHNIQUE;
  return AttackType.SUPPORT;
}

function normalizeTargetProfile(type) {
  const normalized = String(type ?? "").toLowerCase();
  const allowed = new Set(Object.values(TargetProfile));
  return allowed.has(normalized) ? normalized : TargetProfile.UNKNOWN;
}

function makeSourceRow({ entry, character, skill, skillIndex }) {
  const sourceRecord = `HoyoWiki:${character.entryPageId}:${skill.pointKey ?? skillIndex}:${skill.title ?? "skill"}`;
  return {
    id: `source:hoyowiki:${character.entryPageId}:${skill.pointKey ?? skillIndex}`,
    kind: "source_row",
    version: 1,
    createdBy: "hoyowiki-adapter",
    sourceOrigin: SourceOrigin.RAW_SOURCE,
    sourceKind: SourceKind.HOYOWIKI,
    sourcePath: entry.snapshotPath,
    sourceRecord,
    characterId: character.entryPageId,
    sourceText: skill.description ?? null,
    calculationStatus: skill.description ? CalculationStatus.CALCULATION_READY : CalculationStatus.BLOCKED,
    blockedReason: skill.description ? undefined : "missing_source",
  };
}

function makeCoefficientRows({ sourceRow, character, skill, skillIndex }) {
  const rows = [];
  const values = Array.isArray(skill.coefficients) ? skill.coefficients : [];
  if (values.length) {
    rows.push({
      id: `coefficient:hoyowiki:${character.entryPageId}:${skill.pointKey ?? skillIndex}:main`,
      sourceId: sourceRow.id,
      characterId: character.entryPageId,
      skillId: `${character.entryPageId}:${skill.pointKey ?? skillIndex}`,
      attackType: normalizeAttackType(skill.category),
      targetProfile: normalizeTargetProfile(skill.targetProfile?.type),
      scalingStat: "unknown",
      coefficientValues: values,
      calculationStatus: CalculationStatus.CALCULATION_READY,
    });
  }
  for (const [rowIndex, coefficientRow] of (skill.coefficientRows ?? []).entries()) {
    if (!Array.isArray(coefficientRow.values) || coefficientRow.values.length === 0) continue;
    rows.push({
      id: `coefficient:hoyowiki:${character.entryPageId}:${skill.pointKey ?? skillIndex}:row:${rowIndex}`,
      sourceId: sourceRow.id,
      characterId: character.entryPageId,
      skillId: `${character.entryPageId}:${skill.pointKey ?? skillIndex}`,
      attackType: normalizeAttackType(skill.category),
      targetProfile: normalizeTargetProfile(skill.targetProfile?.type),
      scalingStat: "unknown",
      coefficientValues: coefficientRow.values,
      calculationStatus: CalculationStatus.CALCULATION_READY,
    });
  }
  return rows;
}

function inferTargetScope(text) {
  if (/모든\s*아군|아군\s*전체|파티\s*내\s*모든/i.test(text)) return TargetScope.ALL_ALLIES;
  if (/단일\s*아군|지정된\s*아군|아군\s*1명/i.test(text)) return TargetScope.SINGLE_ALLY;
  if (/모든\s*적|적\s*전체|전체\s*적/i.test(text)) return TargetScope.ENEMY_ALL;
  if (/단일\s*적|지정된\s*적|적\s*1명|목표/i.test(text)) return TargetScope.ENEMY_SINGLE;
  if (/자신/i.test(text)) return TargetScope.SELF;
  return TargetScope.FIELD;
}

function inferEffectType(text, targetScope) {
  if (targetScope === TargetScope.ENEMY_ALL || targetScope === TargetScope.ENEMY_SINGLE) return EffectType.DEBUFF;
  if (/방어력\s*감소|받는\s*피해\s*증가|저항\s*감소|취약|디버프/i.test(text)) return EffectType.DEBUFF;
  if (/추가\s*피해|부가\s*피해/i.test(text)) return EffectType.TRIGGERED_DAMAGE;
  return EffectType.BUFF;
}

function targetPolicyFromScope(targetScope) {
  if (targetScope === TargetScope.SELF) return "self";
  if (targetScope === TargetScope.SINGLE_ALLY) return "singleAlly";
  if (targetScope === TargetScope.ALL_ALLIES) return "allAllies";
  if (targetScope === TargetScope.ENEMY_SINGLE) return "enemySingle";
  if (targetScope === TargetScope.ENEMY_ALL) return "enemyAll";
  if (targetScope === TargetScope.FIELD) return "field";
  return "unknown";
}

function percentToValue(value) {
  return Number(value) / 100;
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isDecimalPoint(text, index) {
  return /\d/.test(text[index - 1] ?? "") && /\d/.test(text[index + 1] ?? "");
}

function isSentenceDelimiter(text, index) {
  const char = text[index];
  return char === "|" || (char === "." && !isDecimalPoint(text, index));
}

function sentenceForMatch(text, matchIndex) {
  const normalized = compactText(text);
  let start = -1;
  for (let index = matchIndex - 1; index >= 0; index -= 1) {
    if (isSentenceDelimiter(normalized, index)) {
      start = index;
      break;
    }
  }
  let end = normalized.length;
  for (let index = matchIndex; index < normalized.length; index += 1) {
    if (isSentenceDelimiter(normalized, index)) {
      end = index;
      break;
    }
  }
  return normalized.slice(start + 1, end).trim();
}

function scopeForMatchedText(fullText, matchedText) {
  const scope = inferTargetScope(matchedText);
  if (scope !== TargetScope.FIELD) return scope;
  if (/피격된\s*적|받는\s*(?:지속\s*)?(?:격파\s*)?피해|적이|적에게|모든\s*적|단일\s*적/.test(matchedText)) {
    return /모든\s*적/.test(matchedText) ? TargetScope.ENEMY_ALL : TargetScope.ENEMY_SINGLE;
  }
  if (/모든\s*아군/.test(matchedText)) return TargetScope.ALL_ALLIES;
  if (/자신/.test(matchedText)) return TargetScope.SELF;
  return inferTargetScope(fullText);
}

function effectTypeForSupplement({ stat, targetScope, explicitEffectType }) {
  if (explicitEffectType) return explicitEffectType;
  if (targetScope === TargetScope.ENEMY_ALL || targetScope === TargetScope.ENEMY_SINGLE) return EffectType.DEBUFF;
  if (["vulnerability", "dotVulnerability", "breakVulnerability", "defenseDown", "resistancePen"].includes(stat)) {
    return EffectType.DEBUFF;
  }
  return EffectType.BUFF;
}

const supplementalModifierPatterns = Object.freeze([
  { stat: "breakEffect", regex: /격파\s*특수효과(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g },
  { stat: "toughnessDamageRatio", regex: /(?:약점\s*)?격파\s*효율(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g },
  { stat: "breakVulnerability", regex: /받는\s*격파\s*피해(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g, effectType: EffectType.DEBUFF },
  { stat: "dotVulnerability", regex: /받는\s*지속\s*피해(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g, effectType: EffectType.DEBUFF },
  { stat: "vulnerability", regex: /받는\s*피해(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g, effectType: EffectType.DEBUFF },
  { stat: "damageReduction", regex: /받는\s*피해(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*감소/g },
  { stat: "allDamage", regex: /가하는\s*피해(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g },
  { stat: "atkRatio", regex: /공격력(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g },
  { stat: "atkRatio", regex: /공격력(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*감소/g, effectType: EffectType.DEBUFF },
  { stat: "defenseDown", regex: /방어력(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*감소/g, effectType: EffectType.DEBUFF },
  { stat: "critRate", regex: /치명타\s*확률(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g },
  { stat: "critDamage", regex: /치명타\s*피해(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g },
  { stat: "hpRatio", regex: /HP\s*최대치(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)%\s*증가/g },
  { stat: "speed", regex: /속도(?:가|이|를|을)?\s*(\d+(?:\.\d+)?)\s*pt\s*증가/g, valueType: "flat" },
]);

function extractSupplementalModifiers(sourceText) {
  const text = compactText(sourceText);
  const modifiers = [];
  for (const pattern of supplementalModifierPatterns) {
    for (const match of text.matchAll(pattern.regex)) {
      const matchedText = sentenceForMatch(text, match.index ?? 0);
      modifiers.push({
        stat: pattern.stat,
        rawValue: pattern.valueType === "flat" ? Number(match[1]) : percentToValue(match[1]),
        matchedText,
        targetScope: scopeForMatchedText(text, matchedText),
        explicitEffectType: pattern.effectType,
      });
    }
  }
  return modifiers;
}

function inferStat(text) {
  if (/방어력\s*감소|방어력/i.test(text)) return "defenseDown";
  if (/받는\s*피해\s*증가|취약/i.test(text)) return "vulnerability";
  if (/받는\s*피해\s*감소|피해\s*감소/i.test(text)) return "damageReduction";
  if (/치명타\s*피해/i.test(text)) return "critDamage";
  if (/치명타\s*확률/i.test(text)) return "critRate";
  if (/공격력/i.test(text)) return "atkRatio";
  if (/속도/i.test(text)) return "speed";
  if (/격파\s*특수효과|격파\s*피해/i.test(text)) return "breakDamage";
  if (/피해\s*증가|가하는\s*피해|속성\s*피해/i.test(text)) return "allDamage";
  if (/HP|체력/i.test(text)) return "hpRatio";
  return "unclassified_source_effect";
}

function makeSupplementalEffectRows({ entry, character, skill, skillIndex }) {
  if (!supplementalEffectEntryPageIds.has(String(character.entryPageId))) return [];
  const sourceText = skill.description ?? null;
  if (!sourceText) return [];
  return extractSupplementalModifiers(sourceText).map((modifier, modifierIndex) => {
    const sourceRecord = `HoyoWiki:${character.entryPageId}:${skill.pointKey ?? skillIndex}:${skill.title ?? "skill"}:supplemental-effect:${modifierIndex}`;
    const sourceRow = {
      id: `source:hoyowiki-effect:${character.entryPageId}:${skill.pointKey ?? skillIndex}:${modifierIndex}`,
      kind: "source_row",
      version: 1,
      createdBy: "hoyowiki-adapter",
      sourceOrigin: SourceOrigin.RAW_SOURCE,
      sourceKind: SourceKind.HOYOWIKI,
      sourcePath: entry.snapshotPath,
      sourceRecord,
      characterId: character.entryPageId,
      sourceText: modifier.matchedText,
      calculationStatus: CalculationStatus.CALCULATION_READY,
    };
    const targetPolicy = targetPolicyFromScope(modifier.targetScope);
    const effectRow = {
      id: `effect:hoyowiki-effect:${character.entryPageId}:${skill.pointKey ?? skillIndex}:${modifierIndex}`,
      sourceId: sourceRow.id,
      sourceOrigin: sourceRow.sourceOrigin,
      sourcePath: sourceRow.sourcePath,
      sourceText: sourceRow.sourceText,
      sourceType: sourceRow.sourceKind,
      effectType: effectTypeForSupplement({ stat: modifier.stat, targetScope: modifier.targetScope, explicitEffectType: modifier.explicitEffectType }),
      stat: modifier.stat,
      rawValue: modifier.rawValue,
      valueMode: ValueMode.FIXED,
      dynamicFormulaType: null,
      effectProviderId: character.entryPageId,
      characterName: character.nameKo ?? character.name ?? character.entryPageId,
      minEidolon: null,
      sourceTrace: sourceRecord,
      targetScope: modifier.targetScope,
      effectTargetPolicy: targetPolicy,
      calculationSubjectPolicy: targetPolicy,
      reviewStatus: ReviewStatus.SOURCE_CONFIRMED,
      calculationStatus: CalculationStatus.CALCULATION_READY,
    };
    return { sourceRow, effectRow };
  });
}

export const hoyowikiAdapter = Object.freeze({
  adapterId: "hoyowiki",
  sourceKind: SourceKind.HOYOWIKI,
  load(context = {}) {
    const root = context.root ?? process.cwd();
    const manifest = readJson(root, manifestPath);
    const skillEntry = findManifestEntry(manifest, "legacy:hoyowiki-character-skills");
    if (!skillEntry) throw new Error("legacy:hoyowiki-character-skills manifest entry missing");
    return { manifest, skillEntry, skillPayload: readJson(root, skillEntry.snapshotPath) };
  },
  normalize(input, context = {}) {
    const loaded = input ?? this.load(context);
    const characterLimit = Number.isFinite(context.characterLimit) ? context.characterLimit : null;
    const allCharacters = (loaded.skillPayload.characters ?? []).filter((character) => (character.skills ?? []).length > 0);
    const characters = characterLimit == null ? allCharacters : allCharacters.slice(0, characterLimit);
    const sourceRows = [];
    const effectRows = [];
    const coefficientRows = [];
    const blockedRows = [];

    for (const character of characters) {
      for (const [skillIndex, skill] of (character.skills ?? []).entries()) {
        const sourceRow = makeSourceRow({ entry: loaded.skillEntry, character, skill, skillIndex });
        if (sourceRow.calculationStatus === CalculationStatus.BLOCKED) {
          blockedRows.push(sourceRow);
          continue;
        }
        sourceRows.push(sourceRow);
        coefficientRows.push(...makeCoefficientRows({ sourceRow, character, skill, skillIndex }));
        for (const supplemental of makeSupplementalEffectRows({ entry: loaded.skillEntry, character, skill, skillIndex })) {
          sourceRows.push(supplemental.sourceRow);
          effectRows.push(supplemental.effectRow);
        }
      }
    }

    return {
      sourceRows,
      effectRows,
      coefficientRows,
      blockedRows,
      metadata: {
        datasetMode: characterLimit == null ? "full" : "sample",
        sampledCharacters: characters.map((character) => character.nameKo),
        skillCharactersAvailable: allCharacters.length,
      },
    };
  },
  report(result) {
    const output = result?.output ?? result ?? { sourceRows: [], effectRows: [], coefficientRows: [], blockedRows: [] };
    return {
      adapterId: "hoyowiki",
      sourceKind: SourceKind.HOYOWIKI,
      status: "ok",
      counts: {
        sourceRows: output.sourceRows?.length ?? 0,
        effectRows: output.effectRows?.length ?? 0,
        coefficientRows: output.coefficientRows?.length ?? 0,
        blockedRows: output.blockedRows?.length ?? 0,
        warnings: 0,
        errors: 0,
      },
      warnings: [],
      errors: [],
    };
  },
});

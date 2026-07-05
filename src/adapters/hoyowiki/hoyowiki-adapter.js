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
  if (!supplementalEffectEntryPageIds.has(String(character.entryPageId))) return null;
  const sourceText = skill.description ?? null;
  if (!sourceText) return null;
  const sourceRecord = `HoyoWiki:${character.entryPageId}:${skill.pointKey ?? skillIndex}:${skill.title ?? "skill"}:supplemental-effect`;
  const sourceRow = {
    id: `source:hoyowiki-effect:${character.entryPageId}:${skill.pointKey ?? skillIndex}`,
    kind: "source_row",
    version: 1,
    createdBy: "hoyowiki-adapter",
    sourceOrigin: SourceOrigin.RAW_SOURCE,
    sourceKind: SourceKind.HOYOWIKI,
    sourcePath: entry.snapshotPath,
    sourceRecord,
    characterId: character.entryPageId,
    sourceText,
    calculationStatus: CalculationStatus.BLOCKED,
    blockedReason: BlockedReason.VALUE_MODE_UNKNOWN,
  };
  const targetScope = inferTargetScope(sourceText);
  const targetPolicy = targetPolicyFromScope(targetScope);
  const effectRow = {
    id: `effect:hoyowiki-effect:${character.entryPageId}:${skill.pointKey ?? skillIndex}`,
    sourceId: sourceRow.id,
    sourceOrigin: sourceRow.sourceOrigin,
    sourcePath: sourceRow.sourcePath,
    sourceText,
    sourceType: sourceRow.sourceKind,
    effectType: inferEffectType(sourceText, targetScope),
    stat: inferStat(sourceText),
    rawValue: null,
    valueMode: ValueMode.UNKNOWN,
    dynamicFormulaType: null,
    effectProviderId: character.entryPageId,
    characterName: character.nameKo ?? character.name ?? character.entryPageId,
    minEidolon: null,
    sourceTrace: sourceRecord,
    targetScope,
    effectTargetPolicy: targetPolicy,
    calculationSubjectPolicy: targetPolicy,
    reviewStatus: ReviewStatus.SOURCE_CONFIRMED,
    calculationStatus: CalculationStatus.BLOCKED,
    blockedReason: BlockedReason.VALUE_MODE_UNKNOWN,
  };
  return { sourceRow, effectRow };
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
        const supplemental = makeSupplementalEffectRows({ entry: loaded.skillEntry, character, skill, skillIndex });
        if (supplemental) {
          sourceRows.push(supplemental.sourceRow);
          effectRows.push(supplemental.effectRow);
          blockedRows.push(supplemental.sourceRow, supplemental.effectRow);
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

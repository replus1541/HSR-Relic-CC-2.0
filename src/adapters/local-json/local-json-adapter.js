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

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function findManifestEntry(manifest, id) {
  return manifest.entries.find((entry) => entry.id === id) ?? null;
}

function normalizeValueMode(valueMode) {
  const allowed = new Set(Object.values(ValueMode));
  return allowed.has(valueMode) ? valueMode : ValueMode.UNKNOWN;
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

function makeEffectRow({ sourceRow, character, effect, index }) {
  const valueMode = normalizeValueMode(effect.valueMode);
  return {
    id: `effect:${character.avatar ?? character.name}:${index}`,
    sourceId: sourceRow.id,
    sourceOrigin: sourceRow.sourceOrigin,
    sourcePath: sourceRow.sourcePath,
    sourceText: sourceRow.sourceText,
    sourceType: sourceRow.sourceKind,
    effectType: inferEffectType(effect),
    stat: effect.stat,
    rawValue: effect.value ?? null,
    valueMode,
    dynamicFormulaType: dynamicFormulaType(effect),
    effectProviderId: character.avatar ?? character.name,
    characterName: character.name ?? character.avatar,
    minEidolon: effect.minEidolon ?? null,
    sourceTrace: effect.sourceRecord ?? effect.sourcePath ?? effect.sourceId ?? sourceRow.sourceRecord,
    targetScope: effect.targetScope ?? effect.target ?? TargetScope.UNKNOWN,
    effectTargetPolicy: effect.targetScope ?? effect.target ?? "unknown",
    calculationSubjectPolicy: effect.targetScope ?? effect.target ?? "unknown",
    reviewStatus: ReviewStatus.SOURCE_CONFIRMED,
    calculationStatus: CalculationStatus.CALCULATION_READY,
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
        effectRows.push(makeEffectRow({ sourceRow, character, effect, index }));
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

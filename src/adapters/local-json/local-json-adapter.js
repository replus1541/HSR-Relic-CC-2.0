import fs from "node:fs";
import path from "node:path";
import {
  CalculationStatus,
  EffectType,
  SourceKind,
  SourceOrigin,
  ValueMode,
} from "../../data-model/schemas/index.js";

const defaultCharacterLimit = 3;
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
    sourceText: effect.sourceText ?? effect.text ?? effect.description ?? null,
    calculationStatus: CalculationStatus.CALCULATION_READY,
  };
}

function makeEffectRow({ sourceRow, character, effect, index }) {
  return {
    id: `effect:${character.avatar ?? character.name}:${index}`,
    sourceId: sourceRow.id,
    sourceOrigin: sourceRow.sourceOrigin,
    effectType: inferEffectType(effect),
    stat: effect.stat,
    rawValue: effect.value ?? null,
    valueMode: normalizeValueMode(effect.valueMode),
    effectProviderId: character.avatar ?? character.name,
    effectTargetPolicy: effect.targetScope ?? effect.target ?? "unknown",
    calculationSubjectPolicy: effect.targetScope ?? effect.target ?? "unknown",
    calculationStatus: CalculationStatus.CALCULATION_READY,
  };
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
    const characterLimit = context.characterLimit ?? defaultCharacterLimit;
    const characters = (loaded.effectPayload.characters ?? [])
      .filter((character) => (character.activeEffects ?? []).length > 0)
      .slice(0, characterLimit);
    const sourceRows = [];
    const effectRows = [];
    const blockedRows = [];

    for (const character of characters) {
      for (const [index, effect] of (character.activeEffects ?? []).slice(0, 3).entries()) {
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

    return {
      sourceRows,
      effectRows,
      coefficientRows: [],
      blockedRows,
      metadata: {
        sampledCharacters: characters.map((character) => character.avatar ?? character.name),
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

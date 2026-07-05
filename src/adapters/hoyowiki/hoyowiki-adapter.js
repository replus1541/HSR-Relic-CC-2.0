import fs from "node:fs";
import path from "node:path";
import {
  AttackType,
  CalculationStatus,
  SourceKind,
  SourceOrigin,
  TargetProfile,
} from "../../data-model/schemas/index.js";

const manifestPath = "data/legacy-reference/manifest.json";

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
      }
    }

    return {
      sourceRows,
      effectRows: [],
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

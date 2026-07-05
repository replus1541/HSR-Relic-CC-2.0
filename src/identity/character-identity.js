import fs from "node:fs";
import path from "node:path";

const legacyRoot = "C:\\CODEX\\HSR RELIC CC";

export function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeIdentityKey(value) {
  return normalizeName(value)
    .replace(/\s+/g, "")
    .replace(/[.·•ㆍ・&]/g, "")
    .toLowerCase();
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

export function parseLegacyAliasMap(root = legacyRoot) {
  const source = readText(root, "src/sample-data.js");
  const match = source.match(/const localCharacterNameAliases = \{([\s\S]*?)\n\};/);
  if (!match) return {};
  const aliases = {};
  const linePattern = /"([^"]+)":\s*"([^"]+)"/g;
  let lineMatch;
  while ((lineMatch = linePattern.exec(match[1]))) {
    aliases[normalizeName(lineMatch[1])] = normalizeName(lineMatch[2]);
  }
  return aliases;
}

function findManifestEntry(manifest, id) {
  return manifest.entries.find((entry) => entry.id === id) ?? null;
}

function countCoefficientSlots(character) {
  return (character?.slots ?? []).reduce((sum, slot) => {
    const confirmed = slot?.confirmedCoefficient;
    if (Array.isArray(confirmed?.rows)) return sum + confirmed.rows.length;
    if (Array.isArray(confirmed?.values)) return sum + 1;
    return sum;
  }, 0);
}

function makeEmptyIdentity(officialName) {
  return {
    characterId: null,
    internalId: null,
    internalName: null,
    officialName,
    localizedName: officialName,
    displayName: officialName,
    aliasNames: [],
    element: null,
    path: null,
    iconPath: null,
    sourceOrigin: null,
    sourcePath: null,
    sourceText: officialName,
    localizationSourcePath: null,
    nameReviewStatus: "unreviewed",
    isDisplayNameSourceBacked: false,
    isCharacterIdentitySourceBacked: false,
    identifiers: {
      effectAvatar: null,
      effectName: null,
      hoyowikiEntryPageId: null,
      coefficientAvatar: null,
      coefficientAvatarId: null,
    },
    sourceAvailability: {
      skillText: false,
      effectTrace: false,
      coefficient: false,
      eidolon: false,
      lightcone: "global_snapshot",
      relic: "missing_snapshot",
    },
    sourceCounts: {
      skillRows: 0,
      effectCandidates: 0,
      coefficientSlots: 0,
      eidolons: 0,
    },
    sourceNames: [],
    nameSources: [],
  };
}

function addUnique(list, value) {
  const normalized = normalizeName(value);
  if (!normalized) return;
  if (!list.includes(normalized)) list.push(normalized);
}

function addNameSource(identity, source) {
  const sourceName = normalizeName(source.sourceName);
  if (!sourceName) return;
  addUnique(identity.sourceNames, sourceName);
  if (sourceName !== identity.displayName) addUnique(identity.aliasNames, sourceName);
  identity.nameSources.push({
    sourceName,
    sourceOrigin: source.sourceOrigin,
    sourcePath: source.sourcePath,
    sourceText: source.sourceText ?? sourceName,
    internalId: source.internalId ?? null,
    internalName: source.internalName ?? null,
  });
}

function choosePrimarySource(identity) {
  const priority = ["hoyowiki", "design_data_extracted_catalog", "game_db_generated", "legacy_alias_map"];
  return [...identity.nameSources].sort((left, right) => {
    const leftRank = priority.indexOf(left.sourceOrigin);
    const rightRank = priority.indexOf(right.sourceOrigin);
    return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank);
  })[0] ?? null;
}

function stableCharacterId(identity) {
  return identity.internalName
    ?? identity.identifiers.effectAvatar
    ?? identity.identifiers.coefficientAvatar
    ?? (identity.identifiers.hoyowikiEntryPageId ? `hoyowiki:${identity.identifiers.hoyowikiEntryPageId}` : null)
    ?? normalizeIdentityKey(identity.displayName);
}

function finalizeIdentity(identity) {
  const primarySource = choosePrimarySource(identity);
  identity.sourceOrigin = primarySource?.sourceOrigin ?? null;
  identity.sourcePath = primarySource?.sourcePath ?? null;
  identity.localizationSourcePath = identity.localizationSourcePath ?? primarySource?.sourcePath ?? null;
  identity.internalName = identity.internalName ?? identity.identifiers.effectAvatar ?? identity.identifiers.coefficientAvatar;
  identity.characterId = stableCharacterId(identity);
  identity.isDisplayNameSourceBacked = identity.nameSources.some((source) => (
    normalizeName(source.sourceName) === identity.displayName
    && Boolean(source.sourcePath)
    && source.sourceOrigin !== "manual_hint"
    && source.sourceOrigin !== "manual_guide"
  ));
  identity.isCharacterIdentitySourceBacked = Boolean(
    identity.internalName
    || identity.internalId
    || identity.identifiers.hoyowikiEntryPageId
    || identity.nameSources.some((source) => source.internalId || source.internalName),
  );
  identity.nameReviewStatus = identity.isDisplayNameSourceBacked && identity.isCharacterIdentitySourceBacked
    ? "source_backed"
    : "needs_review";
  identity.aliasNames = [...new Set(identity.aliasNames.filter((alias) => alias !== identity.displayName))].sort((left, right) => left.localeCompare(right));
  identity.sourceNames = [...new Set(identity.sourceNames)].sort((left, right) => left.localeCompare(right));
  return identity;
}

function upsertIdentity(map, officialName) {
  const key = normalizeIdentityKey(officialName);
  const current = map.get(key) ?? makeEmptyIdentity(officialName);
  map.set(key, current);
  return current;
}

function getOfficialName(sourceName, aliasToOfficial) {
  const normalized = normalizeName(sourceName);
  return aliasToOfficial[normalized] ?? normalized;
}

export function buildCharacterIdentityDataset(options = {}) {
  const root = options.root ?? process.cwd();
  const legacyProjectRoot = options.legacyRoot ?? legacyRoot;
  const aliasesByOfficial = parseLegacyAliasMap(legacyProjectRoot);
  const aliasToOfficial = Object.fromEntries(Object.entries(aliasesByOfficial).map(([officialName, aliasName]) => [aliasName, officialName]));
  const manifest = readJson(root, "data/legacy-reference/manifest.json");
  const effectEntry = findManifestEntry(manifest, "legacy:character-effect-candidates");
  const skillEntry = findManifestEntry(manifest, "legacy:hoyowiki-character-skills");
  const coefficientEntry = findManifestEntry(manifest, "legacy:attack-coefficient-candidates");
  const lightconeEntry = findManifestEntry(manifest, "legacy:lightcone-effect-candidates");
  const effectPayload = effectEntry ? readJson(root, effectEntry.snapshotPath) : { characters: [] };
  const skillPayload = skillEntry ? readJson(root, skillEntry.snapshotPath) : { characters: [] };
  const coefficientPayload = coefficientEntry ? readJson(root, coefficientEntry.snapshotPath) : { characters: [] };
  const lightconePayload = lightconeEntry ? readJson(root, lightconeEntry.snapshotPath) : { summary: {} };
  const identityByName = new Map();

  for (const character of skillPayload.characters ?? []) {
    const sourceName = normalizeName(character.nameKo ?? character.entryPageId);
    const officialName = getOfficialName(sourceName, aliasToOfficial);
    const identity = upsertIdentity(identityByName, officialName);
    identity.identifiers.hoyowikiEntryPageId = character.entryPageId ?? identity.identifiers.hoyowikiEntryPageId;
    identity.path = identity.path ?? character.path ?? null;
    identity.element = identity.element ?? character.element ?? null;
    identity.iconPath = identity.iconPath ?? character.iconUrl ?? null;
    identity.sourceCounts.skillRows = Math.max(identity.sourceCounts.skillRows, character.skills?.length ?? 0);
    identity.sourceCounts.eidolons = Math.max(identity.sourceCounts.eidolons, character.eidolons?.length ?? 0);
    identity.sourceAvailability.skillText = identity.sourceCounts.skillRows > 0;
    identity.sourceAvailability.eidolon = identity.sourceCounts.eidolons > 0;
    addNameSource(identity, {
      sourceName,
      sourceOrigin: "hoyowiki",
      sourcePath: skillEntry?.snapshotPath,
      internalId: character.entryPageId ?? null,
    });
  }

  for (const character of effectPayload.characters ?? []) {
    const sourceName = normalizeName(character.name ?? character.avatar);
    const officialName = getOfficialName(sourceName, aliasToOfficial);
    const identity = upsertIdentity(identityByName, officialName);
    identity.identifiers.effectAvatar = character.avatar ?? identity.identifiers.effectAvatar;
    identity.identifiers.effectName = sourceName;
    identity.internalName = identity.internalName ?? character.avatar ?? null;
    identity.path = identity.path ?? character.path ?? null;
    identity.element = identity.element ?? character.element ?? null;
    identity.sourceCounts.effectCandidates = Math.max(identity.sourceCounts.effectCandidates, character.activeEffects?.length ?? 0);
    identity.sourceAvailability.effectTrace = identity.sourceCounts.effectCandidates > 0;
    addNameSource(identity, {
      sourceName,
      sourceOrigin: "game_db_generated",
      sourcePath: effectEntry?.snapshotPath,
      internalName: character.avatar ?? null,
    });
  }

  for (const character of coefficientPayload.characters ?? []) {
    const sourceName = normalizeName(character.localName ?? character.nameKo ?? character.avatar);
    const officialName = getOfficialName(sourceName, aliasToOfficial);
    const identity = upsertIdentity(identityByName, officialName);
    identity.identifiers.coefficientAvatar = character.avatar ?? identity.identifiers.coefficientAvatar;
    identity.identifiers.coefficientAvatarId = character.avatarId ?? identity.identifiers.coefficientAvatarId;
    identity.internalId = identity.internalId ?? character.avatarId ?? null;
    identity.internalName = identity.internalName ?? character.avatar ?? null;
    identity.path = identity.path ?? character.path ?? null;
    identity.element = identity.element ?? character.element ?? null;
    identity.sourceCounts.coefficientSlots = Math.max(identity.sourceCounts.coefficientSlots, countCoefficientSlots(character));
    identity.sourceAvailability.coefficient = identity.sourceCounts.coefficientSlots > 0;
    addNameSource(identity, {
      sourceName,
      sourceOrigin: "game_db_generated",
      sourcePath: coefficientEntry?.snapshotPath,
      internalId: character.avatarId ?? null,
      internalName: character.avatar ?? null,
    });
  }

  for (const [officialName, aliasName] of Object.entries(aliasesByOfficial)) {
    const identity = identityByName.get(normalizeIdentityKey(officialName));
    if (!identity) continue;
    addUnique(identity.aliasNames, aliasName);
    addNameSource(identity, {
      sourceName: aliasName,
      sourceOrigin: "legacy_alias_map",
      sourcePath: "C:\\CODEX\\HSR RELIC CC\\src\\sample-data.js",
    });
  }

  const rows = [...identityByName.values()]
    .map(finalizeIdentity)
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  return {
    version: 1,
    generatedBy: "src/identity/character-identity.js",
    rows,
    summary: {
      characters: rows.length,
      sourceBackedDisplayNames: rows.filter((row) => row.isDisplayNameSourceBacked).length,
      sourceBackedIdentities: rows.filter((row) => row.isCharacterIdentitySourceBacked).length,
      aliases: rows.reduce((sum, row) => sum + row.aliasNames.length, 0),
      lightconeEffects: lightconePayload.summary?.effectRows ?? 0,
    },
  };
}

export function validateCharacterIdentityDataset(dataset) {
  const errors = [];
  const ids = new Set();
  for (const row of dataset?.rows ?? []) {
    if (!row.characterId) errors.push(`${row.displayName}: missing characterId`);
    if (ids.has(row.characterId)) errors.push(`${row.characterId}: duplicate characterId`);
    ids.add(row.characterId);
    if (!row.displayName || row.displayName !== row.officialName) errors.push(`${row.characterId}: displayName must match officialName`);
    if (!row.isDisplayNameSourceBacked) errors.push(`${row.characterId}: displayName must be source backed`);
    if (!row.isCharacterIdentitySourceBacked) errors.push(`${row.characterId}: character identity must be source backed`);
    if (row.aliasNames?.includes(row.displayName)) errors.push(`${row.characterId}: aliasNames must not include displayName`);
    const aliasSource = row.nameSources?.find((source) => source.sourceName !== row.displayName && source.sourceOrigin === "legacy_alias_map");
    if (aliasSource && row.aliasNames.length === 0) errors.push(`${row.characterId}: legacy alias source must be stored in aliasNames`);
  }
  return { ok: errors.length === 0, errors };
}

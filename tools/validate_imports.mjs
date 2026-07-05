import { LoadoutStateRequiredFields } from "../src/data-model/schemas/loadout-state.js";
import { freesrToLoadoutState } from "../src/adapters/freesr/freesr-import-adapter.js";
import { srtoolsToLoadoutState } from "../src/adapters/srtools/srtools-import-adapter.js";
import battleEffectMetadata from "../data/generated/battle-effect-metadata.json" with { type: "json" };
import characterStatBaseline from "../data/generated/character-stat-baseline.json" with { type: "json" };
import characterIdentity from "../data/generated/character-identity.json" with { type: "json" };
import customRelicTypeProfiles from "../data/curated/custom-relic-type-profiles.json" with { type: "json" };
import defaultCharacterBuilds from "../data/generated/default-character-builds.json" with { type: "json" };
import equipmentStatModel from "../data/generated/equipment-stat-model.json" with { type: "json" };
import skillDamageMetadata from "../data/generated/skill-damage-metadata.json" with { type: "json" };

const customTypeOptionalMissingIds = new Set(["hoyowiki:6565", "hoyowiki:6566"]);

function validateLoadoutState(state) {
  const errors = [];
  for (const field of LoadoutStateRequiredFields) {
    if (!(field in state)) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(state.roster)) errors.push("roster must be array");
  if (!Array.isArray(state.partySlots) || state.partySlots.length !== 4) errors.push("partySlots must contain 4 slots");
  if (!state.equipment?.lightcones || !state.equipment?.relics) errors.push("equipment maps are required");
  if (!state.hints?.eidolon || !state.hints?.skillLevels || !state.hints?.superimposition) errors.push("hint maps are required");
  return { ok: errors.length === 0, errors };
}

function assertValid(name, state) {
  const result = validateLoadoutState(state);
  if (!result.ok) throw new Error(`${name} import failed validation: ${result.errors.join("; ")}`);
}

function validateDefaultCharacterBuilds(payload) {
  const errors = [];
  const rows = Object.values(payload.builds ?? {});
  if (payload.summary?.characters !== 92) errors.push(`expected 92 default build characters, got ${payload.summary?.characters}`);
  if (rows.length !== 92) errors.push(`expected 92 default build rows, got ${rows.length}`);
  for (const row of rows) {
    if (!row.characterId) errors.push(`${row.displayName}: missing characterId`);
    if (!row.selectedLightCone?.id) errors.push(`${row.displayName}: missing selected light cone`);
    if (!row.selectedLightCone?.id?.startsWith("wiki-")) errors.push(`${row.displayName}: selected light cone must keep HoYoWiki id`);
    if (!row.selectedRelics?.set4?.id) errors.push(`${row.displayName}: missing selected 4pc relic`);
    if (!row.selectedRelics?.set2?.id) errors.push(`${row.displayName}: missing selected 2pc relic`);
    const setIds = [row.selectedRelics?.set4?.id, row.selectedRelics?.set4Alt?.id, row.selectedRelics?.set2?.id].filter(Boolean);
    for (const id of setIds) {
      if (!id.startsWith("wiki-relic-") && !id.startsWith("manual-")) {
        errors.push(`${row.displayName}: relic id must keep HoYoWiki/manual id: ${id}`);
      }
    }
    if (!row.mainStats?.body || !row.mainStats?.feet || !row.mainStats?.sphere || !row.mainStats?.rope) {
      errors.push(`${row.displayName}: missing variable main stats`);
    }
    if (!Array.isArray(row.subStatPriority) || !row.subStatPriority.length) {
      errors.push(`${row.displayName}: missing substat priority`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function validateCustomRelicTypeProfiles(payload, identityPayload) {
  const errors = [];
  const rows = payload.rows ?? [];
  const byId = new Map(rows.map((row) => [row.characterId, row]));
  if (!payload.policy?.roleTypeProfilesAreUserCurated) errors.push("custom type profiles must be marked user-curated");
  if (payload.policy?.sourceBackedCombatEffect !== false) errors.push("custom type profiles must not be source-backed combat effects");
  if (payload.policy?.defaultBuildsRemainSeparate !== true) errors.push("custom type profiles must remain separate from default builds");
  if (rows.length !== 90) errors.push(`expected 90 custom type profile rows, got ${rows.length}`);
  for (const row of rows) {
    if (!row.characterId) errors.push(`${row.displayName}: missing characterId`);
    if (row.sourceBackedCombatEffect !== false) errors.push(`${row.displayName}: sourceBackedCombatEffect must be false`);
    if (row.calculationUse !== "ui_and_default_profile_metadata_only") errors.push(`${row.displayName}: invalid calculationUse`);
    if (!row.uiTypeProfile?.displayTypeLabel) errors.push(`${row.displayName}: missing display type label`);
    if (!row.uiTypeProfile?.damageTemplate) errors.push(`${row.displayName}: missing damageTemplate`);
    if (!row.uiTypeProfile?.statProfile) errors.push(`${row.displayName}: missing statProfile`);
    if (!row.uiTypeProfile?.primaryStat) errors.push(`${row.displayName}: missing primaryStat`);
    if (!row.relicTypeProfile?.relicProfile) errors.push(`${row.displayName}: missing relicProfile`);
    if (!row.relicTypeProfile?.presetId) errors.push(`${row.displayName}: missing presetId`);
  }
  for (const character of identityPayload.rows ?? []) {
    if (customTypeOptionalMissingIds.has(character.characterId)) continue;
    if (!byId.has(character.characterId)) {
      errors.push(`${character.displayName}: missing custom relic type profile`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function validateSelfStatSources(characterPayload, equipmentPayload, identityPayload) {
  const errors = [];
  const rows = characterPayload.rows ?? [];
  const byId = new Map(rows.map((row) => [row.characterId, row]));
  if (characterPayload.summary?.characters !== 90) errors.push(`expected 90 character stat rows, got ${characterPayload.summary?.characters}`);
  if (characterPayload.summary?.unmatchedIdentity !== 0) errors.push(`expected 0 unmatched character stat rows, got ${characterPayload.summary?.unmatchedIdentity}`);
  for (const row of rows) {
    for (const stat of ["hp", "atk", "def", "speed", "critRate", "critDamage"]) {
      if (!Number.isFinite(Number(row.baseStats?.[stat]))) errors.push(`${row.displayName}: missing base stat ${stat}`);
    }
    if (!Array.isArray(row.traceEntries)) errors.push(`${row.displayName}: traceEntries must be array`);
  }
  for (const character of identityPayload.rows ?? []) {
    if (customTypeOptionalMissingIds.has(character.characterId)) continue;
    if (!byId.has(character.characterId)) errors.push(`${character.displayName}: missing self-stat baseline`);
  }
  if (!equipmentPayload.relicMainStatOptions?.critRate?.value) errors.push("equipment model missing relic main stat options");
  if (!equipmentPayload.relicSubStatRollValues?.critRate) errors.push("equipment model missing relic sub stat roll values");
  if (!Array.isArray(equipmentPayload.relicSets) || equipmentPayload.relicSets.length < 50) errors.push(`expected at least 50 relic stat model rows, got ${equipmentPayload.relicSets?.length ?? 0}`);
  for (const requiredSet of ["wiki-relic-2655", "wiki-relic-2650"]) {
    if (!equipmentPayload.relicSets.some((row) => row.id === requiredSet)) errors.push(`equipment model missing ${requiredSet}`);
  }
  return { ok: errors.length === 0, errors };
}

function validateBattleEffectMetadata(payload) {
  const errors = [];
  const rows = payload.rows ?? [];
  if (rows.length !== 283) errors.push(`expected 283 battle effect metadata rows, got ${rows.length}`);
  for (const row of rows) {
    if (!row.effectRowId) errors.push("battle effect metadata row missing effectRowId");
    if (!row.ownerId) errors.push(`${row.effectRowId}: missing ownerId`);
    if (!row.sourceLabel) errors.push(`${row.effectRowId}: missing sourceLabel`);
  }
  return { ok: errors.length === 0, errors };
}

function validateSkillDamageMetadata(payload, identityPayload) {
  const errors = [];
  const rows = payload.rows ?? [];
  const availableCharacterIds = new Set(identityPayload.rows
    .filter((character) => !customTypeOptionalMissingIds.has(character.characterId))
    .filter((character) => character.sourceAvailability?.coefficient)
    .map((character) => character.characterId));
  const byCharacter = new Map();
  for (const row of rows) {
    if (!row.id) errors.push("skill damage metadata row missing id");
    if (!row.characterId) errors.push(`${row.id}: missing characterId`);
    if (!row.skillId) errors.push(`${row.id}: missing skillId`);
    if (!row.title) errors.push(`${row.id}: missing title`);
    if (!row.skillLevelType) errors.push(`${row.id}: missing skillLevelType`);
    if (!["atk", "hp", "def", "breakEffect"].includes(row.scalingStat)) errors.push(`${row.id}: invalid scalingStat ${row.scalingStat}`);
    if (!Array.isArray(row.parts) || !row.parts.length) errors.push(`${row.id}: missing coefficient parts`);
    for (const part of row.parts ?? []) {
      if (!Array.isArray(part.coefficientValues) || !part.coefficientValues.length) errors.push(`${row.id}: empty coefficient values`);
    }
    if (row.characterId) byCharacter.set(row.characterId, (byCharacter.get(row.characterId) ?? 0) + 1);
  }
  for (const characterId of availableCharacterIds) {
    if (!byCharacter.has(characterId)) errors.push(`${characterId}: missing skill damage rows`);
  }
  if (rows.length < 250) errors.push(`expected at least 250 skill damage rows, got ${rows.length}`);
  if (payload.summary?.coefficientParts < rows.length) errors.push("coefficient part count must be >= row count");
  return { ok: errors.length === 0, errors };
}

const srtools = srtoolsToLoadoutState();
const freesr = freesrToLoadoutState();
assertValid("srtools", srtools);
assertValid("freesr", freesr);

const defaultBuilds = validateDefaultCharacterBuilds(defaultCharacterBuilds);
if (!defaultBuilds.ok) throw new Error(`default character builds failed validation: ${defaultBuilds.errors.join("; ")}`);
const customTypeProfiles = validateCustomRelicTypeProfiles(customRelicTypeProfiles, characterIdentity);
if (!customTypeProfiles.ok) throw new Error(`custom relic type profiles failed validation: ${customTypeProfiles.errors.join("; ")}`);
const selfStatSources = validateSelfStatSources(characterStatBaseline, equipmentStatModel, characterIdentity);
if (!selfStatSources.ok) throw new Error(`self stat sources failed validation: ${selfStatSources.errors.join("; ")}`);
const battleMetadata = validateBattleEffectMetadata(battleEffectMetadata);
if (!battleMetadata.ok) throw new Error(`battle effect metadata failed validation: ${battleMetadata.errors.join("; ")}`);
const skillDamage = validateSkillDamageMetadata(skillDamageMetadata, characterIdentity);
if (!skillDamage.ok) throw new Error(`skill damage metadata failed validation: ${skillDamage.errors.join("; ")}`);

console.log(`import validation ok: srtoolsRoster=${srtools.roster.length}, freesrRoster=${freesr.roster.length}, defaultBuilds=${defaultCharacterBuilds.summary.characters}, customTypeProfiles=${customRelicTypeProfiles.summary.characters}, selfStatRows=${characterStatBaseline.summary.characters}, battleEffectMetadata=${battleEffectMetadata.summary.rows}, skillDamageRows=${skillDamageMetadata.summary.rows}`);

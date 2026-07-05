import { createEmptyLoadoutState, LoadoutSourceKind } from "../../data-model/schemas/loadout-state.js";

export const srtoolsSampleInput = Object.freeze({
  format: "srtools-v2-sample",
  characters: [
    {
      id: "PlayerBoy_20",
      level: 80,
      eidolon: 6,
      skills: { basic: 6, skill: 10, ultimate: 10, talent: 10 },
      lightcone: { id: "sample-lightcone", superimposition: 1, level: 80 },
      relics: [
        { slot: "head", setId: "sample-set", mainStat: "hp" },
        { slot: "hands", setId: "sample-set", mainStat: "atk" },
      ],
    },
  ],
  party: ["PlayerBoy_20"],
});

function normalizeCharacter(rawCharacter) {
  return {
    characterId: String(rawCharacter.id),
    sourceCharacterId: rawCharacter.id,
    level: rawCharacter.level ?? null,
  };
}

export function srtoolsToLoadoutState(input = srtoolsSampleInput, options = {}) {
  const state = createEmptyLoadoutState({
    sourceKind: LoadoutSourceKind.SRTOOLS,
    importId: options.importId ?? "srtools-sample",
  });
  const characters = Array.isArray(input.characters) ? input.characters : [];

  state.roster = characters.map(normalizeCharacter);
  state.partySlots = [...(input.party ?? [])].slice(0, 4);
  while (state.partySlots.length < 4) state.partySlots.push(null);

  for (const character of characters) {
    const id = String(character.id);
    state.hints.eidolon[id] = character.eidolon ?? 0;
    state.hints.skillLevels[id] = character.skills ?? {};
    if (character.lightcone) {
      state.equipment.lightcones[id] = character.lightcone;
      state.hints.superimposition[id] = character.lightcone.superimposition ?? null;
    }
    if (Array.isArray(character.relics)) {
      state.equipment.relics[id] = character.relics;
    }
  }

  if (!characters.length) {
    state.warnings.push("srtools input has no characters");
  }

  return state;
}

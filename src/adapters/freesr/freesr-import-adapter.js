import { createEmptyLoadoutState, LoadoutSourceKind } from "../../data-model/schemas/loadout-state.js";

export const freesrSampleInput = Object.freeze({
  format: "freesr-v2-sample",
  avatars: [
    {
      avatar_id: "5005",
      level: 80,
      rank: 2,
      skills: { skill: 10, ultimate: 10, talent: 10 },
      equipment: { light_cone: { id: "free-lightcone", rank: 5 }, relics: [{ slot: "body", main_affix: "critRate" }] },
    },
  ],
  lineup: ["5005"],
});

function normalizeAvatar(avatar) {
  return {
    characterId: String(avatar.avatar_id),
    sourceCharacterId: avatar.avatar_id,
    level: avatar.level ?? null,
  };
}

export function freesrToLoadoutState(input = freesrSampleInput, options = {}) {
  const state = createEmptyLoadoutState({
    sourceKind: LoadoutSourceKind.FREESR,
    importId: options.importId ?? "freesr-sample",
  });
  const avatars = Array.isArray(input.avatars) ? input.avatars : [];

  state.roster = avatars.map(normalizeAvatar);
  state.partySlots = [...(input.lineup ?? [])].slice(0, 4);
  while (state.partySlots.length < 4) state.partySlots.push(null);

  for (const avatar of avatars) {
    const id = String(avatar.avatar_id);
    state.hints.eidolon[id] = avatar.rank ?? 0;
    state.hints.skillLevels[id] = avatar.skills ?? {};
    if (avatar.equipment?.light_cone) {
      state.equipment.lightcones[id] = avatar.equipment.light_cone;
      state.hints.superimposition[id] = avatar.equipment.light_cone.rank ?? null;
    }
    if (Array.isArray(avatar.equipment?.relics)) {
      state.equipment.relics[id] = avatar.equipment.relics;
    }
  }

  if (!avatars.length) {
    state.warnings.push("freesr input has no avatars");
  }

  return state;
}

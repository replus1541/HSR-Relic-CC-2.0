import { createEmptyLoadoutState, LoadoutSourceKind } from "../../data-model/schemas/loadout-state.js";

export const freesrSampleInput = Object.freeze({
  key: "freesr-v2-sample",
  avatars: {
    "5005": {
      avatar_id: 5005,
      data: {
        rank: 2,
        skills: { "5005001": 6, "5005002": 10, "5005003": 10, "5005004": 10 },
        skills_by_anchor_type: { "1": 6, "2": 10, "3": 10, "4": 10 },
      },
      level: 80,
      promotion: 6,
      sp_max: 120,
      sp_value: 0,
      techniques: [],
    },
  },
  relics: [
    {
      equip_avatar: 5005,
      internal_uid: 1,
      level: 15,
      sub_affixes: [{ sub_affix_id: 8, count: 3, step: 0 }],
      relic_id: 61313,
      main_affix_id: 4,
      relic_set_id: 131,
    },
  ],
  lightcones: [{ equip_avatar: 5005, internal_uid: 2, item_id: 23001, level: 80, promotion: 6, rank: 1 }],
  loadout: [{ avatar_id: 5005 }],
});

function normalizeAvatar(avatar) {
  return {
    characterId: String(avatar.avatar_id),
    sourceCharacterId: avatar.avatar_id,
    level: avatar.level ?? null,
    promotion: avatar.promotion ?? null,
    spMax: avatar.sp_max ?? null,
    spValue: avatar.sp_value ?? null,
  };
}

function getAvatarEntries(input) {
  if (Array.isArray(input.avatars)) return input.avatars;
  if (input.avatars && typeof input.avatars === "object") return Object.values(input.avatars);
  return [];
}

function getLoadoutAvatarIds(input, avatars) {
  const ordered = [];
  const push = (value) => {
    const avatarId = Number(typeof value === "object" && value ? value.avatar_id : value);
    if (!Number.isFinite(avatarId) || avatarId <= 0) return;
    const key = String(avatarId);
    if (!avatars.some((avatar) => String(avatar.avatar_id) === key)) return;
    if (!ordered.includes(key)) ordered.push(key);
  };
  for (const entry of input.loadout ?? []) push(entry);
  for (const entry of input.lineup ?? []) push(entry);
  for (const lightCone of input.lightcones ?? input.light_cones ?? []) push(lightCone?.equip_avatar);
  for (const relic of input.relics ?? []) push(relic?.equip_avatar);
  for (const avatar of avatars) push(avatar?.avatar_id);
  return ordered.slice(0, 4);
}

function groupByEquipAvatar(rows = []) {
  const grouped = {};
  for (const row of rows) {
    const avatarId = Number(row?.equip_avatar);
    if (!Number.isFinite(avatarId) || avatarId <= 0) continue;
    const key = String(avatarId);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }
  return grouped;
}

export function freesrToLoadoutState(input = freesrSampleInput, options = {}) {
  const state = createEmptyLoadoutState({
    sourceKind: LoadoutSourceKind.FREESR,
    importId: options.importId ?? input.key ?? "freesr-sample",
  });
  const avatars = getAvatarEntries(input);
  const relicsByAvatar = groupByEquipAvatar(input.relics ?? []);
  const lightConesByAvatar = groupByEquipAvatar(input.lightcones ?? input.light_cones ?? []);

  state.roster = avatars.map(normalizeAvatar);
  state.partySlots = getLoadoutAvatarIds(input, avatars);
  while (state.partySlots.length < 4) state.partySlots.push(null);

  for (const avatar of avatars) {
    const id = String(avatar.avatar_id);
    state.hints.eidolon[id] = avatar.data?.rank ?? avatar.rank ?? 0;
    state.hints.skillLevels[id] = avatar.data?.skills_by_anchor_type ?? avatar.data?.skills ?? avatar.skills ?? {};
    const lightCone = lightConesByAvatar[id]?.[0] ?? avatar.equipment?.light_cone ?? null;
    if (lightCone) {
      state.equipment.lightcones[id] = lightCone;
      state.hints.superimposition[id] = lightCone.rank ?? null;
    }
    const relics = relicsByAvatar[id] ?? avatar.equipment?.relics ?? null;
    if (Array.isArray(relics)) {
      state.equipment.relics[id] = relics;
    }
  }

  if (!avatars.length) {
    state.warnings.push("freesr input has no avatars");
  }

  return state;
}

const relicPieceOrder = [
  { key: "head", name: "머리", fixedMainStat: "hpFlat" },
  { key: "hands", name: "손", fixedMainStat: "atkFlat" },
  { key: "body", name: "몸통" },
  { key: "feet", name: "신발" },
  { key: "sphere", name: "차원 구체" },
  { key: "rope", name: "연결 매듭" },
];

const baseDefaultStats = {
  hp: 0,
  atk: 0,
  def: 0,
  speed: 100,
  critRate: 0.05,
  critDamage: 0.5,
};

export function calculateSelfEquipmentStats({
  character,
  slot,
  defaultBuild,
  characterStatBaseline,
  equipmentStatModel,
  lightCones,
} = {}) {
  const statRow = findCharacterStatRow(character, characterStatBaseline);
  const lightCone = findLightCone(slot, defaultBuild, lightCones);
  const base = buildBaseStats(statRow?.baseStats, lightCone?.base);
  const entries = [
    ...buildTraceEntries(statRow),
    ...buildLightConeEntries(lightCone, slot?.lightconeRank ?? 1),
    ...buildRelicEntries(slot, defaultBuild, equipmentStatModel),
  ];
  const totals = entriesToTotals(entries);
  const stats = buildFinalStats(base, totals);
  return {
    base,
    totals,
    stats,
    entries,
    sourceStatus: {
      characterStats: statRow ? statRow.sourceStatus : "missing_character_stats",
      lightCone: lightCone ? "matched" : "missing_lightcone",
      relicModel: equipmentStatModel?.relicSets?.length ? "ready" : "missing_relic_model",
    },
  };
}

export function formatSelfStatValue(stat, value) {
  if (!Number.isFinite(Number(value))) return "-";
  if (isPercentStat(stat)) return `${formatNumber(Number(value) * 100, 1)} %`;
  return formatNumber(value, stat === "speed" ? 1 : 0);
}

export function applyStatTotalsToBase(base, totals) {
  return buildFinalStats(base, totals);
}

function findCharacterStatRow(character, payload) {
  if (!character) return null;
  return (payload?.rows ?? []).find((row) => row.characterId === character.characterId || row.displayName === character.displayName) ?? null;
}

function findLightCone(slot, defaultBuild, lightCones = []) {
  const id = slot?.lightconeId ?? defaultBuild?.selectedLightCone?.id;
  const name = slot?.lightconeName ?? defaultBuild?.selectedLightCone?.name;
  return lightCones.find((lightCone) => lightCone.id === id) ?? lightCones.find((lightCone) => lightCone.name === name) ?? null;
}

function buildBaseStats(characterBase = {}, lightConeBase = {}) {
  return {
    hp: valueOf(characterBase.hp, baseDefaultStats.hp) + valueOf(lightConeBase.hp),
    atk: valueOf(characterBase.atk, baseDefaultStats.atk) + valueOf(lightConeBase.atk),
    def: valueOf(characterBase.def, baseDefaultStats.def) + valueOf(lightConeBase.def),
    speed: valueOf(characterBase.speed, baseDefaultStats.speed),
    critRate: valueOf(characterBase.critRate, baseDefaultStats.critRate),
    critDamage: valueOf(characterBase.critDamage, baseDefaultStats.critDamage),
  };
}

function buildTraceEntries(statRow) {
  return (statRow?.traceEntries ?? []).map((entry) => ({
    ...entry,
    sourceType: "행적",
    source: entry.source ?? "행적 추가스탯",
  }));
}

function buildLightConeEntries(lightCone, rank) {
  if (!lightCone) return [];
  const bonus = resolveRankedBonus(lightCone.bonusRanks, rank, lightCone.bonus);
  return Object.entries(bonus ?? {})
    .filter(([, value]) => Number.isFinite(Number(value)) && Number(value) !== 0)
    .map(([stat, value]) => ({
      stat,
      value: Number(value),
      sourceType: "광추",
      source: `${lightCone.name} S${clampRank(rank)}`,
      conditionStatus: "always-on",
    }));
}

function resolveRankedBonus(bonusRanks = {}, rank = 1, fallback = {}) {
  if (!bonusRanks || !Object.keys(bonusRanks).length) return fallback ?? {};
  const rankIndex = clampRank(rank) - 1;
  return Object.fromEntries(
    Object.entries(bonusRanks).map(([stat, values]) => [stat, Array.isArray(values) ? Number(values[rankIndex] ?? values[0] ?? 0) : 0]),
  );
}

function buildRelicEntries(slot, defaultBuild, model) {
  const relicBuild = {
    set4Id: findRelicSetId(model, slot?.relicSet4Name, defaultBuild?.selectedRelics?.set4?.id),
    set4AltId: defaultBuild?.selectedRelics?.set4Alt?.id ?? null,
    set4Mode: defaultBuild?.selectedRelics?.set4Mode ?? "4",
    set2Id: findRelicSetId(model, slot?.relicSet2Name, defaultBuild?.selectedRelics?.set2?.id),
    mainStats: slot?.relicMainStats ?? defaultBuild?.mainStats ?? {},
    pieces: slot?.relicPieces ?? defaultBuild?.pieces ?? {},
    subStatPriority: slot?.relicSubStatPriority ?? defaultBuild?.subStatPriority ?? [],
  };
  const set4 = findRelicSet(model, relicBuild.set4Id);
  const set4Alt = relicBuild.set4Mode === "2+2" ? findRelicSet(model, relicBuild.set4AltId) : null;
  const set2 = findRelicSet(model, relicBuild.set2Id);
  const entries = [];
  if (set4 && set4Alt && relicBuild.set4Mode === "2+2") {
    pushStatEntries(entries, set4.twoPieceStats, "유물", `2셋 효과 (${set4.name})`);
    pushStatEntries(entries, set4Alt.twoPieceStats, "유물", `2셋 효과 (${set4Alt.name})`);
  } else if (set4) {
    pushStatEntries(entries, set4.twoPieceStats, "유물", `2셋 효과 (${set4.name})`);
    pushStatEntries(entries, set4.fourPieceStats, "유물", `4셋 효과 (${set4.name})`);
  }
  if (set2) pushStatEntries(entries, set2.twoPieceStats ?? set2.stats, "유물", `2셋 효과 (${set2.name})`);
  for (const piece of relicPieceOrder) {
    const pieceSet = getRelicPieceSet(piece, set4, set4Alt, set2);
    const mainStat = piece.fixedMainStat ?? relicBuild.mainStats[piece.key] ?? relicBuild.pieces[piece.key]?.mainStat;
    const mainValue = model?.relicMainStatOptions?.[mainStat]?.value;
    if (Number.isFinite(Number(mainValue))) {
      entries.push({ stat: mainStat, value: Number(mainValue), sourceType: "유물", source: formatRelicPieceSource("주옵", piece, pieceSet), conditionStatus: "always-on" });
    }
    const subStats = relicBuild.pieces[piece.key]?.subStats?.length
      ? relicBuild.pieces[piece.key].subStats
      : buildAssumedSubStats(relicBuild.subStatPriority, mainStat);
    for (const subStat of subStats) {
      const rollValue = model?.relicSubStatRollValues?.[subStat.stat];
      const rolls = Number.isFinite(Number(subStat.rolls)) ? Number(subStat.rolls) : 0;
      const value = Number(rollValue) * (1 + Math.max(0, rolls));
      if (Number.isFinite(value) && value !== 0) {
        entries.push({ stat: subStat.stat, value, sourceType: "유물", source: formatRelicPieceSource("부옵", piece, pieceSet), conditionStatus: "assumed-average-roll" });
      }
    }
  }
  return entries;
}

function getRelicPieceSet(piece, set4, set4Alt, set2) {
  if (piece.key === "sphere" || piece.key === "rope") return set2;
  if (set4Alt && (piece.key === "body" || piece.key === "feet")) return set4Alt;
  return set4;
}

function formatRelicPieceSource(optionType, piece, relicSet) {
  return `유물 ${optionType} · ${piece.name}`;
}

function buildAssumedSubStats(priority = [], mainStat) {
  return priority
    .filter((stat) => stat && stat !== mainStat)
    .slice(0, 4)
    .map((stat, index) => ({ stat, rolls: index === 0 ? 2 : index === 1 ? 1 : 0 }));
}

function findRelicSetId(model, name, fallbackId) {
  if (fallbackId) return fallbackId;
  return (model?.relicSets ?? []).find((set) => set.name === name)?.id ?? null;
}

function findRelicSet(model, id) {
  return (model?.relicSets ?? []).find((set) => set.id === id) ?? null;
}

function pushStatEntries(entries, stats = {}, sourceType, source) {
  for (const [stat, value] of Object.entries(stats ?? {})) {
    if (!Number.isFinite(Number(value)) || Number(value) === 0) continue;
    entries.push({ stat, value: Number(value), sourceType, source, conditionStatus: "always-on" });
  }
}

function entriesToTotals(entries) {
  return entries.reduce((totals, entry) => {
    totals[entry.stat] = (totals[entry.stat] ?? 0) + Number(entry.value);
    return totals;
  }, {});
}

function buildFinalStats(base, totals) {
  return {
    base,
    hp: base.hp * (1 + valueOf(totals.hpRatio)) + valueOf(totals.hpFlat),
    atk: base.atk * (1 + valueOf(totals.atkRatio)) + valueOf(totals.atkFlat),
    def: base.def * (1 + valueOf(totals.defRatio)) + valueOf(totals.defFlat),
    speed: base.speed * (1 + valueOf(totals.speedRatio)) + valueOf(totals.speed),
    critRate: Math.max(0, base.critRate + valueOf(totals.critRate)),
    critDamage: base.critDamage + valueOf(totals.critDamage),
    elementDamage: valueOf(totals.elementDamage),
    allDamage: valueOf(totals.allDamage),
    breakEffect: valueOf(totals.breakEffect),
    toughnessDamageRatio: valueOf(totals.toughnessDamageRatio),
    effectHitRate: valueOf(totals.effectHitRate),
    effectResistance: valueOf(totals.effectResistance),
    energyRegen: valueOf(totals.energyRegen),
    outgoingHealingBoost: valueOf(totals.outgoingHealingBoost),
    basicDamage: valueOf(totals.basicDamage),
    skillDamage: valueOf(totals.skillDamage),
    ultimateDamage: valueOf(totals.ultimateDamage),
    followDamage: valueOf(totals.followDamage),
    dotDamage: valueOf(totals.dotDamage),
    breakDamage: valueOf(totals.breakDamage),
  };
}

function isPercentStat(stat) {
  return !["hp", "atk", "def", "speed", "hpFlat", "atkFlat", "defFlat"].includes(stat);
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(Number(value));
}

function valueOf(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampRank(rank) {
  if (!Number.isFinite(Number(rank))) return 1;
  return Math.min(Math.max(Math.round(Number(rank)), 1), 5);
}

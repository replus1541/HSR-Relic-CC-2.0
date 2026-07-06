import { applyStatTotalsToBase, calculateSelfEquipmentStats } from "./self-stat-calculator.js";

const statBuffKeys = new Set([
  "hpRatio",
  "hpFlat",
  "atkRatio",
  "atkFlat",
  "defRatio",
  "defFlat",
  "speedRatio",
  "speed",
  "critRate",
  "critDamage",
  "breakEffect",
  "toughnessDamageRatio",
  "effectHitRate",
  "effectResistance",
  "energyRegen",
  "outgoingHealingBoost",
  "elementDamage",
  "allDamage",
  "basicDamage",
  "skillDamage",
  "ultimateDamage",
  "followDamage",
  "dotDamage",
  "breakDamage",
  "dealtCritDamage",
  "followCritDamage",
  "specialFinal",
]);

const damageModifierKeys = new Set([
  "allDamage",
  "basicDamage",
  "skillDamage",
  "ultimateDamage",
  "followDamage",
  "dotDamage",
  "breakDamage",
  "trueDamageRatio",
  "dealtCritDamage",
  "followCritDamage",
  "specialFinal",
  "elation",
  "merrymake",
  "defenseIgnore",
  "resistancePen",
  "vulnerability",
  "defenseDown",
]);

const chrysosHeirCharacterIds = new Set([
  "PlayerBoy_20",
  "Aglaea_00",
  "Anaxa_00",
  "Castorice_00",
  "Cerydra_00",
  "Cipher_00",
  "Cyrene_00",
  "DanHengPT_00",
  "Evernight_00",
  "Harscyline_00",
  "Hyacine_00",
  "Mydeimos_00",
  "Phainon_00",
  "Tribbie_00",
]);

const targetPolicyOverridesByEffectId = new Map([
  ["effect:PlayerBoy_20:1", "single_ally"],
  ["effect:PlayerBoy_20:hoyowiki-source:E1:현재의_서술자:critRate:0", "single_ally"],
  ["effect:PlayerBoy_20:supplement:mimiSupportTrueDamage", "single_ally"],
  ["effect:Sunday_10:2", "single_ally"],
  ["effect:PlayerBoy_40:2", "enemy_all"],
  ["effect:PlayerBoy_40:0", "self"],
  ["effect:Jingliu_00:0", "self"],
  ["effect:Evanescia_00:0", "self"],
  ["effect:Phainon_00:0", "self"],
  ["effect:YaoGuang_00:0", "self"],
  ["effect:Cerydra_00:3", "single_ally"],
  ["effect:Cerydra_00:4", "single_ally"],
  ["effect:Hyacine_00:hoyowiki-source:E2:제_정원에_앉았다_가세요:speedRatio:0", "all_allies"],
  ["effect:RuanMei_00:hoyowiki-source:talent:프랙탈_나선:speedRatio:0", "all_allies"],
  ["effect:Jade_00:hoyowiki-source:combatSkill:병탄_합병의_담보:speed:0", "single_ally"],
  ["effect:Bronya_00:hoyowiki-source:E2:빠른_행군:speedRatio:0", "single_ally"],
  ["effect:Luocha_00:1", "enemy_all"],
  ["effect:DanHengPT_00:0", "enemy_all"],
  ["effect:Constance_00:0", "enemy_all"],
  ["effect:Constance_00:1", "enemy_all"],
  ["effect:Constance_00:2", "enemy_all"],
  ["effect:BlackSwan_00:0", "enemy_all"],
  ["effect:Cipher_00:0", "enemy_all"],
  ["effect:Acheron_00:0", "enemy_all"],
  ["effect:Ashveil_00:0", "enemy_all"],
  ["effect:Ashveil_00:3", "enemy_all"],
  ["effect:Ashveil_00:5", "enemy_all"],
  ["effect:Evernight_00:0", "enemy_all"],
  ["effect:Lingsha_00:1", "enemy_all"],
  ["effect:Welt_00:0", "enemy_all"],
  ["effect:MortenaxBlade_00:0", "enemy_all"],
  ["effect:MortenaxBlade_00:1", "enemy_all"],
  ["effect:MortenaxBlade_00:5", "enemy_all"],
  ["effect:Jiaoqiu_00:2", "enemy_all"],
  ["effect:Castorice_00:0", "enemy_all"],
  ["effect:Cyrene_00:16", "enemy_all"],
  ["effect:Tribbie_00:5", "enemy_all"],
  ["effect:Harscyline_00:0", "enemy_all"],
  ["effect:Harscyline_00:1", "enemy_all"],
  ["effect:Harscyline_00:6", "enemy_all"],
]);

const targetExcludesOwnerOverridesByEffectId = new Set([
  "effect:RuanMei_00:hoyowiki-source:talent:프랙탈_나선:speedRatio:0",
  "effect:Jade_00:hoyowiki-source:combatSkill:병탄_합병의_담보:speed:0",
]);

const hyacineSignatureLightConeId = "wiki-3775";
const hyacineSignatureVulnerabilityByRank = [0.18, 0.225, 0.27, 0.315, 0.36];
const ashveilSkillDefenseDownByEffectiveLevel = new Map([
  [10, 0.4],
  [12, 0.44],
]);
const mortenaxUltimateSkillLevelValues = Object.freeze({
  vulnerability: { base: 0.5, boosted: 0.54 },
  defenseDown: { base: 0.3, boosted: 0.32 },
  critDamage: { base: 0.6, boosted: 0.66 },
});
const robinUltimateAtkBuffByEffectiveLevel = new Map([
  [10, { ratio: 0.228, flat: 200 }],
  [12, { ratio: 0.243, flat: 230 }],
]);
const cerydraMilitaryMeritAtkRatioByEffectiveLevel = new Map([
  [10, 0.24],
  [12, 0.252],
]);
const jingliuMoonlightEffectRowId = "effect:Jingliu_00:curated:moonlightStacksCritDamage";
const jingliuMoonlightBaseEffectRowId = "effect:Jingliu_00:curated:moonlightStacksCritDamage:base";
const jingliuMoonlightE4EffectRowId = "effect:Jingliu_00:curated:moonlightStacksCritDamage:E4Bonus";
const jingliuMoonlightBaseCritDamagePerStack = 0.24;
const jingliuMoonlightE4CritDamagePerStack = 0.2;
const jingliuMoonlightBaseStacks = 3;
const jingliuMoonlightMaxStacks = 5;
const critRateOvercapConversionRatio = 2;

export function calculateBattleFinalStats({
  party = [],
  activeSlotId,
  characterGetter,
  defaultBuildGetter,
  characterStatBaseline,
  equipmentStatModel,
  lightCones,
  ledgerRows = [],
  effectMetadataRows = [],
  scenarioSettings = {},
  stateControls = [],
} = {}) {
  const activeSlot = party.find((slot) => slot.slotId === activeSlotId) ?? party[0] ?? null;
  const activeCharacter = characterGetter?.(activeSlot?.characterId) ?? null;
  const activeDefaultBuild = defaultBuildGetter?.(activeCharacter?.characterId) ?? null;
  const selfByCharacterId = new Map();
  for (const slot of party ?? []) {
    const character = characterGetter?.(slot?.characterId) ?? null;
    if (!character?.characterId) continue;
    selfByCharacterId.set(character.characterId, calculateSelfEquipmentStats({
      character,
      slot,
      defaultBuild: defaultBuildGetter?.(character.characterId) ?? null,
      characterStatBaseline,
      equipmentStatModel,
      lightCones,
    }));
  }
  const self = calculateSelfEquipmentStats({
    character: activeCharacter,
    slot: activeSlot,
    defaultBuild: activeDefaultBuild,
    characterStatBaseline,
    equipmentStatModel,
    lightCones,
  });
  const partyCharacterIds = new Set(party.map((slot) => slot.characterId).filter(Boolean));
  const partyEidolons = new Map(party.map((slot) => [slot.characterId, Number(slot.eidolon ?? 0)]));
  const partyCharactersById = new Map((party ?? []).map((slot) => [
    slot.characterId,
    characterGetter?.(slot.characterId) ?? null,
  ]).filter(([characterId]) => Boolean(characterId)));
  const partyLightConesByCharacterId = new Map((party ?? []).map((slot) => [
    slot.characterId,
    {
      id: slot.lightConeId ?? slot.lightconeId ?? defaultBuildGetter?.(slot.characterId)?.selectedLightCone?.id ?? null,
      name: slot.lightConeName ?? slot.lightconeName ?? defaultBuildGetter?.(slot.characterId)?.selectedLightCone?.name ?? null,
      rank: Number(slot.lightConeRank ?? slot.lightconeRank ?? 1),
    },
  ]).filter(([characterId]) => Boolean(characterId)));
  const partyBranchState = {
    activeCharacterPath: activeCharacter?.path ?? null,
    jingliuMoonlightStacks: calculateJingliuMoonlightStacks(partyCharactersById),
    lightConesByCharacterId: partyLightConesByCharacterId,
    partyEidolons,
    partyWideCritRateOvercapConversionEnabled: hasPartyWideCritRateOvercapConversion(partyEidolons),
    cyreneInParty: partyCharacterIds.has("Cyrene_00"),
    cyreneHasAnaxa: partyCharacterIds.has("Cyrene_00") && partyCharacterIds.has("Anaxa_00"),
    mortenaxHasOtherNihility: hasOtherNihilityCharacter(partyCharactersById, "MortenaxBlade_00"),
    cyreneHasCipher: partyCharacterIds.has("Cyrene_00") && partyCharacterIds.has("Cipher_00"),
    cyreneHasTribbie: partyCharacterIds.has("Cyrene_00") && partyCharacterIds.has("Tribbie_00"),
  };
  const metadataByEffectId = new Map((effectMetadataRows ?? []).map((row) => [row.effectRowId, row]));
  const scenarioOverridesByEffectId = buildScenarioEffectOverrides({ stateControls, scenarioSettings });
  const equipmentLedgerRows = buildEquipmentLedgerRows({ party, defaultBuildGetter });
  const decoratedRows = [...(ledgerRows ?? []), ...equipmentLedgerRows].flatMap((row) => {
    const metadata = metadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId);
    const effectRowId = row.sourceTrace?.effectRowId ?? row.effectRowId;
    const decorated = applyScenarioEffectOverride(
      decorateLedgerRow(row, metadata),
      scenarioOverridesByEffectId.get(effectRowId),
    );
    return expandRuntimeLedgerRow(decorated);
  });
  const runtimeStatsByCharacterId = buildRuntimeSourceStatsByCharacterId({
    party,
    partyCharacterIds,
    partyEidolons,
    selfByCharacterId,
    rows: decoratedRows,
    partyBranchState,
  });
  const selfSourceStatsByCharacterId = buildSelfSourceStatsByCharacterId({
    selfByCharacterId,
    partyBranchState,
  });
  const appliedRows = [];
  const skippedRows = [];

  for (const row of decoratedRows) {
    const decorated = applyRuntimeSourceStatResolution(
      row,
      { selfByCharacterId, selfSourceStatsByCharacterId, runtimeStatsByCharacterId, activeCharacterId: activeCharacter?.characterId, partyBranchState },
    );
    const decision = shouldApplyLedgerRow(decorated, {
      activeCharacterId: activeCharacter?.characterId,
      partyCharacterIds,
      partyEidolons,
    });
    if (decision.apply) {
      appliedRows.push({ ...decorated, usedForCurrentBattle: true });
    } else {
      skippedRows.push({ ...decorated, usedForCurrentBattle: false, currentBattleSkippedReason: decision.reason });
    }
  }

  const battleTotals = sumRows(appliedRows.filter((row) => statBuffKeys.has(row.stat) && !isEnemyTarget(row)));
  const enemyDebuffRows = appliedRows.filter(isEnemyTarget);
  const enemyDebuffs = sumRows(enemyDebuffRows);
  const damageModifiers = sumRows(appliedRows.filter((row) => damageModifierKeys.has(row.stat) && !isEnemyOnlyDamageModifier(row)));
  const combinedStatTotals = mergeTotals(self.totals, battleTotals);
  const finalStats = applyCritRateOvercapConversion(
    applyStatTotalsToBase(self.stats.base, combinedStatTotals),
    getCritRateOvercapConversionMode(activeCharacter?.characterId, partyBranchState),
    calculateCritRateOvercapConversionBasis({ characterId: activeCharacter?.characterId, self, appliedRows, partyBranchState }),
  );
  const partyFinalStats = buildPartyFinalStatsByCharacterId({
    party,
    activeCharacterId: activeCharacter?.characterId,
    activeFinalStats: finalStats,
    activeCombinedStatTotals: combinedStatTotals,
    decoratedRows,
    selfByCharacterId,
    selfSourceStatsByCharacterId,
    runtimeStatsByCharacterId,
    partyBranchState,
    partyCharactersById,
    partyCharacterIds,
    partyEidolons,
  });

  return {
    activeSlot,
    activeCharacter,
    partySlots: party.map((slot) => ({
      characterId: slot.characterId,
      eidolon: Number(slot.eidolon ?? 0),
      path: partyCharactersById.get(slot.characterId)?.path ?? null,
    })),
    self,
    finalStats,
    partyFinalStatsByCharacterId: partyFinalStats.finalStatsByCharacterId,
    partyCombinedStatTotalsByCharacterId: partyFinalStats.combinedStatTotalsByCharacterId,
    battleTotals,
    combinedStatTotals,
    enemyDebuffs,
    enemyDebuffRows,
    damageModifiers,
    appliedRows,
    skippedRows,
    sourceTrace: {
      ledgerRows: ledgerRows.length + equipmentLedgerRows.length,
      partyRows: appliedRows.length + skippedRows.length,
      appliedRows: appliedRows.length,
      skippedRows: skippedRows.length,
      selfEntries: self.entries.length,
    },
  };
}

function buildEquipmentLedgerRows({ party = [], defaultBuildGetter } = {}) {
  const rows = [];
  for (const slot of party ?? []) {
    const characterId = slot?.characterId;
    if (!characterId) continue;
    const defaultBuild = defaultBuildGetter?.(characterId) ?? null;
    const selectedRelics = defaultBuild?.selectedRelics ?? {};
    const set4Id = slot?.relicSet4Id ?? selectedRelics.set4?.id ?? null;
    const set4Mode = slot?.relicSet4Mode ?? selectedRelics.set4Mode ?? "4";
    if (set4Id === "wiki-relic-4769" && set4Mode !== "2+2") {
      rows.push({
        ledgerId: `ledger:equipment:${characterId}:wiki-relic-4769:all_allies:elation`,
        sourceId: `source:equipment:${characterId}:wiki-relic-4769:all_allies:elation`,
        sourceRowId: `source:equipment:${characterId}:wiki-relic-4769:all_allies:elation`,
        effectRowId: `effect:equipment:${characterId}:wiki-relic-4769:all_allies:elation`,
        ownerId: characterId,
        sourceLabel: "천명에 응해 먼 길을 떠난 점술가",
        sourceDisplayLabel: "유물 4셋 · 천명에 응해 먼 길을 떠난 점술가",
        sourceCategory: "relic",
        sourceTitle: "천명에 응해 먼 길을 떠난 점술가",
        effectType: "buff",
        targetPolicy: "all_allies",
        stat: "elation",
        resolvedValue: 10,
        valueMode: "fixed",
        usedForCalculation: true,
        calculationStatus: "calculation_ready",
        conditionStatus: "assumed-active",
        sourceText: "장착한 캐릭터가 각 전투에서 처음으로 환락 스킬 발동 시 모든 아군의 환락도가 10 증가",
        sourceTrace: {
          effectRowId: `effect:equipment:${characterId}:wiki-relic-4769:all_allies:elation`,
          sourceRowId: `source:equipment:${characterId}:wiki-relic-4769:all_allies:elation`,
          source: "equipment-stat-model",
        },
      });
    }
  }
  return rows;
}

function buildPartyFinalStatsByCharacterId({
  party = [],
  activeCharacterId,
  activeFinalStats,
  activeCombinedStatTotals,
  decoratedRows = [],
  selfByCharacterId,
  selfSourceStatsByCharacterId,
  runtimeStatsByCharacterId,
  partyBranchState,
  partyCharactersById,
  partyCharacterIds,
  partyEidolons,
}) {
  const finalStatsByCharacterId = {};
  const combinedStatTotalsByCharacterId = {};
  for (const slot of party ?? []) {
    const characterId = slot?.characterId;
    if (!characterId) continue;
    if (characterId === activeCharacterId) {
      finalStatsByCharacterId[characterId] = activeFinalStats;
      combinedStatTotalsByCharacterId[characterId] = activeCombinedStatTotals;
      continue;
    }
    const targetSelf = selfByCharacterId.get(characterId);
    if (!targetSelf?.stats?.base) continue;
    const targetCharacter = partyCharactersById.get(characterId);
    const targetBranchState = {
      ...partyBranchState,
      activeCharacterPath: targetCharacter?.path ?? null,
    };
    const targetAppliedRows = [];
    for (const row of decoratedRows) {
      const decorated = applyRuntimeSourceStatResolution(
        row,
        { selfByCharacterId, selfSourceStatsByCharacterId, runtimeStatsByCharacterId, activeCharacterId: characterId, partyBranchState: targetBranchState },
      );
      const decision = shouldApplyLedgerRow(decorated, {
        activeCharacterId: characterId,
        partyCharacterIds,
        partyEidolons,
        assumeSingleAllyTarget: false,
      });
      if (decision.apply) targetAppliedRows.push(decorated);
    }
    const targetBattleTotals = sumRows(targetAppliedRows.filter((row) => statBuffKeys.has(row.stat) && !isEnemyTarget(row)));
    const targetCombinedTotals = mergeTotals(targetSelf.totals, targetBattleTotals);
    finalStatsByCharacterId[characterId] = applyCritRateOvercapConversion(
      applyStatTotalsToBase(targetSelf.stats.base, targetCombinedTotals),
      getCritRateOvercapConversionMode(characterId, targetBranchState),
      calculateCritRateOvercapConversionBasis({ characterId, self: targetSelf, appliedRows: targetAppliedRows, partyBranchState: targetBranchState }),
    );
    combinedStatTotalsByCharacterId[characterId] = targetCombinedTotals;
  }
  return { finalStatsByCharacterId, combinedStatTotalsByCharacterId };
}

function buildScenarioEffectOverrides({ stateControls = [], scenarioSettings = {} } = {}) {
  const overrides = new Map();
  for (const control of stateControls ?? []) {
    const selectedValue = Number(scenarioSettings[control.key] ?? control.defaultValue);
    if (!Number.isFinite(selectedValue)) continue;
    for (const effectRowId of control.effectRowIds ?? []) {
      overrides.set(effectRowId, {
        controlKey: control.key,
        selectedValue,
        valueFormula: control.valueFormula ?? null,
      });
    }
  }
  return overrides;
}

function applyScenarioEffectOverride(row, override) {
  if (!override) return row;
  const nextValue = resolveScenarioEffectValue(row, override);
  if (!Number.isFinite(nextValue)) return row;
  return {
    ...row,
    resolvedValue: nextValue,
    usedForCalculation: true,
    calculationStatus: "calculation_ready",
    blockedReason: null,
    skippedReason: null,
    scenarioOverride: {
      controlKey: override.controlKey,
      selectedValue: override.selectedValue,
      formulaType: override.valueFormula?.type ?? "direct",
    },
  };
}

function expandRuntimeLedgerRow(row) {
  const effectRowId = row.sourceTrace?.effectRowId ?? row.effectRowId;
  if (effectRowId !== jingliuMoonlightEffectRowId) return [row];
  return [
    buildJingliuMoonlightSplitRow(row, {
      effectRowId: jingliuMoonlightBaseEffectRowId,
      ledgerSuffix: "base",
      sourceDisplayLabel: "특성 · 달빛 스택",
      minEidolon: null,
      perStack: jingliuMoonlightBaseCritDamagePerStack,
    }),
    buildJingliuMoonlightSplitRow(row, {
      effectRowId: jingliuMoonlightE4EffectRowId,
      ledgerSuffix: "e4",
      sourceDisplayLabel: "성혼 4 · 달의 검을 쥐고",
      minEidolon: 4,
      perStack: jingliuMoonlightE4CritDamagePerStack,
    }),
  ];
}

function buildJingliuMoonlightSplitRow(row, { effectRowId, ledgerSuffix, sourceDisplayLabel, minEidolon, perStack }) {
  return {
    ...row,
    ledgerId: `${row.ledgerId}:${ledgerSuffix}`,
    sourceRowId: `${row.sourceRowId}:${ledgerSuffix}`,
    resolvedValue: perStack,
    minEidolon,
    metadata: {
      ...(row.metadata ?? {}),
      effectRowId,
      sourceDisplayLabel,
      minEidolon,
      sourceText: row.metadata?.sourceText ?? row.sourceTrace?.sourceText ?? "",
    },
    sourceTrace: {
      ...(row.sourceTrace ?? {}),
      effectRowId,
      sourceRowId: `${row.sourceTrace?.sourceRowId ?? row.sourceRowId}:${ledgerSuffix}`,
    },
  };
}

function hasPartyWideCritRateOvercapConversion(partyEidolons) {
  return Number(partyEidolons?.get("Sunday_10") ?? 0) >= 6;
}

function getCritRateOvercapConversionMode(characterId, partyBranchState) {
  if (!characterId) return null;
  if (characterId === "SilverWolf999_00") return "finalCritRate";
  if (partyBranchState?.partyWideCritRateOvercapConversionEnabled) return "sundayEquipmentPlusBuff";
  return null;
}

function calculateCritRateOvercapConversionBasis({ characterId, self, appliedRows = [], partyBranchState } = {}) {
  const mode = getCritRateOvercapConversionMode(characterId, partyBranchState);
  if (mode === "sundayEquipmentPlusBuff") {
    return calculateEquipmentCritRate(self) + calculateAppliedSundayCritRate(appliedRows);
  }
  return null;
}

function calculateEquipmentCritRate(self) {
  return (self?.entries ?? [])
    .filter((entry) => entry?.stat === "critRate" && (entry.sourceType === "유물" || entry.sourceType === "광추"))
    .reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);
}

function calculateAppliedSundayCritRate(appliedRows = []) {
  return (appliedRows ?? [])
    .filter((row) => row?.ownerId === "Sunday_10" && row?.stat === "critRate" && !isEnemyTarget(row))
    .reduce((sum, row) => sum + Number(row.resolvedValue ?? 0), 0);
}

function applyCritRateOvercapConversion(stats, mode, conversionBasis = null) {
  if (!mode || !stats) return stats;
  const critRate = mode === "sundayEquipmentPlusBuff" ? Number(conversionBasis ?? 0) : Number(stats.critRate ?? 0);
  if (!Number.isFinite(critRate) || critRate <= 1) return stats;
  const convertedCritDamage = (critRate - 1) * critRateOvercapConversionRatio;
  return {
    ...stats,
    critDamage: Number(stats.critDamage ?? 0) + convertedCritDamage,
    critRateOvercapConvertedCritDamage: convertedCritDamage,
    critRateOvercapConversionBasis: critRate,
    critRateOvercapConversionMode: mode,
  };
}

function buildRuntimeSourceStatsByCharacterId({
  party = [],
  partyCharacterIds,
  partyEidolons,
  selfByCharacterId,
  rows = [],
  partyBranchState,
} = {}) {
  const result = new Map();
  for (const slot of party ?? []) {
    const characterId = slot?.characterId;
    const self = selfByCharacterId?.get(characterId);
    if (!characterId || !self?.stats?.base) continue;
    const readyAllyWideTotals = sumRows((rows ?? []).filter((row) => (
      isRuntimeSourceStatRowForCharacter(row, characterId, { partyCharacterIds, partyEidolons })
    )));
    result.set(characterId, applyCritRateOvercapConversion(
      applyStatTotalsToBase(self.stats.base, mergeTotals(self.totals, readyAllyWideTotals)),
      getCritRateOvercapConversionMode(characterId, partyBranchState),
      calculateCritRateOvercapConversionBasis({ characterId, self, appliedRows: [], partyBranchState }),
    ));
  }
  return result;
}

function buildSelfSourceStatsByCharacterId({ selfByCharacterId, partyBranchState } = {}) {
  const result = new Map();
  for (const [characterId, self] of selfByCharacterId ?? []) {
    if (!characterId || !self?.stats) continue;
    result.set(characterId, applyCritRateOvercapConversion(
      self.stats,
      getCritRateOvercapConversionMode(characterId, partyBranchState),
      calculateCritRateOvercapConversionBasis({ characterId, self, appliedRows: [], partyBranchState }),
    ));
  }
  return result;
}

function isRuntimeSourceStatRowForCharacter(row, characterId, { partyCharacterIds, partyEidolons } = {}) {
  if (!row?.usedForCalculation || typeof row.resolvedValue !== "number") return false;
  if (!statBuffKeys.has(row.stat) || isEnemyTarget(row)) return false;
  if (!partyCharacterIds?.has(row.ownerId)) return false;
  const ownerEidolon = Number(partyEidolons?.get(row.ownerId) ?? 0);
  if (Number.isFinite(Number(row.minEidolon)) && ownerEidolon < Number(row.minEidolon)) return false;
  const policy = normalizeTargetPolicy(row.targetPolicy);
  if (policy === "all_allies") return true;
  if (policy === "self") return row.ownerId === characterId;
  return false;
}

function applyRuntimeSourceStatResolution(row, {
  selfByCharacterId,
  selfSourceStatsByCharacterId,
  runtimeStatsByCharacterId,
  activeCharacterId,
  partyBranchState,
} = {}) {
  const sourceTrace = String(row.metadata?.sourceTrace ?? row.sourceTrace?.effectRowId ?? row.effectRowId ?? "");
  const effectRowId = row.sourceTrace?.effectRowId ?? row.effectRowId;
  if (effectRowId === "effect:MortenaxBlade_00:1") {
    const ownerEidolon = Number(partyBranchState?.partyEidolons?.get(row.ownerId) ?? 0);
    return markRuntimeResolved(row, resolveMortenaxUltimateLevelValue("vulnerability", ownerEidolon), {
      type: "skillLevelByEidolon",
      sourceStat: "vulnerability",
      baseLevelValue: mortenaxUltimateSkillLevelValues.vulnerability.base,
      maxLevelValue: mortenaxUltimateSkillLevelValues.vulnerability.boosted,
      ownerEidolon,
    });
  }
  if (
    row.ownerId === "MortenaxBlade_00"
    && row.stat === "defenseDown"
    && sourceTrace.includes("HoyoWiki:5217:ultimate:")
    && sourceTrace.includes("defenseDown:3")
  ) {
    const ownerEidolon = Number(partyBranchState?.partyEidolons?.get(row.ownerId) ?? 0);
    return markRuntimeResolved(row, resolveMortenaxUltimateLevelValue("defenseDown", ownerEidolon), {
      type: "skillLevelByEidolon",
      sourceStat: "defenseDown",
      baseLevelValue: mortenaxUltimateSkillLevelValues.defenseDown.base,
      maxLevelValue: mortenaxUltimateSkillLevelValues.defenseDown.boosted,
      ownerEidolon,
    });
  }
  if (effectRowId === "effect:MortenaxBlade_00:3") {
    const ownerEidolon = Number(partyBranchState?.partyEidolons?.get(row.ownerId) ?? 0);
    return markRuntimeResolved(row, resolveMortenaxUltimateLevelValue("critDamage", ownerEidolon), {
      type: "skillLevelByEidolon",
      sourceStat: "critDamage",
      baseLevelValue: mortenaxUltimateSkillLevelValues.critDamage.base,
      maxLevelValue: mortenaxUltimateSkillLevelValues.critDamage.boosted,
      ownerEidolon,
    });
  }
  if (effectRowId === jingliuMoonlightBaseEffectRowId || effectRowId === jingliuMoonlightE4EffectRowId) {
    const stacks = Number(partyBranchState?.jingliuMoonlightStacks ?? jingliuMoonlightBaseStacks);
    const perStack = effectRowId === jingliuMoonlightE4EffectRowId
      ? jingliuMoonlightE4CritDamagePerStack
      : jingliuMoonlightBaseCritDamagePerStack;
    return markRuntimeResolved(row, stacks * perStack, {
      type: "jingliuMoonlightAutoStacks",
      stackCount: stacks,
      perStack,
    });
  }
  if (row.ownerId === "Cyrene_00") {
    const resolvedCyreneRow = resolveCyrenePoemReceiverRow(row, sourceTrace, { activeCharacterId, partyBranchState });
    if (resolvedCyreneRow) return resolvedCyreneRow;
  }
  if (row.ownerId === "Mar_7th_10" && row.stat === "critDamage" && sourceTrace.includes("basicAttack:파랑:critDamage:0")) {
    if (!activeCharacterId || activeCharacterId === "Mar_7th_10") {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "huntMarchShifuBuff",
        receiverCharacterId: activeCharacterId ?? null,
        selected: false,
      });
    }
    return markRuntimeResolved({
      ...row,
      runtimeTargetCharacterId: activeCharacterId,
    }, 0.6, {
      type: "huntMarchShifuBuff",
      receiverCharacterId: activeCharacterId,
      sourceState: "enhancedBasicAftermath",
    });
  }
  if (row.ownerId === "Hyacine_00" && row.stat === "vulnerability" && sourceTrace.includes("lightcone:wiki-3775:vulnerability")) {
    const lightCone = partyBranchState?.lightConesByCharacterId?.get("Hyacine_00");
    const lightConeId = lightCone?.id;
    const lightConeName = String(lightCone?.name ?? "");
    if (lightConeId !== hyacineSignatureLightConeId && !lightConeName.includes("무지개")) {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "equippedLightConeRequired",
        requiredLightConeId: hyacineSignatureLightConeId,
        equippedLightConeId: lightConeId ?? null,
      });
    }
    const rank = Math.max(1, Math.min(5, Math.trunc(Number(lightCone?.rank ?? 1))));
    return markRuntimeResolved(row, hyacineSignatureVulnerabilityByRank[rank - 1], {
      type: "lightConeSuperimposition",
      lightConeId: hyacineSignatureLightConeId,
      rank,
    });
  }
  if (effectRowId === "effect:Sunday_10:0") {
    const ownerCritDamage = Number(selfSourceStatsByCharacterId?.get(row.ownerId)?.critDamage ?? selfByCharacterId?.get(row.ownerId)?.stats?.critDamage ?? 0);
    const ratio = Number(row.resolvedValue ?? 0);
    if (!Number.isFinite(ownerCritDamage) || ownerCritDamage <= 0 || !Number.isFinite(ratio) || ratio <= 0) return row;
    return markRuntimeResolved(row, ownerCritDamage * ratio, {
      type: "sourceStatRatio",
      sourceStat: "critDamage",
      ratio,
      sourceStatPolicy: "ownerSelfStats",
    });
  }
  if (effectRowId === "effect:Sparkle_00:7") {
    const ownerCritDamage = Number(selfSourceStatsByCharacterId?.get(row.ownerId)?.critDamage ?? selfByCharacterId?.get(row.ownerId)?.stats?.critDamage ?? 0);
    const ratio = Number(row.resolvedValue ?? 0);
    if (!Number.isFinite(ownerCritDamage) || ownerCritDamage <= 0 || !Number.isFinite(ratio) || ratio <= 0) return row;
    const flat = ratio * 1.875;
    return markRuntimeResolved(row, ownerCritDamage * ratio + flat, {
      type: "sourceStatRatioPlusFlat",
      sourceStat: "critDamage",
      ratio,
      flat,
      sourceStatPolicy: "ownerSelfStats",
    });
  }
  if (effectRowId === "effect:Sparkle_00:6") {
    const ownerCritDamage = Number(selfSourceStatsByCharacterId?.get(row.ownerId)?.critDamage ?? selfByCharacterId?.get(row.ownerId)?.stats?.critDamage ?? 0);
    if (!Number.isFinite(ownerCritDamage) || ownerCritDamage <= 0) return row;
    return markRuntimeResolved(row, ownerCritDamage * 0.3, {
      type: "sourceStatRatio",
      sourceStat: "critDamage",
      ratio: 0.3,
      sourceStatPolicy: "ownerSelfStats",
    });
  }
  if (effectRowId === "effect:Ashveil_00:0") {
    const ownerEidolon = Number(partyBranchState?.partyEidolons?.get(row.ownerId) ?? 0);
    const effectiveLevel = ownerEidolon >= 5 ? 12 : 10;
    return markRuntimeResolved(row, ashveilSkillDefenseDownByEffectiveLevel.get(effectiveLevel) ?? 0.4, {
      type: "skillLevelScaledEidolonBonus",
      skillCategory: "combatSkill",
      baseLevel: 10,
      effectiveLevel,
      eidolon: ownerEidolon,
      eidolonLevelBonuses: ownerEidolon >= 5 ? [{ minEidolon: 5, levelBonus: 2, levelCap: 15 }] : [],
    });
  }
  if (row.usedForCalculation && typeof row.resolvedValue === "number") return row;
  if (row.ownerId === "Cyrene_00" && row.stat === "defenseDown" && sourceTrace.includes("defenseDown:0")) {
    if (!partyBranchState?.cyreneHasCipher) {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "cyrenePoemReceiverBranch",
        poem: "strategy",
        receiverCharacterId: "Cipher_00",
        selected: false,
      });
    }
    return markRuntimeResolved(row, 0.1, {
      type: "cyrenePoemReceiverBranch",
      poem: "strategy",
      receiverCharacterId: "Cipher_00",
      target: "cipherRegularCustomer",
      maxDamageTargetPolicy: "regularCustomer",
    });
  }
  if (row.ownerId === "Cyrene_00" && row.stat === "defenseDown" && sourceTrace.includes("defenseDown:1")) {
    return markRuntimeSkipped(row, "branch_not_selected", {
      type: "cyrenePoemReceiverBranch",
      poem: "strategy",
      receiverCharacterId: "Cipher_00",
      target: "nonRegularCustomer",
      maxDamageTargetPolicy: "regularCustomer",
    });
  }
  if (row.ownerId === "Cyrene_00" && row.stat === "defenseIgnore" && sourceTrace.includes("defenseIgnore:3")) {
    if (!partyBranchState?.cyreneHasTribbie) {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "cyrenePoemReceiverBranch",
        poem: "passage",
        receiverCharacterId: "Tribbie_00",
        selected: false,
      });
    }
    return markRuntimeResolved({
      ...row,
      runtimeTargetCharacterId: "Tribbie_00",
    }, 0.06, {
      type: "cyrenePoemReceiverBranch",
      poem: "passage",
      receiverCharacterId: "Tribbie_00",
    });
  }
  if (row.ownerId === "MortenaxBlade_00" && sourceTrace.includes("other-nihility:ultimateDamage")) {
    if (!partyBranchState?.mortenaxHasOtherNihility) {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "partyCompositionBranch",
        branch: "otherNihility",
        selected: false,
      });
    }
    return markRuntimeResolved(row, 0.75, {
      type: "partyCompositionBranch",
      branch: "otherNihility",
      requiredPath: "nihility",
      excludedCharacterId: "MortenaxBlade_00",
    });
  }
  if (row.ownerId === "MortenaxBlade_00" && sourceTrace.includes("no-other-nihility:selfAllDamage")) {
    if (partyBranchState?.mortenaxHasOtherNihility) {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "partyCompositionBranch",
        branch: "noOtherNihility",
        selected: false,
      });
    }
    return markRuntimeResolved(row, 0.75, {
      type: "partyCompositionBranch",
      branch: "noOtherNihility",
      excludedCharacterId: "MortenaxBlade_00",
    });
  }
  if (row.ownerId === "Robin_00" && row.stat === "atkFlat" && sourceTrace.includes("sourceCombatAtkRatioPlusFlat")) {
    const ownerAtk = Number(runtimeStatsByCharacterId?.get(row.ownerId)?.atk ?? 0);
    if (!Number.isFinite(ownerAtk) || ownerAtk <= 0) return row;
    const ownerEidolon = Number(partyBranchState?.partyEidolons?.get(row.ownerId) ?? 0);
    const effectiveLevel = ownerEidolon >= 5 ? 12 : 10;
    const valueConfig = robinUltimateAtkBuffByEffectiveLevel.get(effectiveLevel) ?? robinUltimateAtkBuffByEffectiveLevel.get(10);
    return markRuntimeResolved(row, ownerAtk * valueConfig.ratio + valueConfig.flat, {
      type: "sourceStatRatioPlusFlat",
      sourceStat: "atk",
      ratio: valueConfig.ratio,
      flat: valueConfig.flat,
      sourceStatPolicy: "ownerSelfAndAllyWideReadyBuffs",
      baseLevel: 10,
      effectiveLevel,
      eidolon: ownerEidolon,
      eidolonLevelBonuses: ownerEidolon >= 5 ? [{ minEidolon: 5, levelBonus: 2, levelCap: 15 }] : [],
    });
  }
  if (row.ownerId === "RuanMei_00" && row.stat === "allDamage" && sourceTrace.includes("breakEffect-overcap-allDamage")) {
    const ownerBreakEffect = Number(runtimeStatsByCharacterId?.get(row.ownerId)?.breakEffect ?? 0);
    if (!Number.isFinite(ownerBreakEffect)) return row;
    const overcap = Math.max(0, ownerBreakEffect - 1.2);
    const value = Math.min(0.36, Math.floor((overcap + 1e-9) / 0.1) * 0.06);
    return markRuntimeResolved(row, value, {
      type: "breakEffectOvercapStep",
      sourceStat: "breakEffect",
      threshold: 1.2,
      step: 0.1,
      stepValue: 0.06,
      cap: 0.36,
      sourceStatPolicy: "ownerSelfAndAllyWideReadyBuffs",
    });
  }
  if (row.ownerId === "Cerydra_00" && row.stat === "atkFlat" && sourceTrace.includes("sourceCombatAtkRatio")) {
    const ownerAtk = Number(selfByCharacterId?.get(row.ownerId)?.stats?.atk ?? 0);
    if (!Number.isFinite(ownerAtk) || ownerAtk <= 0) return row;
    const ownerEidolon = Number(partyBranchState?.partyEidolons?.get(row.ownerId) ?? 0);
    const effectiveLevel = ownerEidolon >= 5 ? 12 : 10;
    const ratio = cerydraMilitaryMeritAtkRatioByEffectiveLevel.get(effectiveLevel)
      ?? cerydraMilitaryMeritAtkRatioByEffectiveLevel.get(10);
    return markRuntimeResolved(row, ownerAtk * ratio, {
      type: "sourceStatRatio",
      sourceStat: "atk",
      ratio,
      sourceStatPolicy: "ownerSelfStats",
      baseLevel: 10,
      effectiveLevel,
      eidolon: ownerEidolon,
      eidolonLevelBonuses: ownerEidolon >= 5 ? [{ minEidolon: 5, levelBonus: 2, levelCap: 15 }] : [],
    });
  }
  if (row.ownerId === "DanHengPT_00" && row.stat === "atkFlat" && sourceTrace.includes("sourceCombatAtkRatio")) {
    const ownerAtk = Number(runtimeStatsByCharacterId?.get(row.ownerId)?.atk ?? 0);
    if (!Number.isFinite(ownerAtk) || ownerAtk <= 0) return row;
    return markRuntimeResolved(row, ownerAtk * 0.15, {
      type: "sourceStatRatio",
      sourceStat: "atk",
      ratio: 0.15,
      sourceStatPolicy: "ownerSelfAndAllyWideReadyBuffs",
    });
  }
  if (row.ownerId === "Tingyun_00" && row.stat === "atkFlat" && sourceTrace.includes("targetAtkRatio-sourceAtkCap")) {
    const ownerAtk = Number(runtimeStatsByCharacterId?.get(row.ownerId)?.atk ?? 0);
    const targetAtk = Number(runtimeStatsByCharacterId?.get(activeCharacterId)?.atk ?? 0);
    if (!Number.isFinite(ownerAtk) || !Number.isFinite(targetAtk) || ownerAtk <= 0 || targetAtk <= 0) return row;
    return markRuntimeResolved(row, Math.min(targetAtk * 0.25, ownerAtk * 0.15), {
      type: "targetStatRatioSourceCap",
      targetStat: "atk",
      targetRatio: 0.25,
      sourceStat: "atk",
      sourceCapRatio: 0.15,
      sourceStatPolicy: "ownerSelfAndAllyWideReadyBuffs",
      targetStatPolicy: "activeSelfAndAllyWideReadyBuffs",
    });
  }
  if (row.ownerId === "Hanya_00" && row.stat === "speed" && sourceTrace.includes("sourceSpeedRatio")) {
    const ownerSpeed = Number(runtimeStatsByCharacterId?.get(row.ownerId)?.speed ?? selfByCharacterId?.get(row.ownerId)?.stats?.speed ?? 0);
    if (!Number.isFinite(ownerSpeed) || ownerSpeed <= 0) return row;
    return markRuntimeResolved(row, ownerSpeed * 0.15, {
      type: "sourceStatRatio",
      sourceStat: "speed",
      ratio: 0.15,
      sourceStatPolicy: "ownerSelfAndAllyWideReadyBuffs",
    });
  }
  if (row.ownerId === "Cerydra_00" && row.stat === "critDamage" && sourceTrace.includes("source-atk-threshold-crit-damage")) {
    const ownerAtk = Number(runtimeStatsByCharacterId?.get(row.ownerId)?.atk ?? 0);
    if (!Number.isFinite(ownerAtk) || ownerAtk <= 0) return row;
    const value = Math.min(3.6, Math.max(0, Math.floor((ownerAtk - 2000 + 1e-9) / 100) * 0.18));
    return markRuntimeResolved(row, value, {
      type: "sourceAtkThresholdStep",
      sourceStat: "atk",
      threshold: 2000,
      step: 100,
      stepValue: 0.18,
      cap: 3.6,
      sourceStatPolicy: "ownerSelfAndAllyWideReadyBuffs",
    });
  }
  return row;
}

function resolveMortenaxUltimateLevelValue(stat, ownerEidolon) {
  const values = mortenaxUltimateSkillLevelValues[stat];
  if (!values) return 0;
  return Number(ownerEidolon ?? 0) >= 5 ? values.boosted : values.base;
}

function resolveCyrenePoemReceiverRow(row, sourceTrace, { activeCharacterId, partyBranchState } = {}) {
  if (!partyBranchState?.cyreneInParty || !activeCharacterId) return null;
  if (row.stat === "atkRatio" && sourceTrace.includes("atkRatio:8")) {
    if (!partyBranchState.cyreneHasAnaxa || normalizeCharacterPath(partyBranchState.activeCharacterPath) !== "erudition") {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "cyrenePoemReceiverBranch",
        poem: "reason",
        receiverCharacterId: "Anaxa_00",
        selected: false,
      });
    }
    return markRuntimeResolved({
      ...row,
      runtimeTargetCharacterId: activeCharacterId,
    }, row.resolvedValue, {
      type: "cyrenePoemReceiverBranch",
      poem: "reason",
      receiverCharacterId: "Anaxa_00",
      affectedPath: "erudition",
    });
  }
  if (row.stat === "defenseIgnore" && sourceTrace.includes("defenseIgnore:2")) {
    return resolveCyreneFixedReceiver(row, activeCharacterId, "Aglaea_00", "romance", row.resolvedValue);
  }
  if (row.stat === "defenseIgnore" && sourceTrace.includes("defenseIgnore:3")) {
    if (!partyBranchState?.cyreneHasTribbie) {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "cyrenePoemReceiverBranch",
        poem: "passage",
        receiverCharacterId: "Tribbie_00",
        selected: false,
      });
    }
    return resolveCyreneFixedReceiver(row, activeCharacterId, "Tribbie_00", "passage", 0.06);
  }
  if (row.stat === "allDamage" && sourceTrace.includes("allDamage:9")) {
    if (chrysosHeirCharacterIds.has(activeCharacterId)) {
      return markRuntimeSkipped(row, "branch_not_selected", {
        type: "cyrenePoemReceiverBranch",
        poem: "genericNonChrysos",
        receiverCharacterId: activeCharacterId,
        selected: false,
      });
    }
    return markRuntimeResolved({
      ...row,
      runtimeTargetCharacterId: activeCharacterId,
    }, 0.4, {
      type: "cyrenePoemReceiverBranch",
      poem: "genericNonChrysos",
      receiverCharacterId: activeCharacterId,
    });
  }
  if (row.stat === "allDamage" && sourceTrace.includes("allDamage:10")) {
    return resolveCyreneFixedReceiver(row, activeCharacterId, "Aglaea_00", "romance", 0.36);
  }
  if (row.stat === "allDamage" && sourceTrace.includes("allDamage:11")) {
    return resolveCyreneFixedReceiver(row, activeCharacterId, "Cipher_00", "strategy", 0.18);
  }
  if (row.stat === "allDamage" && sourceTrace.includes("allDamage:12")) {
    return resolveCyreneFixedReceiver(row, activeCharacterId, "Harscyline_00", "sea", row.resolvedValue);
  }
  if (row.stat === "allDamage" && sourceTrace.includes("allDamage:13")) {
    return resolveCyreneFixedReceiver(row, activeCharacterId, "Evernight_00", "years", row.resolvedValue);
  }
  if (row.stat === "allDamage" && sourceTrace.includes("allDamage:14")) {
    return resolveCyreneFixedReceiver(row, activeCharacterId, "DanHengPT_00", "earth", 0.12);
  }
  return null;
}

function resolveCyreneFixedReceiver(row, activeCharacterId, receiverCharacterId, poem, value) {
  if (activeCharacterId !== receiverCharacterId) {
    return markRuntimeSkipped(row, "branch_not_selected", {
      type: "cyrenePoemReceiverBranch",
      poem,
      receiverCharacterId,
      selected: false,
    });
  }
  return markRuntimeResolved({
    ...row,
    runtimeTargetCharacterId: receiverCharacterId,
  }, value, {
    type: "cyrenePoemReceiverBranch",
    poem,
    receiverCharacterId,
  });
}

function markRuntimeResolved(row, resolvedValue, runtimeResolution) {
  if (!Number.isFinite(Number(resolvedValue))) return row;
  return {
    ...row,
    resolvedValue: Number(resolvedValue),
    usedForCalculation: true,
    calculationStatus: "calculation_ready",
    blockedReason: null,
    skippedReason: null,
    runtimeResolution,
  };
}

function markRuntimeSkipped(row, reason, runtimeResolution) {
  return {
    ...row,
    resolvedValue: null,
    usedForCalculation: false,
    calculationStatus: "skipped_branch",
    blockedReason: reason,
    skippedReason: reason,
    runtimeResolution,
  };
}

function hasOtherNihilityCharacter(partyCharactersById, excludedCharacterId) {
  for (const [characterId, character] of partyCharactersById ?? []) {
    if (characterId === excludedCharacterId) continue;
    if (normalizeCharacterPath(character?.path) === "nihility") return true;
  }
  return false;
}

function calculateJingliuMoonlightStacks(partyCharactersById) {
  let memospriteCount = 0;
  for (const [characterId, character] of partyCharactersById ?? []) {
    if (characterId === "Cyrene_00") continue;
    if (normalizeCharacterPath(character?.path) === "memory") memospriteCount += 1;
  }
  return Math.min(jingliuMoonlightMaxStacks, jingliuMoonlightBaseStacks + memospriteCount);
}

function normalizeCharacterPath(path) {
  return String(path ?? "").trim().toLowerCase();
}

function resolveScenarioEffectValue(row, override) {
  const formula = override.valueFormula ?? {};
  const selectedValue = Number(override.selectedValue);
  if (!Number.isFinite(selectedValue)) return null;
  if (formula.type === "stackMultiplier") {
    return selectedValue * Number(formula.unitValue ?? 0);
  }
  if (formula.type === "statStackMultiplier") {
    return selectedValue * Number(formula.unitValues?.[row.stat] ?? 0);
  }
  if (formula.type === "thresholdValue") {
    return selectedValue >= Number(formula.threshold ?? 0) ? Number(formula.value ?? 0) : 0;
  }
  if (formula.type === "hiddenScoreCritConversion") {
    const critRateUnit = Number(formula.critRateUnit ?? 0);
    const critDamageUnit = Number(formula.critDamageUnit ?? 0);
    if (row.stat === "critRate") return Math.min(1, selectedValue * critRateUnit);
    if (row.stat === "critDamage") {
      const scoreUsedForCritRate = critRateUnit > 0 ? Math.min(selectedValue, 1 / critRateUnit) : selectedValue;
      return Math.max(0, selectedValue - scoreUsedForCritRate) * critDamageUnit;
    }
  }
  if (Number.isFinite(Number(formula.value))) return Number(formula.value);
  return selectedValue;
}

function mergeTotals(...totalsList) {
  const merged = {};
  for (const totals of totalsList) {
    for (const [stat, value] of Object.entries(totals ?? {})) {
      merged[stat] = (merged[stat] ?? 0) + Number(value ?? 0);
    }
  }
  return merged;
}

function decorateLedgerRow(row, metadata) {
  const effectRowId = row.sourceTrace?.effectRowId ?? row.effectRowId;
  const targetPolicyOverride = targetPolicyOverridesByEffectId.get(effectRowId);
  const rowMetadata = metadata ?? row.metadata ?? null;
  return {
    ...row,
    stat: rowMetadata?.stat ?? row.stat,
    targetPolicy: targetPolicyOverride ?? row.targetPolicy,
    targetExcludesOwner: Boolean(row.targetExcludesOwner || targetExcludesOwnerOverridesByEffectId.has(effectRowId)),
    metadata: rowMetadata,
    targetPolicyOverride: targetPolicyOverride ? {
      effectRowId,
      originalTargetPolicy: row.targetPolicy,
      targetPolicy: targetPolicyOverride,
    } : null,
    sourceLabel: rowMetadata?.sourceLabel ?? row.sourceLabel ?? row.ownerId ?? "unknown",
    minEidolon: rowMetadata?.minEidolon ?? row.minEidolon ?? null,
  };
}

function shouldApplyLedgerRow(row, context) {
  if (!row.usedForCalculation || typeof row.resolvedValue !== "number") {
    return { apply: false, reason: row.blockedReason ?? "not_calculation_ready" };
  }
  if (!context.partyCharacterIds.has(row.ownerId)) {
    return { apply: false, reason: "owner_not_in_party" };
  }
  const ownerEidolon = Number(context.partyEidolons.get(row.ownerId) ?? 0);
  if (Number.isFinite(Number(row.minEidolon)) && ownerEidolon < Number(row.minEidolon)) {
    return { apply: false, reason: "eidolon_requirement_not_met" };
  }
  if (row.targetExcludesOwner && row.ownerId === context.activeCharacterId) {
    return { apply: false, reason: "target_excludes_owner" };
  }
  if (row.runtimeTargetCharacterId) {
    return row.runtimeTargetCharacterId === context.activeCharacterId
      ? { apply: true }
      : { apply: false, reason: "runtime_target_for_other_character" };
  }
  const policy = normalizeTargetPolicy(row.targetPolicy);
  if (policy === "self") {
    return row.ownerId === context.activeCharacterId
      ? { apply: true }
      : { apply: false, reason: "self_effect_for_other_character" };
  }
  if (policy === "all_allies") return { apply: true };
  if (policy === "single_ally") {
    if (context.assumeSingleAllyTarget === false) {
      return { apply: false, reason: "single_ally_target_not_assumed" };
    }
    return row.ownerId !== context.activeCharacterId
      ? { apply: true }
      : { apply: false, reason: "single_ally_self_target_not_assumed" };
  }
  if (policy.startsWith("enemy")) return { apply: true };
  return { apply: false, reason: "unsupported_target_policy" };
}

function normalizeTargetPolicy(policy) {
  const text = String(policy ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  if (text === "all_allies" || text === "allallies") return "all_allies";
  if (text === "single_ally" || text === "singleally") return "single_ally";
  if (text === "enemy_single" || text === "enemysingle") return "enemy_single";
  if (text === "enemy_all" || text === "enemyall") return "enemy_all";
  return text || "unknown";
}

function isEnemyTarget(row) {
  return normalizeTargetPolicy(row.targetPolicy).startsWith("enemy");
}

function isEnemyOnlyDamageModifier(row) {
  return row?.stat === "vulnerability" && isEnemyTarget(row);
}

function sumRows(rows) {
  const totals = {};
  for (const row of rows) {
    if (typeof row.resolvedValue !== "number") continue;
    totals[row.stat] = (totals[row.stat] ?? 0) + row.resolvedValue;
  }
  return totals;
}

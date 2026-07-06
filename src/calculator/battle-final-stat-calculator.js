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
  ["effect:PlayerBoy_40:2", "enemy_all"],
  ["effect:PlayerBoy_40:0", "self"],
  ["effect:Jingliu_00:0", "self"],
  ["effect:Evanescia_00:0", "self"],
  ["effect:Phainon_00:0", "self"],
  ["effect:YaoGuang_00:0", "self"],
  ["effect:Cerydra_00:3", "single_ally"],
  ["effect:Cerydra_00:4", "single_ally"],
  ["effect:Luocha_00:1", "enemy_all"],
  ["effect:DanHengPT_00:0", "enemy_all"],
  ["effect:Constance_00:0", "enemy_all"],
  ["effect:Constance_00:1", "enemy_all"],
  ["effect:Constance_00:2", "enemy_all"],
  ["effect:BlackSwan_00:0", "enemy_all"],
  ["effect:Cipher_00:0", "enemy_all"],
  ["effect:Acheron_00:0", "enemy_all"],
  ["effect:Ashveil_00:3", "enemy_all"],
  ["effect:Ashveil_00:5", "enemy_all"],
  ["effect:Evernight_00:0", "enemy_all"],
  ["effect:Lingsha_00:1", "enemy_all"],
  ["effect:Welt_00:0", "enemy_all"],
  ["effect:MortenaxBlade_00:1", "enemy_all"],
  ["effect:MortenaxBlade_00:3", "enemy_all"],
  ["effect:Jiaoqiu_00:2", "enemy_all"],
  ["effect:Castorice_00:0", "enemy_all"],
  ["effect:Cyrene_00:16", "enemy_all"],
  ["effect:Tribbie_00:5", "enemy_all"],
  ["effect:Harscyline_00:0", "enemy_all"],
  ["effect:Harscyline_00:1", "enemy_all"],
  ["effect:Harscyline_00:6", "enemy_all"],
]);

const hyacineSignatureLightConeId = "wiki-3775";
const hyacineSignatureVulnerabilityByRank = [0.18, 0.225, 0.27, 0.315, 0.36];

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
    lightConesByCharacterId: partyLightConesByCharacterId,
    cyreneInParty: partyCharacterIds.has("Cyrene_00"),
    cyreneHasAnaxa: partyCharacterIds.has("Cyrene_00") && partyCharacterIds.has("Anaxa_00"),
    mortenaxHasOtherNihility: hasOtherNihilityCharacter(partyCharactersById, "MortenaxBlade_00"),
    cyreneHasCipher: partyCharacterIds.has("Cyrene_00") && partyCharacterIds.has("Cipher_00"),
    cyreneHasTribbie: partyCharacterIds.has("Cyrene_00") && partyCharacterIds.has("Tribbie_00"),
  };
  const metadataByEffectId = new Map((effectMetadataRows ?? []).map((row) => [row.effectRowId, row]));
  const scenarioOverridesByEffectId = buildScenarioEffectOverrides({ stateControls, scenarioSettings });
  const decoratedRows = (ledgerRows ?? []).map((row) => {
    const metadata = metadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId);
    const effectRowId = row.sourceTrace?.effectRowId ?? row.effectRowId;
    return applyScenarioEffectOverride(
      decorateLedgerRow(row, metadata),
      scenarioOverridesByEffectId.get(effectRowId),
    );
  });
  const runtimeStatsByCharacterId = buildRuntimeSourceStatsByCharacterId({
    party,
    partyCharacterIds,
    partyEidolons,
    selfByCharacterId,
    rows: decoratedRows,
  });
  const appliedRows = [];
  const skippedRows = [];

  for (const row of decoratedRows) {
    const decorated = applyRuntimeSourceStatResolution(
      row,
      { selfByCharacterId, runtimeStatsByCharacterId, activeCharacterId: activeCharacter?.characterId, partyBranchState },
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
  const enemyDebuffs = sumRows(appliedRows.filter(isEnemyTarget));
  const damageModifiers = sumRows(appliedRows.filter((row) => damageModifierKeys.has(row.stat)));
  const combinedStatTotals = mergeTotals(self.totals, battleTotals);
  const finalStats = applyStatTotalsToBase(self.stats.base, combinedStatTotals);

  return {
    activeSlot,
    activeCharacter,
    partySlots: party.map((slot) => ({
      characterId: slot.characterId,
      eidolon: Number(slot.eidolon ?? 0),
    })),
    self,
    finalStats,
    battleTotals,
    combinedStatTotals,
    enemyDebuffs,
    damageModifiers,
    appliedRows,
    skippedRows,
    sourceTrace: {
      ledgerRows: ledgerRows.length,
      partyRows: appliedRows.length + skippedRows.length,
      appliedRows: appliedRows.length,
      skippedRows: skippedRows.length,
      selfEntries: self.entries.length,
    },
  };
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

function buildRuntimeSourceStatsByCharacterId({
  party = [],
  partyCharacterIds,
  partyEidolons,
  selfByCharacterId,
  rows = [],
} = {}) {
  const result = new Map();
  for (const slot of party ?? []) {
    const characterId = slot?.characterId;
    const self = selfByCharacterId?.get(characterId);
    if (!characterId || !self?.stats?.base) continue;
    const readyAllyWideTotals = sumRows((rows ?? []).filter((row) => (
      isRuntimeSourceStatRowForCharacter(row, characterId, { partyCharacterIds, partyEidolons })
    )));
    result.set(characterId, applyStatTotalsToBase(self.stats.base, mergeTotals(self.totals, readyAllyWideTotals)));
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
  runtimeStatsByCharacterId,
  activeCharacterId,
  partyBranchState,
} = {}) {
  const sourceTrace = String(row.metadata?.sourceTrace ?? row.sourceTrace?.effectRowId ?? row.effectRowId ?? "");
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
  if (row.ownerId === "Sparkle_00" && row.stat === "critDamage" && sourceTrace.includes("critDamageShare")) {
    const ownerCritDamage = Number(selfByCharacterId?.get(row.ownerId)?.stats?.critDamage ?? 0);
    if (!Number.isFinite(ownerCritDamage) || ownerCritDamage <= 0) return row;
    return markRuntimeResolved(row, ownerCritDamage * 0.3, {
      type: "sourceStatRatio",
      sourceStat: "critDamage",
      ratio: 0.3,
      sourceStatPolicy: "ownerSelfStats",
    });
  }
  if (row.ownerId === "Robin_00" && row.stat === "atkFlat" && sourceTrace.includes("sourceCombatAtkRatioPlusFlat")) {
    const ownerAtk = Number(runtimeStatsByCharacterId?.get(row.ownerId)?.atk ?? 0);
    if (!Number.isFinite(ownerAtk) || ownerAtk <= 0) return row;
    return markRuntimeResolved(row, ownerAtk * 0.152 + 50, {
      type: "sourceStatRatioPlusFlat",
      sourceStat: "atk",
      ratio: 0.152,
      flat: 50,
      sourceStatPolicy: "ownerSelfAndAllyWideReadyBuffs",
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
    return markRuntimeResolved(row, ownerAtk * 0.18, {
      type: "sourceStatRatio",
      sourceStat: "atk",
      ratio: 0.18,
      sourceStatPolicy: "ownerSelfStats",
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
  return {
    ...row,
    stat: metadata?.stat ?? row.stat,
    targetPolicy: targetPolicyOverride ?? row.targetPolicy,
    metadata,
    targetPolicyOverride: targetPolicyOverride ? {
      effectRowId,
      originalTargetPolicy: row.targetPolicy,
      targetPolicy: targetPolicyOverride,
    } : null,
    sourceLabel: metadata?.sourceLabel ?? row.ownerId ?? "unknown",
    minEidolon: metadata?.minEidolon ?? null,
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

function sumRows(rows) {
  const totals = {};
  for (const row of rows) {
    if (typeof row.resolvedValue !== "number") continue;
    totals[row.stat] = (totals[row.stat] ?? 0) + row.resolvedValue;
  }
  return totals;
}

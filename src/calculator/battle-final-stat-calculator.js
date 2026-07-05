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
  const metadataByEffectId = new Map((effectMetadataRows ?? []).map((row) => [row.effectRowId, row]));
  const scenarioOverridesByEffectId = buildScenarioEffectOverrides({ stateControls, scenarioSettings });
  const appliedRows = [];
  const skippedRows = [];

  for (const row of ledgerRows ?? []) {
    const metadata = metadataByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId);
    const decorated = applyScenarioEffectOverride(
      decorateLedgerRow(row, metadata),
      scenarioOverridesByEffectId.get(row.sourceTrace?.effectRowId ?? row.effectRowId),
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
  return {
    ...row,
    stat: metadata?.stat ?? row.stat,
    metadata,
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

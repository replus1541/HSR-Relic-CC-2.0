export const SchemaKind = Object.freeze({
  SOURCE_ROW: "source_row",
  EFFECT_ROW: "effect_row",
  COEFFICIENT_ROW: "coefficient_row",
  CONDITION: "condition",
  STACK_RULE: "stack_rule",
  RESOLVED_EFFECT: "resolved_effect",
  COMBAT_LEDGER_ROW: "combat_ledger_row",
  AGGREGATION_RESULT: "aggregation_result",
});

export const SourceOrigin = Object.freeze({
  RAW_SOURCE: "raw_source",
  CURATED_SOURCE: "curated_source",
  MANUAL_HINT: "manual_hint",
  MANUAL_GUIDE: "manual_guide",
  FALLBACK: "fallback",
  AUDIT_REFERENCE: "audit_reference",
  EXTERNAL_IMPORT: "external_import",
});

export const SourceKind = Object.freeze({
  HOYOWIKI: "hoyowiki",
  GAME_DB_GENERATED: "game_db_generated",
  CURATED_SOURCE: "curated_source",
  EXTERNAL_IMPORT: "external_import",
  AUDIT_REFERENCE: "audit_reference",
  LEGACY_SNAPSHOT: "legacy_snapshot",
});

export const CalculationStatus = Object.freeze({
  CALCULATION_READY: "calculation_ready",
  BLOCKED: "blocked",
  REFERENCE_ONLY: "reference_only",
  PENDING_REVIEW: "pending_review",
});

export const ReviewStatus = Object.freeze({
  UNREVIEWED: "unreviewed",
  REVIEWED: "reviewed",
  SOURCE_CONFIRMED: "source_confirmed",
  NEEDS_SOURCE: "needs_source",
  REJECTED: "rejected",
});

export const ValueMode = Object.freeze({
  FIXED: "fixed",
  SKILL_LEVEL_SCALED: "skill_level_scaled",
  SUPERIMPOSITION_SCALED: "superimposition_scaled",
  EIDOLON_ADJUSTED: "eidolon_adjusted",
  DYNAMIC_FORMULA: "dynamic_formula",
  UNKNOWN: "unknown",
});

export const EffectType = Object.freeze({
  BUFF: "buff",
  DEBUFF: "debuff",
  DAMAGE_MODIFIER: "damage_modifier",
  TRIGGERED_DAMAGE: "triggered_damage",
  STAT_CONVERSION: "stat_conversion",
  RESOURCE_CHANGE: "resource_change",
});

export const TargetScope = Object.freeze({
  SELF: "self",
  SINGLE_ALLY: "single_ally",
  ALL_ALLIES: "all_allies",
  ENEMY_SINGLE: "enemy_single",
  ENEMY_ALL: "enemy_all",
  FIELD: "field",
  UNKNOWN: "unknown",
});

export const TargetProfile = Object.freeze({
  SINGLE: "single",
  BLAST: "blast",
  AOE: "aoe",
  BOUNCE: "bounce",
  SUPPORT: "support",
  SELF: "self",
  FIELD: "field",
  UNKNOWN: "unknown",
});

export const AttackType = Object.freeze({
  BASIC: "basic",
  ENHANCED_BASIC: "enhanced_basic",
  SKILL: "skill",
  ULTIMATE: "ultimate",
  FOLLOW_UP: "follow_up",
  PASSIVE_ATTACK: "passive_attack",
  MEMOSPRITE: "memosprite",
  SUMMON: "summon",
  TECHNIQUE: "technique",
  TRIGGERED_DAMAGE: "triggered_damage",
  SUPPORT: "support",
});

export const ConditionType = Object.freeze({
  EIDOLON: "eidolon",
  SKILL_LEVEL: "skill_level",
  PARTY_COMPOSITION: "party_composition",
  TARGET_STATE: "target_state",
  STACK_PRESET: "stack_preset",
  BATTLEFIELD: "battlefield",
  MANUAL_EXCLUDED: "manual_excluded",
});

export const StackType = Object.freeze({
  FIXED: "fixed",
  LIMITED_PRESET: "limited_preset",
  PARTY_AUTO: "party_auto",
  SKILLSET_AUTO_COUNT: "skillset_auto_count",
  MANUAL_ONLY: "manual_only",
});

export const BlockedReason = Object.freeze({
  MISSING_SOURCE: "missing_source",
  MANUAL_SOURCE_BLOCKED: "manual_source_blocked",
  FALLBACK_SOURCE_BLOCKED: "fallback_source_blocked",
  AUDIT_REFERENCE_ONLY: "audit_reference_only",
  VALUE_MODE_UNKNOWN: "value_mode_unknown",
  PENDING_REVIEW: "pending_review",
  MISSING_RESOLVED_VALUE: "missing_resolved_value",
  CONDITION_NOT_MET: "condition_not_met",
  CONDITION_POLICY_MISSING: "condition_policy_missing",
  TARGET_POLICY_MISSING: "target_policy_missing",
  DEDUPE_SUPERSEDED: "dedupe_superseded",
  UNSUPPORTED_DYNAMIC_FORMULA: "unsupported_dynamic_formula",
  EXTERNAL_MAPPING_UNCONFIRMED: "external_mapping_unconfirmed",
});


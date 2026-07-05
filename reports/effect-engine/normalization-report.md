# Effect Normalization Report

Generated for Task 8-A.

## Taxonomy Source

The effect normalization taxonomy is fixed from `src/data-model/schemas/schema-enums.js`.

- effectType: `EffectType`
- targetScope: `TargetScope`
- attackType: `AttackType`
- valueMode: `ValueMode`

## Unknown Policy

Unknown taxonomy values are not calculation-ready.

| field | blockedReason |
| --- | --- |
| effectType | `pending_review` |
| targetScope | `target_policy_missing` |
| attackType | `pending_review` |
| valueMode | `value_mode_unknown` |

## Deferred

- Mapping adapter `effectTargetPolicy` values such as `allAllies` to canonical target scopes is deferred to Task 8-B.
- Value resolving and dedupe are out of scope for Phase 8-A.
- Calculation logic remains out of scope.

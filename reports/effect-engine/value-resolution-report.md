# Value Resolution Report

Generated for Task 9-A.

## Contract

Value resolution converts a `NormalizedEffect` into a `ResolvedEffect` candidate.

Every resolver must return either a numeric `resolvedValue` or a `blockedReason`. A result must not contain both.

## Context Shape

```js
{
  normalizedEffect,
  skillLevel,
  eidolon,
  superimposition,
  sourceTrace,
  defaultPolicy
}
```

## Blocked Reason Policy

| valueMode | primary blockedReason |
| --- | --- |
| `fixed` | `missing_resolved_value` |
| `skill_level_scaled` | `missing_resolved_value` |
| `eidolon_adjusted` | `condition_not_met` |
| `superimposition_scaled` | `missing_resolved_value` |
| `dynamic_formula` | `unsupported_dynamic_formula` |
| `unknown` | `value_mode_unknown` |

## Fixtures Planned For 9-C

- fixed value succeeds.
- skill level context missing blocks.
- eidolon condition not met blocks.
- superimposition context missing blocks.
- dynamic formula unsupported blocks.
- unknown valueMode blocks.

## Deferred

- Resolver implementation is deferred to Task 9-B.
- Validator and fixtures are deferred to Task 9-C.
- Dedupe and aggregation are out of scope.

# Value Resolvers

Task 9-A defines the resolver contract only. Resolver implementations are added in Task 9-B.

## ValueResolutionContext

A resolver receives:

- `normalizedEffect`: the normalized effect candidate.
- `skillLevel`: active skill level for `skill_level_scaled` rows.
- `eidolon`: provider eidolon level for `eidolon_adjusted` rows.
- `superimposition`: light cone superimposition level for `superimposition_scaled` rows.
- `sourceTrace`: source ids and paths used for audit output.
- `defaultPolicy`: caller policy for optional context defaults.

## ResolverResult

A resolver returns exactly one of:

- `{ resolvedValue, valueTrace, calculationStatus: "calculation_ready" }`
- `{ blockedReason, valueTrace, calculationStatus: "blocked" }`

`resolvedValue` must not be emitted when `blockedReason` is present.

## Value Modes

| valueMode | required context | blockedReason when missing/unsupported |
| --- | --- | --- |
| `fixed` | `normalizedEffect.rawValue` | `missing_resolved_value` |
| `skill_level_scaled` | `rawValue` or scale data plus `skillLevel` | `missing_resolved_value` |
| `eidolon_adjusted` | `rawValue` plus `eidolon` | `condition_not_met` or `missing_resolved_value` |
| `superimposition_scaled` | `rawValue` or scale data plus `superimposition` | `missing_resolved_value` |
| `dynamic_formula` | formula support and required context | `unsupported_dynamic_formula` |
| `unknown` | none | `value_mode_unknown` |

## Guardrails

- Manual guide values are not accepted as resolver input.
- Unknown value modes must remain blocked.
- Dedupe and aggregation are not resolver responsibilities.

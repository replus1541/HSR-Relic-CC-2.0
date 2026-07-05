# Legacy v2 Fixtures

Generated for Task 16-A.

## Fixture Candidates

| id | legacy reference | v2 reference | expected category |
| --- | --- | --- | --- |
| playerboy20-crit-buff | character-effect-candidates | calculation-result-sample | source_guard_or_value_trace |
| playerboy00-dynamic-formula | character-effect-candidates | resolved-effects | unsupported_dynamic_formula |
| playerboy40-single-ally | character-effect-candidates | deduped-effects | target_scope_policy |
| hoyowiki-coefficients | hoyowiki-character-skills | extraction-canonical-dataset | coefficient_extraction_only |
| manual-guide-blocked | guide-or-manual-hint | source-policy | manual_source_blocked |

## Guardrails

- Legacy output is not treated as the automatic source of truth.
- v2 calculation logic is not changed during fixture definition.
- Existing project files are not modified.
- Manual guide sources remain blocked for calculation.

## Next

Task 16-B will create the compare script and split expected versus unexpected differences.

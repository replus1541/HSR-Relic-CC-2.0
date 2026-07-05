# Legacy v2 Triage

Generated for Task 16-C.

## Summary

- fixtures: 5
- expected differences: 5
- unexpected differences: 0

## Expected Categories

| category | handling |
| --- | --- |
| source_guard_or_value_trace | Keep as expected while v2 preserves source-backed trace and blocks fallback. |
| unsupported_dynamic_formula | Backlog for explicit dynamic formula resolver support. |
| target_scope_policy | Expected while v2 keeps canonical target scope explicit. |
| coefficient_extraction_only | Expected until coefficient rows are connected to later calculations. |
| manual_source_blocked | Required guardrail; manual guide/hint must remain blocked. |

## Unexpected Differences

- none

## Backlog

- Add dynamic formula resolver cases when Phase 9 is expanded.
- Expand legacy fixture coverage after more real character outputs are generated.
- Keep manual source blocked unless a future source-backed extraction replaces it.

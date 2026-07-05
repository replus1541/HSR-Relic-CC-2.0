# Canonical Dataset Report

Generated for Task 7-A.

## Scope

- `buildCanonicalDataset()` accepts adapter `sourceRows`, `effectRows`, and `coefficientRows`.
- The builder returns a stable dataset envelope with `version`, `generatedBy`, `manifest`, `rows`, and `policy` sections.
- The manifest currently records row counts and simple source/effect/coefficient distributions.

## Current Guardrails

- Source priority is not applied in Task 7-A.
- Calculation readiness policy is not applied in Task 7-A.
- Manual guide calculation remains disallowed by the dataset policy marker.
- Effect normalization and calculation logic are out of scope for this task.

## Smoke Shape

Empty input returns:

- sourceRows: 0
- effectRows: 0
- coefficientRows: 0
- priorityApplied: false
- calculationReadinessApplied: false

## Next Task

Task 7-B will add source priority and calculation readiness validation.

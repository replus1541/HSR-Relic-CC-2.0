# Combat Ledger Report

Generated for Task 11-A.

## Field Mapping

| ledger field | source |
| --- | --- |
| ledgerId | resolved effect id |
| sourceId | dedupedEffect.sourceId |
| sourceRowId | dedupedEffect.sourceId |
| canonicalEffectKey | dedupedEffect.canonicalEffectKey |
| valueMode | normalizedEffect.valueMode |
| ownerId | normalizedEffect.effectProviderId |
| subjectId | caller subjectId or ownerId |
| targetPolicy | normalizedEffect.targetScope |
| stat | dedupedEffect.stat |
| resolvedValue | used winner rows only |
| blockedReason | blocked or duplicate rows |
| usedForCalculation | winner and calculation_ready |
| sourceTrace | source/effect/resolved/key ids |

## Guardrails

- Ledger rows preserve both used and blocked effects.
- Aggregation is not performed in the ledger builder.
- Source-less used rows must fail validation in Task 11-C.

## Deferred

- Sample ledger generation is deferred to Task 11-B.
- Ledger validator/report execution is deferred to Task 11-C.

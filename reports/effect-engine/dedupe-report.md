# Dedupe Report

Generated for Task 10-A.

## Canonical Effect Key

`createCanonicalEffectKey(resolvedEffect, context)` returns a deterministic key with these ordered components:

1. providerId
2. sourceType
3. sourceId
4. sourcePath
5. effectType
6. targetScope
7. attackType
8. conditionKey
9. stackGroup
10. scalingSourcePath

## Rules

- Key generation is deterministic and lowercases/sanitizes every component.
- Missing optional fields become `none` or an explicit `unknown_*` placeholder.
- Names or display labels are not used for dedupe.
- Winner/loser policy is not implemented in Task 10-A.

## Next

Task 10-B will apply this key to resolved effects and decide winner/loser results.

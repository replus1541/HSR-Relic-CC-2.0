# Aggregation Report

Generated for Task 12-A.

## Result Shape

Aggregation consumes CombatLedger rows and returns a deterministic result envelope.

Required fields:

- id
- scenarioId
- subjectId
- inputHash
- ledgerRowIds
- statTotals
- damageModifiers
- enemyDebuffs
- partyEffects
- additionalDamage
- sourceTrace
- skippedRows

## Buckets

| bucket | purpose |
| --- | --- |
| statTotals | additive stat values by stat key |
| damageModifiers | outgoing damage modifier totals |
| enemyDebuffs | enemy-target debuff totals |
| partyEffects | ally/party shared effect totals |
| additionalDamage | triggered/additional damage placeholders |

## Guardrails

- Aggregation reads ledger rows only.
- Legacy comparison is out of scope.
- UI rendering is out of scope.
- Manual guide values are not aggregation input.

## Deferred

- Stat/damage aggregation functions are deferred to Task 12-B.
- `runCalculationV2` and validation are deferred to Task 12-C.

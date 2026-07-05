# SRTools Import Report

Generated for Task 15-B.

## Adapter

`srtoolsToLoadoutState()` converts a minimal SRTools-like JSON shape into canonical loadout state.

Sample output shape:

- sourceKind: `srtools`
- roster entries from `characters[]`
- partySlots from `party[]`
- lightcone/relic equipment keyed by character id
- eidolon/skill/superimposition hints keyed by character id

## Guardrails

- Adapter does not patch app state.
- Adapter does not run calculation.
- Manual mappings are not used as calculation source.
- Failed or missing rows stay in warnings/failedRows for preview.

## Deferred

- Import validator is deferred to Task 15-C.
- FreeSR adapter is deferred to Task 15-C.
- Import preview UI is deferred to Task 15-D.

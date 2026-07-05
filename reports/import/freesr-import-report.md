# FreeSR Import Report

Generated for Task 15-C.

## Adapter

`freesrToLoadoutState()` converts a minimal FreeSR-like JSON shape into canonical loadout state.

Sample output shape:

- sourceKind: `freesr`
- roster entries from `avatars[]`
- partySlots from `lineup[]`
- lightcone/relic equipment keyed by avatar id
- eidolon/skill/superimposition hints keyed by avatar id

## Validation

`npm.cmd run validate:imports` validates both SRTools and FreeSR sample adapters against the canonical loadout state required fields.

## Guardrails

- Adapter does not run calculation.
- Adapter does not reuse legacy party state.
- Manual guide values are not calculation input.

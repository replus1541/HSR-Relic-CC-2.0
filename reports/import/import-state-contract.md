# Import State Contract

Generated for Task 15-A.

## Canonical Loadout State

Import adapters must produce:

- version
- importId
- sourceKind
- roster
- partySlots
- equipment.lightcones
- equipment.relics
- hints.eidolon
- hints.skillLevels
- hints.superimposition
- warnings
- failedRows

## Guardrails

- Legacy party state is not reused.
- Import adapters do not run calculation.
- Guide/manual fallback values are not calculation input.
- Failed rows remain visible for preview and validation.

## Deferred

- SRTools adapter is deferred to Task 15-B.
- FreeSR adapter and import validator are deferred to Task 15-C.
- Import preview UI is deferred to Task 15-D.

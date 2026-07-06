# v2 Known Gaps

Originally generated for Task 18-B. Updated after the 2026-07-06 formula,
state-control, support-proc, and mobile UI passes.

## Calculation/Data

- Formula bucket handling is implemented for the current source-backed skill
  damage rows: normal, break, DoT, super break, elation, and true damage.
- Character state controls now resolve the reviewed dynamic rows that need
  explicit stack/count input in the calculator and condition-compare flows.
- Remaining blocked value rows are intentional context gaps, not
  `unsupported_dynamic_formula`: they require UI-selected party context, servant
  context, or other explicit battle-state input before they can be treated as
  calculation-ready rows.
- Character coverage is still limited where upstream HoyoWiki skills/eidolons
  are missing or the character is not joined/released in the current source
  snapshot.

## Import

- SRTools and FreeSR adapters validate the current v2 loadout state paths.
- Full external export compatibility still needs expanded real-export fixture
  coverage beyond the local samples.

## Legacy Diff

- Legacy diff uses v2 fixture categories and does not execute the old app runtime.
- More representative character fixtures should be added before broad parity
  claims.

## UI

- The main calculator, stat/damage calculation, character state controls, party
  recommendation, and condition-compare flows are implemented for the current v2
  data path.
- Full external import application and end-to-end editing coverage still need
  broader fixtures and workflow verification.

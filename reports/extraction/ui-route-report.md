# Extraction UI Route Report

Generated for Task 14-C.

## Connected Display

- Overview separates ready and blocked extraction counts from generated status.
- Detail route separates source-backed ready rows from blocked source rows.
- `SourceStatusBadge` renders `manual_hint` and `manual_guide` as blocked even when no current generated row uses them.

## Guardrails

- UI reads generated canonical/status JSON only.
- UI does not run adapters, normalization, value resolution, dedupe, ledger building, or aggregation.
- Manual hint rows are display-only blocked rows and never calculation-ready.

## Next

Phase 15 connects import state contracts and import adapters.

# Validation Policy

Generated for Task 17-C.

## Required Commands

Run before completing a Phase or release checkpoint:

- `npm.cmd run validate`
- `npm.cmd run build`

Run when relevant to the touched area:

- `npm.cmd run diff:legacy` for legacy comparison work.
- `npm.cmd run validate:imports` for import adapter/preview work.
- `npm.cmd run verify:app` for route shell or generated data smoke work.

## Validation Coverage

`npm.cmd run validate` runs:

- schema fixtures
- legacy manifest
- adapter outputs
- canonical dataset/status
- effect normalization
- value resolution
- dedupe
- combat ledger
- aggregation
- imports

## Reporting Rules

- Failed validation is reported as failed, not converted into a known gap.
- Known gaps are documented only after the relevant command result is stated.
- Existing `C:\CODEX\HSR RELIC CC` files remain read-only unless separately approved.
- Manual guide/hint rows remain blocked for calculation.

# Adapter Contract

Task 5-A 결과입니다. 모든 source adapter가 따라야 할 interface와 output contract를 문서로 고정합니다.

## 목표

- legacy/reference/source 데이터를 canonical row 후보로 변환하는 경계를 정의합니다.
- adapter가 계산 결과를 만들지 않도록 제한합니다.
- source provenance, report, validation flow를 모든 adapter에 공통 적용합니다.
- 기존 `C:\CODEX\HSR RELIC CC` 프로젝트는 수정하지 않습니다.

## Adapter 책임

Adapter는 아래 일만 수행합니다.

1. source 또는 snapshot을 읽습니다.
2. raw source row를 canonical `SourceRow` 후보로 변환합니다.
3. 필요한 경우 `EffectRow` 또는 `CoefficientRow` 후보를 생성합니다.
4. 변환 과정의 success/blocked/skipped count를 report로 남깁니다.
5. adapter output validator가 검사할 수 있는 shape를 반환합니다.

Adapter가 하지 않는 일:

- damage calculation
- buff/debuff final aggregation
- active effect dedupe
- value resolver 실행
- UI state patch
- party slot 변경
- manual guide value를 calculation-ready로 승격

## Adapter Interface

Phase 5-B skeleton은 아래 형태를 기준으로 작성합니다.

```js
{
  adapterId: "local-json",
  sourceKind: "legacy_snapshot",
  load(context) {},
  normalize(input, context) {},
  report(result, context) {}
}
```

### `adapterId`

- stable kebab-case id입니다.
- 예: `local-json`, `hoyowiki`, `curated-source`, `srtools-import`, `freesr-import`.

### `sourceKind`

`SourceKind` enum과 맞아야 합니다.

- `hoyowiki`
- `game_db_generated`
- `curated_source`
- `external_import`
- `audit_reference`
- `legacy_snapshot`

### `load(context)`

입력 source를 읽어 raw payload를 반환합니다.

규칙:

- runtime UI bundle에서 자동 실행하지 않습니다.
- `data/legacy-reference/manifest.json` entry를 읽을 경우 `prohibitedRuntimeImport` 정책을 유지합니다.
- 파일이 없으면 adapter report에 blocked/skipped로 남겨야 합니다.

### `normalize(input, context)`

raw payload를 canonical row 후보로 변환합니다.

출력 후보:

- `sourceRows`
- `effectRows`
- `coefficientRows`
- `blockedRows`
- `warnings`

규칙:

- 모든 calculation candidate는 source provenance를 가져야 합니다.
- `manual_hint`, `manual_guide`, `fallback`, `audit_reference`는 calculation-ready가 될 수 없습니다.
- source path와 source record를 잃지 않아야 합니다.

### `report(result, context)`

adapter 실행 결과를 사람이 검수할 수 있는 형태로 요약합니다.

필수 count:

- `sourceRows`
- `effectRows`
- `coefficientRows`
- `blockedRows`
- `warnings`
- `errors`

## Adapter Output Shape

```js
{
  adapterId: "local-json",
  sourceKind: "legacy_snapshot",
  input: {
    manifestEntryId: "legacy:character-effect-candidates",
    snapshotPath: "data/legacy-reference/game-db/character-effect-candidates.json"
  },
  output: {
    sourceRows: [],
    effectRows: [],
    coefficientRows: [],
    blockedRows: []
  },
  report: {
    status: "ok",
    counts: {
      sourceRows: 0,
      effectRows: 0,
      coefficientRows: 0,
      blockedRows: 0,
      warnings: 0,
      errors: 0
    },
    warnings: [],
    errors: []
  }
}
```

## Validation Flow

1. Adapter registry selects adapter by `adapterId`.
2. Adapter loads source snapshot or external input.
3. Adapter normalizes raw input into canonical row candidates.
4. Adapter output validator checks:
   - valid source kind
   - valid source origin
   - source path and record presence
   - manual/reference sources blocked
   - calculation-ready rows have source provenance
5. Adapter report is written to `reports/adapter/`.
6. Later phases consume generated canonical dataset, not raw legacy snapshot directly.

## Source Guard Requirements

Calculation-ready output must satisfy:

- `sourceId` or equivalent source trace exists.
- `sourceOrigin` is `raw_source` or eligible `curated_source`.
- `sourcePath` and `sourceRecord` are present.
- `calculationStatus` is `calculation_ready`.
- `manual_hint`, `manual_guide`, `fallback`, `audit_reference` are excluded.

Blocked output must preserve:

- original source id/path/record when available
- `blockedReason`
- enough text/path context for review UI

## Manifest Integration

Adapters that read `data/legacy-reference/manifest.json` must respect:

- `prohibitedRuntimeImport: true`
- `allowCalculationSourcePromotion: false`
- `requiresSourceProvenance: true`
- `manualGuideCalculationBlocked: true`

Manifest entries with `calculationUse: source_linkage_metadata_only` may help connect source rows but are not calculation rows by themselves.

## Phase 5-B Skeleton Requirements

Task 5-B should add:

- `src/adapters/adapter-contract.js`
- `src/adapters/adapter-registry.js`
- placeholder adapter folders with README files

The skeleton should be importable and side-effect free. It should not parse legacy JSON yet.


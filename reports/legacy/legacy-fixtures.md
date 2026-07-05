# Legacy Fixture Policy

Task 4-A 결과입니다. 이 문서는 Phase 4에서 legacy reference snapshot을 어떤 형식과 용도로 보관할지 정의합니다.

## 목표

- v2 adapter 개발에 필요한 최소 legacy reference만 보관합니다.
- snapshot 파일은 runtime 계산기가 직접 import하지 않습니다.
- source-backed 후보와 reference-only, blocked calculation 자료를 manifest에서 분리합니다.
- 기존 `C:\CODEX\HSR RELIC CC` 프로젝트는 수정하지 않습니다.

## Manifest 파일

예시 파일:

- `data/legacy-reference/manifest.example.json`

Phase 4-B에서 실제 snapshot을 만들 때는 아래 파일을 생성합니다.

- `data/legacy-reference/manifest.json`

## Manifest 필드

| 필드 | 설명 |
| --- | --- |
| `schemaVersion` | manifest schema version입니다. |
| `sourceProjectRoot` | legacy project root입니다. |
| `snapshotRoot` | v2 내부 snapshot root입니다. |
| `policy.prohibitedRuntimeImport` | snapshot을 runtime app에서 직접 import하면 안 된다는 기본 정책입니다. |
| `policy.allowCalculationSourcePromotion` | snapshot 자체를 계산 source로 승격할 수 있는지입니다. 기본 false입니다. |
| `entries[].id` | manifest entry stable id입니다. |
| `entries[].sourceProjectPath` | legacy project 기준 원본 상대 경로입니다. |
| `entries[].snapshotPath` | v2 project 기준 snapshot 상대 경로입니다. |
| `entries[].purpose` | `adapter_input_candidate`, `reference_only`, `blocked_calculation_reference` 중 하나입니다. |
| `entries[].sourceOrigin` | canonical SourceOrigin 후보입니다. |
| `entries[].sourceKind` | canonical SourceKind 후보입니다. |
| `entries[].prohibitedRuntimeImport` | 개별 파일 runtime import 금지 여부입니다. |
| `entries[].calculationUse` | adapter가 사용할 수 있는 범위입니다. |
| `entries[].blockedReason` | reference-only 또는 blocked 자료의 계산 금지 이유입니다. |

## Snapshot 분류

### Adapter input candidate

Phase 6~7 adapter가 읽을 수 있는 후보입니다.

- `data/game-db/hoyowiki-character-base-stats.json`
- `data/game-db/hoyowiki-character-trace-stats.json`
- `data/game-db/hoyowiki-character-skills.json`
- `data/game-db/character-skill-db.json`
- `data/game-db/character-stat-baseline.json`
- `data/game-db/character-effect-candidates.json`
- `data/game-db/attack-skill-inventory.json`
- `data/game-db/attack-coefficient-candidates.json`
- `data/game-db/lightcone-effect-candidates.json`
- `data/character-effects/curated-source-effects.json`
- `data/character-effects/source-effect-mappings.json`

조건:

- v2 runtime이 직접 import하지 않습니다.
- adapter가 canonical `SourceRow`, `EffectRow`, `CoefficientRow`로 변환하기 전 source guard를 통과해야 합니다.
- source path, source record, source text 또는 URL이 유지되어야 합니다.

### Reference only

validator, blocked reason, migration policy를 설계할 때만 참고합니다.

- `data/audit/*`
- `tools/audit_active_effect_*`
- `tools/generate_*`, `tools/extract_*`, `tools/probe_*`
- `src/srtools/audit/*`

조건:

- 계산 source로 사용하지 않습니다.
- adapter output으로 직접 변환하지 않습니다.
- report 또는 validator 요구사항의 근거로만 남깁니다.

### Blocked calculation reference

v2에서 계산 입력으로 쓰면 안 되는 legacy 자료입니다.

- `data/character-effects/character-guides.json`
- `data/character-effects/default-builds.json`
- `data/audit/manual-guide-effect-fallbacks.json`
- `src/sample-data.js`
- `src/model/damage.js`
- `src/srtools/manual-mappings.js`
- `src/srtools/import/srtools-import-preview.js`
- `src/srtools/import/srtools-app-adapter.js`

조건:

- `manual_source_blocked`, `fallback_source_blocked`, `audit_reference_only`, `external_mapping_unconfirmed` 같은 blocked reason을 남깁니다.
- schema, validator, UI 검수 정책 참고로만 사용합니다.
- calculation-ready row로 승격하지 않습니다.

## Phase 4-B 최소 복사 후보

Phase 4-B에서는 전체 legacy data를 복사하지 않고 아래 최소 후보부터 시작합니다.

1. `data/game-db/hoyowiki-character-skills.json`
2. `data/game-db/character-effect-candidates.json`
3. `data/game-db/attack-coefficient-candidates.json`
4. `data/game-db/lightcone-effect-candidates.json`
5. `data/character-effects/curated-source-effects.json`
6. `data/character-effects/source-effect-mappings.json`

추가 후보는 manifest에 `reference_only` 또는 `blocked_calculation_reference`로 먼저 등록한 뒤 복사 여부를 결정합니다.

## 금지

- 기존 프로젝트 수정 금지.
- 대량 데이터 복사 금지.
- snapshot을 runtime app에서 직접 import 금지.
- guide/default build/manual mapping을 source-backed 계산 입력으로 승격 금지.
- adapter, schema validator 확장, calculation 구현을 Task 4-A에서 진행 금지.

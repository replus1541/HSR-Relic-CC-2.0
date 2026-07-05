# Legacy Source Map

Task 2-B 결과입니다. 기존 `C:\CODEX\HSR RELIC CC`의 data/logic 파일군을 v2에서 어떤 목적으로만 참조할지 분류합니다.

## Task 2-B 범위

- 읽은 기존 경로:
  - `C:\CODEX\HSR RELIC CC\data`
  - `C:\CODEX\HSR RELIC CC\src\sample-data.js`
  - `C:\CODEX\HSR RELIC CC\src\model\damage.js`
  - `C:\CODEX\HSR RELIC CC\src\srtools`
  - `C:\CODEX\HSR RELIC CC\src\freesr`
  - `C:\CODEX\HSR RELIC CC\tools`
- v2 수정 경로:
  - `C:\CODEX\HSR RELIC CC 2.0\reports\legacy\legacy-source-map.md`
  - `C:\CODEX\HSR RELIC CC 2.0\reports\legacy\adapter-input-map.md`
  - `C:\CODEX\HSR RELIC CC 2.0\HSR_RELIC_CC_v2_phase_log.md`

## 공통 금지 원칙

- 기존 `C:\CODEX\HSR RELIC CC` 프로젝트는 수정하지 않습니다.
- legacy data를 v2 runtime으로 import하지 않습니다.
- 계산 로직, schema, adapter, effect-engine은 구현하지 않습니다.
- `manual_hint` / `manual_guide` / guide 기반 값을 계산 입력으로 승격하지 않습니다.
- UI는 legacy result shape를 재구성하지 않고, 이후 canonical ledger / aggregation result만 표시해야 합니다.

## Directory Map

| 기존 경로 | 분류 | 판단 |
| --- | --- | --- |
| `data/game-db` | adapter input 후보 | HoYoWiki, battle record probe, attack coefficient, character skill/base stat 후보가 모여 있습니다. v2 canonical snapshot 후보입니다. |
| `data/character-effects` | 혼합 | `curated-source-effects.json`, `source-effect-mappings.json`은 source-backed 후보입니다. `character-guides.json`, `default-builds.json`는 guide/default build 성격이 있어 계산 입력 금지 또는 참고 전용입니다. |
| `data/audit` | legacy reference | source quality, manual guide fallback, dynamic formula audit 결과입니다. v2 source guard 설계 참고용이며 runtime import 금지입니다. |
| `data/config (2).json`, `data/config (3).json` | legacy reference | 외부 config 샘플로 보입니다. Phase 4 snapshot 후보 여부는 별도 확인이 필요합니다. |
| `src/sample-data.js` | rewrite 금지 | game-db, guides, generated relic/lightcone data, manual relic sets를 하나로 조립합니다. v2에서는 adapter output으로 대체해야 합니다. |
| `src/model/damage.js` | rewrite 금지 | `calculateScenario`, ledger 생성, active effect 적용, combat stat 합산, damage 계산이 한 파일에 결합되어 있습니다. v2 effect-engine 설계 전 복사 금지입니다. |
| `src/srtools/import/srtools-import-parser.js` | adapter input 참고 | SRTools raw relic string, main/sub stat id map, forced value parsing이 있습니다. v2 adapter 설계 참고용입니다. |
| `src/freesr/import/freesr-import-parser.js` | adapter input 참고 | FreeSR shape를 SRTools-like config로 변환합니다. v2 FreeSR adapter input 분석에 사용합니다. |
| `src/srtools/import/srtools-import-preview.js` | rewrite 금지 | import preview와 app slot/relic build 적용 로직이 legacy party state와 relic normalization에 묶여 있습니다. |
| `src/srtools/import/srtools-app-adapter.js` | rewrite 금지 | `sample-data`, manual mappings, SRTools audit index, FreeSR 변환을 app state에 직접 연결합니다. |
| `src/srtools/manual-mappings.js` | legacy reference | localStorage 기반 수동 매핑입니다. v2에서는 manual mapping을 계산 source로 쓰지 않고 mapping audit metadata로만 다뤄야 합니다. |
| `src/srtools/srtools-mapping-resolver.js` | adapter input 참고 | external id to internal id resolver입니다. manual mapping source는 blocked metadata로 분리해야 합니다. |
| `src/srtools/audit/*` | legacy reference | SRTools audit UI와 builder입니다. v2에서는 reports/reference로만 참고합니다. |
| `tools/hoyowiki/*`, `tools/fetch_hoyowiki_*` | adapter input 후보 | HoYoWiki raw source fetch/generation 도구입니다. v2 Phase 4 snapshot 구성 시 source provenance를 확인할 후보입니다. |
| `tools/extract_*`, `tools/probe_*`, `tools/generate_*` | legacy reference | game-db 산출물 생성 이력입니다. v2에서 바로 실행하거나 import하지 않고 snapshot provenance 확인용으로만 사용합니다. |
| `tools/audit_active_effect_*` | legacy reference | manual/guide/source quality guard의 근거입니다. v2 validator 요구사항에 반영할 참고 자료입니다. |
| `tools/verify_*` | legacy reference | 기존 앱 검증 도구입니다. v2 검증 명령으로 직접 가져오지 않습니다. |

## Data File Map

### `data/game-db`

- adapter input 후보:
  - `hoyowiki-character-base-stats.json`
  - `hoyowiki-character-trace-stats.json`
  - `hoyowiki-character-skills.json`
  - `character-skill-db.json`
  - `character-stat-baseline.json`
  - `character-effect-candidates.json`
  - `attack-skill-inventory.json`
  - `attack-coefficient-candidates.json`
  - `lightcone-effect-candidates.json`
- legacy reference:
  - `battle-*-probes.json`
  - `character-db-prep.json`
  - `character-path-validation.json`
  - `calculation-readiness-matrix.json`
  - `localization-key-probe.json`
- 처리 원칙:
  - Phase 4에서 read-only snapshot으로 고정한 뒤 Phase 5 adapter에서 canonical row로 변환합니다.
  - source field, source text, source origin이 없는 값은 계산 가능 row로 승격하지 않습니다.

### `data/character-effects`

- adapter input 후보:
  - `curated-source-effects.json`
  - `source-effect-mappings.json`
- legacy reference:
  - `source-builds-2026-03-plus.json`
- 계산 입력 금지:
  - `character-guides.json`
  - `default-builds.json`
- 처리 원칙:
  - guide/default build는 추천 UI나 fixture 참고로만 분리합니다.
  - `manual_hint` 또는 guide-derived effect는 blocked reason이 있는 non-calculation row로만 남겨야 합니다.

### `data/audit`

- legacy reference:
  - `active-effect-source-audit.json`
  - `active-effect-quality-report.json`
  - `active-effect-dynamic-formula-audit.json`
  - `active-effect-priority-token-decode.json`
  - `dynamic-formula-condition-policy.json`
  - `manual-guide-effect-fallbacks.json`
- 처리 원칙:
  - v2 source guard와 validator 요구사항을 만들 때 참고합니다.
  - audit 결과 자체를 계산 source로 사용하지 않습니다.

## Logic File Map

| 기존 파일 | 분류 | v2 처리 |
| --- | --- | --- |
| `src/model/damage.js` | rewrite 금지 | Phase 9 이후 source-backed engine을 새로 작성하기 전까지 복사 금지입니다. |
| `src/sample-data.js` | rewrite 금지 | data import, guide merge, manual relic sets, character assembly를 adapter pipeline으로 분해해야 합니다. |
| `src/srtools/import/srtools-import-parser.js` | adapter input 참고 | raw format parser 요구사항만 문서화합니다. v2 구현은 Phase 15에서 새 adapter로 작성합니다. |
| `src/freesr/import/freesr-import-parser.js` | adapter input 참고 | FreeSR input shape와 roster/loadout ordering 요구사항을 문서화합니다. |
| `src/srtools/import/srtools-import-preview.js` | rewrite 금지 | app state patch, relic build normalization, preview policy가 섞여 있어 직접 재사용 금지입니다. |
| `src/srtools/import/srtools-app-adapter.js` | rewrite 금지 | legacy app dependency와 manual mapping load가 포함됩니다. |
| `src/srtools/srtools-mapping-resolver.js` | adapter input 참고 | id/name mapping rule은 참고하되 manual source는 blocked metadata로 분리합니다. |
| `src/srtools/audit/audit-builders.js` | legacy reference | audit index 구성 참고 전용입니다. |

## Rewrite 금지로 넘길 항목

- `src/model/damage.js` 전체 계산 흐름:
  - `calculateScenario`
  - `buildBuffLedger`
  - `buildCombatStats`
  - `calculateDamage`
  - active effect resolution
- `src/sample-data.js`의 guide merge와 manual relic set fallback.
- SRTools/FreeSR import preview가 legacy party state에 직접 patch하는 흐름.
- manual mapping 결과를 `calculationStatus: applied`로 취급하는 흐름.
- audit report를 runtime calculation source처럼 쓰는 흐름.

## Phase 4 Snapshot 후보

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

이 후보는 아직 v2에 복사하지 않습니다. Phase 4에서 snapshot 기준과 provenance를 확정한 뒤 가져옵니다.

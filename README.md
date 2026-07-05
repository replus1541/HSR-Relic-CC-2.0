# HSR RELIC CC v2.0

HSR RELIC CC v2.0은 기존 `HSR RELIC CC`를 직접 수정하지 않고 새 구조로 재구성하는 독립 프로젝트입니다.

기존 프로젝트는 legacy reference와 비교 기준으로만 사용합니다. v2 작업은 이 폴더 안에서만 진행하며, 기존 프로젝트의 `sample-data.js`, `damage.js`, active effect 생성 로직을 v2 핵심 구조로 그대로 가져오지 않습니다.

## 방향

```text
source adapter
-> extraction canonical dataset
-> normalized effect row
-> value resolver
-> dedupe resolver
-> combat ledger
-> stat/damage aggregator
-> 기존 스타일 기반 UI
```

## Phase 1-A 범위

현재 단계는 npm/Vite/React 프로젝트 골격만 만듭니다.

포함:

- Vite React app shell
- 기본 route shell
- v2 도메인 폴더
- 폴더별 README

제외:

- 계산 로직
- adapter 구현
- schema 구현
- effect-engine 구현
- canonical dataset 생성
- 기존 프로젝트 파일 수정

## Phase 기반 개발 방식

작업은 `HSR_RELIC_CC_v2_refactoring_step_plan.md`의 Phase 순서를 따르되, 실제 실행과 커밋은 더 작은 Task 단위로 진행합니다. 각 Phase는 시작/진행/완료 내용을 `HSR_RELIC_CC_v2_phase_log.md`에 기록하고, 완료 가능한 Task가 끝날 때마다 git commit을 남깁니다.

Phase 1은 프로젝트 골격과 문서 기준을 고정하는 단계입니다. 계산, adapter, schema, effect-engine 구현은 후속 Phase에서만 진행합니다.

Task 기준:

- 한 Task는 검증하거나 설명할 수 있는 최소 작업 단위입니다.
- 한 커밋에는 하나의 Task만 담습니다.
- Phase Log에는 Phase 상태와 Task 결과를 함께 기록합니다.
- Phase 전체가 끝나지 않았더라도 완료된 Task는 커밋합니다.

## 계산 데이터 원칙

v2 계산에 들어갈 수 있는 데이터는 source-backed row로 제한합니다.

계산 가능:

- `raw_source`
- source text/path/review status가 있는 `curated_source`

계산 금지:

- `manual_hint`
- `manual_guide`
- `missing_extraction`
- 출처 없는 fallback
- `valueMode: unknown`

## UI 표시 원칙

UI는 계산값을 직접 재구성하지 않습니다.

정상 흐름:

```text
effect-engine
-> CombatLedger
-> aggregation result
-> UI 표시
```

따라서 화면에 보이는 수치와 계산에 사용된 수치는 같은 ledger row 또는 aggregation result를 참조해야 합니다.

## React / 구조 / 경량화 원칙

- Vite + modern React를 기본으로 사용합니다.
- route shell, domain module, UI component, data/model layer를 분리합니다.
- 거대한 `main.jsx`나 UI/계산/데이터가 섞인 파일을 만들지 않습니다.
- 의존성은 필요한 Phase에서만 추가합니다.
- Phase 1에서는 `react`, `react-dom`, `vite`, `@vitejs/plugin-react`만 사용합니다.
- reference-only data는 runtime bundle에 직접 묶지 않습니다.
- heavy route와 generated data는 후속 Phase에서 lazy loading/chunk 분리를 검토합니다.

## 실행

```powershell
npm.cmd install
npm.cmd run dev:local
npm.cmd run build
```

## 작업 기록

Phase 진행 기록은 `HSR_RELIC_CC_v2_phase_log.md`에 남깁니다.

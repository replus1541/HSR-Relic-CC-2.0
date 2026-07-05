# HSR RELIC CC v2.0 Phase Log

이 문서는 `HSR_RELIC_CC_v2_refactoring_step_plan.md`의 각 Phase를 실제로 진행할 때마다 남기는 작업 기록입니다.

## 기록 규칙

- Phase를 시작하면 해당 Phase의 `시작` 항목을 먼저 남깁니다.
- 작업 중 의미 있는 설계 결정, 파일 생성, 검증 결과, 막힌 점을 즉시 기록합니다.
- 작업 진행 시마다 완료 가능한 Task 단위로 git commit을 남깁니다.
- 한 커밋에는 하나의 Task만 담고, Phase 전체가 끝나기 전이라도 완료된 Task는 커밋합니다.
- Phase가 끝나면 `완료 기준`, `검증 결과`, `다음 Phase로 넘길 항목`을 정리합니다.
- 실패하거나 되돌린 작업도 삭제하지 않고 기록합니다.
- 기존 `HSR RELIC CC` 프로젝트를 참조하거나 복사한 경우 원본 경로를 남깁니다.
- source-backed 계산 원칙, manual guide 계산 금지, ledger 기준 표시 원칙을 어긴 예외가 있으면 반드시 기록합니다.

## 공통 기록 템플릿

```md
## Phase N. 제목

### 상태

- 상태: not_started | in_progress | blocked | complete
- 시작일:
- 완료일:
- 관련 계획 문서:

### 목표

-

### 진행 기록

- YYYY-MM-DD:

### 생성/수정 파일

-

### 설계 결정

-

### 검증

-

### 막힌 점 / 리스크

-

### 다음 Phase로 넘길 항목

-
```

---

## Planning Task. Phase 2~18 Task Breakdown

### 상태

- 상태: complete
- 시작일: 2026-07-05
- 완료일: 2026-07-05
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 목표

- Phase 1 완료 후 Phase 2~18을 Codex 실행 가능한 Task 단위로 세분화합니다.

### 진행 기록

- 2026-07-05: `HSR_RELIC_CC_v2_refactoring_step_plan.md`에 `Phase 2~18 Task Breakdown` 섹션을 추가했습니다.
- 2026-07-05: 각 Phase 아래에 `Task N-A`, `Task N-B`, `Task N-C` 형식의 하위 작업을 만들고, Phase 15는 import preview 범위 때문에 `Task 15-D`까지 분리했습니다.
- 2026-07-05: 모든 Task에 목표, 작업 범위, 하지 말 것, 생성/수정 파일, 검증 명령, 완료 기준, 다음 Task로 넘길 항목을 포함했습니다.
- 2026-07-05: Phase Log 기록 기준을 Task 완료와 Phase 완료로 구분하도록 세분화 문서에 반복 명시했습니다.

### 생성/수정 파일

- `HSR_RELIC_CC_v2_refactoring_step_plan.md`
- `HSR_RELIC_CC_v2_phase_log.md`

### 설계 결정

- Phase 구조는 유지하고 실제 진행 단위만 Task로 쪼갭니다.
- Phase 전체 완료는 모든 하위 Task 완료 후에만 기록합니다.
- 기존 프로젝트 수정 금지, 계산 로직 조기 구현 금지, manual guide 계산 유입 금지 원칙을 모든 Task에 반복 기재합니다.

### 검증

- `npm.cmd run build`: 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- 기존 `C:\CODEX\HSR RELIC CC` 변경 여부 확인: tracked file 변경 없음. 기존 reference untracked 파일 2개만 확인.

### 막힌 점 / 리스크

- 없음

### 다음 Phase로 넘길 항목

- Phase 2부터는 세분화된 Task 2-A 기준으로 시작합니다.

---

## Phase 1. v2 프로젝트 골격 생성

### 상태

- 상태: complete
- 시작일: 2026-07-05
- 완료일: 2026-07-05
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 목표

- `HSR RELIC CC 2.0`을 독립 Vite/React 프로젝트로 만들고 기본 route shell을 준비합니다.

### 진행 기록

- 2026-07-05: Phase 1-A 시작. 독립 npm/Vite/React 프로젝트 골격 생성 범위로 진행하며, 계산/adapter/schema/effect-engine 구현은 제외합니다.
- 2026-07-05: `C:\CODEX\HSR RELIC CC 2.0`에서 git repo를 초기화하고 기본 branch를 `main`으로 설정했습니다.
- 2026-07-05: Vite/React app shell과 route placeholder를 생성했습니다. 의존성은 `react`, `react-dom`, `vite`, `@vitejs/plugin-react`만 사용했습니다.
- 2026-07-05: v2 도메인 폴더와 README placeholder를 생성했습니다. 계산/adapter/schema/effect-engine 구현은 추가하지 않았습니다.
- 2026-07-05: `npm.cmd install` 성공. 65 packages 설치, 취약점 0건.
- 2026-07-05: `npm.cmd run build` 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- 2026-07-05: 상태 표기를 Phase 1 전체 완료가 아니라 `Phase 1-A complete`로 정정했습니다. Phase 1의 나머지 세부 작업은 별도 요청 시 이어서 진행합니다.
- 2026-07-05: Phase 1-B 시작. 코드 기능 추가 없이 Phase Log, root README, report README, domain README의 진행 기준을 보강합니다.
- 2026-07-05: Phase 1-B 완료. 기존 프로젝트와의 관계, Phase 기반 개발 방식, source-backed 계산 원칙, manual_hint 계산 금지, ledger/aggregation UI 표시 원칙, 모던 React/경량 dependency/layer 분리 원칙을 문서에 반영했습니다.
- 2026-07-05: Phase 1-B 검증으로 `npm.cmd run build` 성공. Vite 7.3.6 기준 34 modules transformed.
- 2026-07-05: Phase 단위가 아니라 완료 가능한 Task 단위로 작업/커밋한다는 원칙을 root README와 Phase Log에 명시했습니다.
- 2026-07-05: Phase 1-C 시작. v2 repo top-level, 기존 repo top-level, 기존 프로젝트 변경 여부, build, route shell을 확인했습니다.
- 2026-07-05: `git -C "C:\CODEX\HSR RELIC CC 2.0" rev-parse --show-toplevel` 결과는 `C:/CODEX/HSR RELIC CC 2.0`입니다.
- 2026-07-05: `git -C "C:\CODEX\HSR RELIC CC" rev-parse --show-toplevel` 결과는 `C:/CODEX/HSR RELIC CC`입니다.
- 2026-07-05: 기존 `C:\CODEX\HSR RELIC CC`에는 이번 작업으로 수정된 tracked file이 없고, 기존 reference untracked 파일 2개만 남아 있음을 확인했습니다.
- 2026-07-05: `npm.cmd run build` 성공. Vite 7.3.6 기준 34 modules transformed.
- 2026-07-05: `npm.cmd run dev:local -- --port 5174`로 dev server를 실행해 `/`, `/extraction`, `/ledger`, `/legacy-diff`가 모두 HTTP 200과 React root shell을 반환함을 확인하고 서버를 종료했습니다.
- 2026-07-05: Phase 1-C 완료. Phase 1-A/B/C 기준 Phase 1은 완료 처리합니다.

### 생성/수정 파일

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`
- `src/main.jsx`
- `src/app/App.jsx`
- `src/app/route-config.js`
- `src/app/routes/*`
- `src/ui/app.css`
- `README.md`
- `src/*/README.md`
- `data/*/README.md`
- `reports/*/README.md`
- `tools/README.md`
- `reports/ui-reuse/README.md`
- `reports/legacy/README.md`

### 설계 결정

- Phase 1-A에서는 React Router를 추가하지 않고 `window.location.pathname` 기반 route shell만 사용합니다.
- `lucide-react` 등 추가 UI 라이브러리는 넣지 않았습니다.
- 기존 프로젝트 CSS 전체 복사는 하지 않고 최소 app shell CSS만 작성했습니다.
- Phase 1-B에서 기능 코드는 추가하지 않고 README와 Phase Log만 정리했습니다.
- 이후 UI는 ledger/aggregation result만 표시하고, 계산값 재구성은 금지합니다.
- Phase 1-C에서 route 확인은 dev server를 임시 포트 5174로 띄워 HTTP 응답과 React root shell 존재 여부만 검증했습니다.

### 검증

- `npm.cmd install`: 성공, 취약점 0건.
- `npm.cmd run build`: 성공.
- Phase 1-B `npm.cmd run build`: 성공.
- Phase 1-C `npm.cmd run build`: 성공.
- Phase 1-C route shell 확인: `/`, `/extraction`, `/ledger`, `/legacy-diff` 모두 HTTP 200.
- v2 repo top-level: `C:/CODEX/HSR RELIC CC 2.0`.
- 기존 repo top-level: `C:/CODEX/HSR RELIC CC`.
- 기존 프로젝트 tracked 변경: 없음.

### 막힌 점 / 리스크

- 없음.

### 다음 Phase로 넘길 항목

- Phase 2에서 기존 `HSR RELIC CC`의 UI/데이터/로직 재사용 가능 범위를 파일 단위로 분류해야 합니다.
- 실제 데이터, adapter, schema, effect-engine 구현은 후속 Phase에서 진행합니다.

---

## Phase 2. 기존 구조 재사용/금지 맵 작성

### 상태

- 상태: complete
- 시작일: 2026-07-05
- 완료일: 2026-07-05
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

- 2026-07-05: Task 2-A 시작. 기존 UI 관련 파일을 읽고 재사용/참고/재작성/금지 기준으로 분류합니다.
- 2026-07-05: `src/components`, `src/calculator`, `src/conditions`, `src/active-effects`, `src/styles.css`를 UI 관점으로 검토했습니다.
- 2026-07-05: `reports/ui-reuse/ui-source-map.md`를 작성했습니다. 계산 호출, guide 기반 판단, source grouping, damage recompute가 섞인 UI/analysis 파일은 금지 또는 재작성 대상으로 분류했습니다.
- 2026-07-05: Task 2-A complete. 다음 Task 2-B에는 legacy data/logic source map과 adapter input 후보 분리를 넘깁니다.
- 2026-07-05: Task 2-B 시작. 기존 `data`, `sample-data.js`, `model/damage.js`, `src/srtools`, `src/freesr`, `tools` 구조를 검토했습니다.
- 2026-07-05: `reports/legacy/legacy-source-map.md`와 `reports/legacy/adapter-input-map.md`를 작성했습니다.
- 2026-07-05: `game-db`와 source-backed curated effect 파일은 adapter input 후보로, `character-guides.json`, `default-builds.json`, `sample-data.js`, `model/damage.js`는 계산 입력 또는 복사 금지 대상으로 분리했습니다.
- 2026-07-05: Task 2-B complete. 다음 Task 2-C에는 legacy guide fallback, UI 계산 재구성, damage.js 직접 합산, manual mapping 계산 적용 금지 항목을 넘깁니다.
- 2026-07-05: PC 종료 이후 Task 2-B 산출물, 마지막 커밋 `f7c1099`, clean working tree, `npm.cmd run build` 성공을 재확인해 Task 2-B 완료 상태를 확정했습니다.
- 2026-07-05: Task 2-C 시작. 기존 guide fallback, activeEffects 생성, UI 계산 재구성, 이름 문자열 dedupe, `damage.js` 직접 합산, SRTools/FreeSR app-state patch 흐름을 rewrite 금지 대상으로 정리했습니다.
- 2026-07-05: `reports/legacy/rewrite-ban-list.md`를 작성했습니다. Phase 3 canonical schema에 넘길 source provenance, calculation eligibility, value resolution trace, identity separation, effect axes, dedupe trace, UI traceability, manual/reference isolation 요구사항을 정리했습니다.
- 2026-07-05: Task 2-C complete. Phase 2-A/B/C 기준 Phase 2는 완료 처리합니다.

### 생성/수정 파일

- `reports/ui-reuse/ui-source-map.md`
- `reports/legacy/legacy-source-map.md`
- `reports/legacy/adapter-input-map.md`
- `reports/legacy/rewrite-ban-list.md`
- `HSR_RELIC_CC_v2_phase_log.md`

### 설계 결정

- 기존 `components`의 error boundary/error panel/number input은 작은 UI 구조만 참고하고 v2 dependency 기준에 맞춰 새로 작성합니다.
- `CalculatorRoute.jsx`처럼 route, state, import, calculation orchestration이 섞인 파일은 v2에서 직접 재사용하지 않습니다.
- `DamageResultPanel.jsx`의 ledger 표시 방향은 참고하되 legacy `skillRows`와 formatter dependency는 가져오지 않습니다.
- `character-role.jsx`, `condition-policy.js`, `calculator/analysis/*`, `active-effects` grouping 유틸은 계산/guide/source grouping이 섞여 Task 2-B/2-C에서 금지 대상으로 재확인합니다.
- Phase 4 snapshot 후보는 source-backed `game-db`와 curated source effect 파일로 제한하고, guide/default build/audit 파일은 reference 또는 blocked 설계 참고로 분리합니다.
- SRTools/FreeSR parser shape는 adapter 요구사항으로 참고하지만, legacy app state patch와 manual mapping 적용 흐름은 직접 재사용하지 않습니다.
- Phase 3 schema는 source guard를 먼저 표현할 수 있어야 하며, source provenance와 calculation eligibility를 분리해야 합니다.
- UI는 ledger/aggregation result를 표시만 해야 하며, legacy UI처럼 source grouping이나 damage recompute를 수행하지 않습니다.

### 검증

- `npm.cmd run build`: 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run build`: Task 2-B 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run build`: Task 2-B 재확인 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run build`: Task 2-C 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.

### 막힌 점 / 리스크

- 기존 `CustomSelect.jsx`는 keyboard UX 참고 가치가 있지만 `lucide-react` 의존성이 있어 v2 Phase 1 dependency 원칙상 직접 재사용하지 않습니다.
- 금지 목록은 이후 구현 중 우회 복사를 막기 위한 기준이며, 필요한 동작은 schema/adapter/effect-engine Phase에서 새 구조로 다시 작성해야 합니다.

### 다음 Phase로 넘길 항목

- Phase 3에서 `SourceRow`, `EffectRow`, `ResolvedEffect`, `CombatLedgerRow`, `AggregationResult` schema에 source provenance와 blocked reason을 필수 필드로 반영합니다.
- `manual_hint`, `manual_guide`, fallback, audit report, manual mapping은 계산 가능 row가 아니라 reference/blocked metadata로 표현해야 합니다.
- provider, target, calculation subject, enemy target policy를 문자열 하나로 축약하지 않고 별도 schema 축으로 분리합니다.

---

## Phase 3. Canonical Schema 정의

### 상태

- 상태: complete
- 시작일: 2026-07-05
- 완료일: 2026-07-05
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

- 2026-07-05: Task 3-A 시작. runtime 구현 없이 canonical data model 문서를 먼저 작성합니다.
- 2026-07-05: `docs/canonical-data-model.md`를 작성했습니다. `SourceRow`, `EffectRow`, `CoefficientRow`, `Condition`, `StackRule`, `ResolvedEffect`, `CombatLedgerRow`, `AggregationResult`의 필수/선택 필드와 계산 가능 여부 필드를 문서화했습니다.
- 2026-07-05: `manual_hint`, `manual_guide`, fallback, audit reference가 계산 가능 row로 들어가지 않도록 source guard와 blocked reason 후보를 문서에 포함했습니다.
- 2026-07-05: Task 3-A complete. 다음 Task 3-B에는 source origin, calculation status, blocked reason, value mode, effect type, attack type, target profile enum skeleton 작성을 넘깁니다.
- 2026-07-05: Task 3-B 시작. validation/adapter/effect-engine/calculation 구현 없이 schema naming과 enum skeleton만 코드로 고정합니다.
- 2026-07-05: `src/data-model/schemas/schema-enums.js`, `schema-types.js`, `index.js`를 추가했습니다. source, value, target, attack, condition, stack, blocked reason enum과 JSDoc typedef skeleton만 포함합니다.
- 2026-07-05: `src/data-model/README.md`와 `src/data-model/schemas/README.md`에 현재 구현 범위와 금지 사항을 기록했습니다.
- 2026-07-05: Task 3-B complete. 다음 Task 3-C에는 schema fixture와 validator에서 검사할 enum 목록, source guard, manual guard, value guard를 넘깁니다.
- 2026-07-05: Task 3-C 시작. adapter/effect normalization/calculation 구현 없이 source guard를 검사할 최소 validator와 schema fixture를 추가합니다.
- 2026-07-05: `src/data-model/schema-validator.js`, `tools/validate_schema.mjs`, `data/generated/schema-fixtures/*.json`를 추가했습니다.
- 2026-07-05: 계산 가능 `raw_source`, 계산 가능 `curated_source`, 계산 불가 `manual_hint` fixture를 만들고, validator가 `manual_hint`를 `calculation_ready`로 바꾼 경우 실패하는지 확인하도록 했습니다.
- 2026-07-05: `package.json`에 `validate:schema` 스크립트를 추가했습니다.
- 2026-07-05: Task 3-C complete. Phase 3-A/B/C 기준 Phase 3은 완료 처리합니다.

### 생성/수정 파일

- `docs/canonical-data-model.md`
- `src/data-model/schemas/schema-enums.js`
- `src/data-model/schemas/schema-types.js`
- `src/data-model/schemas/index.js`
- `src/data-model/schema-validator.js`
- `data/generated/schema-fixtures/raw-source-ready.json`
- `data/generated/schema-fixtures/curated-source-ready.json`
- `data/generated/schema-fixtures/manual-hint-blocked.json`
- `tools/validate_schema.mjs`
- `package.json`
- `src/data-model/README.md`
- `src/data-model/schemas/README.md`
- `HSR_RELIC_CC_v2_phase_log.md`

### 설계 결정

- schema runtime 구현 전에 문서로 field contract를 먼저 고정합니다.
- source provenance와 calculation eligibility는 분리된 필드로 표현합니다.
- provider, target, calculation subject, enemy target policy는 effect row에서 별도 축으로 유지합니다.
- ledger row id와 aggregation row id를 UI trace 기준으로 사용합니다.
- Task 3-B 코드 skeleton은 import 가능한 상수와 JSDoc typedef만 포함하며, runtime validator와 계산 로직은 포함하지 않습니다.
- target 관련 enum은 effect 대상 범위인 `TargetScope`와 공격/계수 대상 형태인 `TargetProfile`을 분리합니다.
- Task 3-C validator는 source row guard만 검사합니다. adapter, effect normalizer, value resolver, damage calculation은 구현하지 않습니다.
- `manual_hint`, `manual_guide`, fallback, audit reference는 `blocked` 또는 `reference_only` 상태와 `blockedReason`을 요구합니다.

### 검증

- `npm.cmd run build`: Task 3-A 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run build`: Task 3-B 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run validate:schema`: Task 3-C 성공. fixtures=3, manual_hint_guard=blocked.
- `npm.cmd run build`: Task 3-C 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.

### 막힌 점 / 리스크

- 없음.

### 다음 Task로 넘길 항목

- `sourceOrigin`, `calculationStatus`, `blockedReason`, `valueMode`, `effectType`, `attackType`, `targetProfile` enum skeleton을 `src/data-model/schemas`에 작성합니다.
- Phase 4에서 legacy reference snapshot manifest를 설계합니다.
- Phase 5 adapter output validator는 Task 3-C의 source guard와 enum 검사를 재사용할 수 있습니다.

---

## Phase 4. Legacy Reference Snapshot 구성

### 상태

- 상태: complete
- 시작일: 2026-07-05
- 완료일: 2026-07-05
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

- 2026-07-05: Task 4-A 시작. 대량 데이터 복사 없이 legacy snapshot manifest schema와 snapshot 정책만 문서화합니다.
- 2026-07-05: `data/legacy-reference/manifest.example.json`을 작성했습니다. adapter input candidate, reference only, blocked calculation reference entry 형식을 정의했습니다.
- 2026-07-05: `reports/legacy/legacy-fixtures.md`를 작성했습니다. Phase 4-B 최소 복사 후보와 runtime direct import 금지 정책을 정리했습니다.
- 2026-07-05: Task 4-A complete. 다음 Task 4-B에는 실제 복사할 최소 legacy reference 후보 6개를 넘깁니다.
- 2026-07-05: Task 4-B 시작. 기존 프로젝트는 읽기만 하고, Phase 6~7 adapter 개발에 필요한 최소 legacy reference JSON 6개만 v2 `data/legacy-reference`로 복사합니다.
- 2026-07-05: `game-db` snapshot 4개와 `character-effects` snapshot 2개를 복사했습니다. 복사 대상은 `hoyowiki-character-skills`, `character-effect-candidates`, `attack-coefficient-candidates`, `lightcone-effect-candidates`, `curated-source-effects`, `source-effect-mappings`입니다.
- 2026-07-05: `data/legacy-reference/manifest.json`을 작성했습니다. 각 entry에 source path, snapshot path, source origin/kind, runtime import 금지, calculation use, bytes를 기록했습니다.
- 2026-07-05: Task 4-B complete. 다음 Task 4-C에는 manifest 파일 존재, path, purpose, prohibitedRuntimeImport flag 검증을 넘깁니다.
- 2026-07-05: Task 4-C 시작. adapter/calculation 구현 없이 legacy manifest 검증 스크립트와 report 생성을 추가합니다.
- 2026-07-05: `tools/validate_legacy_manifest.mjs`와 `validate:legacy` script를 추가했습니다. manifest schemaVersion, policy, entry id, snapshot path, purpose, `prohibitedRuntimeImport`, bytes를 검증합니다.
- 2026-07-05: 첫 `npm.cmd run validate:legacy`는 manifest 검증 후 report write에서 Windows EPERM으로 실패했습니다. 같은 Task 범위에서 권한 상승 재실행했고 성공했습니다.
- 2026-07-05: `reports/legacy/legacy-manifest-report.md`를 생성했습니다. manifest entries 6개, failed 0개를 기록했습니다.
- 2026-07-05: Task 4-C complete. Phase 4-A/B/C 기준 Phase 4는 완료 처리합니다.

### 생성/수정 파일

- `data/legacy-reference/manifest.example.json`
- `data/legacy-reference/manifest.json`
- `data/legacy-reference/game-db/hoyowiki-character-skills.json`
- `data/legacy-reference/game-db/character-effect-candidates.json`
- `data/legacy-reference/game-db/attack-coefficient-candidates.json`
- `data/legacy-reference/game-db/lightcone-effect-candidates.json`
- `data/legacy-reference/character-effects/curated-source-effects.json`
- `data/legacy-reference/character-effects/source-effect-mappings.json`
- `reports/legacy/legacy-fixtures.md`
- `reports/legacy/legacy-manifest-report.md`
- `tools/validate_legacy_manifest.mjs`
- `package.json`
- `HSR_RELIC_CC_v2_phase_log.md`

### 설계 결정

- legacy snapshot은 v2 runtime 계산기가 직접 import하지 않습니다.
- manifest entry는 `purpose`, `sourceOrigin`, `sourceKind`, `prohibitedRuntimeImport`, `calculationUse`, `blockedReason`을 분리해서 기록합니다.
- Phase 4-B 복사는 최소 adapter input 후보부터 시작하고, guide/default/manual mapping 자료는 blocked/reference로만 둡니다.
- Phase 4-B snapshot은 runtime import 연결 없이 파일 보관과 manifest 기록까지만 수행합니다.
- Phase 4-C validation은 manifest와 snapshot 파일 존재/정책만 검사하며 adapter 변환은 수행하지 않습니다.

### 검증

- `npm.cmd run build`: Task 4-A 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run build`: Task 4-B 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run validate:legacy`: 첫 실행은 report write EPERM으로 실패, 권한 상승 재실행 성공. entries=6, failed=0.
- `npm.cmd run build`: Task 4-C 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.

### 막힌 점 / 리스크

- 없음.

### 다음 Task로 넘길 항목

- Phase 4-B에서 최소 legacy reference 후보를 `data/legacy-reference`로 복사하고 `manifest.json`을 작성합니다.
- Phase 4-C에서 `manifest.json`의 entry path 존재, purpose, `prohibitedRuntimeImport: true`를 검증합니다.
- Phase 5-A에서 adapter contract를 문서화하고, Phase 4 manifest entry shape를 adapter input contract에 반영합니다.

---

## Phase 5. Source Adapter 기본 프레임 구현

### 상태

- 상태: complete
- 시작일: 2026-07-05
- 완료일: 2026-07-05
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

- 2026-07-05: Task 5-A 시작. 실제 source adapter 구현 없이 adapter interface와 output contract를 문서화합니다.
- 2026-07-05: `reports/adapter/adapter-contract.md`를 작성했습니다. `adapterId`, `sourceKind`, `load`, `normalize`, `report`, output shape, validation flow, source guard, manifest integration을 정의했습니다.
- 2026-07-05: `src/adapters/README.md`에 contract 위치와 adapter report/count 원칙을 반영했습니다.
- 2026-07-05: Task 5-A complete. 다음 Task 5-B에는 side-effect 없는 adapter registry skeleton과 placeholder adapter 폴더를 넘깁니다.
- 2026-07-05: Task 5-B 시작. 실제 legacy/HoyoWiki parsing 없이 adapter registry와 contract helper skeleton만 작성합니다.
- 2026-07-05: `src/adapters/adapter-contract.js`와 `src/adapters/adapter-registry.js`를 추가했습니다. `local-json`, `hoyowiki`, `curated-source` placeholder adapter를 registry에 등록했습니다.
- 2026-07-05: placeholder adapter README 3개를 추가했습니다. 각 README에는 현재 파싱/계산 로직이 없고 이후 Phase에서 구현한다는 제한을 기록했습니다.
- 2026-07-05: adapter registry import smoke를 실행해 `local-json,hoyowiki,curated-source`가 side-effect 없이 import되는 것을 확인했습니다.
- 2026-07-05: Task 5-B complete. 다음 Task 5-C에는 adapter output validator 입력 shape와 placeholder output 검증을 넘깁니다.
- 2026-07-05: Task 5-C 시작. 실제 adapter 구현 없이 adapter output shape validator와 검증 명령을 추가합니다.
- 2026-07-05: `src/adapters/adapter-validator.js`와 `tools/validate_adapters.mjs`를 추가했습니다. SourceRow는 schema validator와 연결하고 EffectRow/CoefficientRow는 필수 필드와 enum을 최소 검증합니다.
- 2026-07-05: `package.json`에 `validate:adapters`를 추가했습니다. placeholder adapter 3개 output과 invalid `manual_hint` fixture 실패 guard를 검증합니다.
- 2026-07-05: Task 5-C complete. Phase 5-A/B/C 기준 Phase 5는 완료 처리합니다.

### 생성/수정 파일

- `reports/adapter/adapter-contract.md`
- `src/adapters/adapter-contract.js`
- `src/adapters/adapter-registry.js`
- `src/adapters/local-json/README.md`
- `src/adapters/hoyowiki/README.md`
- `src/adapters/curated-source/README.md`
- `src/adapters/adapter-validator.js`
- `tools/validate_adapters.mjs`
- `package.json`
- `src/adapters/README.md`
- `HSR_RELIC_CC_v2_phase_log.md`

### 설계 결정

- adapter는 source/snapshot을 canonical row 후보로 변환하는 경계이며 damage calculation을 수행하지 않습니다.
- output은 `sourceRows`, `effectRows`, `coefficientRows`, `blockedRows`, report counts를 포함해야 합니다.
- manifest entry의 `prohibitedRuntimeImport`, `allowCalculationSourcePromotion`, source provenance 정책을 adapter contract에 반영합니다.
- registry skeleton은 import 가능하고 side effect가 없어야 합니다.
- placeholder adapters는 empty output/report만 반환하며 source 파일을 읽지 않습니다.
- adapter output validator는 placeholder adapter output을 허용하되, `manual_hint`가 calculation-ready로 들어오는 경우를 차단합니다.

### 검증

- `npm.cmd run build`: Task 5-A 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- adapter registry import smoke: 성공. `local-json,hoyowiki,curated-source`.
- `npm.cmd run build`: Task 5-B 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run validate:adapters`: Task 5-C 성공. adapters=3, invalid_manual_hint_guard=blocked.
- `npm.cmd run build`: Task 5-C 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.

### 막힌 점 / 리스크

- 없음.

### 다음 Task로 넘길 항목

- Phase 5-B에서 `src/adapters/adapter-contract.js`, `src/adapters/adapter-registry.js`, placeholder adapter README를 작성합니다.
- Phase 5-C에서 adapter output validator를 추가하고 placeholder adapter output이 canonical 최소 shape를 만족하는지 검사합니다.
- Phase 6-A에서 local JSON adapter가 `data/legacy-reference/manifest.json`의 최소 snapshot subset을 읽어 SourceRow/EffectRow 후보를 생성합니다.

---

## Phase 6. Local JSON / HoyoWiki Adapter 구현

### 상태

- 상태: complete
- 시작일: 2026-07-05
- 완료일: 2026-07-05
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

- 2026-07-05: Task 6-A 시작. 기존 프로젝트 수정 없이 v2 legacy reference snapshot 일부를 읽는 local JSON adapter 최소 구현을 추가합니다.
- 2026-07-05: `src/adapters/local-json/local-json-adapter.js`를 추가하고 registry의 `local-json` placeholder를 실제 최소 adapter로 교체했습니다.
- 2026-07-05: adapter는 `data/legacy-reference/manifest.json`에서 `character-effect-candidates`, `hoyowiki-character-skills`, `attack-coefficient-candidates` snapshot을 읽고, active effect가 있는 최소 3명 캐릭터에서 SourceRow/EffectRow 후보를 생성합니다.
- 2026-07-05: `tools/validate_adapters.mjs`가 local-json report를 생성하도록 확장했습니다. 첫 실행은 report write EPERM으로 실패했고, 같은 Task 범위에서 권한 상승 재실행해 성공했습니다.
- 2026-07-05: `reports/adapter/local-json-report.md`를 생성했습니다. sourceRows 9개, effectRows 9개, sampledCharacters 3명, skillCharactersAvailable 90, coefficientCharactersAvailable 95를 기록했습니다.
- 2026-07-05: character baseline snapshot은 Phase 4-B manifest에 없어 adapter report warning으로 남겼습니다.
- 2026-07-05: Task 6-A complete. 다음 Task 6-B에는 HoyoWiki row 결합 기준과 sourceText/sourcePath guard를 넘깁니다.
- 2026-07-05: Task 6-B 시작. remote fetch 없이 Phase 4-B HoyoWiki skill snapshot을 읽는 최소 adapter를 구현합니다.
- 2026-07-05: `src/adapters/hoyowiki/hoyowiki-adapter.js`를 추가하고 registry의 `hoyowiki` placeholder를 실제 최소 adapter로 교체했습니다.
- 2026-07-05: HoyoWiki adapter는 skill description이 있는 row만 calculation-ready SourceRow로 내보내고, coefficient table을 CoefficientRow 후보로 변환합니다.
- 2026-07-05: `reports/adapter/hoyowiki-report.md`를 생성했습니다. sourceRows 17개, coefficientRows 24개, sampledCharacters 3명을 기록했습니다.
- 2026-07-05: calculation-ready SourceRow의 `sourceText`와 `sourcePath` 존재 여부를 smoke로 확인했습니다.
- 2026-07-05: Task 6-B complete. 다음 Task 6-C에는 adapter run script와 generated output 생성을 넘깁니다.
- 2026-07-05: Task 6-C 시작. local-json/HoyoWiki adapter output을 generated JSON으로 저장하는 adapter runner를 추가합니다.
- 2026-07-05: `tools/run_adapters.mjs`와 `data:adapters` script를 추가했습니다. 첫 실행은 `data/generated/source-rows.json` write EPERM으로 실패했고, 같은 Task 범위에서 권한 상승 재실행해 성공했습니다.
- 2026-07-05: `data/generated/source-rows.json`, `effect-rows.json`, `coefficient-rows.json`를 생성했습니다. sourceRows 26개, effectRows 9개, coefficientRows 24개입니다.
- 2026-07-05: `reports/adapter/adapter-run-report.md`를 생성했습니다. adapter별 row count와 warning count를 기록했습니다.
- 2026-07-05: Task 6-C complete. Phase 6-A/B/C 기준 Phase 6은 완료 처리합니다.

### 생성/수정 파일

- `src/adapters/local-json/local-json-adapter.js`
- `src/adapters/hoyowiki/hoyowiki-adapter.js`
- `src/adapters/adapter-registry.js`
- `src/adapters/local-json/README.md`
- `src/adapters/hoyowiki/README.md`
- `tools/validate_adapters.mjs`
- `reports/adapter/local-json-report.md`
- `reports/adapter/hoyowiki-report.md`
- `tools/run_adapters.mjs`
- `data/generated/source-rows.json`
- `data/generated/effect-rows.json`
- `data/generated/coefficient-rows.json`
- `reports/adapter/adapter-run-report.md`
- `package.json`
- `HSR_RELIC_CC_v2_phase_log.md`

### 설계 결정

- local-json adapter는 runtime UI wiring 없이 manifest snapshot을 직접 읽는 adapter layer로만 동작합니다.
- Task 6-A에서는 EffectRow 후보만 만들고 CoefficientRow 변환은 아직 하지 않습니다.
- baseline snapshot 부재는 계산 누락으로 처리하지 않고 adapter report warning으로 남깁니다.
- `manual_hint`나 guide fallback은 adapter output으로 승격하지 않습니다.
- HoyoWiki adapter는 source description이 있는 skill row만 calculation-ready SourceRow로 내보냅니다.
- HoyoWiki adapter의 coefficient row는 아직 계산에 사용하지 않고 adapter output 후보로만 검증합니다.
- `data:adapters` output은 canonical dataset 병합이 아니라 adapter별 row 후보를 단순 연결한 generated output입니다.
- curated-source adapter는 아직 placeholder라 row 0개를 반환합니다.

### 검증

- `npm.cmd run validate:adapters`: 첫 실행은 report write EPERM으로 실패, 권한 상승 재실행 성공. adapters=3, invalid_manual_hint_guard=blocked.
- local-json output smoke: sampledCharacters 3명, sourceRows 9개, effectRows 9개.
- `npm.cmd run build`: Task 6-A 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run validate:adapters`: Task 6-B 성공. adapters=3, invalid_manual_hint_guard=blocked.
- HoyoWiki output smoke: sourceRows 17개, coefficientRows 24개, sourceText/sourcePath missing 0개.
- `npm.cmd run build`: Task 6-B 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.
- `npm.cmd run data:adapters`: 첫 실행은 generated output write EPERM으로 실패, 권한 상승 재실행 성공. sourceRows=26, effectRows=9, coefficientRows=24.
- `npm.cmd run validate:adapters`: Task 6-C 성공. adapters=3, invalid_manual_hint_guard=blocked.
- generated output smoke: sourceRows 26개, effectRows 9개, coefficientRows 24개.
- `npm.cmd run build`: Task 6-C 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.

### 막힌 점 / 리스크

- Phase 4-B snapshot에 character baseline 파일이 없어 baseline row 변환은 아직 수행하지 않습니다.

### 다음 Task로 넘길 항목

- Phase 6-B에서 HoyoWiki adapter가 skill text/source path를 SourceRow로 변환하고 sourceText/sourcePath 없는 calculation-ready row를 차단합니다.
- Phase 6-C에서 adapter runner가 local-json/HoyoWiki output을 `data/generated/source-rows.json`, `effect-rows.json`, `coefficient-rows.json`로 저장합니다.
- Phase 7-A에서 generated adapter output을 받아 canonical dataset shape로 묶는 skeleton을 작성합니다.

---

## Phase 7. Extraction Canonical Dataset 생성

### 상태

- 상태: in_progress
- 시작일: 2026-07-05
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

- Task 7-A 시작: adapter output을 canonical dataset envelope로 묶는 skeleton을 작성합니다.
- `src/extraction/build-canonical-dataset.js`를 추가해 source/effect/coefficient rows 입력, manifest counts, source/effect/coefficient 분포, policy marker를 반환하도록 했습니다.
- `reports/extraction/canonical-dataset-report.md`에 Task 7-A 범위와 7-B로 넘길 source priority/readiness 정책을 기록했습니다.
- priority 병합, 계산 가능 여부 판정, effect normalization, 계산 로직은 구현하지 않았습니다.
- Task 7-B 시작: `src/extraction/source-policy.js`를 추가해 sourceOrigin 기반 priority와 calculationReady 정책을 정의했습니다.
- canonical dataset builder가 source policy marker를 적용하도록 갱신했습니다. manual_hint/manual_guide/fallback/audit_reference는 계산 가능 row로 승격하지 않습니다.
- `tools/validate_canonical_dataset.mjs`와 `validate:canonical-dataset` script를 추가해 manual_hint 계산 가능 우회가 검증 실패하도록 했습니다.
- Task 7-C 시작: validator를 generated output writer로 확장해 `data/generated/extraction-canonical-dataset.json`와 `data/generated/extraction-status.json`를 생성했습니다.
- extraction status는 owner 6개 기준으로 sourceRows 26개, effectRows 9개, coefficientRows 24개를 집계합니다. 현재 generated input 기준 blockedRows는 0개입니다.
- `reports/extraction/canonical-dataset-report.md`를 dataset/status 집계 report로 갱신했습니다.
- Phase 7 완료: canonical dataset shape, source policy, extraction readiness/status output까지 생성했습니다.

### 검증

- `npm.cmd run validate:canonical-dataset`: 성공. sourceRows=26, ready=26, blocked=0, statusCharacters=6, manual_hint_guard=blocked.
- `npm.cmd run build`: 성공. Vite 7.3.6 기준 34 modules transformed, production build 완료.

### 다음 Task로 넘길 항목

- Phase 8-A에서 effect taxonomy constants와 unknown 처리 정책을 정의합니다.

---

## Phase 8. Effect Normalizer 구현

### 상태

- 상태: in_progress
- 시작일: 2026-07-05
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

- Task 8-A 시작: `src/data-model/schemas/schema-enums.js`의 EffectType/TargetScope/AttackType/ValueMode를 effect normalization taxonomy source로 고정했습니다.
- `src/effect-engine/effect-taxonomy.js`에 taxonomy constants, known-value predicate, unknown taxonomy policy를 추가했습니다.
- `reports/effect-engine/normalization-report.md`에 unknown taxonomy는 계산 불가 후보로 처리한다는 정책을 기록했습니다.
- value resolving, dedupe, 계산 로직, adapter target policy mapping은 구현하지 않았습니다.

---

## Phase 9. Value Resolver 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 10. Dedupe Resolver 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 11. Combat Ledger 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 12. Aggregator 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 13. v2 UI Shell 연결

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 14. Extraction 상세 라우트 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 15. SRTools / FreeSR v2 Import 연결

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 16. Legacy 비교 시스템 구축

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 17. 검증 체계 고정

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 18. 1차 통합 완료

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

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

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 4. Legacy Reference Snapshot 구성

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 5. Source Adapter 기본 프레임 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 6. Local JSON / HoyoWiki Adapter 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 7. Extraction Canonical Dataset 생성

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

---

## Phase 8. Effect Normalizer 구현

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

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

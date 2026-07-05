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

## Phase 1. v2 프로젝트 골격 생성

### 상태

- 상태: Phase 1-A complete
- 시작일: 2026-07-05
- 완료일: Phase 1-A 2026-07-05
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

### 검증

- `npm.cmd install`: 성공, 취약점 0건.
- `npm.cmd run build`: 성공.
- Phase 1-B `npm.cmd run build`: 성공.

### 막힌 점 / 리스크

- 없음.

### 다음 Phase로 넘길 항목

- Phase 2에서 기존 `HSR RELIC CC`의 UI/데이터/로직 재사용 가능 범위를 파일 단위로 분류해야 합니다.
- Phase 1-A는 route shell만 만들었으므로 실제 데이터, adapter, schema, effect-engine 구현은 후속 Phase에서 진행합니다.
- Phase 1-A와 Phase 1-B 기준으로는 Phase 1 완료 처리 가능 상태입니다. 추가로 로컬 route 육안 확인이나 dev server smoke가 필요하면 별도 Phase 1-C로 진행합니다.

---

## Phase 2. 기존 구조 재사용/금지 맵 작성

### 상태

- 상태: not_started
- 시작일:
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 진행 기록

-

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

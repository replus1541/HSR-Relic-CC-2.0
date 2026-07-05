# HSR RELIC CC v2.0 Phase Log

이 문서는 `HSR_RELIC_CC_v2_refactoring_step_plan.md`의 각 Phase를 실제로 진행할 때마다 남기는 작업 기록입니다.

## 기록 규칙

- Phase를 시작하면 해당 Phase의 `시작` 항목을 먼저 남깁니다.
- 작업 중 의미 있는 설계 결정, 파일 생성, 검증 결과, 막힌 점을 즉시 기록합니다.
- 작업 진행 시마다 완료 가능한 단계 단위로 git commit을 남깁니다.
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

- 상태: in_progress
- 시작일: 2026-07-05
- 완료일:
- 관련 계획 문서: `HSR_RELIC_CC_v2_refactoring_step_plan.md`

### 목표

- `HSR RELIC CC 2.0`을 독립 Vite/React 프로젝트로 만들고 기본 route shell을 준비합니다.

### 진행 기록

- 2026-07-05: Phase 1-A 시작. 독립 npm/Vite/React 프로젝트 골격 생성 범위로 진행하며, 계산/adapter/schema/effect-engine 구현은 제외합니다.
- 2026-07-05: `C:\CODEX\HSR RELIC CC 2.0`에서 git repo를 초기화하고 기본 branch를 `main`으로 설정했습니다.

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

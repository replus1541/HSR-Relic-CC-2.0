# HSR RELIC CC v2.0

HSR RELIC CC v2.0은 기존 `HSR RELIC CC`를 직접 수정하지 않고 새 구조로 재구성하는 독립 프로젝트입니다.

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

## 실행

```powershell
npm.cmd install
npm.cmd run dev:local
npm.cmd run build
```

## 작업 기록

Phase 진행 기록은 `HSR_RELIC_CC_v2_phase_log.md`에 남깁니다.

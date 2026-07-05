# legacy

기존 HSR RELIC CC 구조 분석, legacy source map, rewrite 금지 목록을 기록합니다.

Phase 2와 Phase 4에서 채웁니다.

## 기록 기준

- 기존 프로젝트는 유지하며 v2에서 직접 수정하지 않습니다.
- legacy 파일은 reference, adapter input, diff fixture 중 하나로 분류합니다.
- `sample-data.js`, `damage.js`, 기존 active effect 생성 방식은 v2 핵심 구조로 직접 복사하지 않습니다.
- manual guide/fallback 기반 계산 row 생성은 rewrite 금지 목록에 포함합니다.
- source-backed curated row와 manual hint를 명확히 구분합니다.

## Phase 2 산출물

- `legacy-source-map.md`
- `rewrite-ban-list.md`
- `adapter-input-map.md`

## Phase 4 산출물

- legacy reference manifest
- legacy fixture 목록
- 기존 계산 결과 snapshot 목록

# extraction

Extraction canonical dataset과 검토 화면의 도메인 로직을 두는 영역입니다.

Phase 1-A에서는 canonical dataset 생성이나 `/extraction` 상세 구현을 하지 않습니다.

## 원칙

- Extraction canonical dataset은 v2 계산 전 단계의 단일 기준 데이터입니다.
- sourceRows, effectRows, coefficientRows, curatedSources, manualHints, missingExtractions를 분리합니다.
- `/extraction` UI는 계산 readiness와 source trace를 확인하는 화면입니다.
- 계산 가능한 row와 계산 금지 row를 명확히 구분합니다.
- 후속 Phase의 `/extraction/:characterId`는 ledger 연결 여부까지 표시해야 합니다.

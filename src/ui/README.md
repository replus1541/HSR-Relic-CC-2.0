# ui

공통 UI 스타일과 재사용 가능한 presentational component를 둘 영역입니다.

기존 HSR RELIC CC의 CSS 전체 복사는 금지합니다. v2 UI는 작은 표시 컴포넌트와 route-level composition으로 나눕니다.

## 원칙

- UI는 `CombatLedger`와 aggregation result를 표시하는 역할에 집중합니다.
- UI component 안에서 effect 합산, source dedupe, value resolving을 수행하지 않습니다.
- 기존 앱의 톤과 흐름은 참고하되, v2에서는 작은 presentational component와 route-level composition을 선호합니다.
- 경량 dependency를 유지하며, 아이콘/차트/상태관리 라이브러리는 필요가 확인된 Phase에서만 추가합니다.
- 텍스트와 카드 밀도는 모바일 기준으로 먼저 검토합니다.
- UI Task는 표시 컴포넌트, route composition, styling을 가능한 한 분리해 커밋합니다.

## Task 13-A Inventory

- Card: repeated item frame.
- Panel: route section group.
- Badge: status/source/blocked label.
- Tabs: route-local view switch.
- TraceRow: source/ledger trace display.
- EmptyState: missing generated data placeholder.
- MetricList: compact precomputed key/value display.
- DataTable: generated status or ledger rows, starting in Phase 14.

## Data Boundary

Presentational UI receives props only. It must not invoke adapters, effect normalization, value resolution, dedupe, ledger building, aggregation, or legacy guide fallback.

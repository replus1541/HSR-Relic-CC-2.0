# data-model

Canonical schema와 runtime assertion을 두는 영역입니다.

Phase 3에서 `SourceRow`, `EffectRow`, `ResolvedEffect`, `CombatLedgerRow` schema를 정의합니다.

이 폴더는 React UI 컴포넌트나 계산 로직을 포함하지 않습니다.

## 원칙

- v2의 모든 layer는 data-model schema를 기준으로 연결합니다.
- source-backed 여부, 계산 가능 여부, blocked reason을 schema에서 표현할 수 있어야 합니다.
- `manual_hint`와 `manual_guide`는 계산 금지 source로 명시되어야 합니다.
- `ResolvedEffect`는 원본 value가 아니라 `resolvedValue`를 계산 layer로 넘깁니다.
- `CombatLedgerRow`는 UI와 계산이 공유하는 trace 기준입니다.

## React 구조 기준

이 폴더는 React에 의존하지 않습니다. UI와 domain model이 결합되지 않도록 순수 데이터 정의와 validation만 둡니다.

## 현재 구현 범위

- `schemas/schema-enums.js`: schema kind, source, value, target, attack, condition, stack, blocked reason enum skeleton입니다.
- `schemas/schema-types.js`: JSDoc typedef skeleton입니다.
- `schemas/index.js`: schema skeleton re-export 진입점입니다.
- `schema-validator.js`: source guard 중심의 최소 schema validator입니다.

아직 adapter, effect normalizer, value resolver, 계산 로직은 없습니다.

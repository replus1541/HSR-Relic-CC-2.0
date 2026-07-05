# effect-engine

Effect normalization, value resolution, dedupe, CombatLedger 생성을 담당할 영역입니다.

Phase 1-A에서는 구현하지 않습니다. 계산 가능한 source-backed row와 차단 row의 기준은 이후 Phase에서 schema와 함께 정의합니다.

## 원칙

- Effect engine은 `EffectRow -> NormalizedEffect -> ResolvedEffect -> CombatLedger` 흐름을 담당합니다.
- 모든 계산값은 `valueMode`를 거쳐 `resolvedValue`로 확정되어야 합니다.
- `manual_hint`, `missing_extraction`, 출처 없는 fallback은 ledger에서 차단 row로 남기고 계산에는 쓰지 않습니다.
- 중복 적용 방지는 이름 문자열이 아니라 `canonicalEffectKey`로 처리합니다.
- UI는 effect-engine 내부 객체를 직접 조립하지 않고 ledger output만 표시합니다.

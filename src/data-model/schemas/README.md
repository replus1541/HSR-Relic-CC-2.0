# schemas

v2 canonical data shape를 파일 단위로 정의합니다.

## 예정 schema

- SourceRow
- EffectRow
- CoefficientRow
- Condition
- StackRule
- ResolvedEffect
- CombatLedgerRow
- AggregationResult

모든 schema는 source trace와 계산 가능 여부를 표현할 수 있어야 합니다.

## 파일

- `schema-enums.js`: import 가능한 순수 enum 상수입니다.
- `schema-types.js`: 구현 없는 JSDoc typedef skeleton입니다.
- `index.js`: schema 상수와 type skeleton을 다시 export합니다.

## 금지

- 이 폴더에서 adapter를 실행하지 않습니다.
- 이 폴더에서 effect normalization이나 damage calculation을 수행하지 않습니다.
- `manual_hint`, `manual_guide`, fallback source를 계산 가능으로 승격하지 않습니다.

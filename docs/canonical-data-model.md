# Canonical Data Model

Task 3-A 초안입니다. 이 문서는 v2 canonical data model의 필수 schema와 계산 가능 여부 필드를 문서로 먼저 고정합니다.

## 공통 원칙

- 모든 계산 가능 row는 source provenance를 가져야 합니다.
- `manual_hint`, `manual_guide`, fallback, audit-only row는 계산 가능 row가 아닙니다.
- UI는 schema row를 변형해 계산하지 않고 ledger/aggregation output을 표시합니다.
- adapter, normalizer, resolver, ledger, aggregator는 모두 같은 canonical id와 source trace를 유지해야 합니다.

## 공통 필드

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | v2 내부 stable id입니다. |
| `kind` | yes | row 종류입니다. 예: `source`, `effect`, `coefficient`, `ledger`. |
| `version` | yes | schema version입니다. |
| `createdBy` | yes | 생성 layer입니다. 예: `legacy-snapshot`, `adapter`, `normalizer`, `resolver`. |
| `sourceId` | conditional | 원천 source row id입니다. source 자체에는 선택입니다. |
| `sourceOrigin` | conditional | `raw_source`, `curated_source`, `manual_hint`, `manual_guide`, `fallback`, `audit_reference`, `external_import` 중 하나입니다. |
| `sourcePath` | conditional | 원본 파일 또는 source 내부 path입니다. |
| `sourceRecord` | conditional | 원본 row/record 식별자입니다. |
| `sourceText` | optional | 사람이 검수할 수 있는 원문 또는 근거 문장입니다. |
| `sourceUrl` | optional | 외부 source URL입니다. |
| `calculationStatus` | yes | `calculation_ready`, `blocked`, `reference_only`, `pending_review` 중 하나입니다. |
| `blockedReason` | conditional | 계산 불가 이유입니다. |
| `reviewStatus` | optional | `unreviewed`, `reviewed`, `source_confirmed`, `needs_source`, `rejected` 중 하나입니다. |

## SourceRow

원본 또는 legacy snapshot의 최소 단위입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | source row stable id입니다. |
| `sourceOrigin` | yes | source 성격입니다. |
| `sourceKind` | yes | `hoyowiki`, `game_db_generated`, `curated_source`, `external_import`, `audit_reference` 등입니다. |
| `sourcePath` | yes | 파일 경로 또는 source namespace입니다. |
| `sourceRecord` | yes | 원본 record id입니다. |
| `sourceText` | optional | 원문 텍스트입니다. |
| `sourceUrl` | optional | 외부 source URL입니다. |
| `provenance` | yes | 생성/수집 시각, legacy path, adapter id 등을 담는 object입니다. |
| `calculationStatus` | yes | source 자체가 계산 row로 변환 가능한지 표시합니다. |
| `blockedReason` | conditional | source가 reference-only인 이유입니다. |

계산 가능 조건:

- `sourceOrigin`이 `raw_source` 또는 source text/path가 있는 `curated_source`여야 합니다.
- `sourcePath`와 `sourceRecord`가 있어야 합니다.
- `manual_hint`, `manual_guide`, `fallback`, `audit_reference`는 계산 가능하지 않습니다.

## EffectRow

정규화 전/후의 효과 후보입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | effect row id입니다. |
| `sourceId` | yes | 근거 SourceRow id입니다. |
| `sourceOrigin` | yes | source 성격입니다. |
| `effectType` | yes | `buff`, `debuff`, `damage_modifier`, `triggered_damage`, `stat_conversion` 등입니다. |
| `stat` | yes | canonical stat key입니다. |
| `rawValue` | optional | 원본 값입니다. |
| `valueMode` | yes | `fixed`, `skill_level_scaled`, `superimposition_scaled`, `dynamic_formula`, `unknown` 등입니다. |
| `valueFormula` | conditional | dynamic value 계산식 설명입니다. |
| `effectProviderId` | yes | 효과 제공자 id입니다. |
| `effectTargetPolicy` | yes | 효과가 부여되는 대상 정책입니다. |
| `calculationSubjectPolicy` | yes | 계산 대상에게 적용되는 방식입니다. |
| `enemyTargetPolicy` | optional | 단일/광역/확산/중앙 대상 같은 적 적용 정책입니다. |
| `conditionIds` | optional | 연결된 Condition id 목록입니다. |
| `stackRuleId` | optional | 연결된 StackRule id입니다. |
| `calculationStatus` | yes | 계산 가능 여부입니다. |
| `blockedReason` | conditional | 계산 불가 이유입니다. |

계산 가능 조건:

- source guard를 통과해야 합니다.
- `valueMode`가 `unknown`이면 계산 불가입니다.
- provider/target/calculation subject 축이 분리되어 있어야 합니다.

## CoefficientRow

스킬 계수와 hit/target 정보를 나타냅니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | coefficient row id입니다. |
| `sourceId` | yes | 근거 SourceRow id입니다. |
| `characterId` | yes | 캐릭터 canonical id입니다. |
| `skillId` | yes | 스킬 canonical id입니다. |
| `attackType` | yes | `basic`, `skill`, `ultimate`, `follow_up`, `enhanced_basic`, `memosprite`, `summon` 등입니다. |
| `targetProfile` | yes | `single`, `blast`, `aoe`, `bounce`, `support`, `self` 등입니다. |
| `scalingStat` | yes | `atk`, `hp`, `def`, `breakEffect` 등입니다. |
| `coefficientValues` | conditional | 레벨별 계수 배열입니다. |
| `effectiveLevel` | optional | 사용 레벨입니다. |
| `calculationStatus` | yes | 계산 가능 여부입니다. |
| `blockedReason` | conditional | coefficient 확정 불가 이유입니다. |

## Condition

효과나 계수 적용 조건입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | condition id입니다. |
| `conditionType` | yes | `eidolon`, `skill_level`, `party_composition`, `target_state`, `stack_preset`, `battlefield`, `manual_excluded` 등입니다. |
| `sourceId` | conditional | 조건 근거 source입니다. |
| `operator` | optional | `equals`, `gte`, `lte`, `includes`, `exists` 등입니다. |
| `expectedValue` | optional | 조건 값입니다. |
| `defaultPolicy` | yes | `fixed_default`, `user_selectable`, `auto_from_party`, `blocked_manual_only` 중 하나입니다. |
| `calculationStatus` | yes | 자동 계산 가능 여부입니다. |
| `blockedReason` | conditional | 조건 평가 불가 이유입니다. |

## StackRule

스택/횟수/cap 정책입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | stack rule id입니다. |
| `stackType` | yes | `fixed`, `limited_preset`, `party_auto`, `skillset_auto_count`, `manual_only` 등입니다. |
| `minStack` | optional | 최소 스택입니다. |
| `maxStack` | conditional | 최대 스택입니다. |
| `defaultStack` | optional | 기본 스택입니다. |
| `presetValues` | optional | 사용자 선택 가능 preset입니다. |
| `perStackValue` | optional | 스택당 값입니다. |
| `sourceId` | conditional | stack rule 근거 source입니다. |
| `calculationStatus` | yes | 자동 계산 가능 여부입니다. |
| `blockedReason` | conditional | 자동 계산 불가 이유입니다. |

## ResolvedEffect

value resolver를 통과한 계산 후보입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | resolved effect id입니다. |
| `effectRowId` | yes | 원본 EffectRow id입니다. |
| `sourceId` | yes | source trace id입니다. |
| `stat` | yes | canonical stat입니다. |
| `resolvedValue` | conditional | 계산에 사용할 값입니다. |
| `valueTrace` | yes | raw value, formula, level, stack, rank 적용 경로입니다. |
| `conditionResults` | optional | 조건 평가 결과입니다. |
| `dedupeKey` | yes | semantic/source dedupe에 쓰는 key입니다. |
| `calculationStatus` | yes | ledger 진입 가능 여부입니다. |
| `blockedReason` | conditional | resolver 단계 계산 불가 이유입니다. |

계산 가능 조건:

- `resolvedValue`가 finite number이거나 별도 damage component로 처리 가능한 typed value여야 합니다.
- blocked/manual/reference row는 ledger로 들어가지 않습니다.

## CombatLedgerRow

계산과 UI가 공유하는 trace 기준 row입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | ledger row id입니다. |
| `resolvedEffectId` | conditional | 근거 ResolvedEffect id입니다. |
| `sourceId` | yes | source trace id입니다. |
| `ownerId` | yes | 효과 제공자 또는 장비 소유자입니다. |
| `subjectId` | yes | 계산 대상 캐릭터입니다. |
| `targetPolicy` | yes | 적용 대상 정책입니다. |
| `stat` | yes | ledger stat key입니다. |
| `value` | yes | aggregation에 들어갈 값입니다. |
| `category` | yes | `base_stat`, `equipment`, `self_buff`, `ally_buff`, `enemy_debuff`, `triggered_damage` 등입니다. |
| `sourceTrace` | yes | UI 표시용 근거 trace입니다. |
| `conditionTrace` | optional | 적용 조건 결과입니다. |
| `dedupeTrace` | optional | 중복 제거 결과입니다. |
| `calculationStatus` | yes | active/skipped/superseded 상태입니다. |
| `skippedReason` | conditional | ledger 제외 이유입니다. |

## AggregationResult

UI 표시와 legacy diff 비교가 참조하는 최종 합산 결과입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `id` | yes | aggregation result id입니다. |
| `scenarioId` | yes | 계산 시나리오 id입니다. |
| `subjectId` | yes | 계산 대상 캐릭터 id입니다. |
| `inputHash` | yes | 입력 snapshot hash입니다. |
| `ledgerRowIds` | yes | 사용한 ledger row id 목록입니다. |
| `statTotals` | yes | stat별 합산 결과입니다. |
| `damageComponents` | optional | 직접 피해, 격파, 추가 피해 등 component입니다. |
| `sourceTrace` | yes | row id 기반 source trace입니다. |
| `skippedRows` | yes | 제외된 ledger/source row 목록입니다. |
| `warnings` | optional | 중복/조건/미지원 경고입니다. |

## Blocked Reason 후보

- `missing_source`
- `manual_source_blocked`
- `fallback_source_blocked`
- `audit_reference_only`
- `value_mode_unknown`
- `pending_review`
- `missing_resolved_value`
- `condition_not_met`
- `condition_policy_missing`
- `target_policy_missing`
- `dedupe_superseded`
- `unsupported_dynamic_formula`
- `external_mapping_unconfirmed`

## Runtime Assertion 후보

Task 3-B/3-C에서 코드 skeleton과 validator로 옮길 후보입니다.

- `sourceOrigin` enum
- `calculationStatus` enum
- `blockedReason` enum
- `valueMode` enum
- `effectType` enum
- `attackType` enum
- `targetProfile` enum
- source guard: 계산 가능 row는 `sourceId`, `sourceOrigin`, `sourcePath` 또는 `sourceRecord` 필요
- manual guard: `manual_hint`, `manual_guide`, `fallback`, `audit_reference`는 calculation-ready 금지
- value guard: ledger 진입 row는 `resolvedValue` 또는 typed damage component 필요

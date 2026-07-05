# Rewrite Ban List

Task 2-C 결과입니다. v2 설계와 구현에서 기존 `C:\CODEX\HSR RELIC CC` 구조를 그대로 가져오면 안 되는 항목을 고정합니다.

## Task 2-C 범위

- 기존 guide fallback, activeEffects 생성, UI 계산 재구성, 이름 문자열 dedupe, `damage.js` 직접 합산 로직을 금지 대상으로 확정합니다.
- 이 문서는 코드 구현, schema 구현, adapter 구현, effect-engine 구현을 하지 않습니다.
- 기존 프로젝트는 수정하지 않습니다.

## 절대 금지 원칙

- `manual_hint`, `manual_guide`, guide-only value, fallback value를 계산 가능한 row로 승격하지 않습니다.
- UI component가 damage, buff, debuff, source grouping, party influence 값을 직접 다시 계산하지 않습니다.
- legacy `sample-data.js` 또는 `damage.js`의 조립/계산 흐름을 v2 핵심 구조로 복사하지 않습니다.
- 이름 문자열, 한글 표시명, alias만으로 effect/source/character identity를 확정하지 않습니다.
- audit/report 산출물을 runtime calculation source처럼 사용하지 않습니다.
- manual mapping 결과를 source-backed 계산 근거로 취급하지 않습니다.

## File-level Ban Map

| 기존 파일/흐름 | 금지 수준 | 금지 사유 | v2 대체 방향 |
| --- | --- | --- | --- |
| `src/sample-data.js` | direct copy 금지 | source-backed data, guide, generated relic/light cone, manual fallback을 한 runtime object로 합칩니다. | Phase 4 snapshot -> Phase 5 adapter -> canonical dataset으로 분해합니다. |
| `src/model/damage.js` | direct copy 금지 | effect resolution, ledger, stat aggregation, final damage formula가 한 파일에 결합되어 있습니다. | Phase 8~12에서 normalizer, value resolver, dedupe resolver, ledger, aggregator로 새로 분리합니다. |
| `data/character-effects/character-guides.json` | calculation input 금지 | guide/manual 성격의 effects와 role metadata가 포함됩니다. | reference 또는 blocked row 설계 참고로만 둡니다. |
| `data/character-effects/default-builds.json` | calculation source 금지 | 추천 장비/default build이며 캐릭터 사실값 source가 아닙니다. | fixture/reference로만 사용하고 계산 source로 쓰지 않습니다. |
| `data/audit/manual-guide-effect-fallbacks.json` | calculation source 금지 | fallback 목록 자체가 source-backed evidence가 아닙니다. | blocked reason과 validator 요구사항 참고로만 사용합니다. |
| `src/srtools/import/srtools-import-preview.js` | direct copy 금지 | import preview, party slot patch, relic build normalization이 legacy state에 결합되어 있습니다. | Phase 15에서 parser, import draft, apply action을 분리합니다. |
| `src/srtools/import/srtools-app-adapter.js` | direct copy 금지 | SRTools/FreeSR input을 legacy app state와 manual mapping에 직접 연결합니다. | external import draft adapter로 새로 작성합니다. |
| `src/srtools/manual-mappings.js` | calculation source 금지 | localStorage 수동 매핑은 source provenance가 아닙니다. | identity mapping confidence metadata 또는 blocked metadata로만 사용합니다. |
| `src/calculator/analysis/*` | direct copy 금지 | scenario building, party influence, UI display shape, 계산 helper가 섞여 있습니다. | Phase 11 ledger와 Phase 12 aggregator output을 소비하는 thin adapter로 새로 작성합니다. |
| `src/conditions/condition-policy.js` | direct copy 금지 | legacy comparison UI, presets, target patching, party state assumptions가 섞여 있습니다. | Phase 3 Condition/StackRule schema 이후 policy만 재정의합니다. |
| `src/active-effects/*` | direct copy 금지 | source formatting, display grouping, active effect 해석이 섞여 있습니다. | Phase 8 normalizer와 Phase 11 ledger trace 기준으로 재작성합니다. |

## Legacy Pattern Ban

### 1. Guide fallback calculation

금지:

- `guide.effects`를 `combatEffects` fallback으로 사용합니다.
- source 없는 effect에 기본 수치를 부여합니다.
- `calculationStatus`가 pending/unknown인 row를 active 계산에 넣습니다.
- guide/default build 값을 캐릭터 사실값처럼 저장합니다.

v2 요구사항:

- 모든 계산 row는 source provenance를 가져야 합니다.
- source가 없으면 blocked row로 남기고 `blockedReason`을 기록합니다.
- manual/guide 정보는 review hint나 blocked evidence로만 표시합니다.

### 2. Legacy activeEffects generation

금지:

- legacy candidate row를 바로 `activeEffects`로 승격합니다.
- fallback/manual row와 source-backed row를 같은 배열에서 계산 대상으로 섞습니다.
- target, source, provider, attacker 축을 하나의 `target` 문자열로 축약합니다.
- lower-priority row를 문자열 비교만으로 dedupe합니다.

v2 요구사항:

- normalize -> resolve value -> dedupe -> ledger 순서를 분리합니다.
- `effectProvider`, `effectTarget`, `calculationSubject`, `enemyTargetPolicy`를 별도 필드로 둡니다.
- superseded/blocked row도 trace에 남기되 계산에는 넣지 않습니다.

### 3. UI calculation reconstruction

금지:

- UI가 buff/debuff source rows를 다시 합산합니다.
- UI가 `resolvedValue ?? value`를 직접 선택해 계산 결과처럼 보여줍니다.
- party influence UI가 damage calculator를 직접 재실행해 ranking source를 만듭니다.
- extraction/review UI가 source-backed 여부를 추론해서 계산 가능 상태로 바꿉니다.

v2 요구사항:

- UI는 `CombatLedgerRow`와 `AggregationResult`를 표시만 합니다.
- UI 표시값과 계산값은 같은 ledger row id를 참조해야 합니다.
- review screen은 blocked/active/superseded 상태를 보여주지만 상태를 계산 가능으로 승격하지 않습니다.

### 4. Name-string dedupe and identity matching

금지:

- 한글 표시명, 공백 제거명, alias 문자열만으로 canonical character/effect/source identity를 확정합니다.
- `source + stat + target` 같은 표시용 문자열만으로 dedupe합니다.
- external import manual mapping을 source identity로 사용합니다.

v2 요구사항:

- canonical id, source row id, source path, source record, provider id를 분리합니다.
- alias/manual mapping은 confidence와 blocked metadata를 가진 mapping evidence로만 둡니다.
- dedupe key는 source identity와 semantic identity를 별도 보존해야 합니다.

### 5. `damage.js` direct aggregation

금지:

- base stat, relic stat, light cone stat, party buff, enemy debuff, dynamic formula를 한 함수에서 합산합니다.
- source guard 이전에 effect value를 number로 변환해 ledger에 넣습니다.
- character-specific fact를 damage formula 내부 조건문으로 하드코딩합니다.
- defenseDown과 defenseIgnore처럼 다른 방어 계열을 표시 문자열 기준으로 합칩니다.

v2 요구사항:

- source guard를 통과한 `ResolvedEffect`만 ledger에 들어갑니다.
- stat aggregation은 ledger row에서만 수행합니다.
- formula layer는 character-specific source fact를 직접 만들지 않습니다.
- skipped/blocked/superseded 이유를 aggregation result와 함께 추적합니다.

### 6. SRTools / FreeSR app-state patch flow

금지:

- parser가 곧바로 party slot, relic build, roster state를 수정합니다.
- import preview에서 legacy character id를 계산 source처럼 확정합니다.
- manual mapping 결과를 source-backed equipment fact로 취급합니다.

v2 요구사항:

- external input parser는 import draft만 만듭니다.
- apply action은 UI state 변경이며, source-backed calculation row 생성과 분리합니다.
- imported relic/light cone/character rows는 external provenance와 mapping confidence를 유지합니다.

## Phase 3로 넘길 Source Guard 요구사항

Phase 3 canonical schema는 최소한 아래 요구사항을 반영해야 합니다.

| 요구사항 | 필요한 필드 후보 |
| --- | --- |
| source provenance | `sourceId`, `sourceOrigin`, `sourcePath`, `sourceRecord`, `sourceText`, `sourceUrl` |
| calculation eligibility | `calculationStatus`, `isSourceBacked`, `blockedReason`, `blockedDetails` |
| value resolution trace | `valueMode`, `rawValue`, `resolvedValue`, `valueFormula`, `scalingSourcePath`, `effectiveLevel` |
| identity separation | `canonicalId`, `displayName`, `aliasEvidence`, `mappingConfidence` |
| effect axes | `effectProviderId`, `effectTargetPolicy`, `calculationSubjectPolicy`, `enemyTargetPolicy` |
| dedupe trace | `sourceDedupeKey`, `semanticDedupeKey`, `supersededBy`, `priorityReason` |
| UI traceability | `ledgerRowId`, `aggregationRowId`, `sourceTrace`, `skippedReason` |
| manual/reference isolation | `referenceOnly`, `manualHint`, `reviewHint`, `mustNotCalculate` |

## 완료 기준

- Phase 3 이후 schema 설계에서 참조할 금지 기준을 문서화했습니다.
- Phase 4 snapshot 후보와 계산 금지 후보의 경계를 유지했습니다.
- 기존 프로젝트 수정, legacy data import, 계산 로직 구현, adapter/schema/effect-engine 구현은 하지 않았습니다.

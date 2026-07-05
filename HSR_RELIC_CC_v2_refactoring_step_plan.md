# HSR RELIC CC v2.0 단계별 리팩토링 계획

## 0. 계획 목적

이 문서는 `HSR_RELIC_CC_current_to_v2_direction.md`를 실행 가능한 단계 단위로 쪼갠 리팩토링 계획입니다.

목표는 기존 `HSR RELIC CC`를 직접 뜯어고치는 것이 아니라, `HSR RELIC CC 2.0`에서 아래 구조를 새로 세우는 것입니다.

```txt
source adapter
-> extraction canonical dataset
-> normalized effect row
-> value resolver
-> dedupe resolver
-> combat ledger
-> stat/damage aggregator
-> 기존 스타일 기반 UI
```

핵심 원칙:

- 기존 프로젝트는 유지합니다.
- 기존 UI 스타일과 사용 흐름은 최대한 재사용합니다.
- `sample-data.js`와 `damage.js` 중심 구조를 v2 핵심으로 가져오지 않습니다.
- 계산 가능한 데이터는 source-backed row로 제한합니다.
- `manual_guide`, `manual_hint`, `missing_extraction`, 출처 없는 fallback은 계산에 쓰지 않습니다.
- UI는 계산값을 재구성하지 않고 `CombatLedger`와 aggregation result만 표시합니다.

---

## Phase 1. v2 프로젝트 골격 생성

### 목표

`HSR RELIC CC 2.0`을 독립 프로젝트로 만들고, 이후 단계가 쌓일 수 있는 최소 실행 골격을 준비합니다.

### 커밋 원칙

- Phase 1 시작 시 `git init`을 수행합니다.
- 이후 작업은 Step 단위로 커밋합니다.
- 한 커밋에는 하나의 완료 가능한 작업 단위만 담습니다.
- Phase Log 갱신도 별도 작업 단위가 끝났으면 커밋합니다.

### 작업

1. `package.json`, `vite.config.js`, `index.html` 생성
2. React entry 생성
   - `src/main.jsx`
   - `src/app/App.jsx`
3. 기본 라우트 구조 생성
   - `/`
   - `/extraction`
   - `/ledger`
   - `/legacy-diff`
4. 기본 폴더 구조 생성

```txt
src/
  app/
  data-model/
  adapters/
  extraction/
  effect-engine/
  calculator/
  ui/

data/
  raw/
  curated/
  generated/
  legacy-reference/

tools/
reports/
```

5. 기존 프로젝트의 UI CSS를 직접 복사하기 전에 재사용 범위를 기록할 placeholder 생성

### 산출물

- `package.json`
- `vite.config.js`
- `index.html`
- `src/main.jsx`
- `src/app/App.jsx`
- 기본 route shell
- `reports/ui-reuse/README.md`
- `reports/legacy/README.md`

### 검증

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

### 완료 기준

- v2 폴더에서 독립적으로 Vite 앱이 실행됩니다.
- 기존 `HSR RELIC CC` 파일을 수정하지 않습니다.
- 아직 계산 기능은 없어도 빈 route가 정상 표시됩니다.

---

## Phase 2. 기존 구조 재사용/금지 맵 작성

### 목표

기존 프로젝트에서 무엇을 재사용하고, 무엇을 reference로만 두고, 무엇을 재작성할지 명확히 분류합니다.

### 작업

1. 기존 UI 컴포넌트 분류
   - 그대로 재사용 가능
   - 스타일만 재사용
   - 구조 참고만 가능
   - 재작성 필요
2. 기존 데이터 파일 분류
   - adapter 입력
   - legacy reference
   - 계산 금지 guide
   - curated source 후보
3. 기존 계산 로직 분류
   - 공식 참고 가능
   - 검증 fixture로만 사용
   - v2 재사용 금지
4. 기존 import 로직 분류
   - SRTools UX 재사용
   - FreeSR UX 재사용
   - 내부 state 변환은 v2 canonical state로 교체

### 산출물

```txt
reports/ui-reuse/ui-source-map.md
reports/legacy/legacy-source-map.md
reports/legacy/rewrite-ban-list.md
reports/legacy/adapter-input-map.md
```

### 검증

- 각 기존 파일이 최소 하나의 분류에 들어갑니다.
- `sample-data.js`, `damage.js`, 기존 active effect 생성 로직은 v2 핵심 재사용 금지로 명시됩니다.

### 완료 기준

- 개발자가 기존 파일을 복사하기 전에 재사용 정책을 확인할 수 있습니다.
- v2에서 사용할 legacy reference 위치가 정해집니다.

---

## Phase 3. Canonical Schema 정의

### 목표

v2의 모든 adapter, effect engine, UI가 공유할 표준 데이터 구조를 먼저 고정합니다.

### 작업

1. `data-model/schemas`에 schema 문서와 타입 정의 생성
2. 핵심 entity 정의
   - `Character`
   - `Skill`
   - `Equipment`
   - `RelicPiece`
   - `SourceRow`
   - `EffectRow`
   - `CoefficientRow`
   - `Condition`
   - `StackRule`
   - `ResolvedEffect`
   - `CombatLedgerRow`
   - `AggregationResult`
3. source 계층 정의

```txt
raw_source
curated_source
manual_hint
missing_extraction
legacy_reference
```

4. 계산 가능 여부 정책 정의

```txt
계산 가능:
  raw_source
  curated_source with sourceText/sourcePath/reviewStatus

계산 불가:
  manual_hint
  missing_extraction
  manual_guide
  legacy_reference only
  unknown valueMode
```

5. `valueMode` enum 정의

```txt
fixed
skill_level_scaled
eidolon_adjusted
dynamic_formula
lightcone_superimposition_scaled
relic_conditional
unknown
```

### 산출물

```txt
src/data-model/schemas/source-row.js
src/data-model/schemas/effect-row.js
src/data-model/schemas/coefficient-row.js
src/data-model/schemas/resolved-effect.js
src/data-model/schemas/combat-ledger-row.js
docs/canonical-data-model.md
```

### 검증

- schema validator 또는 최소한의 runtime assertion 작성
- sample fixture 3개 작성
  - 계산 가능 raw_source
  - 계산 가능 curated_source
  - 계산 불가 manual_hint

### 완료 기준

- 모든 후속 phase가 이 schema를 기준으로 구현됩니다.
- 계산 금지 source가 schema 수준에서 표시됩니다.

---

## Phase 4. Legacy Reference Snapshot 구성

### 목표

기존 프로젝트의 필요한 JSON과 대표 계산 결과를 v2의 reference 영역에 보관합니다.

### 작업

1. 기존 source 후보 복사 또는 snapshot 생성

```txt
data/legacy-reference/game-db/
data/legacy-reference/character-effects/
data/legacy-reference/generated/
data/legacy-reference/import-samples/
```

2. 기존 대표 party fixture 정의
3. 기존 계산 결과 snapshot 저장
4. 기존 `service-structure.md` 또는 방향 문서를 reference로 연결

### 산출물

```txt
data/legacy-reference/manifest.json
data/legacy-reference/import-samples/srtools-sample.json
data/legacy-reference/import-samples/freesr-sample.json
reports/legacy/legacy-fixtures.md
```

### 검증

- snapshot manifest가 실제 파일 존재 여부를 확인합니다.
- reference 파일은 v2 runtime 계산에서 직접 import하지 않습니다.

### 완료 기준

- legacy data는 비교/adapter 입력으로만 쓰입니다.
- v2 계산기가 legacy JSON을 직접 읽지 않습니다.

---

## Phase 5. Source Adapter 기본 프레임 구현

### 목표

원천별 데이터를 표준 `SourceRow`, `EffectRow`, `CoefficientRow`로 변환하는 adapter 프레임을 만듭니다.

### 작업

1. 공통 adapter interface 정의

```js
{
  adapterId,
  sourceKind,
  load(),
  normalize(),
  report()
}
```

2. adapter registry 구현
3. adapter output validator 구현
4. adapter별 skeleton 생성

```txt
src/adapters/hoyowiki/
src/adapters/design-data/
src/adapters/local-json/
src/adapters/curated-source/
src/adapters/srtools/
src/adapters/freesr/
src/adapters/lightcone/
src/adapters/relic/
```

### 산출물

```txt
src/adapters/adapter-registry.js
src/adapters/adapter-contract.js
src/adapters/adapter-validator.js
reports/adapter/adapter-contract.md
```

### 검증

- 빈 adapter도 contract에 맞는 report를 반환합니다.
- 잘못된 output은 validator가 차단합니다.

### 완료 기준

- adapter를 추가할 때 schema와 validator를 통과해야 합니다.

---

## Phase 6. Local JSON / HoyoWiki Adapter 구현

### 목표

기존 생성 JSON과 HoyoWiki 수집 데이터를 v2 canonical dataset으로 변환하는 첫 adapter를 구현합니다.

### 작업

1. `local-json` adapter 구현
   - 기존 `character-stat-baseline`
   - 기존 `character-skill-db`
   - 기존 `character-effect-candidates`
   - 기존 `lightcone-effect-candidates`
2. `hoyowiki` adapter 구현
   - 캐릭터 skill text
   - base stat
   - trace stat
3. source trace 생성
   - `sourceRowId`
   - `sourceText`
   - `sourcePath`
   - `sourceVersion`
4. manual guide row는 `manual_hint` 또는 `legacy_reference`로만 변환

### 산출물

```txt
src/adapters/local-json/local-json-adapter.js
src/adapters/hoyowiki/hoyowiki-adapter.js
data/generated/source-rows.json
data/generated/effect-rows.json
data/generated/coefficient-rows.json
reports/adapter/local-json-report.md
reports/adapter/hoyowiki-report.md
```

### 검증

- 계산 가능 row는 source trace를 반드시 가집니다.
- `manual_hint` row는 계산 가능 flag가 false입니다.
- 누락 row는 `missing_extraction`으로 남습니다.

### 완료 기준

- 최소 3명 캐릭터에 대해 sourceRows/effectRows/coefficientRows가 생성됩니다.
- 수동 guide 값이 계산 가능 row로 들어가지 않습니다.

---

## Phase 7. Extraction Canonical Dataset 생성

### 목표

adapter output을 통합해 v2 계산 전 기준 데이터인 canonical dataset을 생성합니다.

### 작업

1. dataset builder 구현
2. sourceRows/effectRows/coefficientRows 병합
3. 캐릭터별 extraction status 생성
4. source priority 정책 적용

```txt
raw_source > curated_source > manual_hint > missing_extraction
```

5. canonical dataset manifest 생성
6. `/extraction` 화면이 이 dataset을 읽도록 준비

### 산출물

```txt
src/extraction/build-canonical-dataset.js
data/generated/extraction-canonical-dataset.json
data/generated/extraction-status.json
reports/extraction/canonical-dataset-report.md
```

### 검증

- 캐릭터별 row count 집계
- 계산 가능/불가 row 집계
- source 없는 계산 가능 row 0개
- duplicate sourceRowId 없음

### 완료 기준

- canonical dataset 하나만으로 캐릭터별 계산 readiness를 판단할 수 있습니다.

---

## Phase 8. Effect Normalizer 구현

### 목표

canonical effect row를 계산 엔진이 사용할 normalized effect row로 변환합니다.

### 작업

1. effect type taxonomy 정의
2. target scope 정규화

```txt
self
singleAlly
allAllies
enemy
allEnemies
party
```

3. attack type 정규화

```txt
basic
skill
ultimate
followUp
dot
break
superBreak
additional
all
```

4. condition 정규화
5. stack rule 정규화
6. `canonicalEffectKey` 후보 생성

### 산출물

```txt
src/effect-engine/normalize-effects.js
src/effect-engine/effect-taxonomy.js
data/generated/normalized-effect-rows.json
reports/effect-engine/normalization-report.md
```

### 검증

- unknown effectType은 계산 불가 처리
- unknown valueMode는 계산 불가 처리
- targetScope 없는 row는 계산 불가 처리

### 완료 기준

- normalized effect row가 value resolver로 넘어갈 수 있는 형태가 됩니다.

---

## Phase 9. Value Resolver 구현

### 목표

모든 계산 효과값을 `resolvedValue` 하나로 통일합니다.

### 작업

1. resolver interface 구현
2. valueMode별 resolver 구현

```txt
fixed
skill_level_scaled
eidolon_adjusted
dynamic_formula
lightcone_superimposition_scaled
relic_conditional
unknown
```

3. blocked reason 정책 정의
4. skill level/eidolon/lightcone rank/relic condition context 정의
5. resolvedEffect report 생성

### 산출물

```txt
src/effect-engine/resolve-values.js
src/effect-engine/value-resolvers/
data/generated/resolved-effects.json
reports/effect-engine/value-resolution-report.md
```

### 검증

- `unknown` valueMode는 `usedForCalculation=false`
- resolvedValue 없는 row는 계산에 들어가지 않음
- 스킬 레벨 변경 fixture에서 resolvedValue가 변함
- 광추 중첩 변경 fixture에서 resolvedValue가 변함

### 완료 기준

- 계산 엔진은 원본 value가 아니라 `resolvedValue`만 사용합니다.

---

## Phase 10. Dedupe Resolver 구현

### 목표

동일 효과 중복 적용을 `canonicalEffectKey`로 차단합니다.

### 작업

1. canonical key builder 구현
2. key 구성 필드 확정

```txt
providerId
sourceType
sourceId
sourcePath
effectType
targetScope
attackType
conditionKey
stackGroup
scalingSourcePath
```

3. winner/loser 정책 구현
4. source-backed row와 curated_source row 충돌 정책 구현
5. 성혼 보정 row와 기본 row 충돌 정책 구현
6. stack group 중복 정책 구현

### 산출물

```txt
src/effect-engine/dedupe-effects.js
src/effect-engine/canonical-effect-key.js
data/generated/deduped-effects.json
reports/effect-engine/dedupe-report.md
```

### 검증

- 같은 source row 중복 입력 시 1개만 계산
- 기본 row와 eidolon-adjusted row 동시 입력 시 정책대로 winner 선택
- enemy debuff가 공격자별로 중복 합산되지 않음

### 완료 기준

- 모든 resolvedEffect는 dedupeResult를 갖습니다.

---

## Phase 11. Combat Ledger 구현

### 목표

계산에 사용된 모든 효과와 차단된 효과를 추적 가능한 ledger로 만듭니다.

### 작업

1. ledger row builder 구현
2. ledger 필수 필드 채우기

```js
{
  ledgerId,
  sourceRowId,
  canonicalEffectKey,
  providerId,
  targetScope,
  attackType,
  effectType,
  valueMode,
  resolvedValue,
  conditionState,
  stackRule,
  resolvedStack,
  dedupeResult,
  usedForCalculation,
  blockedReason
}
```

3. ledger grouping 구현
   - attacker buffs
   - party buffs
   - enemy debuffs
   - relic conditionals
   - lightcone effects
   - blocked effects
4. ledger trace report 생성

### 산출물

```txt
src/effect-engine/build-combat-ledger.js
data/generated/combat-ledger-sample.json
reports/calculation/combat-ledger-report.md
```

### 검증

- 계산에 쓰인 row는 모두 `usedForCalculation=true`
- 차단된 row는 `blockedReason` 필수
- UI 표시값과 계산값이 같은 ledger row를 참조

### 완료 기준

- v2 계산과 UI trace의 단일 기준이 CombatLedger가 됩니다.

---

## Phase 12. Aggregator 구현

### 목표

CombatLedger를 기반으로 스탯/데미지 modifier를 집계합니다.

### 작업

1. stat aggregation 구현
2. damage modifier aggregation 구현
3. enemy debuff aggregation 구현
4. attacker buff aggregation 구현
5. party buff aggregation 구현
6. additional damage aggregation 구현
7. 방어/저항/취약/방무/방깎 계산 분리

### 산출물

```txt
src/calculator/aggregate-stats.js
src/calculator/aggregate-damage-modifiers.js
src/calculator/run-calculation-v2.js
data/generated/calculation-result-sample.json
reports/calculation/aggregation-report.md
```

### 검증

- 같은 ledger input은 항상 같은 aggregation result를 만듭니다.
- UI는 aggregation result만 표시합니다.
- legacy 비교 전용 fixture와 결과 차이를 report로 냅니다.

### 완료 기준

- `runCalculationV2`가 CombatLedger 기반으로 결과를 반환합니다.

---

## Phase 13. v2 UI Shell 연결

### 목표

기존 UI 스타일을 유지하면서 v2 canonical pipeline 결과를 표시합니다.

### 작업

1. 공통 UI 컴포넌트 구성
   - tab
   - card
   - badge
   - modal
   - list row
   - source trace row
2. 주요 화면 구현
   - Character Setup
   - Extraction Overview
   - Character Extraction Detail
   - Combat Ledger Panel
   - Damage Result Panel
   - Effect Trace Panel
3. 기존 스타일 중 재사용 가능한 CSS만 이식
4. UI에서 effect 합산 로직 제거

### 산출물

```txt
src/ui/
src/app/routes/
reports/ui-reuse/reused-style-map.md
```

### 검증

- 모바일 폭에서 주요 화면이 깨지지 않습니다.
- UI에 source 없는 계산 row가 표시되지 않습니다.
- UI 표시값이 ledger/aggregation result와 연결됩니다.

### 완료 기준

- v2 UI가 계산 결과와 ledger trace를 볼 수 있는 상태가 됩니다.

---

## Phase 14. Extraction 상세 라우트 구현

### 목표

`/extraction`을 canonical dataset 검토 화면으로 승격합니다.

### 작업

1. `/extraction` overview 구현
2. `/extraction/:characterId` 상세 구현
3. 상세 표시 항목 구현

```txt
sourceRows
effectRows
coefficientRows
curatedSources
manualHints
missingExtractions
valueMode
sourceText/sourcePath
ledger 연결 여부
```

4. 계산 가능/불가 badge 구현
5. missing extraction report 연결

### 산출물

```txt
src/extraction/ExtractionOverview.jsx
src/extraction/ExtractionDetail.jsx
reports/extraction/ui-route-report.md
```

### 검증

- 캐릭터 선택 -> 상세 이동 가능
- 상세에서 계산 가능 row와 계산 불가 row가 분리 표시
- manual_hint가 계산 가능으로 보이지 않음

### 완료 기준

- `/extraction`은 v2 계산 전 기준 데이터 확인 화면으로 동작합니다.

---

## Phase 15. SRTools / FreeSR v2 Import 연결

### 목표

기존 import UX를 유지하되, 결과는 v2 canonical loadout/state로 저장합니다.

### 작업

1. SRTools adapter v2 구현
2. FreeSR adapter v2 구현
3. import preview UI 연결
4. 변환 대상 정의

```txt
roster
party slots
lightcone
relic pieces
relic main/sub stats
eidolon
skill level hints
```

5. canonical equipment state 정의
6. import 실패 policy 정의

### 산출물

```txt
src/adapters/srtools/srtools-import-adapter.js
src/adapters/freesr/freesr-import-adapter.js
src/app/import/ImportPreviewModal.jsx
reports/import/srtools-import-report.md
reports/import/freesr-import-report.md
```

### 검증

- SRTools sample import 가능
- FreeSR sample import 가능
- import 결과가 v2 calculation scenario input으로 들어감
- 실패 row는 preview에서 명시됨

### 완료 기준

- 외부 JSON import가 legacy party state가 아니라 v2 canonical state를 생성합니다.

---

## Phase 16. Legacy 비교 시스템 구축

### 목표

기존 계산 결과와 v2 계산 결과를 비교해 차이를 추적합니다.

### 작업

1. legacy fixture 정의
2. legacy result snapshot 불러오기
3. v2 calculation result 생성
4. diff report 생성
5. 차이 분류

```txt
expected_different_due_to_source_guard
expected_different_due_to_dedupe
expected_different_due_to_value_resolver
unexpected_difference
```

### 산출물

```txt
tools/compare_legacy_and_v2.mjs
reports/diff/legacy-v2-diff-report.md
reports/diff/legacy-v2-diff.json
```

### 검증

- 대표 fixture 5개 이상 비교
- unexpected difference는 0개 또는 명시된 backlog로 남김

### 완료 기준

- v2 결과가 왜 기존과 다른지 설명 가능한 상태가 됩니다.

---

## Phase 17. 검증 체계 고정

### 목표

v2의 데이터/계산/UI 흐름이 회귀하지 않도록 검증 스크립트를 고정합니다.

### 작업

1. schema validation
2. adapter output validation
3. canonical dataset validation
4. effect normalization validation
5. value resolver validation
6. dedupe validation
7. ledger validation
8. aggregation validation
9. import validation
10. UI smoke validation

### 산출물

```txt
tools/validate_schema.mjs
tools/validate_adapters.mjs
tools/validate_canonical_dataset.mjs
tools/validate_effect_engine.mjs
tools/validate_combat_ledger.mjs
tools/validate_imports.mjs
tools/verify_app_smoke.mjs
```

### 검증

```powershell
npm.cmd run validate
npm.cmd run verify
npm.cmd run build
```

### 완료 기준

- v2 core 변경은 검증 없이 완료 처리하지 않습니다.
- 계산 금지 source 유입이 자동으로 실패합니다.

---

## Phase 18. 1차 통합 완료

### 목표

v2가 최소 기능 계산기로 독립 동작하는 상태를 만듭니다.

### 작업

1. 대표 캐릭터 3~5명 canonical dataset 완성
2. 대표 party fixture 2~3개 완성
3. source-backed effect만 계산
4. ledger 기반 UI 표시
5. legacy diff report 생성
6. import sample 적용 확인
7. README 사용법 작성

### 산출물

```txt
README.md
reports/release/v2-phase1-summary.md
reports/release/v2-phase1-known-gaps.md
```

### 검증

- `npm.cmd run build`
- `npm.cmd run validate`
- `npm.cmd run verify`
- 대표 import sample 수동 확인
- 대표 계산 fixture 결과 확인

### 완료 기준

- 기존 프로젝트와 독립된 v2 앱이 실행됩니다.
- manual guide/fallback이 계산에 유입되지 않습니다.
- CombatLedger로 계산값과 표시값을 추적할 수 있습니다.
- legacy 결과와 차이를 report로 설명할 수 있습니다.

---

## 단계별 선행 관계

```txt
Phase 1
-> Phase 2
-> Phase 3
-> Phase 4
-> Phase 5
-> Phase 6
-> Phase 7
-> Phase 8
-> Phase 9
-> Phase 10
-> Phase 11
-> Phase 12
-> Phase 13
-> Phase 14
-> Phase 15
-> Phase 16
-> Phase 17
-> Phase 18
```

병렬 가능:

- Phase 2와 Phase 3 일부 문서화
- Phase 6의 local-json adapter와 HoyoWiki adapter
- Phase 13 UI shell과 Phase 14 extraction detail
- Phase 15 import adapter와 Phase 16 legacy diff fixture

병렬 금지:

- schema 확정 전 effect engine 구현
- canonical dataset 전 aggregator 구현
- ledger 전 UI trace 구현
- source guard 전 계산 결과 확정

---

## Phase 2~18 Task Breakdown

아래 Task는 Codex 실행 단위입니다. Phase 구조는 유지하되, 실제 작업/커밋/Phase Log 기록은 `Task N-A`, `Task N-B` 형식으로 진행합니다. Phase 전체 완료는 모든 하위 Task가 완료된 뒤에만 기록합니다.

모든 Task 공통 원칙:

- 기존 `C:\CODEX\HSR RELIC CC` 프로젝트 수정 금지
- v2 작업은 `C:\CODEX\HSR RELIC CC 2.0`에서만 수행
- 계산 로직 조기 구현 금지
- `manual_hint` / `manual_guide` 계산 유입 금지
- source-backed row 원칙 유지
- UI는 계산값을 재구성하지 않고 ledger / aggregation result만 표시
- Task 완료 시 Phase Log에 `Task N-X complete`를 기록하고 별도 커밋 생성

### Phase 2 Tasks. 기존 구조 재사용/금지 맵 작성

#### Task 2-A. UI 재사용 후보 맵 작성

- 목표: 기존 UI 파일을 재사용/참고/재작성/금지로 분류합니다.
- 작업 범위: 기존 `src/calculator`, `src/components`, `src/conditions`, `src/active-effects`, `src/styles.css`를 읽고 UI 관점으로 분류합니다.
- 하지 말 것: 기존 프로젝트 수정 금지, CSS 전체 복사 금지, 계산 로직 구현 금지, adapter/schema/effect-engine 구현 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/ui-reuse/ui-source-map.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: 주요 UI 파일이 재사용 가능/스타일 참고/구조 참고/재작성/금지 중 하나로 분류됩니다.
- 다음 Task로 넘길 항목: 금지로 분류된 UI 계산 조립 로직 목록.

#### Task 2-B. Legacy 데이터/로직 source map 작성

- 목표: 기존 데이터와 계산 로직을 adapter input, legacy reference, rewrite 금지로 분류합니다.
- 작업 범위: 기존 `data`, `src/sample-data.js`, `src/model/damage.js`, `src/srtools`, `src/freesr`, `tools` 구조를 문서화합니다.
- 하지 말 것: 기존 프로젝트 수정 금지, legacy data import 금지, 계산 로직 복사 금지, schema 구현 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/legacy/legacy-source-map.md`, `reports/legacy/adapter-input-map.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: legacy 파일군이 v2에서 어떤 목적으로만 쓰일지 문서화됩니다.
- 다음 Task로 넘길 항목: Phase 4 snapshot 후보 목록.

#### Task 2-C. Rewrite 금지 목록 확정

- 목표: v2에 그대로 가져오면 안 되는 구조를 명확히 금지합니다.
- 작업 범위: 기존 guide fallback, activeEffects 생성, UI 계산 재구성, 이름 문자열 dedupe, damage.js 직접 합산 로직을 금지 목록으로 정리합니다.
- 하지 말 것: 기존 프로젝트 수정 금지, 코드 구현 금지, 금지 대상을 우회적으로 복사 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/legacy/rewrite-ban-list.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: Phase 3 이후 설계에서 참조할 금지 기준이 완성됩니다.
- 다음 Task로 넘길 항목: schema에 반영해야 할 source guard 요구사항.

### Phase 3 Tasks. Canonical Schema 정의

#### Task 3-A. Schema 문서 초안 작성

- 목표: canonical data model을 문서로 먼저 확정합니다.
- 작업 범위: `SourceRow`, `EffectRow`, `CoefficientRow`, `Condition`, `StackRule`, `ResolvedEffect`, `CombatLedgerRow`, `AggregationResult` 필드를 문서화합니다.
- 하지 말 것: schema runtime 구현 금지, adapter 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `docs/canonical-data-model.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: 모든 schema의 필수/선택 필드와 계산 가능 여부 필드가 문서화됩니다.
- 다음 Task로 넘길 항목: runtime assertion으로 옮길 필드 목록.

#### Task 3-B. Schema 상수와 type skeleton 작성

- 목표: 구현 없이 schema naming과 enum을 코드 skeleton으로 고정합니다.
- 작업 범위: source kind, valueMode, targetScope, attackType, blockedReason enum skeleton을 작성합니다.
- 하지 말 것: validation 로직 구현 금지, adapter 구현 금지, effect-engine 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지.
- 생성/수정 파일: `src/data-model/schemas/*.js`, `src/data-model/README.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: import 가능한 순수 상수/skeleton만 존재하고 계산 로직은 없습니다.
- 다음 Task로 넘길 항목: validator에서 검사할 enum 목록.

#### Task 3-C. Schema validator와 fixtures 추가

- 목표: source guard를 검사할 최소 validator와 fixture를 만듭니다.
- 작업 범위: 계산 가능 raw_source, 계산 가능 curated_source, 계산 불가 manual_hint fixture와 validator를 추가합니다.
- 하지 말 것: adapter 구현 금지, effect normalization 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual_hint 계산 허용 금지.
- 생성/수정 파일: `src/data-model/schema-validator.js`, `data/generated/schema-fixtures/*.json`, `tools/validate_schema.mjs`, `package.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:schema`, `npm.cmd run build`
- 완료 기준: manual_hint fixture가 계산 가능으로 들어가면 validator가 실패합니다.
- 다음 Task로 넘길 항목: Phase 5 adapter output validator 요구사항.

### Phase 4 Tasks. Legacy Reference Snapshot 구성

#### Task 4-A. Legacy snapshot manifest 설계

- 목표: 어떤 legacy 파일을 reference로 보관할지 manifest 형식을 정합니다.
- 작업 범위: manifest schema와 snapshot 정책 문서화.
- 하지 말 것: 대량 데이터 복사 금지, 기존 프로젝트 수정 금지, adapter 구현 금지, 계산 로직 구현 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `data/legacy-reference/manifest.example.json`, `reports/legacy/legacy-fixtures.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: snapshot 대상과 용도가 manifest 예시로 설명됩니다.
- 다음 Task로 넘길 항목: 실제 복사할 최소 파일 목록.

#### Task 4-B. 최소 legacy reference snapshot 생성

- 목표: Phase 6~7 adapter 개발에 필요한 최소 legacy reference만 복사합니다.
- 작업 범위: 기존 generated/sample/import 관련 최소 JSON을 `data/legacy-reference`로 복사하고 manifest 갱신.
- 하지 말 것: 기존 프로젝트 수정 금지, runtime import 연결 금지, 계산 로직 구현 금지, legacy data를 source-backed로 승격 금지.
- 생성/수정 파일: `data/legacy-reference/**`, `data/legacy-reference/manifest.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: reference 파일은 v2 runtime 코드에서 직접 import되지 않습니다.
- 다음 Task로 넘길 항목: snapshot 검증 스크립트 대상.

#### Task 4-C. Legacy manifest 검증 추가

- 목표: legacy reference 파일 존재와 용도를 검증합니다.
- 작업 범위: manifest 파일 존재, path, purpose, prohibitedRuntimeImport flag 검사.
- 하지 말 것: adapter 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, reference-only data runtime import 금지.
- 생성/수정 파일: `tools/validate_legacy_manifest.mjs`, `package.json`, `reports/legacy/legacy-manifest-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:legacy`, `npm.cmd run build`
- 완료 기준: manifest 누락/잘못된 path가 검증에서 실패합니다.
- 다음 Task로 넘길 항목: Phase 5 adapter input 목록.

### Phase 5 Tasks. Source Adapter 기본 프레임 구현

#### Task 5-A. Adapter contract 문서화

- 목표: adapter interface와 output contract를 문서로 고정합니다.
- 작업 범위: adapterId, sourceKind, load, normalize, report, validation flow 정의.
- 하지 말 것: 실제 source adapter 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/adapter/adapter-contract.md`, `src/adapters/README.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: 모든 adapter가 따라야 할 입출력 기준이 정리됩니다.
- 다음 Task로 넘길 항목: adapter registry skeleton 요구사항.

#### Task 5-B. Adapter registry skeleton 작성

- 목표: adapter를 등록하고 빈 report를 반환하는 skeleton을 만듭니다.
- 작업 범위: registry, contract helper, placeholder adapters 생성.
- 하지 말 것: 실제 legacy/HoyoWiki parsing 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/adapters/adapter-registry.js`, `src/adapters/adapter-contract.js`, `src/adapters/*/README.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: registry import가 가능하고 side effect가 없습니다.
- 다음 Task로 넘길 항목: validator 입력 shape.

#### Task 5-C. Adapter output validator 추가

- 목표: adapter output이 canonical schema를 위반하면 실패하도록 합니다.
- 작업 범위: SourceRow/EffectRow/CoefficientRow 최소 검증 연결.
- 하지 말 것: 실제 adapter 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual_hint 계산 가능 처리 금지.
- 생성/수정 파일: `src/adapters/adapter-validator.js`, `tools/validate_adapters.mjs`, `package.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:adapters`, `npm.cmd run build`
- 완료 기준: invalid adapter fixture가 실패합니다.
- 다음 Task로 넘길 항목: local-json adapter 구현 대상.

### Phase 6 Tasks. Local JSON / HoyoWiki Adapter 구현

#### Task 6-A. Local JSON adapter 최소 구현

- 목표: legacy reference JSON 일부를 SourceRow/EffectRow 후보로 변환합니다.
- 작업 범위: character baseline, skill DB, effect candidates 중 최소 subset 읽기.
- 하지 말 것: 계산 로직 구현 금지, HoyoWiki adapter 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/adapters/local-json/local-json-adapter.js`, `reports/adapter/local-json-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:adapters`, `npm.cmd run build`
- 완료 기준: 최소 3명 캐릭터의 sourceRows/effectRows 후보가 생성됩니다.
- 다음 Task로 넘길 항목: HoyoWiki row 결합 기준.

#### Task 6-B. HoyoWiki adapter 최소 구현

- 목표: HoyoWiki legacy reference를 source trace가 있는 row로 변환합니다.
- 작업 범위: skill text, base stat, trace stat subset 처리.
- 하지 말 것: local-json adapter 변경 범위 확장 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/adapters/hoyowiki/hoyowiki-adapter.js`, `reports/adapter/hoyowiki-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:adapters`, `npm.cmd run build`
- 완료 기준: sourceText/sourcePath 없는 계산 가능 row가 없습니다.
- 다음 Task로 넘길 항목: adapter 실행 CLI 대상.

#### Task 6-C. Adapter run script와 generated output 생성

- 목표: local-json/HoyoWiki adapter output을 generated 파일로 저장합니다.
- 작업 범위: adapter runner, output JSON, report 생성.
- 하지 말 것: canonical dataset 병합 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `tools/run_adapters.mjs`, `data/generated/source-rows.json`, `data/generated/effect-rows.json`, `data/generated/coefficient-rows.json`, `package.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run data:adapters`, `npm.cmd run validate:adapters`, `npm.cmd run build`
- 완료 기준: adapter output이 생성되고 validator를 통과합니다.
- 다음 Task로 넘길 항목: canonical dataset builder input.

### Phase 7 Tasks. Extraction Canonical Dataset 생성

#### Task 7-A. Canonical dataset builder skeleton

- 목표: adapter output을 받아 canonical dataset 형태로 묶는 skeleton을 만듭니다.
- 작업 범위: sourceRows/effectRows/coefficientRows 입력과 manifest 출력.
- 하지 말 것: priority 병합 정책 과도 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/extraction/build-canonical-dataset.js`, `reports/extraction/canonical-dataset-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: 빈/최소 input으로 dataset shape가 생성됩니다.
- 다음 Task로 넘길 항목: source priority 정책.

#### Task 7-B. Source priority와 계산 가능 여부 적용

- 목표: raw_source/curated_source/manual_hint/missing_extraction 정책을 dataset에 반영합니다.
- 작업 범위: 계산 가능 flag, blocked reason, source priority report.
- 하지 말 것: effect normalization 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual_hint 계산 허용 금지.
- 생성/수정 파일: `src/extraction/source-policy.js`, `tools/validate_canonical_dataset.mjs`, `package.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:canonical-dataset`, `npm.cmd run build`
- 완료 기준: manual_hint가 계산 가능으로 들어가면 검증 실패합니다.
- 다음 Task로 넘길 항목: extraction status summary.

#### Task 7-C. Extraction status output 생성

- 목표: 캐릭터별 extraction readiness와 row count를 생성합니다.
- 작업 범위: status JSON, report, route placeholder에서 읽을 수 있는 fixture 생성.
- 하지 말 것: UI 상세 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `data/generated/extraction-canonical-dataset.json`, `data/generated/extraction-status.json`, `reports/extraction/canonical-dataset-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:canonical-dataset`, `npm.cmd run build`
- 완료 기준: 캐릭터별 계산 가능/불가 row 집계가 생성됩니다.
- 다음 Task로 넘길 항목: effect normalizer input.

### Phase 8 Tasks. Effect Normalizer 구현

#### Task 8-A. Effect taxonomy 정의

- 목표: effectType, targetScope, attackType taxonomy를 고정합니다.
- 작업 범위: taxonomy constants, 문서, unknown 처리 정책.
- 하지 말 것: value resolving 구현 금지, dedupe 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지.
- 생성/수정 파일: `src/effect-engine/effect-taxonomy.js`, `reports/effect-engine/normalization-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: unknown taxonomy는 계산 불가로 표시될 준비가 됩니다.
- 다음 Task로 넘길 항목: normalizer mapping.

#### Task 8-B. normalizeEffects 구현

- 목표: EffectRow를 NormalizedEffect로 변환합니다.
- 작업 범위: effectType/targetScope/attackType/valueMode/condition/stackRule 정규화.
- 하지 말 것: resolvedValue 산출 금지, dedupe 금지, 계산 로직 구현 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/effect-engine/normalize-effects.js`, `data/generated/normalized-effect-rows.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:effect-normalization`, `npm.cmd run build`
- 완료 기준: unknown valueMode/effectType은 blocked candidate로 표시됩니다.
- 다음 Task로 넘길 항목: normalization validator.

#### Task 8-C. Normalization report와 검증 추가

- 목표: normalized row 품질을 검증하고 report합니다.
- 작업 범위: missing targetScope, unknown effectType/valueMode 검사.
- 하지 말 것: value resolver 구현 금지, dedupe 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `tools/validate_effect_normalization.mjs`, `package.json`, `reports/effect-engine/normalization-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:effect-normalization`, `npm.cmd run build`
- 완료 기준: normalization output이 검증과 report를 통과합니다.
- 다음 Task로 넘길 항목: value resolver fixtures.

### Phase 9 Tasks. Value Resolver 구현

#### Task 9-A. Value resolver contract 정의

- 목표: valueMode별 resolver 입출력과 blockedReason 정책을 고정합니다.
- 작업 범위: contract 문서, resolver context shape, fixture 설계.
- 하지 말 것: 실제 계산 aggregator 구현 금지, dedupe 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/effect-engine/value-resolution-report.md`, `src/effect-engine/value-resolvers/README.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: 모든 valueMode의 입력 context와 실패 조건이 문서화됩니다.
- 다음 Task로 넘길 항목: resolver skeleton.

#### Task 9-B. resolveValues 구현

- 목표: NormalizedEffect를 ResolvedEffect로 변환합니다.
- 작업 범위: fixed, skill_level_scaled, eidolon_adjusted, dynamic_formula, lightcone_superimposition_scaled, relic_conditional, unknown 처리 skeleton/기본 구현.
- 하지 말 것: dedupe 구현 금지, aggregation 구현 금지, 기존 프로젝트 수정 금지, unknown 계산 허용 금지.
- 생성/수정 파일: `src/effect-engine/resolve-values.js`, `src/effect-engine/value-resolvers/*.js`, `data/generated/resolved-effects.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:value-resolution`, `npm.cmd run build`
- 완료 기준: 모든 계산 전달값은 `resolvedValue` 또는 `blockedReason`을 갖습니다.
- 다음 Task로 넘길 항목: resolver edge case.

#### Task 9-C. Value resolution 검증 강화

- 목표: level/eidolon/superimposition/unknown fixture를 검증합니다.
- 작업 범위: validator, fixtures, report 갱신.
- 하지 말 것: dedupe 구현 금지, aggregator 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `tools/validate_value_resolution.mjs`, `data/generated/value-resolution-fixtures/*.json`, `package.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:value-resolution`, `npm.cmd run build`
- 완료 기준: unknown valueMode가 계산에 들어가면 실패합니다.
- 다음 Task로 넘길 항목: canonicalEffectKey input.

### Phase 10 Tasks. Dedupe Resolver 구현

#### Task 10-A. canonicalEffectKey 정의

- 목표: 중복 방지 key 구성요소를 코드와 문서로 고정합니다.
- 작업 범위: providerId/sourceType/sourceId/sourcePath/effectType/targetScope/attackType/conditionKey/stackGroup/scalingSourcePath.
- 하지 말 것: winner 정책 구현 금지, 계산 aggregator 구현 금지, 기존 프로젝트 수정 금지, 이름 문자열 dedupe 금지.
- 생성/수정 파일: `src/effect-engine/canonical-effect-key.js`, `reports/effect-engine/dedupe-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: key가 deterministic하게 생성됩니다.
- 다음 Task로 넘길 항목: dedupe winner policy.

#### Task 10-B. dedupeEffects 구현

- 목표: ResolvedEffect 목록에서 winner/loser를 결정합니다.
- 작업 범위: 동일 key 중복 제거, source-backed vs curated 충돌, eidolon-adjusted 충돌 기본 정책.
- 하지 말 것: aggregation 구현 금지, UI trace 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/effect-engine/dedupe-effects.js`, `data/generated/deduped-effects.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:dedupe`, `npm.cmd run build`
- 완료 기준: 모든 resolvedEffect에 dedupeResult가 붙습니다.
- 다음 Task로 넘길 항목: dedupe fixture 확장.

#### Task 10-C. Dedupe 검증 fixtures 추가

- 목표: 중복 source, 성혼 보정, enemy debuff 중복을 검증합니다.
- 작업 범위: fixture와 validator/report 작성.
- 하지 말 것: aggregation 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지, 이름 문자열 fallback 금지.
- 생성/수정 파일: `tools/validate_dedupe.mjs`, `data/generated/dedupe-fixtures/*.json`, `package.json`, `reports/effect-engine/dedupe-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:dedupe`, `npm.cmd run build`
- 완료 기준: 중복 row는 하나만 calculation winner가 됩니다.
- 다음 Task로 넘길 항목: CombatLedger row builder input.

### Phase 11 Tasks. Combat Ledger 구현

#### Task 11-A. CombatLedger schema 연결

- 목표: deduped effect를 ledger row로 옮길 필드 mapping을 정의합니다.
- 작업 범위: ledger row builder contract, field mapping 문서.
- 하지 말 것: aggregation 구현 금지, UI 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/calculation/combat-ledger-report.md`, `src/effect-engine/build-combat-ledger.js`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: ledger 필수 필드 mapping이 누락 없이 정의됩니다.
- 다음 Task로 넘길 항목: ledger grouping.

#### Task 11-B. buildCombatLedger 구현

- 목표: used/blocked effect를 모두 추적 가능한 ledger로 생성합니다.
- 작업 범위: ledgerId, sourceRowId, canonicalEffectKey, valueMode, resolvedValue, usedForCalculation, blockedReason 작성.
- 하지 말 것: stat/damage aggregation 구현 금지, UI trace 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/effect-engine/build-combat-ledger.js`, `data/generated/combat-ledger-sample.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:combat-ledger`, `npm.cmd run build`
- 완료 기준: blocked row는 blockedReason 필수, used row는 resolvedValue 필수입니다.
- 다음 Task로 넘길 항목: ledger validation.

#### Task 11-C. Ledger 검증과 report 추가

- 목표: ledger 품질과 source trace를 검증합니다.
- 작업 범위: validator, report, sample fixture.
- 하지 말 것: aggregator 구현 금지, UI 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `tools/validate_combat_ledger.mjs`, `package.json`, `reports/calculation/combat-ledger-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:combat-ledger`, `npm.cmd run build`
- 완료 기준: source 없는 used ledger row는 실패합니다.
- 다음 Task로 넘길 항목: aggregation input.

### Phase 12 Tasks. Aggregator 구현

#### Task 12-A. Aggregation contract 정의

- 목표: stat/damage/enemy/party/additional damage aggregation result shape를 정의합니다.
- 작업 범위: aggregation report와 skeleton module.
- 하지 말 것: UI 구현 금지, legacy 비교 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/calculator/aggregation-contract.js`, `reports/calculation/aggregation-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: aggregation result 필드가 문서화됩니다.
- 다음 Task로 넘길 항목: stat aggregation.

#### Task 12-B. aggregateStats / aggregateDamageModifiers 구현

- 목표: CombatLedger 기반 최소 stat/damage modifier aggregation을 구현합니다.
- 작업 범위: statAggregation, damageModifierAggregation, enemyDebuffAggregation 기본 구현.
- 하지 말 것: UI 구현 금지, legacy diff 구현 금지, 기존 프로젝트 수정 금지, ledger 외 데이터 직접 읽기 금지.
- 생성/수정 파일: `src/calculator/aggregate-stats.js`, `src/calculator/aggregate-damage-modifiers.js`, `data/generated/calculation-result-sample.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:aggregation`, `npm.cmd run build`
- 완료 기준: 같은 ledger input은 같은 aggregation result를 반환합니다.
- 다음 Task로 넘길 항목: runCalculationV2 wrapper.

#### Task 12-C. runCalculationV2와 aggregation 검증

- 목표: ledger input을 받아 calculation result를 반환하는 v2 wrapper를 만듭니다.
- 작업 범위: runCalculationV2, validator, report.
- 하지 말 것: UI 구현 금지, legacy 비교 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/calculator/run-calculation-v2.js`, `tools/validate_aggregation.mjs`, `package.json`, `reports/calculation/aggregation-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:aggregation`, `npm.cmd run build`
- 완료 기준: calculation result는 ledger/aggregation result에서만 나옵니다.
- 다음 Task로 넘길 항목: UI shell 연결 data contract.

### Phase 13 Tasks. v2 UI Shell 연결

#### Task 13-A. UI component inventory 작성

- 목표: v2 UI에서 필요한 presentational component 목록을 고정합니다.
- 작업 범위: Card, Badge, Tab, Panel, TraceRow, EmptyState 등 문서화.
- 하지 말 것: 계산 로직 구현 금지, adapter 구현 금지, 기존 CSS 전체 복사 금지, 기존 프로젝트 수정 금지.
- 생성/수정 파일: `reports/ui-reuse/reused-style-map.md`, `src/ui/README.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: UI component 구현 범위가 작게 나뉩니다.
- 다음 Task로 넘길 항목: presentational component 구현.

#### Task 13-B. 기본 presentational UI 구현

- 목표: route shell에서 쓸 공통 UI component를 구현합니다.
- 작업 범위: Card/Badge/Panel/Tabs 등 표시 컴포넌트.
- 하지 말 것: ledger 계산 조립 금지, effect 합산 금지, 기존 CSS 전체 복사 금지, 기존 프로젝트 수정 금지.
- 생성/수정 파일: `src/ui/components/*.jsx`, `src/ui/app.css`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: UI component는 props 표시만 수행합니다.
- 다음 Task로 넘길 항목: route composition.

#### Task 13-C. Route shell을 v2 UI component로 재구성

- 목표: Home/Extraction/Ledger/LegacyDiff placeholder를 공통 UI로 정리합니다.
- 작업 범위: route component composition, placeholder copy, responsive layout 확인.
- 하지 말 것: 계산 로직 구현 금지, real data 연결 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/app/routes/*.jsx`, `src/app/App.jsx`, `src/ui/app.css`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: 모든 route가 새 UI component로 렌더링됩니다.
- 다음 Task로 넘길 항목: extraction 상세 route.

### Phase 14 Tasks. Extraction 상세 라우트 구현

#### Task 14-A. Extraction overview data contract 연결

- 목표: generated extraction status를 route에서 표시할 contract를 정의합니다.
- 작업 범위: data loading skeleton, overview placeholder table.
- 하지 말 것: adapter 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, manual_hint 계산 허용 금지.
- 생성/수정 파일: `src/extraction/ExtractionOverview.jsx`, `src/app/routes/ExtractionRoute.jsx`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: overview가 mock/generated status shape를 표시합니다.
- 다음 Task로 넘길 항목: detail route.

#### Task 14-B. `/extraction/:characterId` 상세 shell 구현

- 목표: 캐릭터 상세 검토 route shell을 구현합니다.
- 작업 범위: pathname parsing, detail placeholder, source/effect/coefficient sections.
- 하지 말 것: 계산 로직 구현 금지, adapter 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/extraction/ExtractionDetail.jsx`, `src/app/route-config.js`, `src/app/App.jsx`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: `/extraction/:characterId` shell이 렌더링됩니다.
- 다음 Task로 넘길 항목: calculation-ready badge.

#### Task 14-C. 계산 가능/불가 표시 연결

- 목표: source-backed 가능 row와 blocked row를 UI에서 분리 표시합니다.
- 작업 범위: badge/section display, manual_hint/missing_extraction 표시.
- 하지 말 것: 계산값 산출 금지, effect 합산 금지, 기존 프로젝트 수정 금지, manual_hint 계산 유입 금지.
- 생성/수정 파일: `src/extraction/*.jsx`, `src/ui/components/*.jsx`, `reports/extraction/ui-route-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: manual_hint는 계산 불가로만 표시됩니다.
- 다음 Task로 넘길 항목: import adapter v2.

### Phase 15 Tasks. SRTools / FreeSR v2 Import 연결

#### Task 15-A. Canonical loadout state 정의

- 목표: SRTools/FreeSR import 결과가 들어갈 v2 state shape를 정의합니다.
- 작업 범위: roster, party slots, lightcone, relic pieces, eidolon, skill level hints 문서/fixture.
- 하지 말 것: parser 구현 금지, 계산 로직 구현 금지, 기존 프로젝트 수정 금지, legacy state 재사용 금지.
- 생성/수정 파일: `src/data-model/schemas/loadout-state.js`, `reports/import/import-state-contract.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: import 결과 state contract가 확정됩니다.
- 다음 Task로 넘길 항목: SRTools adapter.

#### Task 15-B. SRTools import adapter v2 구현

- 목표: SRTools JSON을 canonical loadout state로 변환합니다.
- 작업 범위: 기존 UX 참고, v2 state output, preview report.
- 하지 말 것: 기존 프로젝트 수정 금지, 기존 state 구조 그대로 사용 금지, 계산 로직 구현 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/adapters/srtools/srtools-import-adapter.js`, `reports/import/srtools-import-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:imports`, `npm.cmd run build`
- 완료 기준: SRTools sample이 canonical loadout state로 변환됩니다.
- 다음 Task로 넘길 항목: FreeSR adapter.

#### Task 15-C. FreeSR import adapter v2 구현

- 목표: FreeSR JSON을 canonical loadout state로 변환합니다.
- 작업 범위: avatars/lightcones/relics/loadout 변환, preview report.
- 하지 말 것: 기존 프로젝트 수정 금지, legacy party state 사용 금지, 계산 로직 구현 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/adapters/freesr/freesr-import-adapter.js`, `tools/validate_imports.mjs`, `package.json`, `reports/import/freesr-import-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:imports`, `npm.cmd run build`
- 완료 기준: FreeSR sample이 canonical loadout state로 변환됩니다.
- 다음 Task로 넘길 항목: import preview UI.

#### Task 15-D. Import preview UI shell 연결

- 목표: import 결과와 실패 row를 표시하는 UI shell을 연결합니다.
- 작업 범위: ImportPreview route/modal placeholder, mapped/failed rows 표시.
- 하지 말 것: 계산 실행 연결 금지, legacy state 저장 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `src/app/import/ImportPreviewModal.jsx`, `src/app/routes/*.jsx`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate:imports`, `npm.cmd run build`
- 완료 기준: import preview가 canonical state와 warnings를 표시합니다.
- 다음 Task로 넘길 항목: legacy diff fixtures.

### Phase 16 Tasks. Legacy 비교 시스템 구축

#### Task 16-A. Legacy diff fixture 정의

- 목표: 기존 계산 결과와 비교할 대표 fixture를 정합니다.
- 작업 범위: fixture manifest, expected difference category 문서.
- 하지 말 것: v2 계산 변경 금지, 기존 프로젝트 수정 금지, legacy data runtime import 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/diff/legacy-v2-fixtures.md`, `data/legacy-reference/diff-fixtures/*.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run build`
- 완료 기준: 최소 5개 fixture 후보가 문서화됩니다.
- 다음 Task로 넘길 항목: compare script.

#### Task 16-B. compareLegacyAndV2 script 구현

- 목표: legacy snapshot과 v2 result를 비교하는 CLI를 만듭니다.
- 작업 범위: diff runner, category classification, JSON/MD output.
- 하지 말 것: v2 계산 로직 변경 금지, 기존 프로젝트 수정 금지, legacy result를 정답으로 강제 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `tools/compare_legacy_and_v2.mjs`, `reports/diff/legacy-v2-diff.json`, `reports/diff/legacy-v2-diff-report.md`, `package.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run diff:legacy`, `npm.cmd run build`
- 완료 기준: expected/unexpected difference가 report로 분리됩니다.
- 다음 Task로 넘길 항목: unexpected difference triage.

#### Task 16-C. Legacy diff triage report 작성

- 목표: 차이 원인과 후속 작업을 분류합니다.
- 작업 범위: source guard/dedupe/value resolver/unknown 차이 분류.
- 하지 말 것: 계산 로직 즉석 수정 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/diff/legacy-v2-triage.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run diff:legacy`, `npm.cmd run build`
- 완료 기준: unexpected difference가 0개이거나 backlog로 명시됩니다.
- 다음 Task로 넘길 항목: Phase 17 검증 체계.

### Phase 17 Tasks. 검증 체계 고정

#### Task 17-A. validate script 통합

- 목표: schema/adapter/canonical/effect/ledger/import 검증을 한 명령으로 묶습니다.
- 작업 범위: npm scripts, validate runner.
- 하지 말 것: 새 기능 구현 금지, 기존 프로젝트 수정 금지, 계산 로직 변경 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `tools/validate_all.mjs`, `package.json`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate`, `npm.cmd run build`
- 완료 기준: validate가 하위 검증을 순서대로 실행합니다.
- 다음 Task로 넘길 항목: verify smoke.

#### Task 17-B. App smoke 검증 추가

- 목표: route shell과 주요 generated data 존재 여부를 smoke로 확인합니다.
- 작업 범위: dev server 또는 built output 기반 route check.
- 하지 말 것: Playwright 과도 도입 금지, 기존 프로젝트 수정 금지, 계산 로직 변경 금지.
- 생성/수정 파일: `tools/verify_app_smoke.mjs`, `package.json`, `reports/validation/app-smoke-report.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run verify:app`, `npm.cmd run build`
- 완료 기준: 주요 route가 200 또는 expected shell을 반환합니다.
- 다음 Task로 넘길 항목: validation policy.

#### Task 17-C. Validation policy 문서화

- 목표: Phase 완료 전 필요한 검증 기준을 문서화합니다.
- 작업 범위: validate/build/diff/import/smoke 실행 기준 정리.
- 하지 말 것: 기능 구현 금지, 기존 프로젝트 수정 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/validation/validation-policy.md`, `README.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate`, `npm.cmd run build`
- 완료 기준: 후속 Phase 완료 보고에 필요한 검증 기준이 명확해집니다.
- 다음 Task로 넘길 항목: Phase 18 release summary.

### Phase 18 Tasks. 1차 통합 완료

#### Task 18-A. Phase 1~17 산출물 감사

- 목표: v2 phase1 release 후보가 완료 기준을 만족하는지 점검합니다.
- 작업 범위: 파일/검증/report/known gap 감사.
- 하지 말 것: 새 기능 구현 금지, 기존 프로젝트 수정 금지, 계산 로직 즉석 변경 금지, manual guide 계산 유입 금지.
- 생성/수정 파일: `reports/release/v2-phase1-audit.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate`, `npm.cmd run verify`, `npm.cmd run build`
- 완료 기준: release blocker와 known gap이 분리됩니다.
- 다음 Task로 넘길 항목: summary 작성.

#### Task 18-B. Release summary / known gaps 작성

- 목표: v2 1차 통합 상태를 사용자와 미래 작업자가 읽을 수 있게 정리합니다.
- 작업 범위: 구현 범위, 검증 결과, known gaps, 다음 우선순위 작성.
- 하지 말 것: 새 기능 구현 금지, 기존 프로젝트 수정 금지, 검증 실패 숨김 금지.
- 생성/수정 파일: `reports/release/v2-phase1-summary.md`, `reports/release/v2-phase1-known-gaps.md`, `README.md`, `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate`, `npm.cmd run build`
- 완료 기준: 1차 통합 결과와 남은 문제가 문서화됩니다.
- 다음 Task로 넘길 항목: final complete log.

#### Task 18-C. Phase 18 / v2 1차 완료 기록

- 목표: Phase Log에서 Phase 18과 v2 1차 통합을 완료 처리합니다.
- 작업 범위: Phase Log final update, final status check, commit.
- 하지 말 것: 기능 구현 금지, 기존 프로젝트 수정 금지, 실패한 검증을 성공으로 기록 금지.
- 생성/수정 파일: `HSR_RELIC_CC_v2_phase_log.md`
- 검증 명령: `npm.cmd run validate`, `npm.cmd run verify`, `npm.cmd run build`, `git status --short`
- 완료 기준: working tree가 clean이고 Phase 18 complete가 기록됩니다.
- 다음 Task로 넘길 항목: v2 후속 roadmap.

---

## 우선순위 기준

1. 계산 출처 보호
2. canonical dataset 생성
3. valueMode 기반 resolvedValue 처리
4. canonicalEffectKey dedupe
5. CombatLedger 생성
6. Aggregator 구현
7. UI 연결
8. legacy 비교
9. import UX 정리

---

## 초기 3일 작업 제안

### Day 1

- Phase 1 프로젝트 골격 생성
- Phase 2 재사용/금지 맵 초안 작성
- Phase 3 schema 초안 작성

### Day 2

- Phase 3 schema validator 작성
- Phase 4 legacy reference manifest 작성
- Phase 5 adapter contract 작성

### Day 3

- Phase 6 local-json adapter 시작
- Phase 7 canonical dataset builder 초안
- 계산 금지 source guard 검증 추가

---

## 최종 요약

v2 리팩토링은 UI 리디자인이 아니라 계산 데이터 파이프라인 재설계입니다.

가장 먼저 고정해야 할 것은 화면이 아니라 다음 4개입니다.

```txt
Canonical Dataset
ResolvedEffect
canonicalEffectKey
CombatLedger
```

이 4개가 고정된 뒤 기존 UI 스타일을 얹어야, 표시값과 계산값이 같은 출처를 바라보는 v2 구조가 됩니다.

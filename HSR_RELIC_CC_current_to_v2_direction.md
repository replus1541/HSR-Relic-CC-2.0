# HSR RELIC CC 현재 구조 → v2.0 변경 방향 정리

## 0. 문서 목적

이 문서는 현재 `HSR RELIC CC` 구조를 기준으로, 새 프로젝트 `HSR RELIC CC v2.0`을 어떤 방향으로 재구성할지 정리한 실행 기준 문서입니다.

핵심 방향은 다음입니다.

```txt
기존 프로젝트는 유지
+
기존 UI 스타일과 사용 흐름은 최대한 재사용
+
데이터 구조 / 계산 로직 / effect 처리 파이프라인은 v2에서 새로 설계
```

---

# 1. 현재 구조 요약

현재 구조는 대략 아래 흐름입니다.

```txt
외부/원천 데이터
  - HoyoWiki 수집 결과
  - 로컬 게임 DesignData probe 결과
  - 수동/검수 character guide
  - SRTools import JSON
  - FreeSR import JSON

→ tools/* 생성/검증 스크립트
→ data/game-db/*.json
→ data/character-effects/*.json
→ src/generated-*.json
→ src/sample-data.js 런타임 카탈로그
→ src/model/damage.js 계산 모델
→ src/calculator/* React 화면
→ 브라우저 저장 state / export JSON
```

현재 핵심 허브는 다음입니다.

## 1-1. `src/sample-data.js`

현재 앱 런타임 카탈로그의 중심입니다.

역할:

- 캐릭터 데이터 구성
- 광추 데이터 구성
- 유물/장신구 데이터 구성
- 적 데이터 구성
- icon path 구성
- 기본 build 후보 구성

문제점:

- 데이터 흐름을 바꿀 때 영향 범위가 큼
- 계산에 필요한 source-backed row와 UI용 catalogue가 섞이기 쉬움
- v2에서는 핵심 계산 허브가 되면 안 됨

---

## 1-2. `src/model/damage.js`

현재 장비 스탯 계산과 전투 시나리오 계산의 중심입니다.

역할:

- 장비 스탯 계산
- base stat 합산
- 광추 base stat 합산
- 유물 주옵/부옵 합산
- active effects 합산
- 조건부 유물 효과 반영
- 적 방어/저항/취약/강인도 계산
- 최종 데미지 계산

문제점:

- 효과값 산출, 조건 처리, 스탯 계산, 데미지 계산이 한곳에 많이 모임
- valueMode, resolvedValue, ledger, dedupe 개념이 분리되어 있지 않음
- 버프/디버프 효과가 고정값인지, 레벨 연동인지, 성혼 보정인지, 동적 공식인지 추적하기 어려움
- 동일 효과 중복 적용 검증이 어려움

---

## 1-3. `src/calculator/*`

현재 계산기 UI입니다.

주요 화면:

- `CalculatorRoute.jsx`
- `CalculatorPage.jsx`
- `CharacterSetupPanel.jsx`
- `DamageResultPanel.jsx`
- `DamageTracePanel.jsx`
- `ScenarioDamageAnalysisCard.jsx`
- `equipment/*`

역할:

- 파티 상태 관리
- 캐릭터 세팅 UI
- 장비/유물 편집 UI
- 데미지 결과 표시
- 상세 trace 표시
- 조건 비교 UI 연결

v2 방향:

- UI 스타일과 사용 흐름은 최대한 유지
- 내부 계산값 조립 로직은 제거
- UI는 `CombatLedger`와 `aggregation result`를 표시하는 역할로 축소

---

## 1-4. `/extraction`

현재 계산 readiness 검토 화면입니다.

역할:

- 캐릭터별 base stat 확인
- trace stat 확인
- attack skill 확인
- support skill 확인
- self/ally buff 확인
- debuff 확인
- triggered damage 확인
- eidolon row 확인

v2 방향:

- 단순 검토 화면이 아니라 계산 전 단계의 canonical dataset 확인 화면으로 승격
- `/extraction/:characterId` 상세 라우팅 필요
- 계산 엔진이 참조하는 기준 데이터의 상태를 확인하는 화면이 되어야 함

---

# 2. 현재 구조의 핵심 문제

현재 구조의 문제는 UI 자체보다 내부 데이터/계산 파이프라인에 있습니다.

## 2-1. source 계층이 계산 구조와 완전히 분리되어 있지 않음

현재는 아래 데이터들이 생성 단계와 런타임에서 섞일 수 있습니다.

- HoyoWiki 원문
- DesignData
- 수동 character guide
- curated source
- generated candidate
- manual fallback
- active effect 후보

v2에서는 이를 반드시 분리해야 합니다.

```txt
raw_source
curated_source
manual_hint
missing_extraction
```

계산 가능:

```txt
raw_source
curated_source
```

계산 불가:

```txt
manual_hint
missing_extraction
```

---

## 2-2. `manual_guide`와 `curated_source`가 개념적으로 구분되어야 함

수동 입력 자체가 문제는 아닙니다.

문제는 출처 없는 guide/hint 값이 계산 row처럼 섞이는 것입니다.

## 계산 금지

- character-guides.json의 추천/가이드 값
- guide.effects
- 출처 없는 fallback
- 임시 expected value
- manual_hint

## 계산 허용

- 사람이 입력했더라도 sourceText/sourcePath/reviewStatus가 있는 curated_source
- 원문 근거가 명확한 수동 구조화 row
- 검수 완료된 source-backed row

즉, v2 기준은 다음입니다.

```txt
manual_guide = 계산 금지
curated_source = source-backed 조건을 만족하면 계산 가능
```

---

## 2-3. 효과값 산출 방식이 분리되어 있지 않음

같은 버프/디버프라도 값 결정 방식이 다를 수 있습니다.

예:

- 고정값
- 스킬 레벨 연동
- 성혼 보정
- 동적 공식
- 광추 중첩 단계
- 유물 조건부

따라서 v2에서는 모든 계산 효과에 `valueMode`가 있어야 합니다.

허용 valueMode:

```txt
fixed
skill_level_scaled
eidolon_adjusted
dynamic_formula
lightcone_superimposition_scaled
relic_conditional
unknown
```

`unknown`은 계산에 사용하지 않습니다.

---

## 2-4. 동일 효과 중복 적용 가능성

현재 구조에서는 같은 효과가 다른 이름으로 여러 번 들어갈 수 있습니다.

중복 발생 가능성:

- 같은 source row가 다른 effectName으로 중복 생성
- 같은 스킬 효과가 `[스킬]`, `[행적]`, `[추가능력]` label 차이로 중복 표시
- 기본 row와 성혼 보정 row가 동시에 계산
- source-backed row와 curated_source row가 동시에 계산
- enemy debuff가 공격자별로 중복 합산
- 스택형 효과가 여러 row로 분리되어 중복 합산

v2에서는 `canonicalEffectKey`로 중복 적용을 차단해야 합니다.

---

## 2-5. UI와 계산값이 다른 경로를 탈 수 있음

v2에서는 UI가 계산값을 직접 재구성하면 안 됩니다.

정상 구조:

```txt
effect-engine v2
→ combat ledger
→ aggregation result
→ UI 표시
```

UI는 `CombatLedger`와 `aggregation result`만 표시합니다.

---

# 3. v2 목표 구조

v2의 목표 데이터 흐름은 아래와 같습니다.

```txt
외부/원천 데이터
  - HoyoWiki
  - DesignData
  - SRTools
  - FreeSR
  - curated source

→ source adapter
→ extraction canonical dataset
→ normalized effect row
→ value resolver
→ dedupe resolver
→ combat ledger
→ stat/damage aggregator
→ 기존 스타일 기반 UI
```

현재 구조와 비교하면 다음입니다.

```txt
현재:
source → generated JSON → sample-data.js → damage.js → UI

v2:
source → adapter → extraction dataset → effect-engine → ledger → aggregator → UI
```

---

# 4. 현재 구조에서 v2 구조로의 매핑

## 4-1. `data/game-db/*`, `data/character-effects/*`

### 현재 역할

- generated DB
- character effect 후보
- guide/curated/manual 계층 포함 가능
- 계산 readiness에 가까운 생성 산출물

### v2 역할

```txt
data/game-db/*
data/character-effects/*
→ legacy-reference 또는 adapter 입력
→ extraction canonical dataset으로 변환
```

v2 계산기는 기존 JSON을 직접 읽지 않습니다.  
adapter가 표준 row로 변환한 결과만 사용합니다.

---

## 4-2. `src/sample-data.js`

### 현재 역할

런타임 카탈로그 허브입니다.

### v2 역할

```txt
src/sample-data.js
→ legacy catalog reference
→ localJsonAdapter 입력
→ extraction canonical dataset 생성 재료
```

v2의 런타임 기준 데이터는 `sample-data.js`가 아니라 다음에서 나와야 합니다.

```txt
extraction canonical dataset
+ normalized source rows
+ resolved equipment/loadout state
```

---

## 4-3. `src/model/damage.js`

### 현재 역할

장비 스탯 계산과 전투 시나리오 계산 중심입니다.

### v2 역할

```txt
src/model/damage.js
→ legacy calculation reference
→ compareLegacyAndV2 대상
```

v2에서는 기능을 아래 모듈로 분리합니다.

```txt
normalizeEffects.js
resolveValues.js
dedupeEffects.js
buildCombatLedger.js
aggregateStats.js
aggregateDamageModifiers.js
runCalculationV2.js
```

---

## 4-4. `src/active-effects/*`

### 현재 역할

- active effect 표시
- source formatting
- trace grouping

### v2 역할

표시/formatting 일부는 재사용 가능하지만, 데이터 기준은 바뀝니다.

```txt
기존 active effect 표시
→ v2 CombatLedger 표시 layer
```

active effect UI는 effect row를 직접 조립하지 않고 ledger row를 표시해야 합니다.

---

## 4-5. `/extraction`

### 현재 역할

계산 readiness 검토 화면입니다.

### v2 역할

```txt
/extraction
→ 검토 화면
→ canonical dataset 확인 화면
→ 계산 전 기준 데이터 화면
```

v2에서는 `/extraction/:characterId`가 필요합니다.

표시 대상:

- sourceRows
- effectRows
- coefficientRows
- curatedSources
- manualHints
- missingExtractions
- valueMode
- sourceText/sourcePath
- ledger 연결 여부

---

## 4-6. SRTools / FreeSR import

### 현재 역할

SRTools/FreeSR JSON을 내부 party/roster 구조로 변환합니다.

### v2 역할

기존 import UX는 유지합니다.

내부 변환 결과만 바꿉니다.

```txt
SRTools / FreeSR JSON
→ import adapter
→ canonical loadout / roster / equipment state
→ calculation scenario input
```

SRTools/FreeSR import preview UI는 참고/재사용 가능하지만, 최종 적용 데이터는 v2 canonical state에 맞춥니다.

---

# 5. 기존 소스 재활용 전략

## 5-1. 그대로 재활용 가능한 것

아래 항목은 v2에서도 최대한 유지합니다.

- 전체적인 UI 톤
- 색상 체계
- 카드형 레이아웃
- 모바일 화면 폭 기준
- 탭 구조
- 리스트/상세 패널 구조
- 버튼 스타일
- 뱃지 스타일
- 상세 리스트의 시각적 배치
- 캐릭터 선택/파티 구성 UX
- 결과 패널의 정보 배치 방식

단, 데이터 바인딩은 v2 구조로 교체합니다.

---

## 5-2. 참고용으로만 사용할 것

아래 항목은 그대로 복사하지 말고 reference로만 사용합니다.

- 기존 main.jsx의 UI 구성 방식
- 기존 계산 결과 패널
- 기존 데미지 상세 리스트
- 기존 영향도/기여도 UI
- 기존 추출현황 화면
- 기존 sample-data.js
- 기존 character-effect-candidates.json
- 기존 curated-source-effects.json
- 기존 verify 스크립트

---

## 5-3. adapter 또는 snapshot으로 재활용할 것

아래 데이터는 v2에서 직접 계산 source로 쓰지 않고, adapter 또는 legacy-reference snapshot으로 가져옵니다.

- 기존 HoyoWiki 추출 데이터
- 기존 DesignData 추출 데이터
- 기존 character-effect-candidates.json
- 기존 curated-source-effects.json
- 기존 계산 결과 snapshot
- 기존 대표 테스트 케이스
- 기존 캐릭터/광추/유물 기본 데이터

보관 경로:

```txt
data/legacy-reference/
```

---

## 5-4. 재사용 금지 또는 재작성 대상

아래 항목은 v2 핵심 구조로 그대로 가져오면 안 됩니다.

- 기존 effect 생성 파이프라인
- manual_guide 기반 effect row 생성 로직
- 기존 activeEffects 생성 방식
- 기존 calculation input 구성 로직
- 기존 ledger 없이 UI에서 계산값을 재구성하는 방식
- 기존 main.jsx 중심의 거대 상태/계산 혼합 구조
- 기존 방깎/방무/받피증/가피증 직접 합산 로직
- 이름 문자열 기준 dedupe 로직
- source 추적이 불가능한 수동 fallback 로직

---

# 6. v2 모듈 구조

v2는 새 폴더에 구축합니다.

```txt
/C:/CODEX/HSR RELIC CC v2.0
```

권장 구조:

```txt
HSR RELIC CC v2.0/
  README.md
  package.json
  vite.config.js
  index.html

  src/
    app/
      App.jsx
      routes/
      components/

    data-model/
      schemas/

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
    extraction/
    calculation/
    diff/
    ui-reuse/
    legacy/
```

---

# 7. v2 핵심 모듈

## 7-1. Source Adapter

역할:

```txt
외부/내부 원본 데이터
→ 표준 SourceRow / EffectRow / CoefficientRow 변환
```

필요 adapter:

- HoyoWiki adapter
- DesignData adapter
- localJson adapter
- curatedSource adapter
- SRTools adapter
- FreeSR adapter
- lightcone adapter
- relic adapter

---

## 7-2. Extraction Canonical Dataset

역할:

```txt
source adapter 결과
→ 통합 canonical dataset 생성
```

포함 데이터:

- sourceRows
- effectRows
- coefficientRows
- curatedSources
- manualHints
- missingExtractions

이 dataset이 v2 계산 전 단계의 단일 기준 데이터입니다.

---

## 7-3. Effect Normalizer

역할:

```txt
extraction effect row
→ normalized effect row
```

정규화 대상:

- effectType
- targetScope
- attackType
- valueMode
- condition
- stackRule
- source trace
- canonicalEffectKey 후보

---

## 7-4. Value Resolver

역할:

```txt
normalized effect row
→ resolvedEffect
```

모든 계산값은 `resolvedValue`로만 전달합니다.

ResolvedEffect 필드:

```js
{
  effectId,
  sourceRowId,
  valueMode,
  resolvedValue,
  currentLevel,
  effectiveLevel,
  conditionState,
  resolvedStack,
  blockedReason
}
```

---

## 7-5. Dedupe Resolver

역할:

```txt
resolvedEffect 목록
→ 중복 제거
→ winner/loser 결정
```

canonical key 기준:

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

---

## 7-6. Combat Ledger

역할:

```txt
계산에 사용된 효과의 전체 추적 기록
```

ledger 필수 필드:

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

---

## 7-7. Aggregator

역할:

```txt
ledger
→ stat aggregation
→ damage modifier aggregation
→ calculation result
```

분리 대상:

- statAggregation
- damageModifierAggregation
- enemyDebuffAggregation
- attackerBuffAggregation
- partyBuffAggregation
- additionalDamageAggregation

---

# 8. UI 유지 원칙

v2는 UI까지 새로 갈아엎는 프로젝트가 아닙니다.

## 유지할 것

- 기존 화면 구조
- 기존 카드/탭/패널 스타일
- 모바일 기준 레이아웃
- 캐릭터 세팅 흐름
- 파티 구성 흐름
- 데미지 결과 화면 형태
- 상세 trace/기여도 표시 방식

## 바꿀 것

- UI가 직접 effect를 합산하지 않음
- UI가 manual guide나 legacy activeEffect를 직접 읽지 않음
- UI는 combat ledger와 aggregation result를 표시함
- 표시값과 계산값이 같은 ledger row를 참조함

정리:

```txt
겉 UI = 기존 스타일 유지
내부 로직 = v2 canonical pipeline으로 교체
```

---

# 9. 작업 Phase

한 번에 전체를 구현하지 않습니다.

## Phase A. 새 프로젝트 생성

경로:

```txt
/C:/CODEX/HSR RELIC CC v2.0
```

작업:

- 기존 프로젝트 수정 금지
- Vite/React 기본 골격
- 기존 UI 스타일 참고 준비

---

## Phase B. 기존 구조 분석 및 재활용 맵 작성

산출물:

```txt
reports/ui-reuse/ui-source-map.md
reports/legacy/legacy-source-map.md
```

정리 대상:

- 재사용 UI
- 참고용 UI
- 재작성할 로직
- legacy reference data
- adapter로 변환할 데이터

---

## Phase C. Canonical Data Model 정의

정의 대상:

- Character
- Skill
- EffectRow
- CoefficientRow
- Condition
- StackRule
- ResolvedEffect
- CombatLedger

---

## Phase D. Source Adapter 구축

구현 대상:

- HoyoWiki adapter
- DesignData adapter
- localJson adapter
- curatedSource adapter
- SRTools/FreeSR import adapter

---

## Phase E. Extraction Canonical Dataset 생성

기존 `/extraction` 개념을 v2의 중심 데이터로 승격합니다.

---

## Phase F. Effect Engine v2 구현

구현 대상:

- normalizeEffects
- resolveValues
- dedupeEffects
- buildCombatLedger
- aggregateStats
- aggregateDamageModifiers

---

## Phase G. 기존 UI 스타일 기반 v2 UI 연결

구현 대상:

- Extraction Overview
- Character Extraction Detail
- Combat Ledger Panel
- Damage Result Panel
- Effect Trace Panel

---

## Phase H. Legacy 비교

기존 `damage.js` 결과와 v2 결과를 비교합니다.

---

# 10. 완료 기준

v2의 1차 완료 기준은 다음입니다.

- 기존 프로젝트는 유지
- 새 폴더에 v2 프로젝트 생성
- 기존 UI 스타일과 사용 흐름 유지
- canonical data model 정의
- source adapter 기본 구조 생성
- extraction canonical dataset 생성 가능
- EffectRow / ResolvedEffect / CombatLedger 구조 구현
- valueMode 기반 resolvedValue 처리 가능
- canonicalEffectKey 기반 dedupe 가능
- ledger 기반 UI 표시 가능
- 기존 계산기와 v2 계산 결과 비교 가능
- manual_hint/manual_guide가 계산/ledger/UI 확정 효과에 유입되지 않음
- curated_source는 source-backed 조건을 만족하면 계산 가능

---

# 11. 최종 방향성 한 줄 요약

```txt
현재 구조는 generated runtime DB와 damage.js 중심 계산기이고,
v2 구조는 extraction canonical dataset과 combat ledger 중심 계산기로 바꾸는 방향이다.
```

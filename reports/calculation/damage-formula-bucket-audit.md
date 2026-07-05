# Damage Formula Bucket Audit

작성일: 2026-07-06

## 목적

`스탯 / 데미지 계산`의 수치가 실제 계산기로 신뢰 가능해지려면 피해 타입별로 어떤 스탯 버킷을 곱하는지 먼저 고정해야 한다. 현재 v2는 일반 치명타 피해 공식을 중심으로 동작하므로, 지속피해, 격파/슈퍼격파, 환락 피해는 별도 공식으로 분리해야 한다.

## 출처

- Honkai: Star Rail Wiki, Damage: https://honkai-star-rail.fandom.com/wiki/Damage
- Honkai: Star Rail Wiki, Toughness: https://honkai-star-rail.fandom.com/wiki/Toughness
- Honkai: Star Rail Wiki, Elation DMG: https://honkai-star-rail.fandom.com/wiki/Elation_DMG

## 버킷 기준

### 일반 피해 / 추가 피해 / 지속피해

일반 피해 공식은 기본 피해, 원본 피해 배율, 치명타, 피해 증가, 약화, 방어, 저항, 받피증, 피해 경감, 약점 격파 상태 보정을 곱한다. 이 공식에는 캐릭터 DoT와 추가 피해도 포함된다.

적용 버킷:

- 기초 피해: `scalingStat * abilityMultiplier + extraDamage`
- 치명타: 치명 가능 피해만 적용
- 피해 증가: 타입 피해 증가, 속성 피해 증가, 모든 피해 증가
- 방어: 방깎/방무 포함
- 저항: 속저관/속저 감소 포함
- 받피증: 타입/속성/전체 받피증
- 약점 격파 상태: 강인도 보유 0.9, 격파 상태 1.0

DoT 특이점:

- DoT는 일반 피해 공식 계열이다.
- DoT는 기본적으로 치명타가 적용되지 않는다.
- DoT 피해 증가, 속성 피해 증가, 모든 피해 증가는 적용된다.

### 격파 피해

격파 피해는 일반 피해 공식과 별도다. 캐릭터 레벨, 격파 특수효과, 적 최대 강인도, 속성별 격파 계수, 방어, 저항, 받피증, 피해 경감, 약점 격파 상태를 쓴다.

적용 버킷:

- 레벨 배율
- 속성별 격파 기본 배율
- 적 최대 강인도 배율
- 격파 특수효과
- 격파 피해 증가
- 방어
- 저항
- 받피증
- 피해 경감
- 약점 격파 상태

미적용 버킷:

- 치명타
- 일반 피해 증가 / 속성 피해 증가 / 모든 피해 증가

### 슈퍼격파 피해

슈퍼격파는 격파 피해의 특수 변형이다. 공격의 강인도 감소량, 캐릭터 레벨, 격파 특수효과, 격파 피해 증가, 슈퍼격파 피해 증가와 표준 방어/저항/받피증 계열을 사용한다.

적용 버킷:

- 강인도 감소량 / 10
- 레벨 배율
- 슈퍼격파 능력 배율
- 격파 특수효과
- 격파 피해 증가
- 슈퍼격파 피해 증가
- 방어
- 저항
- 받피증
- 피해 경감
- 약점 격파 상태

미적용 버킷:

- 치명타
- 일반 피해 증가 / 속성 피해 증가 / 모든 피해 증가

### 환락 피해

환락 피해는 일반 피해 공식이 아니라 전용 공식이다. 레벨 배율과 환락 전용 계수, 치명타, 환락 스탯, Punchline, Merrymake, 방어, 저항, 환락 받피증/전체 받피증, 피해 경감, 약점 격파 상태를 사용한다.

적용 버킷:

- 레벨 배율
- 환락 피해 능력 배율
- 환락 피해 배율 증가
- 치명타
- 환락 스탯
- Punchline / Certified Banger
- Merrymake
- 방어
- 저항
- 환락 받피증 / 전체 받피증
- 피해 경감
- 약점 격파 상태

미적용 버킷:

- 일반 피해 증가 / 속성 피해 증가 / 모든 피해 증가
- 약화

## 구현 불일치

현재 `src/calculator/skill-damage-calculator.js`는 다음 전제를 깔고 있다.

- 모든 스킬 카드가 `scalingStat * coefficient` 기반이다.
- 모든 스킬 카드에 `allDamage + elementDamage + attackTypeDamage`가 적용된다.
- 모든 스킬 카드에 치명타 피해가 계산된다.
- 방어/저항/받피증은 공통으로 처리된다.

따라서 현재 구현은 일반 치명타 딜러의 1차 계산에는 맞지만, 아래 타입은 정확하지 않다.

- DoT: 치명타를 빼야 한다.
- Break/Super Break: 피해 증가와 치명타를 빼고 레벨/강인도/격특 공식으로 분기해야 한다.
- Elation: 일반 피해 증가를 빼고 환락 전용 버킷과 레벨 배율 공식으로 분기해야 한다.

## 1~5 작업 정리

1. 피해 타입 분류 필드 추가
   - `skill-damage-metadata`에 `damageFormulaType`을 추가한다.
   - 후보: `normal`, `dot`, `break`, `super_break`, `elation`.

2. 버킷 맵 추가
   - 공식 타입별 적용 스탯 목록을 코드 상수로 고정한다.
   - 기여도 UI도 이 버킷 맵을 기준으로 출처 row를 필터링한다.

3. 계산 엔진 분기
   - `calculateSkillDamageCard`를 공식 타입별 함수로 분리한다.
   - 일반/DoT는 기존 공식을 공유하되 치명타 가능 여부를 분리한다.
   - 격파/슈퍼격파/환락은 레벨 배율 테이블을 별도 데이터로 둔다.

4. 기여도 재계산
   - 현재 `buildDamageContributionViews`는 추정치다.
   - 정확 계산은 source row 제거 또는 가상 스탯 delta 주입 후 스킬 피해를 다시 계산해 delta를 구해야 한다.

5. 파티원추천 계산
   - 현재 UI는 v1 형태로 정리했지만 값은 현재 파티원이 준 추정 기여량이다.
   - 실제 추천은 후보 캐릭터를 파티 슬롯에 넣고 기본 세팅/광추/유물/조건을 적용한 뒤, 1~4의 정확 공식으로 재계산해야 한다.

## 구현 우선순위

1. `damageFormulaType` 생성 및 수동 보정 테이블 추가
2. 일반/DoT 치명타 분리
3. 격파/슈퍼격파 레벨 배율 및 강인도 공식 추가
4. 환락 피해 공식 추가
5. 기여도/파티원추천을 공식 기반 재계산으로 교체

## 1차 구현 현황

작성일: 2026-07-06

- `data/generated/skill-damage-metadata.json`에 `damageFormulaType`과 속성 필드를 추가했다.
- 현재 생성 결과: `normal=201`, `break=32`, `dot=26`, `super_break=4`, `elation=9`.
- 일반/DoT는 같은 기본 피해 공식을 쓰되 DoT는 치명타를 적용하지 않는다.
- 격파/슈퍼격파는 일반 피해 증가/속성 피해 증가/치명타를 제외하고, 레벨 80 격파 기초값, 격특, 격파 피해 증가, 방어, 저항, 받피증, 격파 상태 보정으로 분기했다.
- 환락은 일반 피해 증가/속성 피해 증가를 제외하고 레벨 80 환락 레벨 배율, Certified Banger/Punchline 배율, Merrymake, 치명타, 방어, 저항, 받피증, 격파 상태 보정을 반영하는 분기로 분리했다.
- 확정피해는 스킬 공식 타입이 아니라 `trueDamageRatio` 전투 modifier로 분리했다. 최종 피해 산출 후 `최종 피해 * trueDamageRatio`를 추가한다.
- 캐릭터별/스탯별/파티원 추천 기여도 추정은 공식 타입별 유효 버킷만 보도록 필터링했다.
- 스킬 상세 출처도 같은 버킷 필터를 사용하므로 DoT에 치확/치피, 격파에 일반 피증, 환락에 일반 피증이 섞이지 않는다.

추가 구현:

- `data/curated/skill-damage-formula-overrides.json`를 추가해 스킬 단위 공식 보정표를 분리했다.
- `crit-follow`는 더 이상 자동으로 `elation`이 되지 않는다. 실제 source text에 `환락 피해`가 있는 row만 `elation`으로 분류한다.
- Certified Banger와 Merrymake는 `스탯 / 데미지 계산` 탭의 `현재 파티 별도 설정` UI에서 선택한다.
- 기여도/추천은 source row 제거 후 동일 스킬을 재계산하는 exact delta를 우선 사용한다.
- 타입별 검증은 `npm.cmd run verify:damage-formulas`와 `reports/calculation/damage-formula-validation.md`에 고정했다.

잔여 리스크:

- 슈퍼격파는 현재 source text 기반 4개 row만 확정 매핑했다. 추후 source row가 더 분리되면 보정표를 확장해야 한다.
- 확정피해 중 사이퍼처럼 “기록 수치”를 참조하는 케이스는 현재 전투 modifier가 아니라 캐릭터별 전용 상태 모델이 필요하다.

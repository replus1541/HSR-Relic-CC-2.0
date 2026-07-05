# Character State Controls

작성일: 2026-07-06

## 목적

캐릭터별 스택, 전용 상태값, 기록 피해처럼 사이클 계산 없이도 사용자가 최대 피해 조건을 고르는 값을 `data/curated/character-state-controls.json`으로 분리한다. 계산 UI와 조건부 비교 UI는 이 카탈로그를 읽어 컨트롤을 자동 생성한다.

## 현재 컨트롤

- `blackSwanArcanaStacks`: 블랙스완이 파티에 있으면 표시. E0-E5는 30/50/70스택, E6은 30/80/120스택.
- `elationCertifiedBangerStacks`: 활성 딜러가 환락 피해 row를 가지면 표시. Punchline 배율에 반영.
- `elationMerrymake`: 활성 딜러가 환락 피해 row를 가지면 표시. 환락 전용 Merrymake 배율에 반영.
- `cipherRecordedDamage`: 사이퍼가 활성 딜러면 표시. 필살기 확정피해 가산값으로 반영.
- `superBreakToughnessMultiplier`: 활성 딜러가 슈퍼격파 피해 row를 가지면 표시. 슈퍼격파 강인도 전환 배율에 반영.
- `trailblazerDestructionBreakStacks`: 파멸 개척자 활성 시 표시. `effect:PlayerBoy_00:0` 공격력 증가를 `10% * stackCount`로 재계산.
- `danHengIlPrideStacks`: 단항•음월 활성 시 표시. `effect:DanHengIL_00:0` 피해 증가를 `5% * stackCount`로 재계산.
- `lukaFightingWillStacks`: 루카 활성 시 표시. `effect:Luka_00:1` 공격력 증가를 `5% * stackCount`로 재계산.
- `astaChargeStacks`: 아스타가 파티에 있으면 표시. `effect:Asta_00:0` 파티 공격력 증가를 `5% * stackCount`로 재계산.
- `ashveilIndulgenceStacks`: E6 애쉬베일 활성 시 표시. `effect:Ashveil_00:6` 피해 증가를 `4% * stackCount`로 재계산.
- `silverWolf999HiddenScore`: 은랑 LV.999 활성 시 표시. `effect:SilverWolf999_00:0/1` 치확/치피 전환을 히든 스코어 기준으로 재계산.
- `qingqueSkillStacks`: 청작 활성 시 표시. `effect:Qingque_00:1` 전투 스킬 피해 증가를 `14% * stackCount`로 재계산.
- `cerydraNobilityStacks`: 케리드라가 파티에 있으면 표시. 6충전 이상일 때 `effect:Cerydra_00:10` 속저관 8% 적용.
- `cyreneDemiurgeBuffCount`: E2 키레네가 파티에 있으면 표시. `effect:Cyrene_00:18` 확정피해 배율을 `6% * targetCount`로 재계산.
- `phainonTransformedStacks`: 파이논 활성 시 표시. `effect:Phainon_00:1` 변신 공격력 증가를 선택 단계로 재계산.
- `drRatioDeductionStacks`: Dr. 레이시오 활성 시 표시. `effect:Dr_Ratio_00:0/1` 치확/치피를 귀납 스택 기준으로 재계산.

## 연결 경로

- 자동 UI: `src/app/routes/CalculatorRoute.jsx`의 `buildPartySpecificControls`.
- 스탯/데미지 계산: `PartySpecificSettingPanel` 값이 `scenarioSettings`로 전달된다.
- 조건부 비교: 같은 컨트롤을 기준값과 비교값으로 분리해 총 피해 및 스킬별 변화량을 계산한다.
- 계산식: `src/calculator/skill-damage-calculator.js`.
- 전투 원장 override: `src/calculator/battle-final-stat-calculator.js`가 `stateControls`와 `scenarioSettings`를 받아 blocked/dynamic effect row의 `resolvedValue`를 전투 시점에 재계산한다.

## 전수 Audit

- 스크립트: `npm.cmd run audit:character-state-exceptions`
- JSON: `reports/calculation/character-state-exception-audit.json`
- Markdown: `reports/calculation/character-state-exception-audit.md`
- 2026-07-06 결과: HoyoWiki 92명 중 출시/조인 87명, 선택불가/미조인 5명, UI 입력형 effect row 14개, 상태값 control 보유 캐릭터 13명.

## 검증

- `npm.cmd run verify:damage-formulas`: 상태값 카탈로그, 환락 스택, 슈퍼격파 배율, 사이퍼 기록 피해, 아스타/파멸 개척자 동적 effect row override 확인.
- `node tools\verify_elation_settings_ui.mjs`: 스탯/데미지 계산과 조건부 비교 탭의 상태값 컨트롤 노출 확인.

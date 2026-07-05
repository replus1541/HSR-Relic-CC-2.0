# Damage Formula Validation

작성일: 2026-07-06

## Summary

- checks: 10
- failed: 0
- formula counts: normal=201, break=32, dot=26, super_break=4, elation=9

## Checks

- PASS normal follow-up stays normal: Feixiao follow-up formula=normal, usesCrit=true
- PASS DoT skips crit: Kafka sample formula=dot, crit=5884, expected=5884
- PASS break skips crit and normal damage boost: Gallagher formula=break, damage=10196
- PASS super break mapped and skips crit: Rappa formula=super_break, damage=103647
- PASS super break state multiplier changes damage: Rappa x1=103647, x1.4=145106
- PASS elation Certified Banger increases damage: Sparxie 0=10340, 240=36191, punchlineMultiplier=3.500
- PASS character state control catalog contains required controls: blackSwanArcanaStacks,elationCertifiedBangerStacks,elationMerrymake,cipherRecordedDamage,superBreakToughnessMultiplier,trailblazerDestructionBreakStacks,astaChargeStacks,drRatioDeductionStacks
- PASS character state controls resolve dynamic effect rows: Asta atkRatio 3=0.150 5=0.250 Trailblazer=0.200
- PASS Cipher recorded damage adds ultimate true damage: Cipher base=11930, recorded=111930, delta=100000
- PASS true damage ratio adds post-final damage: Cyrene trueDamageRatio base=1941, with=5162, true=1065

## Notes

- `crit-follow` 캐릭터는 더 이상 자동으로 환락 공식이 되지 않는다. 실제 row 설명에 `환락 피해`가 있는 경우만 `elation`으로 분류한다.
- 확정피해는 스킬 전체 공식이 아니라 `trueDamageRatio` 전투 modifier로 처리한다. 최종 피해 계산 후 `최종 피해 * trueDamageRatio`를 추가한다.
- Certified Banger는 UI 선택값을 사용하며 환락 Punchline 배율 `1 + value * 5 / (value + 240)`에 반영한다.
- 캐릭터/공식별 수동 상태값은 `data/curated/character-state-controls.json`에서 관리한다.
- `superBreakToughnessMultiplier`는 슈퍼격파 강인도 전환 배율에 곱한다.
- `cipherRecordedDamage`는 사이퍼 필살기 결과에 최종 확정피해로 더한다.
- UI 입력형 effect row는 전투 계산 시점에 `stateControls + scenarioSettings`로 `resolvedValue`를 덮어쓴다.

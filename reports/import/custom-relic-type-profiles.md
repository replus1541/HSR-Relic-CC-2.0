# Custom Relic Type Profiles

v1에서 사용자가 직접 구성한 캐릭터 타입/유물 프리셋 메타데이터입니다.
HoYoWiki 추천 세트 원천이나 계산 가능한 전투 효과 원천으로 취급하지 않고, UI 타입 표시와 기본 프리셋 선택 보조 데이터로만 사용합니다.

## Summary

- characters: 90
- matchedIdentity: 90
- unmatchedIdentity: 0

## Role Classes

- 치확 / 치피 딜러: 33
- 지원형 서포터: 14
- 힐러: 9
- 지속피해 딜러: 7
- 공격형 서포터: 6
- 격파 딜러: 5
- 디버퍼: 5
- 체퍼기반 딜러: 5
- 탱커: 5
- 환락 서포터: 1

## Damage Templates

- crit: 27
- support: 17
- crit-follow: 15
- break: 11
- utility: 10
- dot: 7
- crit-summon: 3

## Stat Profiles

- atk: 44
- support: 24
- hp: 11
- break: 6
- def: 5

## Relic Profiles

- crit95: 21
- break: 11
- critFollow: 9
- hpCrit: 9
- support: 9
- dotEhr: 8
- def: 6
- hpSpeedSupport: 4
- atkSpeedSupport: 3
- elationDps: 3
- speedDebufferEhr: 3
- elationSupport: 2
- atk2pcSupport: 1
- cerydraAtk2pcSupport: 1

## Preset Buckets

- crit: 35
- support: 21
- break: 11
- hp: 9
- dot: 8
- def: 6

## Characters

| character | source | type label | roleClass | damageTemplate | statProfile | primaryStat | relicProfile | presetId | main stats | substats | status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 갤러거 | 갤러거 | 힐러 | 힐러 | break | break | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | hpRatio, breakEffect, atkRatio, speed, critRate, hpFlat | matched_identity |
| Mar. 7th•수렵 | 검칠이 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, atkRatio, critRate, effectHitRate, defRatio | matched_identity |
| 게파드 | 게파드 | 탱커 | 탱커 | utility | def | def | def | def | body:critRate, feet:defRatio, sphere:elementDamage, rope:defRatio | speed, critDamage, critRate, defRatio, defFlat, hpFlat | matched_identity |
| 경류 | 경류 | 체퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | critDamage, critRate, speed, breakEffect, hpRatio, defRatio | matched_identity |
| 경원 | 경원 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, atkRatio, breakEffect, speed, atkFlat | matched_identity |
| 계네빈 | 계네빈 | 지속피해 딜러 | 지속피해 딜러 | dot | atk | atk | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | breakEffect, atkRatio, effectHitRate, speed, critDamage, defRatio | matched_identity |
| 곽향 | 곽향 | 힐러 | 힐러 | utility | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | critDamage, speed, critRate, hpRatio, atkFlat, breakEffect | matched_identity |
| 개척자 • 기억 | 기억척자 | 지원형 서포터 | 지원형 서포터 | support | support | critDamage | support | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | atkRatio, defRatio, speed, hpRatio, breakEffect, critDamage | matched_identity |
| 길가메시 | 길가메쉬 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, speed, atkRatio, defFlat, atkFlat | matched_identity |
| 나찰 | 나찰 | 힐러 | 힐러 | utility | support | atk | hpSpeedSupport | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | atkRatio, defRatio, hpRatio, speed, defFlat, atkFlat | matched_identity |
| 나타샤 | 나타샤 | 힐러 | 힐러 | utility | support | hp | hpSpeedSupport | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | atkRatio, defRatio, hpRatio, speed, critDamage, critRate | matched_identity |
| 단항 | 단항 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | atkRatio, speed, critDamage, critRate, hpRatio, breakEffect | matched_identity |
| 달리아 | 달리아 | 힐러 | 힐러 | break | hp | hp | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | hpRatio, atkRatio, breakEffect, speed, atkFlat, defFlat | matched_identity |
| 더 헤르타 | 더 헤르타 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, critRate, atkRatio, defRatio, atkFlat | matched_identity |
| 단항 • 등황 | 등황 | 공격형 서포터 | 공격형 서포터 | support | support | atk | def | def | body:critRate, feet:defRatio, sphere:elementDamage, rope:defRatio | speed, critDamage, critRate, atkRatio, defRatio, defFlat | matched_identity |
| 라파 | 라파 | 격파 딜러 | 격파 딜러 | break | break | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | hpRatio, speed, breakEffect, atkRatio, effectHitRate, critDamage | matched_identity |
| Dr. 레이시오 | 레이시오 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, speed, atkRatio, atkFlat, defFlat | matched_identity |
| 로빈 | 로빈 | 공격형 서포터 | 공격형 서포터 | support | support | atk | atk2pcSupport | support | body:atkRatio, feet:atkRatio, sphere:atkRatio, rope:energyRegen | speed, defRatio, atkFlat, atkRatio, critDamage, critRate | matched_identity |
| 루카 | 루카 | 지속피해 딜러 | 지속피해 딜러 | dot | atk | atk | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, breakEffect, effectHitRate, atkRatio, atkFlat, hpFlat | matched_identity |
| 링스 | 링스 | 힐러 | 힐러 | utility | support | hp | hpSpeedSupport | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | defRatio, speed, atkRatio, breakEffect, hpRatio, critRate | matched_identity |
| 마이데이 | 마이데이 | 체퍼 / 치확 딜러 | 체퍼기반 딜러 | crit | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | speed, critDamage, critRate, hpRatio, atkFlat, defFlat | matched_identity |
| 망귀인 | 망귀인 | 지원형 서포터 | 지원형 서포터 | break | support | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | speed, breakEffect, hpRatio, atkRatio, atkFlat, critDamage | matched_identity |
| 맥택 | 맥택 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, critDamage, atkRatio, critRate, hpFlat, breakEffect | matched_identity |
| 미샤 | 미샤 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, critRate, atkRatio, hpFlat, defFlat | matched_identity |
| 반디 | 반디 | 격파 딜러 | 격파 딜러 | break | break | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | speed, hpRatio, breakEffect, atkRatio, defFlat, critDamage | matched_identity |
| 백로 | 백로 | 힐러 | 힐러 | utility | support | hp | hpSpeedSupport | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | defRatio, speed, atkRatio, hpRatio, atkFlat, breakEffect | matched_identity |
| 개척자 • 보존 | 보존척자 | 탱커 | 탱커 | utility | def | def | def | def | body:critRate, feet:defRatio, sphere:elementDamage, rope:defRatio | critDamage, critRate, speed, defRatio, breakEffect, defFlat | matched_identity |
| 부트힐 | 부트힐 | 격파 딜러 | 격파 딜러 | break | break | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | hpRatio, atkRatio, breakEffect, speed, defFlat, atkFlat | matched_identity |
| 부현 | 부현 | 탱커 | 탱커 | utility | hp | hp | def | def | body:critRate, feet:defRatio, sphere:elementDamage, rope:defRatio | critDamage, speed, critRate, defRatio, atkFlat, atkRatio | matched_identity |
| 브로냐 | 브로냐 | 지원형 서포터 | 지원형 서포터 | support | support | critDamage | support | support | body:critDamage, feet:speed, sphere:hpRatio, rope:energyRegen | critDamage, atkRatio, hpRatio, speed, defRatio, effectHitRate | matched_identity |
| 블랙 스완 | 블랙스완 | 지속피해 딜러 | 지속피해 딜러 | dot | atk | atk | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | breakEffect, atkRatio, effectHitRate, speed, atkFlat, critDamage | matched_identity |
| 블레이드 | 블레이드 | 체퍼 / 치확 딜러 | 체퍼기반 딜러 | crit | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | speed, critDamage, critRate, hpRatio, hpFlat, atkFlat | matched_identity |
| 비소 | 비소 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, speed, atkRatio, effectHitRate, atkFlat | matched_identity |
| 사이퍼 | 사이퍼 | 공격형 서포터 | 공격형 서포터 | crit-follow | atk | atk | atkSpeedSupport | support | body:atkRatio, feet:speed, sphere:atkRatio, rope:energyRegen | defRatio, speed, atkRatio, hpRatio, critDamage, atkFlat | matched_identity |
| Mar. 7th | 삼칠이 | 탱커 | 탱커 | utility | def | def | def | def | body:critRate, feet:defRatio, sphere:elementDamage, rope:defRatio | speed, critDamage, critRate, defRatio, defFlat, atkRatio | matched_identity |
| 삼포 | 삼포 | 지속피해 딜러 | 지속피해 딜러 | dot | atk | atk | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, breakEffect, effectHitRate, atkRatio, defFlat, atkFlat | matched_identity |
| 서벌 | 서벌 | 지속피해 딜러 | 지속피해 딜러 | dot | atk | atk | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | breakEffect, speed, effectHitRate, atkRatio, defFlat, defRatio | matched_identity |
| 선데이 | 선데이 | 지원형 서포터 | 지원형 서포터 | support | support | critDamage | support | support | body:critDamage, feet:speed, sphere:hpRatio, rope:energyRegen | critDamage, hpRatio, speed, atkRatio, atkFlat, defRatio | matched_identity |
| 설의 | 설의 | 격파 딜러 | 격파 딜러 | break | break | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | speed, hpRatio, breakEffect, atkRatio, defRatio, critDamage | matched_identity |
| 세이버 | 세이버 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, atkRatio, critRate, effectHitRate, atkFlat | matched_identity |
| 소상 | 소상 | 격파 딜러 | 격파 딜러 | break | break | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | hpRatio, atkRatio, breakEffect, speed, critDamage, atkFlat | matched_identity |
| 스파클 | 스파클 | 지원형 서포터 | 지원형 서포터 | support | support | critDamage | support | support | body:critDamage, feet:speed, sphere:hpRatio, rope:energyRegen | critDamage, atkRatio, defRatio, hpRatio, effectHitRate, speed | matched_identity |
| 스파키 | 스파키 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | elationDps | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, critDamage, atkRatio, critRate, effectHitRate, defRatio | matched_identity |
| 아글라이아 | 아글라이아 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-summon | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, atkRatio, critRate, atkFlat, breakEffect | matched_identity |
| 아낙사 | 아낙사 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | atkRatio, speed, critDamage, critRate, hpRatio, atkFlat | matched_identity |
| 아를란 | 아를란 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, critDamage, atkRatio, critRate, hpFlat, defRatio | matched_identity |
| 아스타 | 아스타 | 지원형 서포터 | 지원형 서포터 | support | support | atk | support | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | atkRatio, defRatio, speed, hpRatio, critDamage, atkFlat | matched_identity |
| 아젠티 | 아젠티 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, atkRatio, critRate, breakEffect, effectHitRate | matched_identity |
| 아처 | 아처 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, atkRatio, critRate, speed, defFlat, atkFlat | matched_identity |
| 아케론 | 아케론 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, atkRatio, critRate, breakEffect, defFlat | matched_identity |
| 애쉬베일 | 애쉬베일 | 디버퍼 | 디버퍼 | support | support | effectHitRate | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, critRate, atkRatio, defRatio, atkFlat | matched_identity |
| 어공 | 어공 | 지원형 서포터 | 지원형 서포터 | support | support | atk | support | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | defRatio, atkRatio, speed, breakEffect, hpRatio, atkFlat | matched_identity |
| 어벤츄린 | 어벤츄린 | 탱커 | 탱커 | crit-follow | def | def | def | def | body:critRate, feet:defRatio, sphere:elementDamage, rope:defRatio | critDamage, speed, critRate, atkRatio, defRatio, hpRatio | matched_identity |
| 에바네시아 | 에바네시아 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-summon | atk | atk | elationDps | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, atkRatio, critRate, defRatio, hpFlat | matched_identity |
| 에버나이트 | 에버나이트 | 체퍼 / 치확 딜러 | 체퍼기반 딜러 | crit | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | critDamage, speed, critRate, defFlat, defRatio, hpRatio | matched_identity |
| 연경 | 연경 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | atkRatio, speed, critDamage, critRate, hpFlat, atkFlat | matched_identity |
| 영사 | 영사 | 힐러 | 힐러 | break | support | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | breakEffect, speed, hpRatio, atkRatio, atkFlat, critDamage | matched_identity |
| 완•매 | 완매 | 지원형 서포터 | 지원형 서포터 | break | support | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | speed, hpRatio, breakEffect, atkRatio, defFlat, effectHitRate | matched_identity |
| 웰트 | 웰트 | 디버퍼 | 디버퍼 | crit | atk | atk | speedDebufferEhr | support | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, atkRatio, speed, breakEffect, effectHitRate | matched_identity |
| 은랑 | 은랑 | 디버퍼 | 디버퍼 | support | support | effectHitRate | speedDebufferEhr | support | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | atkRatio, speed, critDamage, critRate, breakEffect, atkFlat | matched_identity |
| 은랑 LV.999 | 은랑 LV 999 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | elationDps | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, atkRatio, critRate, speed, breakEffect, atkFlat | matched_identity |
| 단항•음월 | 음월 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, speed, atkRatio, defFlat, hpRatio | matched_identity |
| 정운 | 정운 | 지원형 서포터 | 지원형 서포터 | support | support | atk | support | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | defRatio, speed, atkRatio, hpRatio, breakEffect, atkFlat | matched_identity |
| 제레 | 제레 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, atkRatio, speed, defFlat, defRatio | matched_identity |
| 제이드 | 제이드 | 공격형 서포터 | 공격형 서포터 | crit-follow | atk | atk | atkSpeedSupport | support | body:atkRatio, feet:speed, sphere:atkRatio, rope:energyRegen | defRatio, hpRatio, speed, atkRatio, atkFlat, defFlat | matched_identity |
| 천야 • 블레이드 | 천야 블레이드 | 체퍼 / 치확 딜러 | 체퍼기반 딜러 | crit | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | critDamage, speed, critRate, defRatio, hpRatio, atkFlat | matched_identity |
| 청작 | 청작 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, critDamage, atkRatio, critRate, hpFlat, defFlat | matched_identity |
| 초구 | 초구 | 디버퍼 | 디버퍼 | support | support | effectHitRate | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | breakEffect, speed, effectHitRate, atkRatio, defRatio, critDamage | matched_identity |
| 카스토리스 | 카스토리스 | 체퍼 / 치확 딜러 | 체퍼기반 딜러 | crit-summon | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | speed, critDamage, critRate, defRatio, hpRatio, atkFlat | matched_identity |
| 카프카 | 카프카 | 지속피해 딜러 | 지속피해 딜러 | dot | atk | atk | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | breakEffect, atkRatio, speed, effectHitRate, defFlat, defRatio | matched_identity |
| 케리드라 | 케리드라 | 지원형 서포터 | 지원형 서포터 | support | support | atk | cerydraAtk2pcSupport | support | body:critDamage, feet:atkRatio, sphere:atkRatio, rope:atkRatio | atkFlat, critDamage, speed, atkRatio, hpRatio, breakEffect | matched_identity |
| 클라라 | 클라라 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, speed, atkRatio, hpFlat, critRate, defFlat | matched_identity |
| 키레네 | 키레네 | 지원형 서포터 | 지원형 서포터 | support | support | critDamage | support | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | atkRatio, speed, defRatio, hpRatio, critRate, defFlat | matched_identity |
| 토오사카 린 | 토오사카 린 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, atkRatio, speed, defFlat, effectHitRate | matched_identity |
| 토파즈&복순이 | 토파즈 | 공격형 서포터 | 공격형 서포터 | crit-follow | atk | atk | atkSpeedSupport | support | body:atkRatio, feet:speed, sphere:atkRatio, rope:energyRegen | defRatio, speed, hpRatio, atkRatio, effectHitRate, breakEffect | matched_identity |
| 트리비 | 트리비 | 공격형 서포터 | 공격형 서포터 | crit | hp | hp | hpCrit | hp | body:critDamage, feet:hpRatio, sphere:hpRatio, rope:energyRegen | critRate, critDamage, hpRatio, defRatio, effectHitRate, breakEffect | matched_identity |
| 개척자 • 파멸 | 파멸척자 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, atkRatio, speed, breakEffect, effectHitRate | matched_identity |
| 파이논 | 파이논 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, critDamage, atkRatio, critRate, defRatio, breakEffect | matched_identity |
| 페라 | 페라 | 디버퍼 | 디버퍼 | support | support | effectHitRate | speedDebufferEhr | support | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, atkRatio, speed, breakEffect, defFlat | matched_identity |
| 한아 | 한아 | 지원형 서포터 | 지원형 서포터 | support | support | speed | support | support | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | atkRatio, defRatio, hpRatio, speed, critDamage, breakEffect | matched_identity |
| 헤르타 | 헤르타 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, critDamage, atkRatio, critRate, effectHitRate, defFlat | matched_identity |
| 개척자 • 화합 | 화척자 | 지원형 서포터 | 지원형 서포터 | break | def | breakEffect | break | break | body:atkRatio, feet:speed, sphere:elementDamage, rope:breakEffect | hpRatio, atkRatio, breakEffect, speed, critDamage, defFlat | matched_identity |
| 개척자 • 환락 | 환락 척자 | 지원형 서포터 | 지원형 서포터 | support | support | critDamage | elationSupport | crit | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | atkRatio, speed, hpRatio, defRatio, breakEffect, defFlat | matched_identity |
| 효광 | 효광 | 환락 서포터 | 환락 서포터 | crit | atk | atk | elationSupport | crit | body:hpRatio, feet:speed, sphere:hpRatio, rope:energyRegen | defRatio, speed, atkRatio, breakEffect, hpFlat, hpRatio | matched_identity |
| 후크 | 후크 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, atkRatio, speed, hpRatio, defRatio | matched_identity |
| 히메코 | 히메코 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, critDamage, atkRatio, critRate, effectHitRate, atkFlat | matched_identity |
| 히메코 • 노바 | 히메코 노바 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | crit95 | crit | body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critDamage, critRate, speed, atkRatio, breakEffect, defRatio | matched_identity |
| 히실렌스 | 히실렌스 | 지속피해 딜러 | 지속피해 딜러 | dot | atk | atk | dotEhr | dot | body:effectHitRate, feet:speed, sphere:elementDamage, rope:atkRatio | speed, breakEffect, effectHitRate, atkRatio, critRate, hpFlat | matched_identity |
| 히아킨 | 히아킨 | 힐러 | 힐러 | utility | hp | hp | hpCrit | hp | body:critRate, feet:hpRatio, sphere:hpRatio, rope:hpRatio | critDamage, speed, critRate, breakEffect, defRatio, hpRatio | matched_identity |
| 운리 | 운리 | 공퍼 / 치확 딜러 | 치확 / 치피 딜러 | crit-follow | atk | atk | critFollow | crit | head:hpFlat, hands:atkFlat, body:critRate, feet:speed, sphere:elementDamage, rope:atkRatio | critRate, critDamage, atkRatio, speed | manual_v2_user_curated |


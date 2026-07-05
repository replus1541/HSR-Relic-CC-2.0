# Character State / Formula Exception Audit

생성일: 2026-07-05T21:23:48.804Z

## Summary

- HoyoWiki characters: 92
- released/joined characters: 87
- unavailable/unjoined characters: 5
- characters with state controls: 13
- UI-input effect rows: 14
- always-ON reviewed rows: 68
- formula override characters: 4
- rows needing review visibility: 87

## UI 입력형 상태값

### 은랑 LV.999

- characterId: `SilverWolf999_00`
- controls: `silverWolf999HiddenScore`
- effect:SilverWolf999_00:0: critRate, minEidolon=-, decision=UI selectable Hidden Score preset. Provide options 100, 150, 200, 250, and 300, and calculate the critRate/critDamage conversion from the selected score for the current Silver Wolf LV.999 calculation.

### 애쉬베일

- characterId: `Ashveil_00`
- controls: `ashveilIndulgenceStacks`
- effect:Ashveil_00:6: allDamage, minEidolon=6, decision=UI selectable stack preset when Ashveil is E6 or higher. Do not force maximum only. Provide Indulgence stack options 10, 20, and 30, and calculate this self allDamage buff from the selected stack count for the current Ashveil calculation.

### 키레네

- characterId: `Cyrene_00`
- controls: `cyreneDemiurgeBuffCount`
- effect:Cyrene_00:18: specialFinal, minEidolon=2, decision=UI selectable ally-count preset when Cyrene is E2 or higher. Provide options 2, 3, and 4 different allied characters receiving Demiurge memosprite skill buffs, and calculate this specialFinal bonus from the selected count.

### 케리드라

- characterId: `Cerydra_00`
- controls: `cerydraNobilityStacks`
- effect:Cerydra_00:10: resistancePen, minEidolon=-, decision=UI selectable Nobility charge state. Provide options "below 5 stacks" and "6 stacks". Apply the Nobility resistance penetration effect only when the 6-stack option is selected for the currently selected calculated character.

### 파이논

- characterId: `Phainon_00`
- controls: `phainonTransformedStacks`
- effect:Phainon_00:1: atkRatio, minEidolon=-, decision=UI selectable stack preset when Phainon/Chaoslana is the currently selected calculated character. Provide 1-stack and 2-stack options, and calculate this transformed-state ATK buff from the selected stack count.

### 사이퍼

- characterId: `Cipher_00`
- controls: `cipherRecordedDamage`

### 제이드

- characterId: `Jade_00`
- controls: -
- effect:Jade_00:1: atkRatio, minEidolon=-, decision=Always calculate at maximum Pawned Asset stacks when Jade is the currently selected calculated character. Do not expose a stack preset for this row unless later review needs non-max scenarios.

### 블랙 스완

- characterId: `BlackSwan_00`
- controls: `blackSwanArcanaStacks`
- effect:BlackSwan_00:1: defenseIgnore, minEidolon=-, decision=Always ON for Arcana DoT. Change dynamic_formula -> fixed. defenseIgnore +20%; calculator assumes selected Arcana stack preset is always at least 7 stacks. Applies only to Black Swan Arcana DoT damage, not direct skill/ultimate hit damage.

### Dr. 레이시오

- characterId: `Dr_Ratio_00`
- controls: `drRatioDeductionStacks`
- effect:Dr_Ratio_00:0: critRate, minEidolon=-, decision=UI selectable Deduction stack preset. Provide 3, 6, and 10 stack options; only allow the 10-stack option when Dr. Ratio is E2 or higher.
- effect:Dr_Ratio_00:1: critDamage, minEidolon=-, decision=UI selectable Deduction stack preset. Provide 3, 6, and 10 stack options; only allow the 10-stack option when Dr. Ratio is E2 or higher. Use the same selected stack count as effect:Dr_Ratio_00:0.

### 단항•음월

- characterId: `DanHengIL_00`
- controls: `danHengIlPrideStacks`
- effect:DanHengIL_00:0: allDamage, minEidolon=-, decision=Dan Heng IL Pride stacks via UI preset 0/3/6, default 6. allDamage = 5% * stackCount.

### 루카

- characterId: `Luka_00`
- controls: `lukaFightingWillStacks`
- effect:Luka_00:1: atkRatio, minEidolon=4, decision=Luka Fighting Will stacks via UI preset 0/2/4, default 4. atkRatio = 5% * stackCount.

### 청작

- characterId: `Qingque_00`
- controls: `qingqueSkillStacks`
- effect:Qingque_00:1: allDamage, minEidolon=-, decision=UI selectable combat-skill stack preset. Provide Qingque combat skill stack options 3, 5, and 7, and calculate this self damage buff from the selected stack count for the current Qingque calculation.

### 아스타

- characterId: `Asta_00`
- controls: `astaChargeStacks`
- effect:Asta_00:0: atkRatio, minEidolon=-, decision=UI selectable stack preset. Do not force always max. Provide Asta charge stack options 3 and 5, and calculate the allAllies ATK buff from the selected stack count for the current calculation.

### 개척자 • 파멸

- characterId: `PlayerBoy_00`
- controls: `trailblazerDestructionBreakStacks`
- effect:PlayerBoy_00:0: atkRatio, minEidolon=-, decision=UI input stackCount 0-2. stack_count, atkRatio = 10% * stackCount. No implicit ready without stack input.

## 공식/상태 예외 후보

- 천야 • 블레이드 (`MortenaxBlade_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 개척자 • 환락 (`PlayerBoy_40`): damageTypes=normal, override=no, signals=슈퍼격파,환락피해,실드/치유 기반 피해
- 에바네시아 (`Evanescia_00`): damageTypes=normal,elation, override=no, signals=슈퍼격파,환락피해,분배/랜덤,실드/치유 기반 피해
- 은랑 LV.999 (`SilverWolf999_00`): damageTypes=normal,elation, override=no, signals=확정피해,슈퍼격파,환락피해,분배/랜덤,현재 DoT 즉시 피해,실드/치유 기반 피해
- 애쉬베일 (`Ashveil_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 스파키 (`Sparxie_00`): damageTypes=normal,elation, override=no, signals=슈퍼격파,환락피해,분배/랜덤,실드/치유 기반 피해
- 효광 (`YaoGuang_00`): damageTypes=normal,elation, override=no, signals=슈퍼격파,환락피해,분배/랜덤,현재 DoT 즉시 피해,실드/치유 기반 피해
- 달리아 (`Constance_00`): damageTypes=break,super_break, override=yes, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 키레네 (`Cyrene_00`): damageTypes=normal, override=no, signals=확정피해,슈퍼격파,분배/랜덤,현재 DoT 즉시 피해,실드/치유 기반 피해
- 단항 • 등황 (`DanHengPT_00`): damageTypes=normal, override=no, signals=슈퍼격파,현재 DoT 즉시 피해,실드/치유 기반 피해
- 에버나이트 (`Evernight_00`): damageTypes=normal, override=no, signals=슈퍼격파,현재 DoT 즉시 피해,실드/치유 기반 피해
- 케리드라 (`Cerydra_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 히실렌스 (`Harscyline_00`): damageTypes=dot, override=no, signals=슈퍼격파,현재 DoT 즉시 피해,실드/치유 기반 피해
- 파이논 (`Phainon_00`): damageTypes=normal, override=no, signals=확정피해,슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 아처 (`Archer_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 세이버 (`Saber_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 사이퍼 (`Cipher_00`): damageTypes=normal, override=no, signals=확정피해,슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 히아킨 (`Hyacine_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 아낙사 (`Anaxa_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,현재 DoT 즉시 피해,실드/치유 기반 피해
- 카스토리스 (`Castorice_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,현재 DoT 즉시 피해,실드/치유 기반 피해
- 마이데이 (`Mydeimos_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 트리비 (`Tribbie_00`): damageTypes=normal, override=no, signals=확정피해,슈퍼격파,현재 DoT 즉시 피해,실드/치유 기반 피해
- 개척자 • 기억 (`PlayerBoy_20`): damageTypes=normal, override=no, signals=확정피해,실드/치유 기반 피해
- 아글라이아 (`Aglaea_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 더 헤르타 (`TheHerta_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 망귀인 (`Fugue_00`): damageTypes=break,super_break, override=yes, signals=슈퍼격파,실드/치유 기반 피해
- 선데이 (`Sunday_10`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 라파 (`Rappa_00`): damageTypes=super_break,break, override=yes, signals=슈퍼격파,실드/치유 기반 피해
- 맥택 (`Moze_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 영사 (`Lingsha_00`): damageTypes=break, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 비소 (`Feixiao_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,현재 DoT 즉시 피해,실드/치유 기반 피해
- Mar. 7th•수렵 (`Mar_7th_10`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 초구 (`Jiaoqiu_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 운리 (`Yunli_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 개척자 • 화합 (`PlayerBoy_30`): damageTypes=break, override=yes, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 제이드 (`Jade_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 반디 (`Sam_00`): damageTypes=break, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 부트힐 (`Boothill_00`): damageTypes=break, override=no, signals=슈퍼격파,현재 DoT 즉시 피해,실드/치유 기반 피해
- 로빈 (`Robin_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 갤러거 (`Gallagher_00`): damageTypes=break, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 어벤츄린 (`Aventurine_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 아케론 (`Acheron_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,현재 DoT 즉시 피해,실드/치유 기반 피해
- 미샤 (`Misha_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 스파클 (`Sparkle_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 블랙 스완 (`BlackSwan_00`): damageTypes=dot, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 설의 (`Xueyi_00`): damageTypes=break, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- Dr. 레이시오 (`Dr_Ratio_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 완•매 (`RuanMei_00`): damageTypes=break, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 한아 (`Hanya_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 아젠티 (`Argenti_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 곽향 (`Huohuo_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 계네빈 (`Guinaifen_00`): damageTypes=dot, override=no, signals=슈퍼격파,현재 DoT 즉시 피해
- 토파즈&복순이 (`Topaz_00`): damageTypes=normal, override=no, signals=슈퍼격파
- 경류 (`Jingliu_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 링스 (`Lynx_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 단항•음월 (`DanHengIL_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 부현 (`FuXuan_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 루카 (`Luka_00`): damageTypes=dot, override=no, signals=슈퍼격파,현재 DoT 즉시 피해,실드/치유 기반 피해
- 카프카 (`Kafka_00`): damageTypes=dot, override=no, signals=슈퍼격파,현재 DoT 즉시 피해,실드/치유 기반 피해
- 블레이드 (`Ren_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 어공 (`Yukong_00`): damageTypes=normal, override=no, signals=슈퍼격파
- 나찰 (`Luocha_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 은랑 (`Silwolf_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 백로 (`Bailu_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤,실드/치유 기반 피해
- 연경 (`Yanqing_00`): damageTypes=normal, override=no, signals=슈퍼격파
- 소상 (`Sushang_00`): damageTypes=break, override=no, signals=슈퍼격파,현재 DoT 즉시 피해
- 경원 (`JingYuan_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤
- 정운 (`Tingyun_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 청작 (`Qingque_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤
- 개척자 • 보존 (`PlayerBoy_10`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 후크 (`Hook_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 삼포 (`Sampo_00`): damageTypes=dot, override=no, signals=슈퍼격파,분배/랜덤,현재 DoT 즉시 피해
- 클라라 (`Klara_00`): damageTypes=normal, override=no, signals=슈퍼격파
- 페라 (`Pela_00`): damageTypes=normal, override=no, signals=슈퍼격파
- 나타샤 (`Natasha_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 게파드 (`Gepard_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 서벌 (`Serval_00`): damageTypes=dot, override=no, signals=슈퍼격파
- 제레 (`Seele_00`): damageTypes=normal, override=no, signals=확정피해,슈퍼격파
- 브로냐 (`Bronya_00`): damageTypes=normal, override=no, signals=슈퍼격파
- 헤르타 (`Herta_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 아스타 (`Asta_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤
- 아를란 (`Arlan_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 웰트 (`Welt_00`): damageTypes=normal, override=no, signals=슈퍼격파,분배/랜덤
- 히메코 (`Himeko_00`): damageTypes=normal, override=no, signals=슈퍼격파,현재 DoT 즉시 피해
- 단항 (`DanHeng_00`): damageTypes=normal, override=no, signals=슈퍼격파
- Mar. 7th (`Mar_7th_00`): damageTypes=normal, override=no, signals=슈퍼격파,실드/치유 기반 피해
- 개척자 • 파멸 (`PlayerBoy_00`): damageTypes=normal, override=no, signals=슈퍼격파

## 선택 불가/미조인

- 어벤츄린 • 웨이브 (`hoyowiki:6566`): skillCount=0
- 로빈 • 서머레토 (`hoyowiki:6565`): skillCount=0
- 토오사카 린 (`TohsakaRin_00`): skillCount=0
- 길가메시 (`Gilgamesh_00`): skillCount=0
- 히메코 • 노바 (`HimekoNova_00`): skillCount=0

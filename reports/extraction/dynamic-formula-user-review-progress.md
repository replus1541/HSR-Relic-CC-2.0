# Dynamic Formula User Review Progress

Generated during interactive review. This file preserves decisions before restarting Codex.

## Summary

- dynamic_formula rows total: 103
- reviewed and decided: 17
- remaining: 86

## Confirmed Decisions


### 1. 개척자 • 파멸 - effect:PlayerBoy_00:0

- characterId: PlayerBoy_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:6:talent:도루 견제:atkRatio:0
- decision: UI input stackCount 0-2. stack_count, atkRatio = 10% * stackCount. No implicit ready without stack input.
- sourceText: <특성> 강화 적의 약점을 격파할 때마다 개척자의 공격력이 10% 증가한다. 해당 효과 최대 중첩수: 2스택

### 2. 개척자 • 파멸 - effect:PlayerBoy_00:1

- characterId: PlayerBoy_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:6:ultimate:투지:allDamage:0
- decision: Always ON. Change dynamic_formula -> fixed. allDamage +25%. Applies to combat skill / specific ultimate damage condition metadata.
- sourceText: <추가 능력> 전투 스킬 또는 필살기 [압승•안식 홈런] 발동 시 지정된 적에게 가하는 피해가 25% 증가한다

### 3. 개척자 • 환락 - effect:PlayerBoy_40:0

- characterId: PlayerBoy_40
- stat: critDamage
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:5006:ultimate:마음껏 날아, 개척이 함께할 테니!:critDamage:0
- decision: Fixed singleAlly critDamage +30%. Auto-check target ally path/skillset for Elation skill; no default manual toggle required, optional advanced override.
- sourceText: <필살기> [서포트] 웃음 포인트 를 5pt 획득하고, 지정된 단일 아군의 치명타 피해를 30% 증가시킨다, 지속 시간: 3턴. 또한 해당 목표의 제어류 디버프 상태 를 해제한다. 목표가 환락 스킬을 보유하고 있다면, 목표는 추가로 [훌륭한 솜씨에는 보상을] 을 10pt 획득하고, 즉시 웃음 포인트 20pt로 고정

### 4. 경류 - effect:Jingliu_00:0

- characterId: Jingliu_00
- stat: critRate
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:1387:talent:담월전백:critRate:0
- decision: Jingliu calculated in Spectral Transmigration state. target allAllies -> self, dynamic_formula -> fixed, always ON, critRate +40%.
- sourceText: <특성> 강화 [삭망] 2스택 보유 시, 경류가 [전백(轉魄)] 상태에 진입하고 행동 게이지가 100% 증가, 치명타 확률이 40% 증가한다. 이후 전투 스킬 [무결의 섬광]이 [한천(寒川)에 비친 달]로 강화되며 해당 전투 스킬만 사용할 수 있다. [전백] 상태일 때 공격을 발동하면 동료 HP를 각각 동료 HP 최대치의 4%만큼 소모한다(모든 동료

### 5. 경류 - effect:Jingliu_00:1

- characterId: Jingliu_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:1387:ultimate:서리 혼:allDamage:0
- decision: Jingliu ultimate damage bonus. stat allDamage -> ultimateDamage, dynamic_formula -> fixed, always ON, +20%.
- sourceText: <추가 능력> [전백(轉魄)] 상태일 때 필살기가 가하는 피해가 20% 증가한다

### 6. 경원 - effect:JingYuan_00:0

- characterId: JingYuan_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:26:combatSkill:장수 파견:critRate:0
- decision: Jing Yuan critRate after skill is always ON. dynamic_formula -> fixed, self, critRate +10%.
- sourceText: <추가 능력> 전투 스킬 발동 후 치명타 확률이 10% 증가한다. 지속 시간: 2턴

### 7. 경원 - effect:JingYuan_00:2

- characterId: JingYuan_00
- stat: vulnerability
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:26:E6:적을 격멸하는 위령(威霊):vulnerability:0
- decision: Jing Yuan E6 vulnerability stack. Use max 3 stacks by default. vulnerability = 12% * 3 = 36%, enemySingle.
- sourceText: [신군]의 공격은 단마다 지정된 적을 추가로 취약 상태에 빠트린다. 취약 상태의 적은 받는 피해가 12% 증가하며, 이번 [신군] 공격 종료까지 지속된다. 해당 효과 최대 중첩수: 3스택

### 8. 단항 - effect:DanHeng_00:0

- characterId: DanHeng_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:8:basicAttack:세찬 바람:allDamage:0
- decision: Dan Heng slow-condition basic attack bonus always ON because he can apply slow himself. stat allDamage -> basicDamage, dynamic_formula -> fixed, +40%.
- sourceText: <추가 능력> 일반 공격이 감속 상태의 적에게 가하는 피해가 40% 증가한다

### 9. 단항 • 등황 - effect:DanHengPT_00:2

- characterId: DanHengPT_00
- stat: atkFlat
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:3957:combatSkill:천혜의 경관:atkFlat:sourceCombatAtkRatio
- decision: Dan Heng PT ally target is current calculated DPS. Always ON. Keep dynamic_formula source_stat_ratio: atkFlat = DanHengPT_ATK * 15%, singleAlly.
- sourceText: <추가 능력> 전투 스킬 발동 시 [전우]가 된 목표의 공격력이 단항 • 등황 공격력의 15%만큼 증가한다

### 10. 단항•음월 - effect:DanHengIL_00:0

- characterId: DanHengIL_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:1226:talent:긍지:allDamage:0
- decision: Dan Heng IL Pride stacks via UI preset 0/3/6, default 6. allDamage = 5% * stackCount.
- sourceText: <특성> 강화 단항・음월의 공격 단수마다 [긍지] 효과를 획득하고, 스택당 자신이 가하는 피해가 5.0% 증가한다. 해당 효과는 6스택 중첩 가능하며, 자신의 턴이 종료될 때까지 지속된다

### 11. 달리아 - effect:Constance_00:0

- characterId: Constance_00
- stat: defenseDown
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:4060:ultimate:빠져들어... 재가 흩날리는 묘지로:defenseDown:0
- decision: Constance/Dahlia Epiphany defense down. target enemySingle -> enemyAll, dynamic_formula -> fixed, always ON, defenseDown +8%.
- sourceText: , 지속시간: 4턴. 이후 달리아 공격력의 180% 만큼 화염 속성 피해 를 가하고, 이는 모든 적이 균등 분담한다. [영락] 상태일 때 적의 방어력이 8.0% 감소하고, 모든 [춤 파트너] 속성의 약점이 부여된다

### 12. 더 헤르타 - effect:TheHerta_00:0

- characterId: TheHerta_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3285:ultimate:마법이라고 했잖아:atkRatio:level10-curated
- decision: The Herta ultimate ATK buff always ON. Use existing Lv10 curated value 80%, dynamic_formula -> skill_level_scaled or fixed_level10, self.
- sourceText: 필살기 발동 시 더 헤르타의 공격력이 40% 증가한다. HoyoWiki 공식 설명은 Lv.1 값을 표시하지만, 더 헤르타 필살기 레벨10 계수는 80%로 계산한다.

### 13. 더 헤르타 - effect:TheHerta_00:1

- characterId: TheHerta_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3285:combatSkill:냉정한 정직:selfEnhancedSkillAllDamage
- decision: The Herta enhanced skill uses enemy count and Interpretation stacks. enemy<=1 choose 42 or 20 stacks; enemy>=3 choose center42_adjacent20 or all42. +50% only on 42-stack target.
- sourceText: 강화된 전투 스킬 발동 시 주목표의 [해독]이 42스택에 도달하면 더 헤르타가 가하는 피해가 50% 증가하며, 이번 공격이 종료될 때까지 지속된다

### 14. 로빈 - effect:Robin_00:2

- characterId: Robin_00
- stat: atkFlat
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:2366:ultimate:천음의 합주, 뭇별의 푸가:atkFlat:sourceCombatAtkRatioPlusFlat:level10
- decision: Robin ultimate ATK buff always ON if Robin in party. source_stat_ratio_plus_flat: Robin_finalCombatATK * 15.2% + 50. Include other ally AoE ATK buffs on Robin, with recursion guard.
- sourceText: <필살기> 서포트 | 에너지 소모 160 로빈이 [협주] 상태에 진입하고, 자신 이외의 동료를 즉시 행동하게 한다. [협주] 상태 시 모든 아군의 공격력이 증가한다. 증가 수치는 로빈 공격력의 15.2% + 50 pt이며, 아군이 공격을 발동할 때마다 로빈은 추가로 자신의 공격력의 72% 만큼 물리 속성 추가 피해 를 1회 가한다. 해당 피해의 치명타 확률은 100%, 치명타 피해는 150%로 고정된다. [협주] 상태일 시 로빈은 제어류 디버프 상태 에 면역되고, [협주] 상태 종료 전에는 자신의 턴에 진입하지 않으며 행동할 수 없다. 행동 서열에 [협주] 카운트다운이 나타나고, 카운트다운 턴 시작 시 로빈은 [협주] 상태를 종료하고 즉시 행동한다. 카운트다운이 보유한 고정 속도는 90pt이다

### 15. 루카 - effect:Luka_00:1

- characterId: Luka_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:801:E4:칠전팔기:atkRatio:0
- decision: Luka Fighting Will stacks via UI preset 0/2/4, default 4. atkRatio = 5% * stackCount.
- sourceText: [투지]를 1스택 획득할 때마다 공격력이 5% 증가한다. 해당 효과 최대 중첩수: 4스택

### 16. 망귀인 - effect:Fugue_00:0

- characterId: Fugue_00
- stat: defenseDown
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:3151:combatSkill:현인의 길조, 천명의 부채:defenseDown:0
- decision: Fugue defense down always ON, fixed 8%, but target scope depends on current DPS attack coverage: single/blast/bounce/aoe affected enemies.
- sourceText:  상태일 시 망귀인의 일반 공격이 강화된다. [여우의 기도]를 보유한 아군이 공격을 발동할 때마다 망귀인은 100%의 기본 확률로 피격된 적의 방어력을 8% 감소시킨다, 지속 시간: 2턴

### 17. 맥택 - effect:Moze_00:0

- characterId: Moze_00
- stat: followDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:2949:ultimate:올곧은 복수심:followDamage:0
- decision: Moze self-only follow-up handling: user confirmed always ON for self. Treat as always applied for Moze; split metadata ultimate-counts-as-follow-up if needed.
- sourceText: <추가 능력> 필살기를 발동해 피해를 가할 시 추가 공격을 발동한 것으로 간주한다. [사냥감]이 받는 추가 공격 피해가 25% 증가한다

## Remaining Rows

These still need user review.


### 18. 부현 - effect:FuXuan_00:0

- characterId: FuXuan_00
- stat: critRate
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:804:combatSkill:별의 움직임, 미래의 그림자:critRate:0
- sourceText: : 3턴. [궁관진] 상태의 모든 아군이 [감식] 효과를 획득한다. [감식]: 아군 HP 최대치가 부현 HP 최대치의 3.0% 만큼 증가하고, 치명타 확률이 6.0% 증가한다. 부현이 전투 불능 상태 가 되면 [궁관진]도 해제된다
- decision: pending

### 19. 브로냐 - effect:Bronya_00:0

- characterId: Bronya_00
- stat: atkRatio
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:14:ultimate:벨로보그 행진곡:atkRatio:0
- sourceText: <필살기> 서포트 | 에너지 소모 120 모든 아군의 공격력이 33% 증가하고, 동시에 브로냐 치명타 피해 12%+12% 만큼의 치명타 피해가 증가한다. 지속 시간: 2턴
- decision: pending

### 20. 브로냐 - effect:Bronya_00:1

- characterId: Bronya_00
- stat: allDamage
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:14:combatSkill:작전 재배치:allDamage:0
- sourceText: <전투 스킬> 서포트 지정된 단일 아군의 디버프 효과 를 1개 해제하며, 해당 목표는 즉시 행동하고, 가하는 피해가 33% 증가한다. 지속 시간: 1턴. 자신에게 해당 스킬을 발동하면 즉시 행동 효과는 발동되지 않는다
- decision: pending

### 21. 블랙 스완 - effect:BlackSwan_00:0

- characterId: BlackSwan_00
- stat: vulnerability
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:1806:ultimate:저편의 품에 취해:vulnerability:0
- sourceText: 에너지 소모 120 | 강인성 감소 수치: 20 모든 적을 [발로] 상태에 빠뜨린다. 지속 시간: 2턴 [발로] 상태에서 적은 자신의 턴 동안 받는 피해가 15% 증가하고 적이 [ 아르카나 ] 상태일 시 동시에 풍화 , 열상 , 연소 , 감전 상태에 빠진 것으로 간주한다. 또한 [ 아르카나 ]가 매턴 시작 시 피해를 가한 후 스택 수가 초기화되지 않는다. [ 아르카나 ] 스택 수
- decision: pending

### 22. 블랙 스완 - effect:BlackSwan_00:1

- characterId: BlackSwan_00
- stat: defenseIgnore
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:1806:talent:변덕스러운 운명의 베틀:defenseIgnore:0
- sourceText:  기본 확률 로 인접한 목표를 [ 아르카나 ] 1스택에 빠트린다. 7스택 이상일 경우, 이번에 가하는 지속 피해는 해당 목표 및 인접한 목표의 방어력을 20% 무시한다
- decision: pending

### 23. 블랙 스완 - effect:BlackSwan_00:2

- characterId: BlackSwan_00
- stat: defenseDown
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:1806:combatSkill:실추, 거짓된 신의 황혼:defenseDown:0
- sourceText: 에 100%의 기본 확률 로 목표 및 인접한 목표를 [ 아르카나 ] 1스택에 빠뜨린다. 또한, 100%의 기본 확률 로 목표 및 인접한 목표의 방어력을 14.8% 감소시킨다. 지속 시간: 3턴
- decision: pending

### 24. 블레이드 - effect:Ren_00:1

- characterId: Ren_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:789:combatSkill:지옥변:allDamage:0
- sourceText: 드가 HP 최대치의 30%만큼 HP를 소모해 [지옥변(地獄變)] 상태에 진입한다. [지옥변] 상태에서는 전투 스킬을 발동할 수 없으며, 자신이 가하는 피해가 12% 증가하고, 일반 공격 [지리검(支離劍)]이 강화되어 [무간검수(無間劍樹)]로 바뀐다. 지속 시간: 3턴 블레이드의 현재 HP가 부족할 때 전투 스킬을 발동하면 HP가 1pt까지 감소한다. 해당 전투 스킬로 에너지를 회복
- decision: pending

### 25. 비소 - effect:Feixiao_00:0

- characterId: Feixiao_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:2947:talent:뇌정의 수렵:allDamage:0
- sourceText: 시 랜덤 단일 적을 공격한다. 해당 효과는 턴마다 최대 1회 발동하며, 비소의 턴 시작 시 발동 횟수가 초기화된다. 해당 공격 발동 시 자신이 가하는 피해가 30% 증가한다, 지속 시간: 2턴
- decision: pending

### 26. 비소 - effect:Feixiao_00:1

- characterId: Feixiao_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:2947:combatSkill:섬전:atkRatio:0
- sourceText: <추가 능력> 전투 스킬 발동 시 공격력이 48% 증가한다. 지속 시간: 3턴
- decision: pending

### 27. 사이퍼 - effect:Cipher_00:0

- characterId: Cipher_00
- stat: vulnerability
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:3691:talent:해를 바꿔치기한 대도:vulnerability:0
- sourceText: 특성의 추가 공격이 가하는 치명타 피해가 100% 증가한다. 사이퍼가 필드에 있을 시 모든 적이 받는 피해가 40% 증가한다
- decision: pending

### 28. 사이퍼 - effect:Cipher_00:1

- characterId: Cipher_00
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3691:talent:해를 바꿔치기한 대도:critDamage:1
- sourceText: 특성의 추가 공격이 가하는 치명타 피해가 100% 증가한다. 사이퍼가 필드에 있을 시 모든 적이 받는 피해가 40% 증가한다
- decision: pending

### 29. 사이퍼 - effect:Cipher_00:2

- characterId: Cipher_00
- stat: followDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3691:talent:해를 바꿔치기한 대도:followDamage:2
- sourceText: 특성의 추가 공격이 가하는 치명타 피해가 100% 증가한다. 사이퍼가 필드에 있을 시 모든 적이 받는 피해가 40% 증가한다
- decision: pending

### 30. 사이퍼 - effect:Cipher_00:3

- characterId: Cipher_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3691:combatSkill:헷, 공짜 보물:atkRatio:0
- sourceText: 인성 감소 수치: 20 120%의 기본 확률로 지정된 단일 적 및 인접한 목표를 허약 상태에 빠트려 가하는 피해를 10% 감소시키고, 사이퍼의 공격력을 30% 증가시킨다, 지속 시간: 2턴. 또한 지정된 단일 적에게 사이퍼 공격력의 100% 만큼 양자 속성 피해 를 가하고, 인접한 목표에게 사이퍼 공격력의 50% 만큼 양자 속성 피해 를 가한다
- decision: pending

### 31. 선데이 - effect:Sunday_10:2

- characterId: Sunday_10
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3150:talent:고해의 육신:critRate:0
- sourceText: <특성> [서포트] 전투 스킬 발동 시 목표의 치명타 확률이 10.0% 증가한다, 지속 시간: 3턴
- decision: pending

### 32. 세이버 - effect:Saber_00:1

- characterId: Saber_00
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3767:combatSkill:별의 왕관:critDamage:0
- sourceText: <추가 능력> 전투 스킬 발동 시 세이버의 치명타 피해가 50% 증가한다, 지속 시간: 2턴. 이번 전투에서 [노심 공명]을 1pt 획득할 때마다 세이버의 치명타 피해가 4% 증가한다, 해당 효과 최대 중첩수: 8스택
- decision: pending

### 33. 세이버 - effect:Saber_00:2

- characterId: Saber_00
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3767:combatSkill:별의 왕관:critDamage:1
- sourceText:  전투 스킬 발동 시 세이버의 치명타 피해가 50% 증가한다, 지속 시간: 2턴. 이번 전투에서 [노심 공명]을 1pt 획득할 때마다 세이버의 치명타 피해가 4% 증가한다, 해당 효과 최대 중첩수: 8스택
- decision: pending

### 34. 세이버 - effect:Saber_00:3

- characterId: Saber_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3767:combatSkill:용의 기사:critRate:0
- sourceText: <추가 능력> 세이버의 치명타 확률이 20% 증가한다. 전투 진입 및 강화된 일반 공격 발동 시 [마력 방출] 효과를 획득한다. 해당 효과일 때 세이버가 [노심 공명]을 보유하는 동시에 전투 스킬을 발동해 [노심 공명]을 소모하여 세이버의 에너지를 전부 회복할 수
- decision: pending

### 35. 소상 - effect:Sushang_00:0

- characterId: Sushang_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:27:ultimate:태허형온 • 촉야:atkRatio:0
- sourceText: 20 | 강인성 감소 수치: 30 지정된 단일 적에게 소상 공격력 192% 만큼의 물리 속성 피해를 주고 소상은 즉시 행동한다. 동시에 소상의 공격력이 18% 증가하고 전투 스킬 발동 시 [검세]의 발동 판정이 추가로 2회 증가한다. 지속 시간: 2턴. 추가 판정으로 발동된 [검세]의 피해는 기존 피해의 50%이다
- decision: pending

### 36. 스파클 - effect:Sparkle_00:0

- characterId: Sparkle_00
- stat: vulnerability
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: Sparkle_00:Talent:RedHerring:vulnerability:curated-2026-06-21
- sourceText: Prydwen Sparkle AS kit: Talent applies enemy vulnerability when allies consume Skill Points, stacking up to 3.
- decision: pending

### 37. 스파클 - effect:Sparkle_00:1

- characterId: Sparkle_00
- stat: vulnerability
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: Sparkle_00:Ultimate:HeroWithAThousandFaces:vulnerability:curated-2026-06-21
- sourceText: Prydwen Sparkle AS kit: Cipher increases Sparkle Talent's enemy vulnerability benefit per stack.
- decision: pending

### 38. 스파클 - effect:Sparkle_00:5

- characterId: Sparkle_00
- stat: defenseDown
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:1807:E2:실없는 허구:advanced:defenseDown
- sourceText: 특성의 각 스택 효과는 추가로 적의 방어력을 10% 감소시킨다
- decision: pending

### 39. 스파클 - effect:Sparkle_00:6

- characterId: Sparkle_00
- stat: critDamage
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:1807:E6:다중 해답:advanced:critDamageShare
- sourceText: 전투 스킬의 치명타 피해 증가 효과가 스파클 치명타 피해의 30%만큼 추가로 증가한다. 스파클이 전투 스킬을 발동하면, 전투 스킬의 치명타 피해 증가 효과는 [기이한 수수께끼]를 보유한 모든 동료에게 적용된다. 스파클이 필살기를 발동 시 단일 아군 중 전투 스킬의 치명타 피해 증가 효과를 보유한 목표가 있으면, 해당 효과는 [기이한 수수께끼]를 보유한 동료에게까지 확산된다
- decision: pending

### 40. 아낙사 - effect:Anaxa_00:1

- characterId: Anaxa_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3561:combatSkill:헛된 지식을 몰아내는 프랙털:allDamage:0
- sourceText: 가하며, 이번 전투 스킬에 명중하지 않은 적에게 우선으로 바운스한다. 발동 시 필드 위에 공격 가능한 적이 1기 있을 때마다 이번 전투 스킬로 가하는 피해가 20% 증가한다
- decision: pending

### 41. 아낙사 - effect:Anaxa_00:4

- characterId: Anaxa_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3561:E4:산골짜기에 떨어진 열기:atkRatio:0
- sourceText: 전투 스킬 발동 시 공격력이 30% 증가한다, 지속 시간: 2턴, 해당 효과 최대 중첩수: 2스택
- decision: pending

### 42. 아스타 - effect:Asta_00:0

- characterId: Asta_00
- stat: atkRatio
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:12:talent:천체학:atkRatio:0
- sourceText: 충전을 1스택 획득하며 피격된 적의 약점이 화염 속성일 경우 추가로 충전 1스택을 획득한다. 아스타가 충전을 1스택 보유할 때마다 모든 아군의 공격력이 5.0% 증가한다. 최대 중첩수: 5회. 자신의 두 번째 턴부터 턴이 시작될 때마다 아스타의 충전 스택이 3스택 감소한다
- decision: pending

### 43. 아젠티 - effect:Argenti_00:0

- characterId: Argenti_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:1535:talent:숭고한 객체:critRate:0
- sourceText: 화 일반 공격, 전투 스킬, 필살기 발동 시 적을 1기 명중할 때마다 아젠티의 에너지가 3pt 회복되고, [승격]을 1스택 획득하며, 아젠티의 치명타 확률이 1.0% 증가한다. 해당 효과 최대 중첩수: 10스택
- decision: pending

### 44. 아처 - effect:Archer_00:0

- characterId: Archer_00
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3768:combatSkill:수호자:critDamage:0
- sourceText: <추가 능력> 아군이 전투 스킬 포인트 획득 후 전투 스킬 포인트가 4pt 이상일 경우 아처의 치명타 피해가 120% 증가한다, 지속 시간: 1턴
- decision: pending

### 45. 아케론 - effect:Acheron_00:0

- characterId: Acheron_00
- stat: resistancePen
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:1919:talent:비에 젖은 단풍, 끝없는 하늘:resistancePen:0
- sourceText:  조각]이 9pt에 도달하면 필살기를 활성화할 수 있다. 필살기 발동 중에는 약점 속성을 무시하고 적의 강인성을 소모할 수 있으며, 모든 적의 모든 속성 저항을 10% 감소시킨다. 해당 효과는 필살기가 종료될 때까지 지속된다. 임의의 유닛이 스킬을 발동하는 동안 적을 디버프 효과에 빠트리면 아케론은 [꿈 조각]을 1pt 획득하고 목표에게 [아즈사카]를 1스택 부여한다. 만약 여러 목표
- decision: pending

### 46. 아케론 - effect:Acheron_00:1

- characterId: Acheron_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:1919:ultimate:뇌심:allDamage:0
- sourceText: <추가 능력> 필살기의 [눈물 베기]로 [아즈사카]를 보유한 적 명중 시 아케론이 가하는 피해가 30% 증가한다. 해당 효과 최대 중첩수: 3스택, 지속 시간: 3턴. 또한, [황천의 귀환] 발동 시 추가로 피해를 6회 가하고, 피해를 가할 때마다 랜덤 단일 적에게 아케론 공격력의 25%만큼 번개 속성 피해를 가하며, 해
- decision: pending

### 47. 애쉬베일 - effect:Ashveil_00:6

- characterId: Ashveil_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4781:E6:결말, 그리고 어쩌면 아무도 없었다:allDamage:1
- sourceText: 필드에 [미끼]가 존재할 경우, 모든 적의 모든 속성 저항이 20% 감소한다. 애쉬베일은 [탐닉]을 1스택 획득할 때마다 가하는 피해가 4% 증가한다, 해당 효과 최대 중첩수: 30스택
- decision: pending

### 48. 어공 - effect:Yukong_00:1

- characterId: Yukong_00
- stat: atkRatio
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:712:combatSkill:천궁에 울리는 활:atkRatio:0
- sourceText: <전투 스킬> 서포트 [활시위 호령] 2스택을 획득한다. (최대 2스택 보유) 어공이 [활시위 호령] 효과를 보유할 경우 모든 아군의 공격력이 40% 증가한다. 아군의 턴이 종료될 때마다 어공의 [활시위 호령] 효과가 1스택 감소한다. 어공이 전투 스킬을 발동해 [활시위 호령]을 획득한 턴은 [활시위 호령]이 감소하지 않는다
- decision: pending

### 49. 에바네시아 - effect:Evanescia_00:0

- characterId: Evanescia_00
- stat: critRate
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:5005:ultimate:환희의 조망자:critRate:0
- sourceText: <추가 능력> 에바네시아의 치명타 확률이 30% 증가하고, 필드 위 적 수가 3이상/2/1일 때 필살기의 바운스 횟수가 1/2/4회 증가한다. 환락 스킬의 출연 번호가 에바네시아보다 작은 동료가 [ 훌륭한 솜씨에는 보상을 ] 획득 시, 에바네시아는 그중 50%를 자신
- decision: pending

### 50. 에버나이트 - effect:Evernight_00:2

- characterId: Evernight_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3956:combatSkill:어두운 하늘, 고요한 달:critRate:0
- sourceText: <추가 능력> 에버나이트와 기억 정령 「긴 밤」의 치명타 확률이 35% 증가하고, 스킬 발동 시 자신의 현재 HP의 5%을 소모해 애버나이트와 기억 정령 「긴 밤」의 치명타 피해를 15% 증가시킨다. 지속 시간: 2턴. 기억 정령 「긴 밤」이 [이슬처럼 사라지는 미몽] 발동 후 아군의 전투
- decision: pending

### 51. 에버나이트 - effect:Evernight_00:3

- characterId: Evernight_00
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3956:combatSkill:어두운 하늘, 고요한 달:critDamage:1
- sourceText: 와 기억 정령 「긴 밤」의 치명타 확률이 35% 증가하고, 스킬 발동 시 자신의 현재 HP의 5%을 소모해 애버나이트와 기억 정령 「긴 밤」의 치명타 피해를 15% 증가시킨다. 지속 시간: 2턴. 기억 정령 「긴 밤」이 [이슬처럼 사라지는 미몽] 발동 후 아군의 전투 스킬 포인트를 1pt 회복한다
- decision: pending

### 52. 연경 - effect:Yanqing_00:0

- characterId: Yanqing_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:28:ultimate:비바람을 가르는 제비:critRate:0
- sourceText: <필살기> 단일 공격 | 에너지 소모 140 | 강인성 감소 수치: 30 자신의 치명타 확률이 60% 증가하고 만일 연경이 [신검합일] 효과를 가지고 있다면 치명타 피해가 추가로 30% 증가한다. 버프 효과 는 1턴 동안 지속된다. 이후 지정된 단일 적에게 연경 공격력 210% 의 얼음 속성 피해를 준다
- decision: pending

### 53. 완•매 - effect:RuanMei_00:2

- characterId: RuanMei_00
- stat: toughnessDamageRatio
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:1638:combatSkill:우아한 연주:toughnessDamageRatio:fixed50
- sourceText: <전투 스킬> 서포트 전투 스킬 발동 후 완•매는 [현의 여음]을 획득한다. 지속 시간: 3턴. 완•매의 턴이 시작될 때마다 지속 턴 횟수는 1 감소한다. 완•매가 [현의 여음]을 보유하면 모든 아군의 피해가 16.0% 증가하며 약점 격파 효율이 50% 증가한다
- decision: pending

### 54. 완•매 - effect:RuanMei_00:3

- characterId: RuanMei_00
- stat: allDamage
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:1638:combatSkill:수면에 일렁이는 촛불:breakEffect-overcap-allDamage:max36
- sourceText: <추가 능력> 전투 중 완•매의 격파 특수효과가 120%를 초과할 시 10% 초과할 때마다 전투 스킬로 인한 모든 아군의 피해 증가 효과가 추가로 6% 증가한다. (최대 36%까지 증가)
- decision: pending

### 55. 웰트 - effect:Welt_00:0

- characterId: Welt_00
- stat: vulnerability
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:10:ultimate:징벌:vulnerability:0
- sourceText: <추가 능력> 필살기 발동 시 100%의 기본 확률 로 적이 받는 피해가 12% 증가한다. 지속 시간: 2턴
- decision: pending

### 56. 웰트 - effect:Welt_00:4

- characterId: Welt_00
- stat: allDamage
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:10:ultimate:유사 블랙홀:AS-zeroGravity-allDamage-stacks
- sourceText: AS 기준: 아군이 [무중력] 상태의 적을 공격 시 가하는 피해가 10% 증가한다. 최대 10스택.
- decision: pending

### 57. 은랑 - effect:Silwolf_00:2

- characterId: Silwolf_00
- stat: resistancePen
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:710:combatSkill:수정하시겠습니까?:weakness-resistanceDown:fixed20
- sourceText: <전투 스킬> 단일 공격 지정된 단일 적에게 필드에 있는 아군이 보유한 속성의 약점을 75% 의 기본 확률 로 1개 부여하고, 해당 약점에 대응하는 속성의 저항이 20% 감소한다. 지속 시간: 2턴. 적이 보유한 속성과 동일한 약점이 부여되면 대응하는 속성 저항 감소 효과가 발동되지 않는다. 은랑은 단일 적에게 1개의 약점만 부여할 수 있고, 약점 재부여 시 새로 부여된 약점만 존재한다. 100%의 기본 확률 로 해당 목표의 모든 속성 저항이 추가로 7.5% 감소한다. 지속 시간: 2턴. 해당 목표에게 은랑 공격력의 98% 만큼 양자 속성 피해를 준다
- decision: pending

### 58. 은랑 LV.999 - effect:SilverWolf999_00:0

- characterId: SilverWolf999_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4997:talent:나만 믿어, 버스 태워줄게:critRate:0
- sourceText: 에도 240pt 초과할 수 있다. 웃음 포인트 획득 시 「은랑 LV.999」는 같은 양의 [히든 스코어]를 획득한다. [히든 스코어] 1pt당 치명타 확률이 0.20% 증가한다. 치명타 확률이 100%에 도달하면 나머지 [히든 스코어] 1pt당 치명타 피해가 0.40% 증가하는 것으로 변경된다. [무적 플레이어] 상태에서 「은랑 LV.999」는 제어류 디버프 상태 에 면역이고, 필살기
- decision: pending

### 59. 정운 - effect:Tingyun_00:0

- characterId: Tingyun_00
- stat: allDamage
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:25:ultimate:상서로운 구름의 기원:allDamage:0
- sourceText: <필살기> 서포트 | 에너지 소모 130 지정된 단일 아군의 에너지를 50pt 회복하고, 목표가 가하는 피해가 20% 증가한다. 지속 시간: 2턴
- decision: pending

### 60. 정운 - effect:Tingyun_00:2

- characterId: Tingyun_00
- stat: atkFlat
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:25:combatSkill:정다운 화음:atkFlat:level10-targetAtkRatio-sourceAtkCap
- sourceText: <전투 스킬> 서포트 지정된 단일 아군에게 [축복]을 제공한다. 대상의 공격력을 25% 증가시키며 현재 정운 공격력의 15% 을 넘지 않는다. [축복]을 획득한 대상은 공격 발동 후 추가로 자신의 공격력 20% 만큼의 번개 속성 추가 피해 를 1회 가한다. [축복] 지속 시간: 3턴. 최근 정운의 전투 스킬 대상이 된 아군에게만 적용된다
- decision: pending

### 61. 제레 - effect:Seele_00:0

- characterId: Seele_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:15:talent:재현:allDamage:0
- sourceText: 공격, 전투 스킬, 필살기를 발동해 적을 처치한 후 즉시 보너스 턴 을 1턴 획득하고 증폭 상태에 진입한다. 증폭 상태의 제레는 공격 발동으로 가하는 피해가 40% 증가한다. 지속 시간: 1턴. 제레가 특성 [재현]으로 획득한 보너스 턴 에서 적 처치 시 해당 특성은 적용되지 않는다
- decision: pending

### 62. 제이드 - effect:Jade_00:1

- characterId: Jade_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:2495:talent:유전물:atkRatio:0
- sourceText: <추가 능력> 특성의 [전당품] 1스택마다 추가로 제이드의 공격력을 0.5% 증가시킨다
- decision: pending

### 63. 천야 • 블레이드 - effect:MortenaxBlade_00:2

- characterId: MortenaxBlade_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:5217:ultimate:뼈는 화로요, 피와 살은 땔감이니:critRate:2
- sourceText: 20%만큼 HP를 소모해 결계를 펼치며, 결계가 지속되는 동안 천야 • 블레이드는 [끝없는 분노] 상태를 획득한다. [끝없는 분노] 상태에서는 치명타 확률이 20% 증가하고, 치명타 피해가 30.0% 증가하며, 일반 공격이 강화되는 동시에 전투 스킬이 해방되고 새로운 필살기 [천야로 빚어내어, 영겁토록 신멸하리]를 획득한다. 또한, 치명적인 공격을 받으면 전투불능 상태에 빠지지 않
- decision: pending

### 64. 천야 • 블레이드 - effect:MortenaxBlade_00:4

- characterId: MortenaxBlade_00
- stat: allDamage
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:5217:ultimate:만쉬심:allDamage:0
- sourceText: <추가 능력> 결계가 지속되는 동안 아군이 가하는 피해가 50% 증가하며, 아군 파티 내 천야 • 블레이드를 제외한 「공허」 운명의 길 캐릭터가 존재할 시 아군이 가하는 필살기 피해가 75% 증가하고, 그렇지 않을 시 천야 • 블레이드가 가하는 피해가 추가로 75% 증가한다
- decision: pending

### 65. 천야 • 블레이드 - effect:MortenaxBlade_00:7

- characterId: MortenaxBlade_00
- stat: ultimateDamage
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:5217:A:만쉬심:other-nihility:ultimateDamage
- sourceText: 만쉬심 원문상 천야 블레이드를 제외한 공허 캐릭터가 있을 때만 아군 필살기 피해 +75%를 적용한다.
- decision: pending

### 66. 천야 • 블레이드 - effect:MortenaxBlade_00:8

- characterId: MortenaxBlade_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:5217:A:만쉬심:no-other-nihility:selfAllDamage
- sourceText: 만쉬심 원문상 천야 블레이드를 제외한 공허 캐릭터가 없을 때 75% 피해 증가는 천야 본인에게만 적용한다.
- decision: pending

### 67. 청작 - effect:Qingque_00:0

- characterId: Qingque_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:24:talent:제원 경옥:atkRatio:0
- sourceText: 보유할 수 있다. 청작의 턴 시작 시 같은 문양의 경옥패를 4장 뽑을 경우 경옥패를 전부 소모해 [꿀조합] 상태에 돌입한다. 꿀조합 상태에서는 공격력이 36% 증가하고 일반 공격이 강화된다. 일반 공격 강화를 발동할 경우 [꿀조합] 상태는 종료된다
- decision: pending

### 68. 청작 - effect:Qingque_00:1

- characterId: Qingque_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:24:combatSkill:끝내기 조합:allDamage:0
- sourceText: <전투 스킬> 강화 즉시 경옥패를 2장 뽑는다. 자신이 가하는 피해가 14% 증가하며, 이번 턴이 끝날 때까지 지속된다. 최대 중첩 수: 4스택. 해당 전투 스킬 발동 후 그 턴은 종료되지 않는다
- decision: pending

### 69. 초구 - effect:Jiaoqiu_00:2

- characterId: Jiaoqiu_00
- stat: vulnerability
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:2643:talent:기정지변, 절묘한 맛:ashenRoastVulnerability:level10-stacks
- sourceText: <특성> 방해 초구가 일반 공격, 전투 스킬, 필살기를 사용해 적 명중 시 100%의 기본 확률로 해당 적에게 [훈작]을 1스택 부여한다. 1스택일 시 적이 받는 피해가 7.5% 증가하고, 이후 1스택 중첩될 때마다 2.5% 증가한다. [훈작] 최대 중첩수: 5스택, 지속 시간: 2턴. 적이 [훈작] 상태일 시 동시에 연소 상태에 빠진 것으로 간주하며, 턴이 시작될 때마다 초구 공격력의 90% 만큼 화염 속성 지속 피해 를 받는다
- decision: pending

### 70. 카스토리스 - effect:Castorice_00:0

- characterId: Castorice_00
- stat: resistancePen
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:3560:ultimate:포효하는 망자, 소생의 종:resistancePen:0
- sourceText: > [소환] 기억 정령 죽음의 용을 소환하고 대상의 행동 게이지를 100% 증가시키며, 동시에 경계 [세상을 잊은 저승]을 전개하여 모든 적의 모든 속성 저항을 10% 감소시킨다. 카스토리스가 특성의 가하는 피해 증가 효과를 보유할 시, 해당 효과를 죽음의 용에게 확산시킨다. 죽음의 용은 기본 상태에서 165pt의 속도와 [새로운 꽃술] 최대치의 100%만큼 고정 HP 최대치를 보유한
- decision: pending

### 71. 케리드라 - effect:Cerydra_00:1

- characterId: Cerydra_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3886:ultimate:본 자:critRate:0
- sourceText: <추가 능력> 케리드라의 치명타 확률이 100% 증가한다. 케리드라의 충전이 최대치보다 낮을 시 [군공]을 보유한 캐릭터가 필살기를 발동하면 케리드라가 충전을 1pt 획득하며, 해당 효과는 단일 전투에서 1회 발동할 수 있다
- decision: pending

### 72. 케리드라 - effect:Cerydra_00:6

- characterId: Cerydra_00
- stat: atkFlat
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:3886:talent:카이사르에게 영광을:atkFlat:sourceCombatAtkRatio:level10
- sourceText: <특성> [서포트] [군공]을 보유한 캐릭터의 공격력이 케리드라 공격력의 18.0% 만큼 증가하고, 일반 공격 또는 전투 스킬 발동 시 케리드라가 충전을 1pt 획득한다. 기습 중에는 케리드라가 충전을 획득할 수 없다. [군공]을 보유한 캐릭터가 공격 발동 후 케리드라가 추가로 케리드라 공격력의 30% 만큼 바람 속성 추가 피해를 1회 가하고, 해당 효과는 최대 20회 발동하며, 케리드라가 필살기를 발동할 때마다 발동 가능 횟수가 초기화된다. [군공]은 가장 최근에 부여한 목표에게만 적용되며, 목표 변경 시 케리드라의 충전이 0pt로 초기화된다
- decision: pending

### 73. 케리드라 - effect:Cerydra_00:7

- characterId: Cerydra_00
- stat: speed
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3886:trace:이긴 자:speed:self
- sourceText: <추가 능력> 전투 스킬 발동 시 자신과 [군공]을 보유한 동료의 속도가 20pt 증가한다, 지속 시간: 3턴. [군공]을 보유한 캐릭터가 일반 공격 또는 전투 스킬 발동 시 케리드라의 에너지를 5pt 회복한다
- decision: pending

### 74. 케리드라 - effect:Cerydra_00:8

- characterId: Cerydra_00
- stat: speed
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:3886:trace:이긴 자:speed:singleAlly
- sourceText: <추가 능력> 전투 스킬 발동 시 자신과 [군공]을 보유한 동료의 속도가 20pt 증가한다, 지속 시간: 3턴. [군공]을 보유한 캐릭터가 일반 공격 또는 전투 스킬 발동 시 케리드라의 에너지를 5pt 회복한다
- decision: pending

### 75. 케리드라 - effect:Cerydra_00:9

- characterId: Cerydra_00
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3886:trace:source-atk-threshold-crit-damage
- sourceText: 공격력이 2000보다 높을 시 공격력이 100pt 초과할 때마다 자신의 치명타 피해가 18% 증가하며, 최대 360% 증가한다
- decision: pending

### 76. 케리드라 - effect:Cerydra_00:10

- characterId: Cerydra_00
- stat: resistancePen
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:3886:combatSkill:프로모션, 지휘관의 자질:resistancePen:nobility-6-stacks
- sourceText: <전투 스킬> [서포트] 지정된 단일 아군 캐릭터가 [군공]을 획득하고 케리드라가 충전을 1pt 획득한다. 충전 상한: 8pt. 충전 6pt 도달 시 캐릭터의 [군공]이 [작위]로 자동 업그레이드되고, 대상의 제어류 디버프 상태를 해제한다. [작위]를 보유한 캐릭터는 동시에 [군공]을 보유한 것으로 간주한다. [작위]를 보유한 캐릭터가 가하는 전투 스킬 피해의 치명타 피해가 36% 증가하고, 모든 속성 저항 관통이 8.0% 증가하며, 적에게 전투 스킬 발동 시 기습을 발동한다. 기습 종료 후 충전을 6pt 소모하여 [작위]를 [군공]으로 되돌린다
- decision: pending

### 77. 키레네 - effect:Cyrene_00:0

- characterId: Cyrene_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:시의 「◦」, 서약의 「∞」:critRate:0
- sourceText: 의 물결] 상태에 진입하고 일반 공격이 [사랑과 내일을 향해♪]로 강화되며, 해당 일반 공격만 사용할 수 있다. 또한, 키레네와 데미우르고스의 치명타 확률이 25% 증가하며, 전투 스킬의 결계를 펼치고 전투 스킬의 결계에 지속 시간이 없어진다. 단일 전투에서 1회만 발동할 수 있으며, 데미우르고스는 기본 상태에서 HP 최대치를 키레네 HP 최대치의 100%만큼 보유한다 | 첫 만남
- decision: pending

### 78. 키레네 - effect:Cyrene_00:1

- characterId: Cyrene_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:critRate:4
- sourceText: 과하면 1pt를 초과할 때마다 카오스라나의 치명타 피해가 6% 증가하며, 최대 36% 증가한다. [영원히 이어지는 불길] 보유 시 카오스라나의 치명타 확률이 8% 증가하며, 카오스라나의 보너스 턴 소진 후 변신이 종료되지 않고, 모든 카오스라나의 보너스 턴을 초기화하며 [훼멸]을 4pt 획득한다. 보너스 턴 시작 시 카오스라나는 HP를 현재 HP의 15%만큼 소모한다. 공격 발동
- decision: pending

### 79. 키레네 - effect:Cyrene_00:3

- characterId: Cyrene_00
- stat: defenseDown
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:defenseDown:0
- sourceText: 1스택 소모한다 「계략」에 바치는 시 [서포트] 전투 내내 적용된다. 사이퍼에게 발동 시 사이퍼가 가하는 피해가 18% 증가하고 [단골손님]의 방어력이 10% 감소하며, [단골손님] 이외의 적의 방어력이 6% 감소한다 「부세」에 바치는 시 [서포트] 전투 내내 적용된다. 파이논에게 발동 후 파이논이 [불씨]를 6pt 획득하며, 변신 시 [영원히 이어지는 불길]을 획득한다. 변
- decision: pending

### 80. 키레네 - effect:Cyrene_00:4

- characterId: Cyrene_00
- stat: defenseDown
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:defenseDown:1
- sourceText:  내내 적용된다. 사이퍼에게 발동 시 사이퍼가 가하는 피해가 18% 증가하고 [단골손님]의 방어력이 10% 감소하며, [단골손님] 이외의 적의 방어력이 6% 감소한다 「부세」에 바치는 시 [서포트] 전투 내내 적용된다. 파이논에게 발동 후 파이논이 [불씨]를 6pt 획득하며, 변신 시 [영원히 이어지는 불길]을 획득한다. 변신 시 [불씨]가 12pt를 초과하면 1pt를 초과
- decision: pending

### 81. 키레네 - effect:Cyrene_00:5

- characterId: Cyrene_00
- stat: defenseIgnore
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:defenseIgnore:2
- sourceText: 아 또는 의상공이 공격 후 [낭만]을 소모하고 자신의 에너지를 70pt 회복한다. 아글라이아와 의상공이 가하는 피해가 36% 증가하고, 목표의 방어력을 18% 무시하며, 아글라이아의 [지고의 자태] 상태가 종료될 때까지 지속된다 「통로」에 바치는 시 [서포트] 전투 내내 적용된다. 트리비에게 발동 시 트리비가 가하는 피해가 적의 방어력을 6% 무시한다. 트리비가 추가 공격을 
- decision: pending

### 82. 키레네 - effect:Cyrene_00:6

- characterId: Cyrene_00
- stat: defenseIgnore
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:defenseIgnore:3
- sourceText: 의 자태] 상태가 종료될 때까지 지속된다 「통로」에 바치는 시 [서포트] 전투 내내 적용된다. 트리비에게 발동 시 트리비가 가하는 피해가 적의 방어력을 6% 무시한다. 트리비가 추가 공격을 발동해 트리비의 결계의 추가 피해 발동 시 추가 피해를 추가로 1회 가한다 「분쟁」에 바치는 시 [서포트] 1회만 적용된다. 마이데이에게 발동 시 마이데이가 빠진 모든 제어류 디버프 상태
- decision: pending

### 83. 키레네 - effect:Cyrene_00:9

- characterId: Cyrene_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:atkRatio:8
- sourceText: 속 시간: 1턴. 아낙사가 다음에 일반 공격, 전투 스킬 발동 시 [참된 지식]을 획득한다. [참된 지식]: 모든 「지식」 운명의 길 캐릭터의 공격력이 30% 증가하고, 가하는 전투 스킬 피해가 20% 증가하며, 아낙사의 다음 턴 시작 시까지 지속된다 「천공」에 바치는 시 [서포트] 데미우르고스ㄴ가 기억 정령 스킬을 발동하면 히아킨이 [「천공」에 바치는 시]를 2스택 획득한다
- decision: pending

### 84. 키레네 - effect:Cyrene_00:10

- characterId: Cyrene_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:allDamage:9
- sourceText: 터에게 버프 효과를 부여한다. 해당 캐릭터가 황금의 후예일 시 대상이 ∞ 특수 효과 를 획득한다. 해당 캐릭터가 황금의 후예가 아닐 시 대상이 가하는 피해가 40% 증가한다, 지속 시간: 2턴, 이 효과는 대상의 기억 정령에게도 적용된다 「창세」에 바치는 시 [서포트] 전투 내내 적용된다. 개척자·기억에게 발동 시 개척자•기억의 공격력이 데미우르고스 HP 최대치의 8% 만큼 증가하
- decision: pending

### 85. 키레네 - effect:Cyrene_00:11

- characterId: Cyrene_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:allDamage:10
- sourceText:  수가 즉시 최대치로 중첩된다. 아글라이아 또는 의상공이 공격 후 [낭만]을 소모하고 자신의 에너지를 70pt 회복한다. 아글라이아와 의상공이 가하는 피해가 36% 증가하고, 목표의 방어력을 18% 무시하며, 아글라이아의 [지고의 자태] 상태가 종료될 때까지 지속된다 「통로」에 바치는 시 [서포트] 전투 내내 적용된다. 트리비에게 발동 시 트리비가 가하는 피해가 적의 방어력을 6%
- decision: pending

### 86. 키레네 - effect:Cyrene_00:12

- characterId: Cyrene_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:allDamage:11
- sourceText: 필살기를 발동하면 [「천공」에 바치는 시]를 1스택 소모한다 「계략」에 바치는 시 [서포트] 전투 내내 적용된다. 사이퍼에게 발동 시 사이퍼가 가하는 피해가 18% 증가하고 [단골손님]의 방어력이 10% 감소하며, [단골손님] 이외의 적의 방어력이 6% 감소한다 「부세」에 바치는 시 [서포트] 전투 내내 적용된다. 파이논에게 발동 후 파이논이 [불씨]를 6pt 획득하며, 변신 시 
- decision: pending

### 87. 키레네 - effect:Cyrene_00:13

- characterId: Cyrene_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:allDamage:12
- sourceText:  [따뜻한 해류]를 획득한다. 히실렌스가 공격 발동 후 [따뜻한 해류]를 소모하고 자신의 에너지를 60pt 회복한다. 이번 전투에서 히실렌스가 가하는 피해가 60% 증가하며, 일반 공격/전투 스킬을 발동해 적 공격 후 피격된 적이 현재 받는 모든 지속 피해가 즉시 기존 피해의 30% / 40% 만큼 피해를 생성한다 「율법」에 바치는 시 [서포트] 전투 내내 적용된다. 케리드라에게 
- decision: pending

### 88. 키레네 - effect:Cyrene_00:14

- characterId: Cyrene_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:allDamage:13
- sourceText:  「세월」에 바치는 시 [서포트] 전투 내내 적용된다. 에버나이트에게 발동 후 「긴 밤」이 기억 정령 스킬 [이슬처럼 사라지는 미몽] 발동 시 가하는 피해가 9% 증가하고, 에버나이트가 전투 스킬/필살기 발동 후 추가로 [기억 물질]을 1pt 획득한다. 에버나이트 전투 스킬의 치명타 피해 증가 효과가 추가로 에버나이트 치명타 피해의 6% 만큼 증가한다 「대지」에 바치는 시 [서포
- decision: pending

### 89. 키레네 - effect:Cyrene_00:15

- characterId: Cyrene_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:4003:ultimate:꽃과 화살의 무곡:allDamage:14
- sourceText:  다음 3회 공격이 상응하는 속성의 추가 피해를 [전우] 실드량의 40%만큼 가한다. 단항•등황이 [「대지」에 바치는 시] 보유 시 [전우]가 가하는 피해가 12% 증가한다. 단항•등황에게 발동 시 용령의 행동 게이지가 100% 증가하며, 용령이 다음 행동 시 단항•등황 필살기의 강화 효과를 획득하고, 제공하는 실드량이 기존 실드량의 150%만큼 증가하며, 단항•등황 필살기의 강화
- decision: pending

### 90. 키레네 - effect:Cyrene_00:18

- characterId: Cyrene_00
- stat: specialFinal
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:4003:E2:내일을 투영하는 열세 빛깔:specialFinal
- sourceText: 전투 진입 시 추가로 [추억]을 12pt 획득한다. 서로 다른 아군 캐릭터가 데미우르고스 기억 정령 스킬의 버프 효과를 획득할 때마다 아군이 전투 스킬의 결계를 통해 가하는 확정 피해 배율이 6% 증가하며, 최대 24% 증가한다
- decision: pending

### 91. 트리비 - effect:Tribbie_00:0

- characterId: Tribbie_00
- stat: followDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3322:talent:성벽 밖의 어린양…:followDamage:0
- sourceText: <추가 능력> 특성의 추가 공격 발동 후, 트리비가 가하는 피해가 72% 증가한다, 해당 효과 최대 중첩수: 3스택, 지속 시간: 3턴
- decision: pending

### 92. 트리비 - effect:Tribbie_00:1

- characterId: Tribbie_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3322:talent:성벽 밖의 어린양…:allDamage:1
- sourceText: <추가 능력> 특성의 추가 공격 발동 후, 트리비가 가하는 피해가 72% 증가한다, 해당 효과 최대 중첩수: 3스택, 지속 시간: 3턴
- decision: pending

### 93. 파이논 - effect:Phainon_00:1

- characterId: Phainon_00
- stat: atkRatio
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:3769:talent:이 몸을 횃불 삼아:atkRatio:1
- sourceText: 카오스라나는 제어류 디버프 상태에 면역되고, 강화된 일반 공격 1개와 강화된 전투 스킬 2개를 보유하며 필살기를 발동할 수 없다. 변신 중에는 공격력이 40% 증가하고 HP 최대치가 135% 증가하며, 공격을 발동하면 자신의 HP 최대치의 20%만큼 HP를 회복한다. 카오스라나가 치명적인 공격을 받을 시 전투 불능 상태에 빠지지 않는 대신 자신의 HP 최대치의 25%만큼 HP
- decision: pending

### 94. 페라 - effect:Pela_00:0

- characterId: Pela_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:19:combatSkill:추격 토벌:allDamage:0
- sourceText: <추가 능력> 전투 스킬 발동으로 버프 효과를 해제할 시 다음 공격으로 가하는 피해가 20% 증가한다
- decision: pending

### 95. 한아 - effect:Hanya_00:0

- characterId: Hanya_00
- stat: atkRatio
- effectType: buff
- targetScope: singleAlly
- sourceTrace: HoyoWiki:1537:ultimate:시왕의 칙령, 모두 복종하라:atkRatio:0
- sourceText: <필살기> 강화 지정된 단일 아군의 속도를 한아 속도의 15.0% 만큼 증가시키고, 해당 목표의 공격력을 36% 증가시킨다. 지속 시간: 2턴
- decision: pending

### 96. 한아 - effect:Hanya_00:2

- characterId: Hanya_00
- stat: atkRatio
- effectType: buff
- targetScope: allAllies
- sourceTrace: HoyoWiki:1537:combatSkill:서기:atkRatio:0
- sourceText: <추가 능력> [부담]의 전투 스킬 포인트 회복 효과를 발동하는 단일 아군의 공격력이 10% 증가한다. 지속 시간: 1턴
- decision: pending

### 97. 헤르타 - effect:Herta_00:0

- characterId: Herta_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:13:ultimate:빙결:allDamage:0
- sourceText: <추가 능력> 필살기 발동 시, 빙결 상태의 적에게 가하는 피해가 20% 증가한다
- decision: pending

### 98. 헤르타 - effect:Herta_00:2

- characterId: Herta_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:13:E2:승리를 위한 추격:critRate:0
- sourceText: 특성을 1회 발동할 때마다 자신의 치명타 확률이 3% 증가한다. 해당 효과 최대 중첩수: 5스택
- decision: pending

### 99. 히메코 - effect:Himeko_00:0

- characterId: Himeko_00
- stat: allDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:9:combatSkill:작열:allDamage:0
- sourceText: <추가 능력> 전투 스킬이 연소 상태의 적에게 가하는 피해가 20% 증가한다
- decision: pending

### 100. Dr. 레이시오 - effect:Dr_Ratio_00:0

- characterId: Dr_Ratio_00
- stat: critRate
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:1639:A:귀납:critRate:enemyDebuffCount
- sourceText: 귀납은 전투 중 누적 스택으로 처리해 현재 적 디버프 수와 무관하게 E0 최대 6스택/E1 이상 최대 10스택을 적용한다.
- decision: pending

### 101. Dr. 레이시오 - effect:Dr_Ratio_00:1

- characterId: Dr_Ratio_00
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:1639:A:귀납:critDamage:enemyDebuffCount
- sourceText: 귀납은 전투 중 누적 스택으로 처리해 현재 적 디버프 수와 무관하게 E0 최대 6스택/E1 이상 최대 10스택을 적용한다.
- decision: pending

### 102. Dr. 레이시오 - effect:Dr_Ratio_00:4

- characterId: Dr_Ratio_00
- stat: effectResDown
- effectType: debuff
- targetScope: enemySingle
- sourceTrace: HoyoWiki:1639:A:연역:effectResDown
- sourceText: 연역 원문상 전투 스킬 명중 시 적 효과 저항 -10%를 적 디버프 row로 사용한다.
- decision: pending

### 103. Mar. 7th•수렵 - effect:Mar_7th_10:1

- characterId: Mar_7th_10
- stat: critDamage
- effectType: buff
- targetScope: self
- sourceTrace: HoyoWiki:2657:basicAttack:파랑:critDamage:0
- sourceText: <추가 능력> 강화된 일반 공격 발동 후 [사부]의 치명타 피해가 60% 증가하고, 격파 특수효과가 36% 증가한다. 지속 시간: 2턴
- decision: pending


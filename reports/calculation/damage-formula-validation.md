# Damage Formula Validation

Generated at: 2026-07-06T12:14:43.446Z

## Summary

- checks: 31
- failed: 1
- formula counts: normal=201, break=32, dot=26, super_break=4, elation=9

## Checks

- PASS normal follow-up stays normal: 뇌정의 수렵 => normal
- PASS DoT skips crit: 달빛의 어루만짐 formula=dot usesCrit=false
- PASS break skips crit and normal damage boost: 콜키지 usesCrit=false damageBoost=0
- PASS super break mapped and skips crit: 인법첩•해명 formula=super_break usesCrit=false
- PASS super break state multiplier changes damage: 인법첩•해명 x1=125718 x1.4=176005
- PASS elation Certified Banger uses per-character 0-500 stacks: 배후의 파키 0=24687 500=108090 multiplier=4.378
- PASS YaoGuang E6 is the only Merrymake source: E0 rows=0 E6=0.250 damage 64185->96995
- PASS elation stat sources use integer points: trace=SilverWolf999_00:10,Evanescia_00:18,Sparxie_00:28,PlayerBoy_40:0,YaoGuang_00:10 final=91 dynamic=55 ornament=8 supportSelf=0 YaoGuangE2=16 relic=10 formulaElation=117 expected=117 synthetic=0to40
- FAIL YaoGuang speed elation is runtime-resolved from final source stats: speed=204.2 dynamic=126 self=10 final=162 source=true selfDynamic=false
- PASS Elation profiles show elation stats instead of elemental damage: dealers=true primary=elation,atk,speed,merrymake,critRate,critDamage,defensePen damageBonusGroup=false support=elation-support
- PASS Sparxie and Silver Wolf stack controls are active dealer only: Sparxie=activeCharacter/Sparxie_00 SilverWolf=activeCharacter/SilverWolf999_00 skill 5408->16223 talent 24687->49375
- PASS character state control catalog contains required controls: keys=blackSwanArcanaStacks,elationCertifiedBangerStacks,sparxieSkillEnhancementStacks,cipherRecordedDamage,superBreakToughnessMultiplier,trailblazerDestructionBreakStacks,astaChargeStacks,drRatioDeductionStacks
- PASS character state controls resolve dynamic effect rows: Asta atkRatio 3=0.150 5=0.250 Trailblazer=0.200
- PASS Cipher recorded damage adds ultimate true damage: 고양이 괴도 드림! base=19710 recorded=119710 delta=100000 trace=100000
- PASS true damage ratio adds post-final damage: base=1941 withTrue=3351 trueDamage=691 trueRows=1
- PASS Sparkle signature light cone team crit buffs apply: critRateDelta=0.100 critDamageDelta=0.280 lightconeRows=2
- PASS Light cone self stats are not duplicated between equipment and ledger: selfRows=1 selfTotal=0.180 ledgerRows=0
- PASS Silver Wolf 999 default light cone uses own Elation signature: selected=wiki-5218/갤럭시 시티에 오신 것을 환영합니다 recommended=wiki-5218
- PASS Elation default main stats match reviewed per-character builds: Silver sphere=hpRatio/rope=hpRatio speed=200.6 cr=88.2 cd=173.5 Sparxie=atkRatio/atkRatio YaoGuang=hpRatio/energyRegen
- PASS Multiple basic attacks display normal before enhanced: displayTypes=basic,basic_enhanced
- PASS Silver Wolf 999 normal basic stays single-target 110 percent at E6: normal target=single/single parts=1 coeff=110.0 enhanced=484.0
- PASS crit buffs are visible in major stat panel for support profiles: critRateRow=true labels=광추 · 속세에서의 유희
- PASS Remembrance Trailblazer ally crit buff is visible for active dealer: critRateRow=true trailblazerSource=true
- PASS Remembrance Trailblazer Mimi Support true damage is visible for active dealer: E0=0.300 E4=0.360 trueDamageRow=true trailblazerSource=true
- PASS Hyacine speed sources apply in calculator: E2 speedDelta=33.00 signature speedDelta=19.80
- PASS Ally speed buffs route to ally targets: Hyacine E2=0.300/all_allies, Ruan Mei talent=0.080/all_allies, Jade skill=30.000/single_ally, Bronya E2=0.300/single_ally, Hanya ultimate=23.970/single_ally
- PASS Light cone speed buffs route correctly: 효광전광=0.180, 바다는 왜 노래하는가=0.1, 관의 울림=12.0, 어울림=12.0
- PASS Mortenax Blade defense down uses HoyoWiki level-scaled row only: rows=1 total=0.320 legacy=false
- PASS Jingliu moonlight crit damage is split and E4 allDamage misread excluded: E3 rows=1 E4 rows=2 wrongAllDamage=false
- PASS Ashveil defense down scales by combat skill level and is not duplicated at E6: E4=0.400 E6 rows=1 total=0.440 hoyowikiDuplicate=false
- PASS Cerydra Military Merit ATK buff scales by talent level: E2 ratio=0.240 value=1256.6 E6 ratio=0.252 value=1319.4

## Samples

- Feixiao follow-up: formula=normal, usesCrit=true
- Kafka sample: formula=dot, crit=5884, expected=5884
- Gallagher break: formula=break, damage=11420
- Rappa super_break: formula=super_break, damage=125718
- Rappa super_break state: x1=125718, x1.4=176005
- Sparxie elation: 0=24687, 500=108090, punchlineMultiplier=4.378
- YaoGuang E6 Merrymake: value=0.250, damage 64185->96995
- Elation integer sources: Sparxie trace=28, dynamic=55, ornament=8, YaoGuang E2=16, relic4=10, formulaElation=117
- YaoGuang speed elation: speed=204.2, dynamic=126, final=162
- Elation profile stats: primary=elation/atk/speed/merrymake/critRate/critDamage/defensePen, damageBonusGroup=false
- Sparxie skill enhancement stacks: skill 5408->16223, talent 24687->49375
- State controls: Asta 3=0.150, Asta 5=0.250, Trailblazer stacks=0.200
- Cipher recorded true damage: base=19710, recorded=119710, delta=100000
- Cyrene trueDamageRatio: base=1941, with=3351, true=691
- Sparkle LC team crit: CR +0.100, CD +0.280
- Dan Heng IL LC critRate: selfRows=1, selfTotal=0.180, ledgerRows=0
- Silver Wolf 999 LC: wiki-5218 갤럭시 시티에 오신 것을 환영합니다
- Silver Wolf 999 default stats: speed=200.6, CR=88.2%, CD=173.5%
- Dan Heng IL basic display order: basic > basic_enhanced
- Silver Wolf 999 basics: normal=110.0%, enhanced=484.0%
- Trailblazer Mimi Support trueDamageRatio: E0=0.300, E4=0.360
- Hyacine speed: E2 +33.00, signature +19.80
- Mortenax Blade defenseDown: rows=1, total=0.320
- Jingliu moonlight rows: E3=1, E4=2
- Ashveil E6 defenseDown: rows=1, total=0.440
- Cerydra Military Merit ATK: E2 ratio=0.240, E6 ratio=0.252

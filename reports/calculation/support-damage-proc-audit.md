# Support Damage Proc Audit

Generated at: 2026-07-06T11:26:32.494Z

## Summary

- supportDamageProcs rows: 7
- supportDamageProcs owners: 6
- ally trueDamageRatio ledger rows: 5
- failed proc checks: 0
- failed ledger checks: 0
- failed modifier checks: 0

## Explicit support-damage procs

| owner | type | eidolon | trigger | formula | path | E0 blocked | skill card | contribution sourceRows | skill detail | delta | source |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| 로빈 | additionalDamage | E0+ | basic, skill, ultimate, follow_up | support.atk * 120% / E3+ 129% * damageBoost * fixed crit x7 * DEF * RES * broken | support-proc | YES | YES | YES | YES | 20401.439 | effect:Robin_00:2 |
| 정운 | additionalDamage | E0+ | basic, skill, ultimate, follow_up | active.atk * 20% * damageBoost * active critDamage * DEF * RES * broken | support-proc | YES | YES | YES | YES | 2335.598 | effect:Tingyun_00:2 |
| 케리드라 | additionalDamage | E0+ | basic, skill, ultimate, follow_up | support.atk * 60% / E5+ 66% / E6+ 264% * damageBoost * support critDamage * DEF * RES * broken | support-proc | YES | YES | YES | YES | 18189.841 | effect:Cerydra_00:6 |
| 키레네 | trueDamageRatio | E0+ | basic, skill, ultimate, follow_up, dot | directCritDamage * 26% | ledger | YES | YES | YES | YES | 0 | effect:Cyrene_00:19 |
| 트리비 | trueDamageRatio | E1+ | basic, skill, ultimate, follow_up, dot | directCritDamage * 24% | ledger | YES | YES | YES | YES | 1027.994 | effect:Tribbie_00:3 |
| 트리비 | additionalDamage | E0+ | basic, skill, ultimate, follow_up | support.hp * 6% * damageBoost * no crit * DEF * RES * broken | support-proc | YES | YES | YES | YES | 1027.994 | effect:Tribbie_00:5 |
| 단항 • 등황 | additionalDamage | E6+ | ultimate | support.atk * 330% * damageBoost * support critDamage * DEF * RES * broken | support-proc | YES | YES | YES | YES | 31014.796 | effect:DanHengPT_00:0 |

## Ally trueDamageRatio ledger rows

| owner | effect | eidolon | applied | card true damage | contribution sourceRows | skill detail | value |
| --- | --- | ---: | --- | --- | --- | --- | ---: |
| 개척자 • 기억 | effect:PlayerBoy_20:2 | 4 | YES | YES | YES | YES | 0.36 |
| 키레네 | effect:Cyrene_00:18 | 2 | YES | YES | YES | YES | 0.5 |
| 키레네 | effect:Cyrene_00:19 | 0 | YES | YES | YES | YES | 0.26 |
| 트리비 | effect:Tribbie_00:3 | 1 | YES | YES | YES | YES | 0.24 |
| 개척자 • 기억 | effect:PlayerBoy_20:supplement:mimiSupportTrueDamage | 0 | YES | YES | YES | YES | 0.3 |

## Modifier checks

| name | pass | base | with modifiers |
| --- | --- | ---: | ---: |
| Robin additional damage uses current party buffs and enemy debuffs | YES | 20401.439 | 48025.285 |
| Cerydra Military Merit additional damage uses Lv10 and E6 coefficient | YES | 35001.155 | 154005.08 |


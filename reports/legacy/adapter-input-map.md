# Adapter Input Map

Task 2-B 결과입니다. v2 adapter가 나중에 읽을 수 있는 legacy/source-backed 후보와 금지 대상을 분리합니다.

## 원칙

- 이 문서는 adapter를 구현하지 않습니다.
- 기존 `C:\CODEX\HSR RELIC CC` 프로젝트를 수정하지 않습니다.
- legacy data를 v2 runtime에 import하지 않습니다.
- `manual_hint` / `manual_guide` / guide 값은 계산 가능한 adapter output으로 만들지 않습니다.
- 계산 로직 조기 구현, schema 구현, effect-engine 구현은 금지합니다.

## Adapter Input Candidate

| 후보 | source 성격 | adapter output 후보 | 조건 |
| --- | --- | --- | --- |
| `data/game-db/hoyowiki-character-base-stats.json` | HoYoWiki character base stat | `SourceRow`, `CharacterBaseStatRow` | source URL/source origin/provenance가 유지되어야 합니다. |
| `data/game-db/hoyowiki-character-trace-stats.json` | HoYoWiki trace stat | `SourceRow`, `TraceStatRow` | trace unlock/level 조건이 분리되어야 합니다. |
| `data/game-db/hoyowiki-character-skills.json` | HoYoWiki skill text/table | `SourceRow`, `SkillTextRow`, `CoefficientCandidateRow` | 공식 텍스트와 coefficient table을 구분해야 합니다. |
| `data/game-db/character-skill-db.json` | generated skill DB | `SkillRow`, `CoefficientRow` 후보 | 생성 provenance와 원본 HoYoWiki row 연결이 필요합니다. |
| `data/game-db/character-stat-baseline.json` | generated stat baseline | `CharacterBaseStatRow` 후보 | generation rule과 source file 연결이 필요합니다. |
| `data/game-db/character-effect-candidates.json` | extracted effect candidates | `EffectCandidateRow` | source text, parameter reference, confidence를 유지해야 합니다. |
| `data/game-db/attack-skill-inventory.json` | attack skill inventory | `AttackProfileRow` | target profile과 attack type을 canonical enum으로 변환해야 합니다. |
| `data/game-db/attack-coefficient-candidates.json` | coefficient candidates | `CoefficientRow` 후보 | confidence와 source-backed 여부를 검증해야 합니다. |
| `data/game-db/lightcone-effect-candidates.json` | light cone effect candidates | `EffectCandidateRow` | light cone rank/superimposition 조건이 분리되어야 합니다. |
| `data/character-effects/curated-source-effects.json` | curated source-backed effects | `EffectRow` 후보 | curated 이유와 original source 연결이 필요합니다. |
| `data/character-effects/source-effect-mappings.json` | source mapping metadata | source linkage metadata | 계산 row가 아니라 provenance 연결 보조 자료로만 사용합니다. |
| `src/srtools/import/srtools-import-parser.js` | external SRTools shape knowledge | external import parser 요구사항 | code copy가 아니라 mapping spec만 가져옵니다. |
| `src/freesr/import/freesr-import-parser.js` | external FreeSR shape knowledge | external import parser 요구사항 | FreeSR raw shape를 canonical import draft로 변환하는 요구사항만 가져옵니다. |

## Reference Only

| 후보 | 이유 |
| --- | --- |
| `data/audit/*` | source guard와 blocked reason 설계 참고 자료입니다. 계산 source로 사용하지 않습니다. |
| `tools/audit_active_effect_*` | v2 validator 요구사항 참고 자료입니다. |
| `tools/generate_*`, `tools/extract_*`, `tools/probe_*` | 기존 산출물 생성 이력입니다. Phase 4 provenance 확인에만 씁니다. |
| `src/srtools/audit/*` | SRTools mapping audit UX/reference입니다. adapter runtime으로 가져오지 않습니다. |
| `data/config (2).json`, `data/config (3).json` | legacy external config 샘플입니다. Phase 4에서 샘플 snapshot 여부를 따로 결정합니다. |

## Calculation Input Blocked

| 후보 | blocked reason |
| --- | --- |
| `data/character-effects/character-guides.json` | guide/manual 성격입니다. role, damage template, effects를 계산에 넣지 않습니다. |
| `data/character-effects/default-builds.json` | 추천 build/default equipment 성격입니다. 계산 source가 아니라 fixture/reference로만 둘 수 있습니다. |
| `data/audit/manual-guide-effect-fallbacks.json` | manual guide fallback 목록입니다. blocked row 설계 참고만 가능합니다. |
| `src/sample-data.js` | source-backed data와 guide/manual fallback을 합쳐 app data로 만듭니다. |
| `src/model/damage.js` | legacy calculation engine입니다. v2 source-backed engine 전에는 복사 금지입니다. |
| `src/srtools/manual-mappings.js` | localStorage manual mapping입니다. mapping confidence metadata로만 다뤄야 합니다. |
| `src/srtools/import/srtools-import-preview.js` | import preview와 legacy app state patch가 결합되어 있습니다. |
| `src/srtools/import/srtools-app-adapter.js` | FreeSR/SRTools input을 legacy app state에 직접 연결합니다. |

## External Import Notes

### SRTools

- Raw shape detection: `avatar_config` array.
- Relic string shape: `relicId,level,mainStatId,rarity,subAffixId:count:step...`.
- Useful adapter requirements:
  - external avatar id to canonical character id mapping
  - light cone id mapping
  - relic set id and piece mapping
  - main/sub stat id mapping
  - parse success/partial/fail status
- v2 rule:
  - parsed external values are import draft rows.
  - manual mapping can resolve identity, but must not become a calculation source without explicit provenance.

### FreeSR

- Raw shape detection: object with `avatars`, `relics`, `lightcones`.
- Current legacy code converts FreeSR to SRTools-like `avatar_config`.
- Useful adapter requirements:
  - preserve full roster, not only first 4 party slots
  - preserve loadout ordering separately from owned roster
  - preserve raw relic/light cone rows as external source evidence
- v2 rule:
  - FreeSR import creates import draft data first.
  - applying to party or calculation is a later UI/action layer step, not parser responsibility.

## Phase 4 Snapshot Candidates

Phase 4 should decide which files are copied into v2 `data/reference` or `data/generated` snapshots. Candidate priority:

1. HoYoWiki source-backed game-db files.
2. Generated skill/stat/effect candidate files that preserve source provenance.
3. Curated source-backed effect mapping files.
4. External import sample files only as fixtures, not runtime defaults.

Do not snapshot guide/default build files as calculation inputs.

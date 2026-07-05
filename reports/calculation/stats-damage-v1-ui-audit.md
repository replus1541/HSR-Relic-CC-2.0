# Stats / Damage UI Audit From v1

This document summarizes the v1 `스탯 / 데미지 계산` screen so the v2 UI can expose the same useful information without copying the old data flow.

## v1 Screen Order

1. Main dealer selector
   - Current party compact selector.
   - Selected main dealer drives all evaluation and damage cards.

2. Enemy editor
   - Enemy count: 1-5.
   - Enemy level.
   - Toughness.
   - Element resistance.

3. Party-specific controls
   - Conditional stack controls shown only when the current party needs them.
   - Examples in v1: character-specific stack count or special state overrides.
   - These controls are not generic cycle controls; they are max-damage input knobs for effects that cannot be inferred from the static party.

4. Stat evaluation panel
   - Rendered as grouped rows.
   - Each row is expandable and shows source rows by owner character.
   - Status states:
     - neutral: check icon only.
     - notice: compact warning text.
     - warning: adjustment warning text.

5. Damage contribution tabs
   - `캐릭터별`
   - `스탯 별`
   - `파티원 추천`

6. Skill damage cards
   - One card per attack scenario.
   - Header line: skill name + total DMG.
   - Subtitle line: total coefficient percent + attack type/target label.
   - Body: `출처 / 비율` contribution list.

7. Contribution detail
   - Character mode:
     - ranked source owner rows.
     - owner icon, name, eidolon, contribution percent, track bar.
     - expandable detail rows with source icon, stat/effect title, compact source label, percent.
   - Stat mode:
     - ranked stat rows.
     - stat label, unit gain text, source count, contribution percent, track bar.
     - expandable detail rows grouped by source character and source label.

8. Party member damage increase prediction
   - Shown when contribution tab is `파티원 추천`.
   - Per scenario group.
   - Base damage in header.
   - Candidate rows with character icon, eidolon, +damage, +percent.
   - Expandable source details.
   - Candidate eidolon mode select:
     - owned characters.
     - force candidate E0-E6.

9. Recommendation list
   - v1 kept a separate `추천 파티원` section.
   - In current v1 code this is mostly empty because the stronger replacement is the party member damage increase prediction.

## v1 Stat Evaluation Rows

Rows are template-dependent.

### Crit / Crit-Follow / Crit-Summon

- Group `주요 스탯`
  - Primary scaling stat: ATK / HP / DEF / CRIT DMG depending on character profile.
  - Speed, only for dealer-like roles.
  - Crit rate.
  - Crit damage.
  - Dealt crit damage, only if source rows exist.
  - Follow-up crit damage, only if source rows exist.
  - Vulnerability, only if source rows exist.
  - Defense down / defense ignore, only if source rows exist.
  - Resistance penetration, only if source rows exist.
  - Special final damage, only if party source rows exist.
  - Taken crit damage, only if source rows exist.
- Group `피해증가 총합`
  - Basic attack damage increase.
  - Skill damage increase.
  - Ultimate damage increase.
  - Follow-up damage increase.
- Optional group `보조 스탯`
  - Speed if not already shown in primary group.
  - Debuff count.
  - Effect hit rate.
  - Effect resistance, only if source rows exist.
  - Energy regen.

### DoT

- Group `주요 스탯`
  - Primary scaling stat, usually ATK.
  - Speed, if dealer-like.
  - DoT damage.
  - Vulnerability.
  - Defense down / defense ignore.
  - Resistance penetration.
- Group `피해증가 총합`
  - Basic attack damage increase.
  - Skill damage increase.
  - Ultimate damage increase.
  - Follow-up damage increase.
  - DoT damage increase.
- Optional group `보조 스탯`.

### Break

- Group `주요 스탯`
  - Primary scaling stat.
  - Speed, if dealer-like.
  - Break effect.
  - Break damage.
  - Vulnerability.
  - Defense down / defense ignore.
  - Resistance penetration.
- Optional group `보조 스탯`.

### Utility / Support

- Group `주요 스탯`
  - Primary support stat.
  - Utility crit rows only for explicit special cases.
  - Vulnerability / defense / resistance rows if source rows exist.
- Optional group `보조 스탯`.
- Important: support templates should not show a hardcoded effect resistance row unless the current data actually has that source row.

## v2 Current State

Already connected:

- Main dealer selector.
- Enemy editor.
- Battle-final stat result.
- Skill damage metadata and skill cards.
- E3/E5 level correction for coefficient level.
- Applied effect list.

Currently missing or too thin:

- Party-specific stack controls.
- Stat evaluation grouped rows.
- Common contribution tab switcher.
- `출처 / 비율` under each skill card.
- Character contribution ranking.
- Stat contribution ranking.
- Party member damage increase prediction.
- Stat damage increase sensitivity panel.
- Source icons and compact source labels.
- Better skill card title/subtitle density matching v1.

## v2 Implementation Plan

### Step A. Evaluation Summary

Add a v2 equivalent of `buildPartyEvaluation`.

Inputs:

- active battle result.
- applied rows.
- active character custom type profile.
- enemy state.

Output:

- grouped evaluation items.
- item label/value/status.
- source rows grouped by owner.

UI:

- Put evaluation groups between enemy editor and skill damage cards.
- Keep neutral rows compact.
- Expand rows to show source details.

### Step B. Skill Card Formatting

Keep current skill damage calculation, but change card display to v1 shape:

- `skill title + crit-hit DMG` on the first line.
- `계수: nnn% / attack type / target` on the second line.
- Move secondary values into a compact metadata strip:
  - expected damage.
  - non-crit damage.
  - scaling stat.
  - level.
  - part count.

### Step C. Contribution Tabs

Add a shared tab control:

- `캐릭터별`
- `스탯 별`
- `파티원 추천`

For the first pass:

- Character/stat tabs can use applied row magnitudes as an approximation.
- Then replace with recalculated damage deltas after the damage engine can isolate each effect.

### Step D. Source / Ratio Per Skill

For each skill card, add `출처 / 비율`.

Minimum viable source rows:

- owner display name.
- stat label.
- source label.
- value.
- percent contribution approximation.

Later precision:

- Recalculate skill damage without each source row and calculate delta share.

### Step E. Party Member Recommendation

Rebuild later after v2 has:

- candidate party simulation.
- default builds for candidates.
- stack override support.

UI shape should follow v1:

- scenario group.
- candidate row: icon, name, eidolon, +damage, +percent.
- details expandable.

### Step F. Stat Damage Sensitivity

Add after contribution rows:

- stat label.
- unit input/range.
- +damage.
- +percent.
- expandable details.

This is lower priority than evaluation rows and per-skill source ratios because it requires recalculating each skill after injecting virtual stat deltas.

## Recommended Priority

1. Stat evaluation grouped rows.
2. Skill card display cleanup.
3. Character/stat contribution tabs and source/ratio rows.
4. Party-specific stack controls for known source-backed max-damage knobs.
5. Party member recommendation.
6. Stat damage sensitivity.


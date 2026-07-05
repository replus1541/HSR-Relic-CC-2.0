import fs from "node:fs";
import path from "node:path";

const status = JSON.parse(fs.readFileSync("data/generated/extraction-status.json", "utf8"));
const effects = JSON.parse(fs.readFileSync("data/generated/effect-rows.json", "utf8")).rows;

const statusByEntryPageId = new Map(
  status.rows
    .filter((row) => row.identifiers?.hoyowikiEntryPageId)
    .map((row) => [String(row.identifiers.hoyowikiEntryPageId), row]),
);

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(relativePath), { recursive: true });
  fs.writeFileSync(relativePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeReport(relativePath, lines) {
  fs.mkdirSync(path.dirname(relativePath), { recursive: true });
  fs.writeFileSync(relativePath, `${lines.join("\n")}\n`, "utf8");
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function classifyRow(row) {
  const text = compactText(row.sourceText);
  const isAttackCoefficientText = hasAny(text, [
    /공격력(?:의)?\s*\d+(?:\.\d+)?%/,
    /HP\s*최대치(?:의)?\s*\d+(?:\.\d+)?%/,
    /방어력\s*\d+(?:\.\d+)?%/,
  ]);
  const hasFlatPlusScaled = /\d+(?:\.\d+)?%\s*\+\s*\d+/.test(text);
  const isMetadataPattern = hasAny(text, [
    /강인성\s*감소\s*수치(?:가)?\s*(?:추가로\s*)?\d+(?:\.\d+)?%\s*증가/,
    /피격될\s*확률/,
    /추가\s*공격을\s*발동한\s*것으로\s*간주/,
    /디버프\s*효과를\s*\d+개\s*해제/,
    /지속\s*회복\s*효과를\s*1턴\s*연장/,
    /지속\s*시간이\s*1턴\s*증가/,
  ]);
  const isFixedNumericPattern = hasAny(text, [
    /에너지를\s*\d+(?:\.\d+)?\s*pt\s*회복/,
    /행동\s*게이지/,
    /기본\s*확률\s*이?\s*\d+(?:\.\d+)?%\s*증가/,
    /받는\s*피해가\s*\d+(?:\.\d+)?%\s*감소/,
    /디버프\s*효과를\s*\d+개\s*해제/,
    /지속\s*시간이\s*1턴\s*증가/,
    /효과를\s*1턴\s*연장/,
  ]);
  const isSkillScaledEffect = isAttackCoefficientText || hasFlatPlusScaled || hasAny(text, [
    /격파\s*특수효과가\s*\d+(?:\.\d+)?%\s*증가/,
    /받는\s*격파\s*피해가\s*\d+(?:\.\d+)?%\s*증가/,
    /받는\s*추가\s*공격\s*피해를\s*\d+(?:\.\d+)?%\s*증가/,
    /받는\s*지속\s*피해가\s*\d+(?:\.\d+)?%\s*증가/,
    /피해\s*감소.*\d+(?:\.\d+)?%/,
    /공격력을\s*\d+(?:\.\d+)?%\s*감소/,
    /치명타\s*피해가\s*\d+(?:\.\d+)?%\s*증가/,
    /속도가\s*\d+(?:\.\d+)?\s*pt\s*증가/,
    /피해\s*배율이\s*\d+(?:\.\d+)?%\s*증가/,
    /HP\s*최대치가.*\d+(?:\.\d+)?%/,
  ]);
  const isDynamic = hasAny(text, [
    /HP가\s*낮을수록/,
    /HP\s*백분율/,
    /HP가\s*\d+(?:\.\d+)?%\s*이하/,
    /스택/,
    /상태에서는/,
    /보유하고\s*있으면/,
    /빠진\s*적이/,
    /받을\s*시/,
    /공격을\s*받을\s*때마다/,
    /부족하면/,
    /임의의\s*적/,
    /랜덤/,
  ]);
  const isEidolonAdjusted = /성혼|돌파|E[1-6]/i.test(text);
  const isNonCalculation = hasAny(text, [
    /불능\s*상태/,
    /움직임이\s*제한/,
    /추가\s*공격을\s*발동한\s*것으로\s*간주/,
    /지속\s*시간이\s*1턴\s*증가/,
    /효과를\s*1턴\s*연장/,
    /기본\s*확률이\s*\d+(?:\.\d+)?%\s*증가/,
  ]);

  if (isEidolonAdjusted) {
    return {
      proposedValueMode: "eidolon_adjusted",
      requiredPolicy: "eidolon_policy_review",
      nextAction: "성혼 조건/대상 변화가 계산 row로 들어갈 수 있는지 별도 eidolon policy에서 검토한다.",
    };
  }

  if (isDynamic && isAttackCoefficientText) {
    return {
      proposedValueMode: "dynamic_formula",
      requiredPolicy: "dynamic_formula_resolver_needed",
      nextAction: "조건부 상태, HP 조건, 랜덤/타깃 조건을 분리한 뒤 source-backed resolver 후보로 올린다.",
    };
  }

  if (isDynamic && !isAttackCoefficientText) {
    return {
      proposedValueMode: "dynamic_formula",
      requiredPolicy: "dynamic_formula_or_reference_policy",
      nextAction: "조건이 계산 입력에 영향을 주는지 확인하고, 직접 계산 대상이 아니면 reference-only로 둔다.",
    };
  }

  if (isSkillScaledEffect) {
    return {
      proposedValueMode: "skill_level_scaled",
      requiredPolicy: "hoyowiki_skill_level_table_parser_needed",
      nextAction: "HoyoWiki description의 현재 수치를 계산에 쓰지 말고, 계수 테이블/스킬 레벨 row와 연결하는 parser rule을 만든다.",
    };
  }

  if (isMetadataPattern) {
    return {
      proposedValueMode: "metadata_only",
      requiredPolicy: "metadata_schema_needed",
      nextAction: "강인성, 행동 게이지, 에너지, 지속 턴 같은 전투 메타는 damage modifier와 분리된 metadata schema로 보존한다.",
    };
  }

  if (isFixedNumericPattern || /\d+(?:\.\d+)?\s*(?:pt|%|턴|회)/.test(text)) {
    return {
      proposedValueMode: "fixed",
      requiredPolicy: "fixed_value_review_needed",
      nextAction: "고정 수치인지 스킬 레벨 스케일 수치인지 원천 테이블과 대조한 뒤에만 계산 후보로 승격한다.",
    };
  }

  if (isNonCalculation) {
    return {
      proposedValueMode: "non_calculation_text",
      requiredPolicy: "reference_only_policy",
      nextAction: "현재 relic/stat 계산에 직접 쓰지 않고 source-backed reference text로만 유지한다.",
    };
  }

  if (hasAny(text, [/증가|감소|부여|빠트린다|상태/])) {
    return {
      proposedValueMode: "parser_rule_needed",
      requiredPolicy: "repeatable_text_pattern_parser_needed",
      nextAction: "반복되는 상태 부여/증감 패턴을 parser rule로 분류한 뒤 valueMode를 다시 제안한다.",
    };
  }

  return {
    proposedValueMode: "needs_curated_source",
    requiredPolicy: "curated_source_review_required",
    nextAction: "원문만으로 구조화가 어렵다. 자동 승격하지 말고 curated_source 검수 row가 필요하다.",
  };
}

function proposedEffectType(row, proposedValueMode) {
  if (proposedValueMode === "metadata_only" || proposedValueMode === "non_calculation_text") return "reference_only";
  if (row.stat === "atkRatio" && row.targetScope?.startsWith("enemy")) return "damage_or_debuff";
  if (row.stat === "hpRatio") return "healing_or_hp_modifier";
  if (row.stat === "defenseDown" && row.targetScope !== "enemy_all" && row.targetScope !== "enemy_single") return "shield_or_defense_scaling";
  return row.effectType;
}

const rows = effects
  .filter((row) => row.id.startsWith("effect:hoyowiki-effect:"))
  .map((row) => {
    const statusRow = statusByEntryPageId.get(String(row.effectProviderId));
    const classification = classifyRow(row);
    return {
      rowId: row.id,
      characterId: statusRow?.characterId ?? row.effectProviderId,
      displayName: statusRow?.displayName ?? row.characterName,
      sourceName: row.characterName,
      sourceText: row.sourceText,
      currentBlockedReason: row.blockedReason ?? null,
      proposedValueMode: classification.proposedValueMode,
      proposedEffectType: proposedEffectType(row, classification.proposedValueMode),
      requiredPolicy: classification.requiredPolicy,
      nextAction: classification.nextAction,
    };
  });

const proposedValueModeCounts = countBy(rows, (row) => row.proposedValueMode);
const requiredPolicyCounts = countBy(rows, (row) => row.requiredPolicy);
const parserRuleNeededCount = proposedValueModeCounts.parser_rule_needed ?? 0;
const parserPolicyNeededCount = rows.filter((row) => (
  row.requiredPolicy.includes("parser_needed")
  || row.requiredPolicy.includes("parser_rule")
)).length;

const output = {
  version: 1,
  generatedBy: "tools/review_hoyowiki_supplemental_value_modes.mjs",
  scope: "effect:hoyowiki-effect:* rows only",
  totalRows: rows.length,
  proposedValueModeCounts,
  requiredPolicyCounts,
  metadataOnlyCount: proposedValueModeCounts.metadata_only ?? 0,
  parserRuleNeededCount,
  parserPolicyNeededCount,
  needsCuratedSourceCount: proposedValueModeCounts.needs_curated_source ?? 0,
  rows,
};

writeJson("reports/extraction/hoyowiki-supplemental-value-mode-review.json", output);
writeReport("reports/extraction/hoyowiki-supplemental-value-mode-review.md", [
  "# HoyoWiki Supplemental Value Mode Review",
  "",
  "Generated by `node tools/review_hoyowiki_supplemental_value_modes.mjs`.",
  "",
  "Scope: only `effect:hoyowiki-effect:*` supplemental rows. This report does not change generated `valueMode`, readiness, or calculation status.",
  "",
  "## Summary",
  "",
  `- totalRows: ${output.totalRows}`,
  `- metadata_only: ${output.metadataOnlyCount}`,
  `- parser_rule_needed: ${output.parserRuleNeededCount}`,
  `- parserPolicyNeeded: ${output.parserPolicyNeededCount}`,
  `- needs_curated_source: ${output.needsCuratedSourceCount}`,
  "",
  "## Proposed Value Modes",
  "",
  ...Object.entries(proposedValueModeCounts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Required Policies",
  "",
  ...Object.entries(requiredPolicyCounts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Rows",
  "",
  ...rows.flatMap((row) => [
    `### ${row.displayName} - ${row.rowId}`,
    "",
    `- characterId: ${row.characterId}`,
    `- sourceName: ${row.sourceName}`,
    `- currentBlockedReason: ${row.currentBlockedReason}`,
    `- proposedValueMode: ${row.proposedValueMode}`,
    `- proposedEffectType: ${row.proposedEffectType}`,
    `- requiredPolicy: ${row.requiredPolicy}`,
    `- nextAction: ${row.nextAction}`,
    `- sourceText: ${compactText(row.sourceText)}`,
    "",
  ]),
]);

console.log(JSON.stringify({
  totalRows: output.totalRows,
  proposedValueModeCounts,
  metadataOnlyCount: output.metadataOnlyCount,
  parserRuleNeededCount,
  parserPolicyNeededCount,
  needsCuratedSourceCount: output.needsCuratedSourceCount,
}, null, 2));

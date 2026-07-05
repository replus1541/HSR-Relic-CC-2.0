import fs from "node:fs";
import path from "node:path";

const candidates = JSON.parse(fs.readFileSync("data/legacy-reference/game-db/character-effect-candidates.json", "utf8"));
const wiki = JSON.parse(fs.readFileSync("data/legacy-reference/game-db/hoyowiki-character-skills.json", "utf8"));

const wikiByEntry = new Map((wiki.characters ?? []).map((character) => [String(character.entryPageId), character]));

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function pct(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  const rounded = Math.round(value * 10000) / 100;
  return `${rounded}%`;
}

function parseSourceId(sourceId) {
  const parts = String(sourceId ?? "").split(":");
  if (parts[0] !== "HoyoWiki") return null;
  return {
    entryPageId: parts[1] ?? null,
    category: parts[2] ?? null,
    title: parts[3] ?? null,
    stat: parts[4] ?? null,
    suffix: parts.slice(5).join(":"),
  };
}

function findSkill(trace) {
  if (!trace?.entryPageId) return null;
  const character = wikiByEntry.get(String(trace.entryPageId));
  if (!character) return null;
  const skills = character.skills ?? [];
  const skill = skills.find((item) => item.category === trace.category && item.title === trace.title)
    ?? skills.find((item) => item.title === trace.title)
    ?? skills.find((item) => item.category === trace.category);
  return skill ? { character, skill } : { character, skill: null };
}

const labelNeedlesByStat = {
  atkRatio: ["공격력"],
  atkFlat: ["공격력"],
  hpRatio: ["HP", "체력"],
  critRate: ["치명타 확률"],
  critDamage: ["치명타 피해"],
  allDamage: ["피해 증가", "가하는 피해", "피해량 증가", "피해 배율 증가"],
  basicDamage: ["일반 공격 피해"],
  skillDamage: ["스킬 피해"],
  ultimateDamage: ["필살기", "피해 증가"],
  followDamage: ["추가 공격 피해"],
  vulnerability: ["받는 피해", "취약"],
  defenseDown: ["방어력 감소", "방어력"],
  defenseIgnore: ["방어력", "무시"],
  resistancePen: ["저항 관통", "저항"],
  toughnessDamageRatio: ["강인성"],
  breakEffect: ["격파 특수효과"],
  breakDamage: ["격파 피해"],
  speed: ["속도"],
};

function labelMatchesStat(label, stat) {
  const normalized = compactText(label);
  const needles = labelNeedlesByStat[stat] ?? [];
  if (!needles.length) return false;
  return needles.some((needle) => normalized.includes(needle));
}

function rowHasValue(row, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return (row.values ?? []).some((candidate) => Math.abs(Number(candidate) - value) < 0.00001);
}

function matchingCoefficientRows(skill, effect) {
  const rows = skill?.coefficientRows ?? [];
  return rows.filter((row) => labelMatchesStat(row.label, effect.stat) || rowHasValue(row, effect.value));
}

function hasNumberedEffectText(effect) {
  const text = compactText(effect.sourceText);
  if (!/\d+(?:\.\d+)?\s*(?:%|pt|턴|회)/.test(text)) return false;
  const statWords = [
    "공격력", "치명타", "피해", "방어력", "저항", "속도", "격파", "HP", "체력", "취약",
  ];
  return statWords.some((word) => text.includes(word));
}

function isAdditionalAbility(effect) {
  const text = compactText(effect.sourceText);
  return text.startsWith("<추가 능력>") || effect.sourceKind === "추가 능력";
}

function isEidolonTrace(trace) {
  return /^E[1-6]$/i.test(trace?.category ?? "");
}

function isSourceStatFormula(effect) {
  const text = `${effect.sourceId ?? ""} ${effect.valueFormula ?? ""} ${effect.scalingSource ?? ""}`;
  return /sourceCombat|sourceAtk|targetAtk|source.*Ratio|PlusFlat|overcap/i.test(text);
}

function isStackFormula(effect) {
  const text = compactText(`${effect.sourceText ?? ""} ${effect.valueFormula ?? ""} ${effect.scalingSource ?? ""}`);
  return /스택|중첩|stack/i.test(text);
}

function classify(effect, trace, skill, matches) {
  if (!trace) return {
    className: "non_hoyowiki_source",
    action: "HoyoWiki source가 아니므로 별도 source policy에서 검토한다.",
  };
  if (isEidolonTrace(trace)) return {
    className: "eidolon_or_constellation",
    action: "성혼 조건값으로 분리한다. 스킬 레벨 fixed 승격 대상이 아니다.",
  };
  if (isSourceStatFormula(effect)) return {
    className: "source_stat_formula",
    action: "고정값이 아니라 source stat 기반 공식으로 유지한다.",
  };
  if (matches.length > 0) return {
    className: "level_scaled_confirmed_by_coefficient_row",
    action: "fixed 금지. HoyoWiki coefficientRows와 연결해 skill_level_scaled로 처리한다.",
  };
  if (isStackFormula(effect)) return {
    className: "dynamic_stack_or_condition",
    action: "스택/조건 입력값으로 유지한다. 조건 ON과 수치 fixed를 섞지 않는다.",
  };
  if (isAdditionalAbility(effect)) return {
    className: "probably_fixed_additional_ability",
    action: "추가 능력 고정값 후보. 그래도 coefficientRows 재매칭 후에만 fixed 확정한다.",
  };
  if (["basicAttack", "combatSkill", "ultimate", "talent"].includes(trace.category) && hasNumberedEffectText(effect)) {
    return {
      className: "level_scaling_table_missing_or_unmatched",
      action: "fixed 금지. HoyoWiki ability scaling form 누락/미매칭으로 보고 테이블을 찾아 연결하거나 blocked 처리한다.",
    };
  }
  if (!skill) return {
    className: "wiki_skill_not_found",
    action: "sourceId가 가리키는 HoyoWiki 스킬을 찾지 못했다. 매핑부터 고친다.",
  };
  return {
    className: "needs_manual_value_mode_review",
    action: "자동으로 fixed 승격하지 않는다. 원문과 스케일링 폼을 같이 보고 결정한다.",
  };
}

const rows = [];
for (const character of candidates.characters ?? []) {
  for (const effect of character.activeEffects ?? []) {
    if (effect.valueMode !== "dynamic_formula") continue;
    const trace = parseSourceId(effect.sourceId);
    const found = findSkill(trace);
    const skill = found?.skill ?? null;
    const matches = matchingCoefficientRows(skill, effect);
    const classification = classify(effect, trace, skill, matches);
    rows.push({
      name: character.name,
      avatar: character.avatar,
      stat: effect.stat,
      value: effect.value,
      valuePct: pct(effect.value),
      sourceKind: effect.sourceKind,
      sourceId: effect.sourceId,
      sourceTitle: trace?.title ?? effect.source,
      sourceCategory: trace?.category ?? "unknown",
      wikiSkillFound: Boolean(skill),
      coefficientRowCount: skill?.coefficientRows?.length ?? 0,
      matchingCoefficientRows: matches.map((row) => ({
        label: row.label,
        first: row.values?.[0] ?? null,
        level10: row.values?.[9] ?? null,
        last: row.values?.at(-1) ?? null,
      })),
      auditClass: classification.className,
      action: classification.action,
      sourceText: compactText(effect.sourceText),
    });
  }
}

const counts = rows.reduce((acc, row) => {
  acc[row.auditClass] = (acc[row.auditClass] ?? 0) + 1;
  return acc;
}, {});

const output = {
  version: 1,
  generatedBy: "tools/audit_dynamic_formula_level_scaling.mjs",
  scope: "all character-effect-candidates activeEffects where valueMode == dynamic_formula",
  totalRows: rows.length,
  counts,
  rows,
};

fs.mkdirSync("reports/extraction", { recursive: true });
fs.writeFileSync("reports/extraction/dynamic-formula-level-scaling-audit.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");

const lines = [
  "# Dynamic Formula Level Scaling Audit",
  "",
  "Generated by `node tools/audit_dynamic_formula_level_scaling.mjs`.",
  "",
  "Scope: all 103 `dynamic_formula` active effect candidates. This report exists to prevent changing setup assumptions directly into `fixed` values when the value should come from HoyoWiki ability scaling / coefficient rows.",
  "",
  "## Summary",
  "",
  `- totalRows: ${rows.length}`,
  ...Object.entries(counts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Rows",
  "",
];

for (const row of rows) {
  lines.push(
    `### ${row.name} - ${row.sourceId}`,
    "",
    `- avatar: ${row.avatar}`,
    `- stat: ${row.stat}`,
    `- sourceCategory: ${row.sourceCategory}`,
    `- sourceKind: ${row.sourceKind ?? "unknown"}`,
    `- currentValue: ${row.valuePct}`,
    `- auditClass: ${row.auditClass}`,
    `- action: ${row.action}`,
    `- wikiSkillFound: ${row.wikiSkillFound}`,
    `- coefficientRowCount: ${row.coefficientRowCount}`,
    `- matchingCoefficientRows: ${row.matchingCoefficientRows.length ? row.matchingCoefficientRows.map((match) => `${match.label} [first=${pct(match.first)}, level10=${pct(match.level10)}, last=${pct(match.last)}]`).join("; ") : "none"}`,
    `- sourceText: ${row.sourceText}`,
    "",
  );
}

fs.writeFileSync("reports/extraction/dynamic-formula-level-scaling-audit.md", `${lines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  totalRows: output.totalRows,
  counts: output.counts,
  report: "reports/extraction/dynamic-formula-level-scaling-audit.md",
}, null, 2));

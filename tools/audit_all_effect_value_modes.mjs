import fs from "node:fs";
import { resolveValue } from "../src/effect-engine/resolve-values.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function pct(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${Math.round(value * 10000) / 100}%`;
}

function countBy(rows, getKey) {
  return rows.reduce((counts, row) => {
    const key = getKey(row) ?? "none";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function parseHoyoWikiSourceId(sourceId) {
  const parts = String(sourceId ?? "").split(":");
  if (parts[0] !== "HoyoWiki") return null;
  return {
    entryPageId: parts[1] ?? null,
    category: parts[2] ?? null,
    title: parts[3] ?? null,
    stat: parts[4] ?? null,
  };
}

const skillLabelByCategory = Object.freeze({
  basicAttack: "일반 공격",
  combatSkill: "전투 스킬",
  ultimate: "필살기",
  talent: "특성",
});

function parseEidolonLevelBonuses(character, category) {
  const skillLabel = skillLabelByCategory[category];
  if (!skillLabel) return [];
  const bonuses = [];
  const pattern = new RegExp(`${skillLabel}\\s*레벨\\s*\\+\\s*(\\d+)\\s*,\\s*최대\\s*Lv\\.?\\s*(\\d+)`, "g");
  for (const eidolon of character?.eidolons ?? []) {
    const text = compactText(eidolon.description);
    for (const match of text.matchAll(pattern)) {
      bonuses.push({
        minEidolon: Number(eidolon.rank),
        levelBonus: Number(match[1]),
        levelCap: Number(match[2]),
        sourceTitle: eidolon.title ?? null,
      });
    }
  }
  return bonuses.sort((a, b) => a.minEidolon - b.minEidolon);
}

function parseAllEidolonLevelBonuses(character) {
  return Object.keys(skillLabelByCategory).flatMap((category) => (
    parseEidolonLevelBonuses(character, category).map((bonus) => ({
      characterEntryPageId: character.entryPageId,
      characterName: character.nameKo,
      skillCategory: category,
      skillLabel: skillLabelByCategory[category],
      ...bonus,
    }))
  ));
}

function classifyGeneratedEffect(effect, resolved, e6) {
  if (effect.skillScaling) {
    if (effect.calculationStatus !== "calculation_ready" || resolved?.calculationStatus === "blocked") {
      if (effect.skillScaling.missingReason === "aggregated_or_stack_value_requires_dynamic_level_formula") {
        return "level_scaled_stack_formula_blocked";
      }
      if (resolved?.valueTrace?.reason === "effective level is outside coefficient table") {
        return "level_scaled_e6_table_too_short";
      }
      return "level_scaled_missing_or_unmatched_table";
    }
    if (e6?.calculationStatus === "blocked") return "level_scaled_e6_table_too_short";
    return "level_scaled_resolved";
  }

  if (effect.valueMode === "skill_level_scaled") return "legacy_skill_level_scaled_raw_needs_skillScaling";
  if (effect.valueMode === "eidolon_adjusted") return "eidolon_adjusted";
  if (effect.valueMode === "fixed") return "fixed";
  if (effect.valueMode === "unknown") return "unknown";

  if (effect.valueMode === "dynamic_formula") {
    if (resolved?.calculationStatus === "calculation_ready") return "dynamic_review_resolved";
    if (resolved?.valueTrace?.resolution === "ui_context_required") return "dynamic_review_ui_context_required";
    if (resolved?.valueTrace?.resolution === "party_context_required") return "dynamic_review_party_context_required";
    if (resolved?.valueTrace?.resolution === "source_stat_context_required") return "dynamic_review_source_stat_context_required";
    if (resolved?.valueTrace?.resolution === "excluded_or_deferred_by_review") return "dynamic_review_excluded_or_off";
    if (resolved?.valueTrace?.resolution === "review_decision_not_automatable") return "dynamic_review_policy_required";

    const haystack = [
      effect.sourceTrace,
      effect.sourceId,
      effect.sourceText,
      effect.valueFormula,
      effect.scalingSource,
      effect.dynamicFormulaType,
    ].map(compactText).join(" ").toLowerCase();

    if (/sourcecombat|sourceatk|targetatk|source-atk|threshold|overcap|breakeffect/.test(haystack)) {
      return "source_stat_or_threshold_formula";
    }
    if (/stack|stacks|스택|중첩|nobility|ashenroast|enemydebuffcount|debuff count/.test(haystack)) {
      return "dynamic_stack_or_condition";
    }
    return "dynamic_formula_unresolved";
  }

  return `other:${effect.valueMode ?? "missing"}`;
}

function toRowAudit(effect, normalized, resolved) {
  const e0 = normalized?.skillScaling ? resolveValue(normalized, { context: { eidolon: 0 } }) : null;
  const e6 = normalized?.skillScaling ? resolveValue(normalized, { context: { eidolon: 6 } }) : null;
  return {
    effectRowId: effect.id,
    characterId: effect.effectProviderId,
    characterName: effect.characterName,
    stat: effect.stat,
    valueMode: effect.valueMode,
    classification: classifyGeneratedEffect(effect, resolved, e6),
    calculationStatus: resolved?.calculationStatus ?? effect.calculationStatus,
    blockedReason: resolved?.blockedReason ?? effect.blockedReason ?? null,
    rawValue: effect.rawValue ?? null,
    rawValuePct: pct(effect.rawValue),
    resolvedValue: resolved?.resolvedValue ?? null,
    resolvedValuePct: pct(resolved?.resolvedValue),
    sourceTrace: effect.sourceTrace ?? null,
    sourceText: compactText(effect.sourceText),
    skillScaling: effect.skillScaling ? {
      skillCategory: effect.skillScaling.skillCategory,
      skillTitle: effect.skillScaling.skillTitle,
      coefficientLabel: effect.skillScaling.coefficientLabel,
      matchType: effect.skillScaling.matchType,
      missingReason: effect.skillScaling.missingReason ?? null,
      baseLevel: effect.skillScaling.baseLevel ?? null,
      hardCap: effect.skillScaling.hardCap ?? null,
      eidolonLevelBonuses: effect.skillScaling.eidolonLevelBonuses ?? [],
      e0EffectiveLevel: e0?.valueTrace?.effectiveLevel ?? null,
      e0ResolvedValue: e0?.resolvedValue ?? null,
      e0ResolvedValuePct: pct(e0?.resolvedValue),
      e6EffectiveLevel: e6?.valueTrace?.effectiveLevel ?? null,
      e6ResolvedValue: e6?.resolvedValue ?? null,
      e6ResolvedValuePct: pct(e6?.resolvedValue),
    } : null,
  };
}

const legacy = readJson("data/legacy-reference/game-db/character-effect-candidates.json");
const skillPayload = readJson("data/legacy-reference/game-db/hoyowiki-character-skills.json");
const effects = readJson("data/generated/effect-rows.json").rows;
const normalized = readJson("data/generated/normalized-effect-rows.json").rows;
const resolved = readJson("data/generated/resolved-effects.json").rows;

const normalizedByEffectRowId = new Map(normalized.map((row) => [row.effectRowId, row]));
const resolvedByEffectRowId = new Map(resolved.map((row) => [row.effectRowId, row]));
const generatedRows = effects.map((effect) => toRowAudit(
  effect,
  normalizedByEffectRowId.get(effect.id),
  resolvedByEffectRowId.get(effect.id),
));

const legacyCharacters = legacy.characters ?? [];
const legacyActiveEffects = legacyCharacters.flatMap((character) => (
  (character.activeEffects ?? []).map((effect) => ({
    characterId: character.id,
    characterName: character.name,
    stat: effect.stat,
    valueMode: effect.valueMode ?? "unknown",
    sourceTrace: effect.sourceTrace ?? effect.sourceId ?? null,
    sourceText: compactText(effect.sourceText),
  }))
));

const eidolonSkillBonuses = (skillPayload.characters ?? []).flatMap(parseAllEidolonLevelBonuses);
const eidolonBonusByCharacter = new Map();
for (const bonus of eidolonSkillBonuses) {
  const list = eidolonBonusByCharacter.get(bonus.characterEntryPageId) ?? [];
  list.push(bonus);
  eidolonBonusByCharacter.set(bonus.characterEntryPageId, list);
}

const e3e5CharactersWithEidolons = (skillPayload.characters ?? [])
  .filter((character) => (character.eidolons ?? []).length > 0)
  .map((character) => ({
    entryPageId: character.entryPageId,
    characterName: character.nameKo,
    parsedBonuses: eidolonBonusByCharacter.get(character.entryPageId) ?? [],
    e3Text: compactText((character.eidolons ?? []).find((item) => Number(item.rank) === 3)?.description),
    e5Text: compactText((character.eidolons ?? []).find((item) => Number(item.rank) === 5)?.description),
  }));

const output = {
  version: 1,
  generatedBy: "tools/audit_all_effect_value_modes.mjs",
  policy: {
    defaultSkillLevels: {
      basicAttack: 6,
      combatSkill: 10,
      ultimate: 10,
      talent: 10,
    },
    eidolonSkillLevelHandling: "E3/E5 descriptions are parsed per character and per affected skill category. E0 and E6 effective levels are audited separately.",
    fixedVsLevelScaledHandling: "Every generated effect row is classified after adapter generation. Rows can be scanned/classified even if their numeric resolver is still blocked.",
  },
  legacy: {
    characterCount: legacy.summary?.characters ?? legacyCharacters.length,
    activeEffectCount: legacy.summary?.activeEffects ?? legacyActiveEffects.length,
    valueModeCounts: countBy(legacyActiveEffects, (row) => row.valueMode),
  },
  generated: {
    effectRowCount: effects.length,
    valueModeCounts: countBy(effects, (row) => row.valueMode),
    classificationCounts: countBy(generatedRows, (row) => row.classification),
    calculationStatusCounts: countBy(generatedRows, (row) => row.calculationStatus),
  },
  eidolonSkillLevelBonuses: {
    characterCountWithEidolons: e3e5CharactersWithEidolons.length,
    parsedBonusCount: eidolonSkillBonuses.length,
    bonusCountsBySkillCategory: countBy(eidolonSkillBonuses, (row) => row.skillCategory),
    charactersMissingParsedE3E5SkillBonus: e3e5CharactersWithEidolons
      .filter((character) => character.parsedBonuses.length === 0)
      .map(({ entryPageId, characterName, e3Text, e5Text }) => ({ entryPageId, characterName, e3Text, e5Text })),
    bonuses: eidolonSkillBonuses,
  },
  rows: generatedRows,
};

writeJson("reports/extraction/all-effect-value-mode-audit.json", output);

const actionRows = generatedRows.filter((row) => (
  row.classification.includes("missing")
  || row.classification.includes("blocked")
  || row.classification.includes("too_short")
  || row.classification.includes("needs")
  || row.classification === "unknown"
  || row.classification === "dynamic_formula_unresolved"
));

const lines = [
  "# All Effect Value Mode Audit",
  "",
  "Generated by `node tools/audit_all_effect_value_modes.mjs`.",
  "",
  "## Scope",
  "",
  `- legacy characters scanned: ${output.legacy.characterCount}`,
  `- legacy active effects scanned: ${output.legacy.activeEffectCount}`,
  `- generated effect rows scanned: ${output.generated.effectRowCount}`,
  "",
  "## Generated Row Classification",
  "",
  ...Object.entries(output.generated.classificationCounts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Generated ValueMode Counts",
  "",
  ...Object.entries(output.generated.valueModeCounts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## E3/E5 Skill Level Bonus Parsing",
  "",
  `- characters with eidolon source rows: ${output.eidolonSkillLevelBonuses.characterCountWithEidolons}`,
  `- parsed skill-level bonus entries: ${output.eidolonSkillLevelBonuses.parsedBonusCount}`,
  ...Object.entries(output.eidolonSkillLevelBonuses.bonusCountsBySkillCategory).map(([key, value]) => `- ${key}: ${value}`),
  `- characters with eidolons but no parsed E3/E5 skill bonus: ${output.eidolonSkillLevelBonuses.charactersMissingParsedE3E5SkillBonus.length}`,
  "",
  "## Skill-Level Rows",
  "",
  ...generatedRows.filter((row) => row.skillScaling || row.classification.startsWith("legacy_skill_level_scaled_raw")).map((row) => (
    row.skillScaling
      ? `- ${row.characterName} (${row.characterId}) / ${row.stat}: ${row.skillScaling.skillCategory} ${row.rawValuePct} -> E0 Lv${row.skillScaling.e0EffectiveLevel} ${row.skillScaling.e0ResolvedValuePct}, E6 Lv${row.skillScaling.e6EffectiveLevel} ${row.skillScaling.e6ResolvedValuePct}; ${row.classification}; ${row.skillScaling.skillTitle} / ${row.skillScaling.coefficientLabel ?? row.skillScaling.missingReason}`
      : `- ${row.characterName} (${row.characterId}) / ${row.stat}: ${row.rawValuePct}; ${row.classification}; source=${row.sourceTrace ?? "n/a"}`
  )),
  "",
  "## Rows Needing Follow-Up",
  "",
  ...actionRows.map((row) => (
    `- ${row.characterName} (${row.characterId}) / ${row.stat}: ${row.classification}; valueMode=${row.valueMode}; reason=${row.blockedReason ?? row.skillScaling?.missingReason ?? "n/a"}; source=${row.sourceTrace ?? "n/a"}`
  )),
  "",
];

fs.writeFileSync("reports/extraction/all-effect-value-mode-audit.md", `${lines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  legacyCharacters: output.legacy.characterCount,
  legacyActiveEffects: output.legacy.activeEffectCount,
  generatedEffectRows: output.generated.effectRowCount,
  classificationCounts: output.generated.classificationCounts,
  parsedEidolonSkillLevelBonuses: output.eidolonSkillLevelBonuses.parsedBonusCount,
  missingParsedE3E5Characters: output.eidolonSkillLevelBonuses.charactersMissingParsedE3E5SkillBonus.length,
  report: "reports/extraction/all-effect-value-mode-audit.md",
}, null, 2));

import fs from "node:fs";
import path from "node:path";

const effects = JSON.parse(fs.readFileSync("data/generated/effect-rows.json", "utf8")).rows;
const status = JSON.parse(fs.readFileSync("data/generated/extraction-status.json", "utf8")).rows;
const hoyowiki = JSON.parse(fs.readFileSync("data/legacy-reference/game-db/hoyowiki-character-skills.json", "utf8"));

const entryById = new Map(hoyowiki.characters.map((character) => [String(character.entryPageId), character]));
const statusByEntry = new Map(status
  .filter((row) => row.identifiers?.hoyowikiEntryPageId)
  .map((row) => [String(row.identifiers.hoyowikiEntryPageId), row]));

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(relativePath), { recursive: true });
  fs.writeFileSync(relativePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeReport(relativePath, lines) {
  fs.mkdirSync(path.dirname(relativePath), { recursive: true });
  fs.writeFileSync(relativePath, `${lines.join("\n")}\n`, "utf8");
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return compactText(value)
    .replace(/coefficient rows?:.*$/i, "")
    .replace(/\/ coefficient r.*$/i, "")
    .replace(/[「」『』[\]().,，:：|•·\s]/g, "")
    .toLowerCase();
}

function parseTrace(sourceTrace) {
  const parts = String(sourceTrace ?? "").split(":");
  if (parts[0] !== "HoyoWiki") return null;
  return {
    entryPageId: parts[1] ?? null,
    key: parts[2] ?? null,
    title: parts[3] ?? null,
  };
}

function findWikiSource(trace) {
  if (!trace?.entryPageId) return null;
  const character = entryById.get(String(trace.entryPageId));
  if (!character) return null;

  if (/^E[1-6]$/.test(trace.key ?? "")) {
    const rank = Number(trace.key.slice(1));
    const eidolon = (character.eidolons ?? []).find((item) => Number(item.rank) === rank || item.title === trace.title);
    return eidolon ? {
      sourceKind: "eidolon",
      sourceKey: trace.key,
      sourceTitle: eidolon.title,
      sourceText: eidolon.description,
      coefficientRows: [],
      character,
    } : null;
  }

  const skills = character.skills ?? [];
  const skill = skills.find((item) => item.pointKey === trace.key)
    ?? skills.find((item) => item.category === trace.key && item.title === trace.title)
    ?? skills.find((item) => item.category === trace.key)
    ?? skills.find((item) => item.title === trace.title);

  return skill ? {
    sourceKind: "skill",
    sourceKey: skill.pointKey,
    sourceCategory: skill.category,
    sourceTitle: skill.title,
    sourceText: skill.description,
    coefficientRows: skill.coefficientRows ?? [],
    character,
  } : null;
}

function inferValueModeFromWiki(wikiSource, row) {
  if (wikiSource?.sourceKind === "eidolon") return "eidolon_adjusted";
  if ((wikiSource?.coefficientRows ?? []).length > 0 && /coefficientRows|level\d+|AS-level/i.test(String(row.sourceTrace ?? ""))) {
    return "skill_level_scaled";
  }
  const normalized = compactText(wikiSource?.sourceText);
  if (/스택|중첩|HP가\s*낮을수록|HP\s*백분율|상태일\s*때|상태에서는|보유\s*시|보유한|턴\s*시작|받을\s*시|랜덤|임의/.test(normalized)) return "dynamic_formula";
  if (/\d+(?:\.\d+)?%\s*\+\s*\d+/.test(normalized)) return "skill_level_scaled";
  if (/\d+(?:\.\d+)?\s*(?:%|pt)/.test(normalized)) return "fixed";
  return "unknown";
}

function inferTargetFromWiki(text) {
  const normalized = compactText(text);
  if (/모든\s*아군|아군\s*전체|모든\s*동료/.test(normalized)) return "allAllies";
  if (/지정된\s*단일\s*아군|단일\s*아군|아군\s*1명/.test(normalized)) return "singleAlly";
  if (/모든\s*적|전체\s*적/.test(normalized)) return "enemyAll";
  if (/지정된\s*단일\s*적|단일\s*적/.test(normalized)) return "enemySingle";
  if (/자신의\s*(?:치명타|공격력|방어력|속도|효과|피해)|자신에게|자신이\s*받는/.test(normalized)) return "self";
  return "unknown";
}

function statEvidence(text, stat) {
  const normalized = compactText(text);
  const evidence = {
    atkRatio: /공격력/,
    hpRatio: /HP|체력/,
    defenseDown: /방어력|방어/,
    critRate: /치명타\s*확률/,
    critDamage: /치명타\s*피해/,
    allDamage: /피해/,
    vulnerability: /받는\s*피해|취약/,
    breakDamage: /격파\s*피해|격파\s*특수효과/,
    speed: /속도/,
    resistancePen: /저항/,
    effectHitRate: /효과\s*명중|기본\s*확률/,
  };
  return evidence[stat]?.test(normalized) ?? true;
}

function compareRow(row) {
  const trace = parseTrace(row.sourceTrace);
  const wikiSource = findWikiSource(trace);
  const statusRow = statusByEntry.get(String(trace?.entryPageId));
  if (!wikiSource) {
    return {
      row,
      trace,
      wikiSource,
      statusRow,
      issues: ["wiki_source_not_found"],
      proposedValueMode: "unknown",
      proposedTarget: "unknown",
    };
  }
  const existingText = normalizeText(row.sourceText);
  const wikiText = normalizeText(wikiSource.sourceText);
  const textMatches = existingText.includes(wikiText) || wikiText.includes(existingText);
  const proposedValueMode = inferValueModeFromWiki(wikiSource, row);
  const proposedTarget = inferTargetFromWiki(wikiSource.sourceText);
  const issues = [];
  if (!textMatches) issues.push("source_text_mismatch");
  if (proposedValueMode !== "unknown" && row.valueMode !== proposedValueMode) issues.push("value_mode_diff");
  if (proposedTarget !== "unknown" && row.targetScope !== proposedTarget) issues.push("target_scope_diff");
  if (!statEvidence(wikiSource.sourceText, row.stat)) issues.push("stat_evidence_weak");
  return { row, trace, wikiSource, statusRow, issues, proposedValueMode, proposedTarget };
}

function hasCoefficientOrLevelEvidence(item) {
  return /coefficientRows|level\d+|AS-level|curated/i.test(String(item.row.sourceTrace ?? ""))
    || (item.wikiSource?.coefficientRows ?? []).some((row) => String(row.label ?? "").includes(item.row.stat));
}

function isLongComposite(item) {
  const text = compactText(item.wikiSource?.sourceText);
  const markers = [
    /동시에/,
    /또한/,
    /추가로/,
    /상태/,
    /스택/,
    /회복/,
    /피해/,
    /증가/,
    /감소/,
  ];
  return text.length > 240 && markers.filter((pattern) => pattern.test(text)).length >= 4;
}

function classifyCorrection(item) {
  const text = compactText(item.wikiSource?.sourceText);
  const existing = item.row;
  const issues = new Set(item.issues);

  if (issues.has("wiki_source_not_found") || issues.has("source_text_mismatch")) {
    return {
      classification: "needs_source_refresh",
      autoFix: false,
      rationale: "sourceTrace/sourceText must be refreshed before changing valueMode or targetScope.",
      proposedPatch: null,
    };
  }

  if (hasCoefficientOrLevelEvidence(item)) {
    return {
      classification: "keep_existing",
      autoFix: false,
      rationale: "Existing row is backed by coefficient or skill-level table evidence; do not downgrade it from parser inference.",
      proposedPatch: null,
    };
  }

  if (isLongComposite(item)) {
    return {
      classification: "needs_parser_fix",
      autoFix: false,
      rationale: "HoyoWiki source text contains multiple effects in one paragraph; parser must split sub-effects before a safe correction.",
      proposedPatch: null,
    };
  }

  if (
    issues.has("target_scope_diff")
    && existing.effectType === "debuff"
    && existing.targetScope === "enemySingle"
    && item.proposedTarget === "enemyAll"
    && /모든\s*적|전체\s*적/.test(text)
  ) {
    return {
      classification: "safe_auto_fix",
      autoFix: true,
      rationale: "HoyoWiki explicitly says all enemies, existing row is a debuff scoped to enemySingle.",
      proposedPatch: { targetScope: "enemyAll", effectTargetPolicy: "enemyAll", calculationSubjectPolicy: "enemyAll" },
    };
  }

  if (
    issues.has("target_scope_diff")
    && existing.effectType === "buff"
    && item.proposedTarget === "self"
    && ["allAllies", "enemySingle", "enemyAll"].includes(existing.targetScope)
    && /자신/.test(text)
  ) {
    return {
      classification: "safe_auto_fix",
      autoFix: true,
      rationale: "HoyoWiki explicitly scopes the buff to self, while existing targetScope points to allies or enemies.",
      proposedPatch: { targetScope: "self", effectTargetPolicy: "self", calculationSubjectPolicy: "self" },
    };
  }

  if (
    issues.has("value_mode_diff")
    && existing.valueMode === "dynamic_formula"
    && item.proposedValueMode === "fixed"
    && !/스택|중첩|상태|보유|HP가\s*낮을수록|랜덤|임의|마다/.test(text)
  ) {
    return {
      classification: "safe_auto_fix",
      autoFix: true,
      rationale: "HoyoWiki source has a condition-free numeric effect; existing valueMode is dynamic_formula.",
      proposedPatch: { valueMode: "fixed" },
    };
  }

  if (
    issues.has("target_scope_diff")
    && ["buff", "triggered_damage"].includes(existing.effectType)
    && ["enemySingle", "enemyAll"].includes(item.proposedTarget)
  ) {
    return {
      classification: "keep_existing",
      autoFix: false,
      rationale: "HoyoWiki proposed target appears to follow the skill damage target, not the buff/effect recipient.",
      proposedPatch: null,
    };
  }

  if (issues.has("stat_evidence_weak") || issues.size > 1) {
    return {
      classification: "manual_review",
      autoFix: false,
      rationale: "Multiple signals differ or stat evidence is weak; human review is needed before correction.",
      proposedPatch: null,
    };
  }

  return {
    classification: "manual_review",
    autoFix: false,
    rationale: "The difference is plausible, but target/valueMode depends on combat context.",
    proposedPatch: null,
  };
}

const existingRows = effects.filter((row) => !row.id.startsWith("effect:hoyowiki-effect:"));
const issueRows = existingRows
  .map(compareRow)
  .filter((item) => item.issues.length > 0)
  .map((item) => ({ ...item, correction: classifyCorrection(item) }));

const classificationCounts = issueRows.reduce((counts, item) => {
  counts[item.correction.classification] = (counts[item.correction.classification] ?? 0) + 1;
  return counts;
}, {});

const issueCounts = issueRows.reduce((counts, item) => {
  for (const issue of item.issues) counts[issue] = (counts[issue] ?? 0) + 1;
  return counts;
}, {});

const rows = issueRows.map((item) => ({
  rowId: item.row.id,
  characterId: item.statusRow?.characterId ?? item.row.effectProviderId,
  displayName: item.statusRow?.displayName ?? item.row.characterName ?? item.row.effectProviderId,
  sourceTrace: item.row.sourceTrace,
  issues: item.issues,
  classification: item.correction.classification,
  autoFix: item.correction.autoFix,
  rationale: item.correction.rationale,
  existing: {
    effectType: item.row.effectType,
    stat: item.row.stat,
    valueMode: item.row.valueMode,
    targetScope: item.row.targetScope,
    sourceText: item.row.sourceText,
  },
  hoyowiki: {
    sourceKind: item.wikiSource?.sourceKind ?? "not_found",
    sourceKey: item.wikiSource?.sourceKey ?? "not_found",
    sourceTitle: item.wikiSource?.sourceTitle ?? "not_found",
    proposedValueMode: item.proposedValueMode,
    proposedTargetScope: item.proposedTarget,
    sourceText: item.wikiSource?.sourceText ?? null,
  },
  proposedPatch: item.correction.proposedPatch,
}));

const output = {
  version: 1,
  generatedBy: "tools/build_effect_row_correction_plan.mjs",
  inputReport: "reports/extraction/existing-effects-vs-hoyowiki-review.md",
  issueRows: rows.length,
  classificationCounts,
  issueCounts,
  rows,
};

writeJson("reports/extraction/effect-row-correction-plan.json", output);
writeReport("reports/extraction/effect-row-correction-plan.md", [
  "# Effect Row Correction Plan",
  "",
  "Generated by `node tools/build_effect_row_correction_plan.mjs`.",
  "",
  "This is a patch plan only. It does not edit generated JSON and does not blindly trust HoyoWiki proposed values.",
  "",
  "## Summary",
  "",
  `- issueRows: ${rows.length}`,
  `- safe_auto_fix: ${classificationCounts.safe_auto_fix ?? 0}`,
  `- keep_existing: ${classificationCounts.keep_existing ?? 0}`,
  `- needs_parser_fix: ${classificationCounts.needs_parser_fix ?? 0}`,
  `- needs_source_refresh: ${classificationCounts.needs_source_refresh ?? 0}`,
  `- manual_review: ${classificationCounts.manual_review ?? 0}`,
  "",
  "## Issue Types",
  "",
  ...Object.entries(issueCounts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Safe Auto Fix Candidates",
  "",
  ...rows.filter((row) => row.classification === "safe_auto_fix").flatMap((row) => [
    `### ${row.displayName} - ${row.rowId}`,
    "",
    `- sourceTrace: ${row.sourceTrace}`,
    `- issues: ${row.issues.join(", ")}`,
    `- rationale: ${row.rationale}`,
    `- existing: valueMode=${row.existing.valueMode}, targetScope=${row.existing.targetScope}, stat=${row.existing.stat}`,
    `- hoyowiki: proposedValueMode=${row.hoyowiki.proposedValueMode}, proposedTargetScope=${row.hoyowiki.proposedTargetScope}`,
    `- proposedPatch: ${JSON.stringify(row.proposedPatch)}`,
    `- sourceText: ${compactText(row.hoyowiki.sourceText)}`,
    "",
  ]),
  "## Deferred Rows",
  "",
  ...rows.filter((row) => row.classification !== "safe_auto_fix").flatMap((row) => [
    `### ${row.displayName} - ${row.rowId}`,
    "",
    `- classification: ${row.classification}`,
    `- sourceTrace: ${row.sourceTrace}`,
    `- issues: ${row.issues.join(", ")}`,
    `- rationale: ${row.rationale}`,
    `- existing: valueMode=${row.existing.valueMode}, targetScope=${row.existing.targetScope}, stat=${row.existing.stat}`,
    `- hoyowiki: sourceKind=${row.hoyowiki.sourceKind}, proposedValueMode=${row.hoyowiki.proposedValueMode}, proposedTargetScope=${row.hoyowiki.proposedTargetScope}`,
    `- sourceText: ${compactText(row.hoyowiki.sourceText) || "not_found"}`,
    "",
  ]),
]);

console.log(JSON.stringify({
  issueRows: rows.length,
  classificationCounts,
  issueCounts,
}, null, 2));

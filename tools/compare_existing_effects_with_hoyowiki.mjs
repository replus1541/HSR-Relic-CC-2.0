import fs from "node:fs";
import path from "node:path";

const effects = JSON.parse(fs.readFileSync("data/generated/effect-rows.json", "utf8")).rows;
const status = JSON.parse(fs.readFileSync("data/generated/extraction-status.json", "utf8")).rows;
const hoyowiki = JSON.parse(fs.readFileSync("data/legacy-reference/game-db/hoyowiki-character-skills.json", "utf8"));

const entryById = new Map(hoyowiki.characters.map((character) => [String(character.entryPageId), character]));
const statusByEntry = new Map(status
  .filter((row) => row.identifiers?.hoyowikiEntryPageId)
  .map((row) => [String(row.identifiers.hoyowikiEntryPageId), row]));

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
    rawParts: parts,
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
  const text = wikiSource?.sourceText ?? "";
  const normalized = compactText(text);
  if (/스택|중첩|HP가\s*낮을수록|HP\s*백분율|상태일 때|상태에서는|보유 시|보유한|턴 시작|받을 시|랜덤|임의/.test(normalized)) return "dynamic_formula";
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

function classifyComparison(row, wikiSource) {
  if (!wikiSource) return {
    ok: false,
    issueType: "wiki_source_not_found",
    reason: "sourceTrace points to HoyoWiki, but matching skill/eidolon text was not found in the current snapshot.",
  };

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

  return {
    ok: issues.length === 0,
    issueType: issues.join(", ") || "matched",
    proposedValueMode,
    proposedTarget,
    reason: issues.length
      ? "Existing parsed row differs from the current HoyoWiki source text or source-derived policy inference."
      : "Existing parsed row matches the current HoyoWiki source text at this review level.",
  };
}

const existingRows = effects.filter((row) => !row.id.startsWith("effect:hoyowiki-effect:"));
const comparisons = existingRows.map((row) => {
  const trace = parseTrace(row.sourceTrace);
  const wikiSource = findWikiSource(trace);
  const result = classifyComparison(row, wikiSource);
  const statusRow = statusByEntry.get(String(trace?.entryPageId));
  return {
    row,
    trace,
    wikiSource,
    statusRow,
    ...result,
  };
});

const issueRows = comparisons.filter((item) => !item.ok);
const issueCounts = issueRows.reduce((counts, item) => {
  for (const issue of item.issueType.split(", ").filter(Boolean)) counts[issue] = (counts[issue] ?? 0) + 1;
  return counts;
}, {});

writeReport("reports/extraction/existing-effects-vs-hoyowiki-review.md", [
  "# Existing Effects vs HoyoWiki Review",
  "",
  "Generated by `node tools/compare_existing_effects_with_hoyowiki.mjs`.",
  "",
  "Scope: existing generated effect rows only. Rows with `effect:hoyowiki-effect:*` are excluded because those are the 66 supplemental rows currently under separate parsing review.",
  "",
  "This report does not change generated JSON. It lists rows where existing parsed data differs from the current HoyoWiki source text or source-derived policy inference.",
  "",
  "## Summary",
  "",
  `- existingRowsReviewed: ${existingRows.length}`,
  `- issueRows: ${issueRows.length}`,
  ...Object.entries(issueCounts).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Rows To Review",
  "",
  ...issueRows.flatMap((item) => [
    `### ${item.statusRow?.displayName ?? item.row.characterName ?? item.row.effectProviderId} - ${item.row.id}`,
    "",
    `- characterId: ${item.statusRow?.characterId ?? item.row.effectProviderId}`,
    `- sourceTrace: ${item.row.sourceTrace ?? "missing"}`,
    `- issueType: ${item.issueType}`,
    `- reason: ${item.reason}`,
    "- existingParsedInfo:",
    `  - effectType: ${item.row.effectType ?? "missing"}`,
    `  - stat: ${item.row.stat ?? "missing"}`,
    `  - valueMode: ${item.row.valueMode ?? "missing"}`,
    `  - targetScope: ${item.row.targetScope ?? item.row.effectTargetPolicy ?? "missing"}`,
    `  - sourceText: ${compactText(item.row.sourceText)}`,
    "- hoyowikiCurrentSource:",
    `  - sourceKind: ${item.wikiSource?.sourceKind ?? "not_found"}`,
    `  - sourceKey: ${item.wikiSource?.sourceKey ?? "not_found"}`,
    `  - sourceTitle: ${item.wikiSource?.sourceTitle ?? "not_found"}`,
    `  - proposedValueModeFromWiki: ${item.proposedValueMode ?? "unknown"}`,
    `  - proposedTargetFromWiki: ${item.proposedTarget ?? "unknown"}`,
    `  - sourceText: ${compactText(item.wikiSource?.sourceText) || "not_found"}`,
    "- candidateChange:",
    item.issueType.includes("wiki_source_not_found")
      ? "  - Re-check sourceTrace entry/key mapping before trusting this existing row."
      : item.issueType.includes("source_text_mismatch")
        ? "  - Compare old parsed sourceText with current HoyoWiki text and decide whether to refresh or preserve as legacy snapshot."
        : "  - Review parsed valueMode/target/stat against HoyoWiki current source before changing calculation behavior.",
    "",
  ]),
]);

console.log(JSON.stringify({
  existingRowsReviewed: existingRows.length,
  issueRows: issueRows.length,
  issueCounts,
}, null, 2));

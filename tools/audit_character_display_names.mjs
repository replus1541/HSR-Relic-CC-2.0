import fs from "node:fs";
import path from "node:path";

const v2Root = process.cwd();
const legacyRoot = "C:\\CODEX\\HSR RELIC CC";
const reportPath = "reports/extraction/character-display-name-audit.md";
const jsonPath = "reports/extraction/character-display-name-audit.json";

function readJson(relativePath, root = v2Root) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath, root = v2Root) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeLookup(value) {
  return normalizeName(value)
    .replace(/\s+/g, "")
    .replace(/[.·•ㆍ・&]/g, "")
    .toLowerCase();
}

function parseLegacyAliasMap() {
  const source = readText("src/sample-data.js", legacyRoot);
  const match = source.match(/const localCharacterNameAliases = \{([\s\S]*?)\n\};/);
  if (!match) return {};
  const aliases = {};
  const linePattern = /"([^"]+)":\s*"([^"]+)"/g;
  let lineMatch;
  while ((lineMatch = linePattern.exec(match[1]))) {
    aliases[normalizeName(lineMatch[1])] = normalizeName(lineMatch[2]);
  }
  return aliases;
}

function pushIndex(index, key, value) {
  if (!key) return;
  const normalized = normalizeLookup(key);
  const list = index.get(normalized) ?? [];
  list.push(value);
  index.set(normalized, list);
}

function createSourceIndexes() {
  const legacyAliases = parseLegacyAliasMap();
  const officialByAlias = Object.fromEntries(Object.entries(legacyAliases).map(([officialName, aliasName]) => [aliasName, officialName]));
  const exactAliasNames = new Set(Object.values(legacyAliases).map(normalizeName));
  const hoyowikiSkills = readJson("data/legacy-reference/game-db/hoyowiki-character-skills.json");
  const effectCandidates = readJson("data/legacy-reference/game-db/character-effect-candidates.json");
  const coefficientCandidates = readJson("data/legacy-reference/game-db/attack-coefficient-candidates.json");
  const legacyCharacterDb = readJson("data/game-db/character-db-prep.json", legacyRoot);
  const legacySkillDb = readJson("data/game-db/character-skill-db.json", legacyRoot);

  const officialIndex = new Map();
  const aliasIndex = new Map();

  for (const [officialName, aliasName] of Object.entries(legacyAliases)) {
    pushIndex(aliasIndex, aliasName, {
      officialName,
      aliasName,
      sourcePath: "C:\\CODEX\\HSR RELIC CC\\src\\sample-data.js",
      sourceOrigin: "legacy_alias_map",
    });
  }

  for (const character of hoyowikiSkills.characters ?? []) {
    pushIndex(officialIndex, character.nameKo, {
      officialName: normalizeName(character.nameKo),
      sourcePath: "data/legacy-reference/game-db/hoyowiki-character-skills.json",
      sourceOrigin: "hoyowiki",
      internalId: character.entryPageId ?? null,
    });
  }

  for (const character of effectCandidates.characters ?? []) {
    pushIndex(officialIndex, character.name, {
      officialName: normalizeName(character.name),
      sourcePath: "data/legacy-reference/game-db/character-effect-candidates.json",
      sourceOrigin: "game_db_generated",
      internalName: character.avatar ?? null,
    });
  }

  for (const character of coefficientCandidates.characters ?? []) {
    pushIndex(officialIndex, character.localName ?? character.nameKo, {
      officialName: normalizeName(character.localName ?? character.nameKo),
      sourcePath: "data/legacy-reference/game-db/attack-coefficient-candidates.json",
      sourceOrigin: "game_db_generated",
      internalName: character.avatar ?? null,
      internalId: character.avatarId ?? null,
    });
  }

  for (const character of legacyCharacterDb.avatars ?? []) {
    pushIndex(officialIndex, character.nameKo, {
      officialName: normalizeName(character.nameKo),
      sourcePath: "C:\\CODEX\\HSR RELIC CC\\data\\game-db\\character-db-prep.json",
      sourceOrigin: "design_data_extracted_catalog",
      internalName: character.avatar ?? null,
      internalId: character.avatarId ?? null,
      localizationSourcePath: character.configPath ?? null,
    });
  }

  for (const character of legacySkillDb.characters ?? []) {
    pushIndex(officialIndex, character.nameKo, {
      officialName: normalizeName(character.nameKo),
      sourcePath: "C:\\CODEX\\HSR RELIC CC\\data\\game-db\\character-skill-db.json",
      sourceOrigin: "design_data_extracted_catalog",
      internalName: character.avatar ?? null,
      internalId: character.avatarId ?? null,
      localizationSourcePath: character.configPath ?? null,
    });
  }

  return { legacyAliases, officialByAlias, exactAliasNames, officialIndex, aliasIndex };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function classifyRow(row, indexes) {
  const displayName = normalizeName(row.displayName ?? row.characterId);
  const normalizedDisplay = normalizeLookup(displayName);
  const officialMatches = indexes.officialIndex.get(normalizedDisplay) ?? [];
  const aliasMatches = indexes.aliasIndex.get(normalizedDisplay) ?? [];
  const exactAliasMatch = indexes.exactAliasNames.has(displayName);
  const identifierValues = Object.values(row.identifiers ?? {}).filter(Boolean).map(normalizeName);
  const sourceNames = unique([
    row.identifiers?.effectName,
    row.displayName,
    row.characterId,
    ...identifierValues,
  ].map(normalizeName));

  const issues = [];
  if (exactAliasMatch) issues.push("alias_used_as_displayName");
  else if (aliasMatches.length) issues.push("alias_normalized_collision");
  if (!officialMatches.length) issues.push("displayName_without_official_source_match");
  if (/[A-Za-z]/.test(displayName) && /[\uAC00-\uD7AF]/.test(displayName)) issues.push("mixed_english_korean_displayName");
  if (/[A-Za-z]+_[A-Za-z0-9_]+/.test(displayName)) issues.push("internal_name_exposed");
  if (/LV\.?\s*\d+/i.test(displayName)) issues.push("level_or_placeholder_suffix_in_displayName");
  if (displayName !== normalizeName(row.characterId)) issues.push("route_characterId_displayName_mismatch");
  if (row.sourceAvailability?.skillText === false && row.sourceAvailability?.effectTrace === false && row.sourceAvailability?.coefficient === false) {
    issues.push("placeholder_like_character_row");
  }
  if (!row.localizationSourcePath && !row.isDisplayNameSourceBacked) issues.push("missing_display_name_source_metadata");

  const officialNames = unique(officialMatches.map((item) => item.officialName));
  const aliasTargets = exactAliasMatch ? unique(aliasMatches.map((item) => item.officialName)) : [];
  const sourceOrigins = unique(officialMatches.map((item) => item.sourceOrigin));
  const localizationSources = unique(officialMatches.map((item) => item.localizationSourcePath ?? item.sourcePath));

  if (officialNames.length > 1) issues.push("official_source_name_collision");
  if (exactAliasMatch && aliasTargets.length && !officialNames.includes(aliasTargets[0])) issues.push("alias_official_target_mismatch");

  return {
    characterId: row.characterId,
    displayName,
    sourceNames,
    identifiers: row.identifiers ?? {},
    officialNames,
    aliasTargets,
    sourceOrigins,
    localizationSources,
    isDisplayNameSourceBacked: officialMatches.length > 0 && aliasMatches.length === 0,
    nameReviewStatus: issues.length ? "needs_review" : "source_backed",
    issues,
  };
}

function severityFor(issue) {
  if (["alias_used_as_displayName", "internal_name_exposed", "placeholder_like_character_row"].includes(issue)) return "high";
  if (["displayName_without_official_source_match", "official_source_name_collision", "alias_official_target_mismatch"].includes(issue)) return "medium";
  return "low";
}

function createReport(auditRows, indexes) {
  const issueRows = auditRows.filter((row) => row.issues.length);
  const issueCounts = issueRows.reduce((counts, row) => {
    for (const issue of row.issues) counts[issue] = (counts[issue] ?? 0) + 1;
    return counts;
  }, {});
  const highRows = issueRows.filter((row) => row.issues.some((issue) => severityFor(issue) === "high"));
  const mediumRows = issueRows.filter((row) => !highRows.includes(row) && row.issues.some((issue) => severityFor(issue) === "medium"));

  const lines = [
    "# Character Display Name Audit",
    "",
    "Generated by `node tools/audit_character_display_names.mjs`.",
    "",
    "## Scope",
    "",
    "- v2 project files inspected: `data/generated/extraction-canonical-dataset.json`, `data/generated/extraction-status.json`, `data/generated/source-rows.json`, `data/legacy-reference/**`, `src/adapters/**`, `src/extraction/**`, `src/data-model/schemas/**`.",
    "- legacy project files inspected read-only: `data/game-db/character-db-prep.json`, `data/game-db/character-skill-db.json`, `data/game-db/hoyowiki-character-skills.json`, `data/game-db/hoyowiki-character-base-stats.json`, `src/sample-data.js`, `src/extraction/extraction-builders.js`, `docs/localization-key-probe.md`.",
    "- Existing project was not modified.",
    "",
    "## Summary",
    "",
    `- audited rows: ${auditRows.length}`,
    `- rows needing review: ${issueRows.length}`,
    `- high priority rows: ${highRows.length}`,
    `- medium priority rows: ${mediumRows.length}`,
    `- legacy alias mappings found: ${Object.keys(indexes.legacyAliases).length}`,
    "",
    "## Issue Counts",
    "",
    ...(Object.keys(issueCounts).length ? Object.entries(issueCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([issue, count]) => `- ${issue}: ${count}`) : ["- none"]),
    "",
    "## High Priority Findings",
    "",
    "| displayName | characterId | issues | official/target | source evidence |",
    "| --- | --- | --- | --- | --- |",
    ...highRows.map((row) => `| ${row.displayName} | ${row.characterId} | ${row.issues.join(", ")} | ${unique([...row.officialNames, ...row.aliasTargets]).join(", ") || "none"} | ${row.localizationSources.slice(0, 2).join("<br>") || "none"} |`),
    "",
    "## Medium/Low Findings",
    "",
    "| displayName | characterId | issues | official matches |",
    "| --- | --- | --- | --- |",
    ...issueRows.filter((row) => !highRows.includes(row)).map((row) => `| ${row.displayName} | ${row.characterId} | ${row.issues.join(", ")} | ${row.officialNames.join(", ") || "none"} |`),
    "",
    "## Current v2 Problem",
    "",
    "- `tools/validate_canonical_dataset.mjs` currently creates coverage rows with `ensureCoverageCharacter(displayName)` and uses raw `character.name`, HoyoWiki `nameKo`, or coefficient `localName` as both `characterKey` and `displayName`.",
    "- `data/generated/extraction-status.json` does not contain `officialName`, `localizedName`, `aliasNames`, `localizationSourcePath`, `isDisplayNameSourceBacked`, or `nameReviewStatus`.",
    "- `/extraction` links to `/extraction/:characterId` with `row.characterId`, but `characterId` is currently the display string, not a stable identity key.",
    "",
    "## Source Priority Recommendation",
    "",
    "1. Official localization source.",
    "2. HoyoWiki official character name.",
    "3. DesignData localization text.",
    "4. Verified displayName from legacy generated character catalog.",
    "5. curated_source name mapping.",
    "",
    "Do not promote arbitrary translations, aliases, community nicknames, internal keys, placeholder ids, sourcePath-less names, or manual_hint names to `displayName`. Keep aliases only in `aliasNames` for lookup/search.",
    "",
    "## Character Identity Row Recommendation",
    "",
    "A dedicated character identity row is needed before the next UI/data expansion. Suggested shape:",
    "",
    "```js",
    "{",
    "  characterId,",
    "  internalId,",
    "  internalName,",
    "  officialName,",
    "  localizedName,",
    "  displayName,",
    "  aliasNames,",
    "  element,",
    "  path,",
    "  iconPath,",
    "  sourceOrigin,",
    "  sourcePath,",
    "  sourceText,",
    "  localizationSourcePath,",
    "  nameReviewStatus,",
    "  isDisplayNameSourceBacked",
    "}",
    "```",
    "",
    "## Required Follow-up",
    "",
    "- Build `data/generated/character-identity.json` or equivalent before regenerating extraction coverage.",
    "- Make `/extraction` use `displayName` only from identity rows; route with stable `characterId` or `internalName`.",
    "- Store aliases such as `삼칠이`, `검칠이`, `음월`, `완매`, `블랙스완`, `파멸척자`, `보존척자`, `화척자` only in `aliasNames`.",
    "- Add a validator that fails when `displayName` has no source-backed official/localization evidence.",
  ];

  return { lines, issueCounts, highRows, mediumRows };
}

const extractionStatus = readJson("data/generated/extraction-status.json");
const indexes = createSourceIndexes();
const auditRows = (extractionStatus.rows ?? []).map((row) => classifyRow(row, indexes));
const report = createReport(auditRows, indexes);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${report.lines.join("\n")}\n`, "utf8");
fs.writeFileSync(jsonPath, `${JSON.stringify({
  version: 1,
  generatedBy: "tools/audit_character_display_names.mjs",
  summary: {
    auditedRows: auditRows.length,
    rowsNeedingReview: auditRows.filter((row) => row.issues.length).length,
    issueCounts: report.issueCounts,
  },
  rows: auditRows,
}, null, 2)}\n`, "utf8");

console.log(`character display name audit ok: rows=${auditRows.length}, needsReview=${auditRows.filter((row) => row.issues.length).length}, highPriority=${report.highRows.length}`);

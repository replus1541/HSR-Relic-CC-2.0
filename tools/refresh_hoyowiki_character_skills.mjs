import fs from "node:fs";

const snapshotPath = "data/legacy-reference/game-db/hoyowiki-character-skills.json";
const originalSnapshotPath = "C:/CODEX/HSR RELIC CC/data/game-db/hoyowiki-character-skills.json";
const reportPath = "reports/extraction/hoyowiki-character-skills-refresh-report.md";
const listUrl = "https://sg-act-public-api.hoyolab.com/hoyowiki/hsr/wapi/get_entry_page_list";
const pageUrl = "https://sg-wiki-api.hoyolab.com/hoyowiki/hsr/wapi/entry_page";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTableRows(html) {
  return [...String(html ?? "").matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((rowMatch) => (
    [...rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cellMatch) => stripHtml(cellMatch[1]))
  ));
}

function parseScalars(cell) {
  const text = compactText(cell).replace(/,/g, "");
  const percentMatches = [...text.matchAll(/(-?\d+(?:\.\d+)?)\s*%/g)].map((match) => Number(match[1]) / 100);
  if (percentMatches.length) return percentMatches;
  const ptMatches = [...text.matchAll(/(-?\d+(?:\.\d+)?)\s*pt/gi)].map((match) => Number(match[1]));
  if (ptMatches.length) return ptMatches;
  const numberMatch = text.match(/^(-?\d+(?:\.\d+)?)$/);
  if (numberMatch) return [Number(numberMatch[1])];
  return [];
}

function parseCoefficientRows(form) {
  const tableRows = parseTableRows(form);
  if (tableRows.length < 2) return [];
  const header = tableRows[0] ?? [];
  const levelStart = header.findIndex((cell) => /레벨\s*\d+/.test(cell));
  if (levelStart < 1) return [];
  const levelCount = header.slice(levelStart).filter((cell) => /레벨\s*\d+/.test(cell)).length;
  if (levelCount === 0) return [];
  const labelIndex = levelStart - 1;

  const rows = [];
  for (const row of tableRows.slice(1)) {
    const rowLabelIndex = row.length === levelCount + 1 ? 0 : labelIndex;
    const rowLevelStart = row.length === levelCount + 1 ? 1 : levelStart;
    const label = compactText(row[rowLabelIndex]);
    if (!label || /승급\s*재료|재료/.test(label)) continue;
    const cells = row.slice(rowLevelStart, rowLevelStart + levelCount);
    if (cells.length !== levelCount) continue;
    const valuesByCell = cells.map(parseScalars);
    if (valuesByCell.some((values) => values.length === 0)) continue;
    const valueWidth = Math.max(...valuesByCell.map((values) => values.length));
    for (let valueIndex = 0; valueIndex < valueWidth; valueIndex += 1) {
      const values = valuesByCell.map((values) => values[valueIndex] ?? values[0]);
      if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) continue;
      rows.push({ label: valueWidth > 1 ? `${label} #${valueIndex + 1}` : label, values });
    }
  }
  return rows;
}

function firstCoefficientValues(rows) {
  return rows[0]?.values ?? [];
}

function normalizeFilterValue(filterValues, key) {
  const values = filterValues?.[key]?.value_types ?? [];
  return values[0]?.enum_string || values[0]?.value || filterValues?.[key]?.values?.[0] || "";
}

function parseJsonData(component) {
  if (!component?.data) return null;
  try {
    return JSON.parse(component.data);
  } catch {
    return null;
  }
}

function findTrace(page) {
  const component = (page.modules ?? [])
    .flatMap((module) => module.components ?? [])
    .find((item) => item.component_id === "trace");
  return parseJsonData(component);
}

function findEidolonComponent(page) {
  return (page.modules ?? [])
    .flatMap((module) => module.components ?? [])
    .find((item) => /eidolon|rank|constellation/i.test(item.component_id ?? "") || /성혼/.test(item.component_id ?? ""));
}

function parseEidolons(page, existingCharacter) {
  const component = findEidolonComponent(page);
  const parsed = parseJsonData(component);
  const candidates = parsed?.list ?? parsed?.items ?? parsed?.ranks ?? [];
  if (!Array.isArray(candidates) || candidates.length === 0) return existingCharacter?.eidolons ?? [];
  return candidates.map((item, index) => ({
    rank: Number(item.rank ?? item.key ?? index + 1),
    id: item.id ?? null,
    title: stripHtml(item.name ?? item.title ?? item.key ?? ""),
    description: stripHtml(item.desc ?? item.description ?? item.content ?? ""),
    iconUrl: item.icon ?? item.icon_url ?? item.img ?? null,
    extraLevels: item.extraLevels ?? null,
  })).filter((item) => item.title || item.description);
}

function inferCategory(point) {
  const text = `${stripHtml(point?.title ?? "")} ${stripHtml(point?.desc ?? "")}`;
  if (/<일반\s*공격>|일반\s*공격/.test(text)) return "basicAttack";
  if (/<전투\s*스킬>|전투\s*스킬/.test(text)) return "combatSkill";
  if (/<필살기>|필살기/.test(text)) return "ultimate";
  if (/<특성>|특성/.test(text)) return "talent";
  if (/<비술>|비술/.test(text)) return "technique";
  return "unknown";
}

function looksLikeSkillPoint(point) {
  const text = `${stripHtml(point?.title ?? "")} ${stripHtml(point?.desc ?? "")}`;
  return /<일반\s*공격>|<전투\s*스킬>|<필살기>|<특성>|<비술>|일반\s*공격|전투\s*스킬|필살기|특성|비술|기억\s*정령\s*스킬|기억\s*정령\s*특성/.test(text);
}

function mergeSkill(existingSkill, pointKey, point) {
  const parsedRows = parseCoefficientRows(point.form);
  const coefficientRows = [...parsedRows];
  const parsedLabels = new Set(parsedRows.map((row) => row.label));
  for (const row of existingSkill?.coefficientRows ?? []) {
    if (parsedLabels.has(row.label)) continue;
    coefficientRows.push(row);
  }
  return {
    pointKey,
    title: stripHtml(point.title ?? existingSkill?.title ?? ""),
    category: existingSkill?.category ?? inferCategory(point),
    targetProfile: existingSkill?.targetProfile ?? null,
    coefficients: firstCoefficientValues(coefficientRows),
    coefficientRows,
    description: stripHtml(point.desc ?? existingSkill?.description ?? ""),
    iconUrl: point.icon ?? existingSkill?.iconUrl ?? null,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-rpc-language": "ko-kr",
      "x-rpc-wiki_app": "hsr",
      "user-agent": "Mozilla/5.0",
      referer: "https://wiki.hoyolab.com/",
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const payload = await response.json();
  if (payload.retcode !== 0) throw new Error(`${payload.retcode} ${payload.message}: ${url}`);
  return payload;
}

async function fetchCharacterList() {
  const rows = [];
  const pageSize = 20;
  for (let pageNum = 1; pageNum <= 20; pageNum += 1) {
    const payload = await fetchJson(listUrl, {
      method: "POST",
      body: JSON.stringify({
        menu_id: "104",
        page_num: pageNum,
        page_size: pageSize,
        filters: [],
        lang: "ko-kr",
      }),
    });
    const list = payload.data?.list ?? [];
    rows.push(...list);
    const total = Number(payload.data?.total ?? rows.length);
    if (rows.length >= total || list.length === 0) break;
  }
  return rows;
}

async function fetchPage(entryPageId) {
  const payload = await fetchJson(`${pageUrl}?entry_page_id=${encodeURIComponent(entryPageId)}&lang=ko-kr`);
  return payload.data.page;
}

const snapshot = readJson(fs.existsSync(originalSnapshotPath) ? originalSnapshotPath : snapshotPath);
const existingByEntryId = new Map((snapshot.characters ?? []).map((character) => [String(character.entryPageId), character]));
const existingByName = new Map((snapshot.characters ?? []).map((character) => [character.nameKo, character]));
const list = await fetchCharacterList();
const refreshedCharacters = [];
const reportRows = [];

for (const entry of list) {
  const page = await fetchPage(entry.entry_page_id);
  const existing = existingByEntryId.get(String(entry.entry_page_id)) ?? existingByName.get(entry.name) ?? null;
  const trace = findTrace(page);
  const existingSkillByPoint = new Map((existing?.skills ?? []).map((skill) => [String(skill.pointKey), skill]));
  const existingSkillByTitle = new Map((existing?.skills ?? []).map((skill) => [skill.title, skill]));
  const skills = [];
  if (existing?.skills?.length) {
    for (const existingSkill of existing.skills) {
      const point = trace?.points?.[existingSkill.pointKey]
        ?? Object.values(trace?.points ?? {}).find((candidate) => stripHtml(candidate?.title ?? "") === existingSkill.title)
        ?? null;
      skills.push(point ? mergeSkill(existingSkill, existingSkill.pointKey, point) : existingSkill);
    }
  } else {
    for (const [pointKey, point] of Object.entries(trace?.points ?? {})) {
      if (!pointKey || pointKey === "") continue;
      const title = stripHtml(point.title ?? "");
      if (!title && !point.desc && !point.form) continue;
      if (!looksLikeSkillPoint(point)) continue;
      const existingSkill = existingSkillByPoint.get(String(pointKey)) ?? existingSkillByTitle.get(title) ?? null;
      skills.push(mergeSkill(existingSkill, pointKey, point));
    }
  }

  const character = {
    entryPageId: String(entry.entry_page_id),
    nameKo: entry.name,
    path: normalizeFilterValue(entry.filter_values, "character_paths") || existing?.path || "",
    element: normalizeFilterValue(entry.filter_values, "character_combat_type") || existing?.element || "",
    iconUrl: entry.icon_url ?? page.icon_url ?? existing?.iconUrl ?? null,
    skills,
    eidolons: parseEidolons(page, existing),
  };
  refreshedCharacters.push(character);

  const oldRows = (existing?.skills ?? []).reduce((sum, skill) => sum + (skill.coefficientRows?.length ?? 0), 0);
  const newRows = skills.reduce((sum, skill) => sum + (skill.coefficientRows?.length ?? 0), 0);
  const zeroForms = skills.filter((skill) => /<table/i.test(trace?.points?.[skill.pointKey]?.form ?? "") && skill.coefficientRows.length === 0);
  reportRows.push({
    entryPageId: character.entryPageId,
    nameKo: character.nameKo,
    skills: skills.length,
    oldCoefficientRows: oldRows,
    newCoefficientRows: newRows,
    tableParseFailures: zeroForms.map((skill) => `${skill.pointKey}:${skill.title}`),
  });
}

const output = {
  ...snapshot,
  generatedAt: new Date().toISOString(),
  source: {
    ...(snapshot.source ?? {}),
    refreshedFromLiveHoyoWiki: true,
  },
  summary: {
    characters: refreshedCharacters.length,
    skillPoints: refreshedCharacters.reduce((sum, character) => sum + character.skills.length, 0),
    targetProfiles: refreshedCharacters.reduce((sum, character) => sum + character.skills.filter((skill) => skill.targetProfile).length, 0),
    coefficientMentions: refreshedCharacters.reduce((sum, character) => sum + character.skills.reduce((inner, skill) => inner + (skill.coefficientRows ?? []).reduce((rowSum, row) => rowSum + row.values.length, 0), 0), 0),
    coefficientRows: refreshedCharacters.reduce((sum, character) => sum + character.skills.reduce((inner, skill) => inner + (skill.coefficientRows?.length ?? 0), 0), 0),
    eidolons: refreshedCharacters.reduce((sum, character) => sum + (character.eidolons?.length ?? 0), 0),
  },
  characters: refreshedCharacters,
};

writeJson(snapshotPath, output);

const failures = reportRows.filter((row) => row.tableParseFailures.length > 0);
const oldTotal = reportRows.reduce((sum, row) => sum + row.oldCoefficientRows, 0);
const newTotal = reportRows.reduce((sum, row) => sum + row.newCoefficientRows, 0);
const lines = [
  "# HoyoWiki Character Skills Refresh Report",
  "",
  "Generated by `node tools/refresh_hoyowiki_character_skills.mjs`.",
  "",
  "## Summary",
  "",
  `- characters fetched: ${refreshedCharacters.length}`,
  `- skill points parsed: ${output.summary.skillPoints}`,
  `- coefficient rows before refresh: ${oldTotal}`,
  `- coefficient rows after refresh: ${newTotal}`,
  `- table parse failure skills: ${failures.reduce((sum, row) => sum + row.tableParseFailures.length, 0)}`,
  "",
  "## Per Character",
  "",
  ...reportRows.map((row) => `- ${row.nameKo} (${row.entryPageId}): skills=${row.skills}, coefficientRows ${row.oldCoefficientRows} -> ${row.newCoefficientRows}${row.tableParseFailures.length ? `, parseFailures=${row.tableParseFailures.join(", ")}` : ""}`),
  "",
];

fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  characters: refreshedCharacters.length,
  skillPoints: output.summary.skillPoints,
  coefficientRowsBefore: oldTotal,
  coefficientRowsAfter: newTotal,
  tableParseFailureSkills: failures.reduce((sum, row) => sum + row.tableParseFailures.length, 0),
  report: reportPath,
}, null, 2));

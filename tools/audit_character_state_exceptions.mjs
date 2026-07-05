import fs from "node:fs";

const characterIdentity = readJson("data/generated/character-identity.json");
const hoyowikiSkills = readJson("data/legacy-reference/game-db/hoyowiki-character-skills.json");
const effectRows = readJson("data/generated/effect-rows.json").rows ?? [];
const skillDamageMetadata = readJson("data/generated/skill-damage-metadata.json");
const stateControls = readJson("data/curated/character-state-controls.json");
const formulaOverrides = readJson("data/curated/skill-damage-formula-overrides.json");

const identityByName = new Map((characterIdentity.rows ?? []).map((row) => [normalizeName(row.displayName), row]));
const controlsByCharacterId = groupBy(stateControls.controls ?? [], (control) => control.characterId ?? control.formulaType ?? "global");
const overrideCharacters = new Set((formulaOverrides.rules ?? []).map((rule) => rule.characterId).filter(Boolean));
const damageTypesByCharacterId = groupBy(skillDamageMetadata.rows ?? [], (row) => row.characterId);

const sourceRows = Object.values(hoyowikiSkills.characters ?? {}).map((character) => {
  const identity = identityByName.get(normalizeName(character.nameKo)) ?? null;
  const characterId = identity?.characterId ?? `hoyowiki:${character.entryPageId ?? character.nameKo}`;
  const skillTexts = (character.skills ?? []).map((skill) => [
    skill.title,
    skill.category,
    skill.description,
    ...(skill.coefficientRows ?? []).map((row) => row.label),
  ].filter(Boolean).join(" "));
  const eidolonTexts = (character.eidolons ?? []).map((eidolon) => [
    eidolon.title,
    eidolon.description,
  ].filter(Boolean).join(" "));
  const allText = [...skillTexts, ...eidolonTexts].join(" ");
  const effectUiRows = effectRows.filter((row) => row.effectProviderId === characterId && isUiInputDecision(row.userReview?.decision));
  const effectAlwaysRows = effectRows.filter((row) => row.effectProviderId === characterId && isAlwaysOnDecision(row.userReview?.decision));
  const damageTypes = [...new Set((damageTypesByCharacterId.get(characterId) ?? []).map((row) => row.damageFormulaType ?? "normal"))];
  return {
    characterId,
    displayName: identity?.displayName ?? character.nameKo,
    entryPageId: character.entryPageId ?? null,
    released: Boolean(identity) && (character.skills ?? []).length > 0,
    skillCount: character.skills?.length ?? 0,
    controlKeys: (controlsByCharacterId.get(characterId) ?? []).map((control) => control.key),
    uiInputEffectRows: effectUiRows.map(toEffectSummary),
    alwaysOnEffectRows: effectAlwaysRows.map(toEffectSummary),
    textSignals: classifyTextSignals(allText),
    damageFormulaTypes: damageTypes,
    hasFormulaOverride: overrideCharacters.has(characterId),
  };
});

const releasedRows = sourceRows.filter((row) => row.released);
const unreleasedRows = sourceRows.filter((row) => !row.released);
const rowsNeedingReview = releasedRows.filter((row) =>
  row.uiInputEffectRows.length
  || row.textSignals.formulaException.length
  || row.textSignals.state.length
  || row.damageFormulaTypes.some((type) => type !== "normal")
  || row.hasFormulaOverride
);

const report = {
  app: "hsr-relic-cc-character-state-exception-audit",
  version: 1,
  generatedAt: new Date().toISOString(),
  summary: {
    hoyowikiCharacters: sourceRows.length,
    releasedCharacters: releasedRows.length,
    unreleasedCharacters: unreleasedRows.length,
    charactersWithStateControls: releasedRows.filter((row) => row.controlKeys.length).length,
    uiInputEffectRows: releasedRows.reduce((sum, row) => sum + row.uiInputEffectRows.length, 0),
    alwaysOnReviewedRows: releasedRows.reduce((sum, row) => sum + row.alwaysOnEffectRows.length, 0),
    formulaOverrideCharacters: releasedRows.filter((row) => row.hasFormulaOverride).length,
    reviewRows: rowsNeedingReview.length,
  },
  rows: sourceRows,
};

fs.mkdirSync("reports/calculation", { recursive: true });
fs.writeFileSync("reports/calculation/character-state-exception-audit.json", `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync("reports/calculation/character-state-exception-audit.md", renderMarkdown(report));

console.log(`character state exception audit ok: released=${report.summary.releasedCharacters}, controls=${report.summary.charactersWithStateControls}, uiRows=${report.summary.uiInputEffectRows}, reviewRows=${report.summary.reviewRows}`);

function classifyTextSignals(text) {
  const compact = String(text ?? "").replace(/\s+/g, " ").trim();
  return {
    state: matchSignals(compact, [
      ["스택", /스택|중첩|stack/i],
      ["강화상태", /강화|상태|변신|결계|전용 효과/],
      ["기록/누적", /기록|누적|저장|획득|소모|충전|카운트|pt/],
      ["소환/기억정령", /소환|기억 정령|기억정령|동반체|추가 공격/],
    ]),
    formulaException: matchSignals(compact, [
      ["확정피해", /확정 피해|최종 피해/],
      ["슈퍼격파", /슈퍼 격파|강인성 감소 수치/],
      ["환락피해", /환락 피해|웃음 포인트|Certified Banger|Punchline|Merrymake/],
      ["분배/랜덤", /균등 분담|분배|랜덤|바운스|피해 횟수/],
      ["현재 DoT 즉시 피해", /현재 받는 모든 지속 피해|지속 피해가 즉시|기존 피해/],
      ["실드/치유 기반 피해", /실드량|치유 수치|HP 최대치|방어력의|공격력의/],
    ]),
  };
}

function matchSignals(text, patterns) {
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function isUiInputDecision(decision) {
  return /UI input|UI selectable|UI preset|stack preset|ally-count preset|Hidden Score preset|Nobility charge state|No implicit ready without stack input/i.test(String(decision ?? ""));
}

function isAlwaysOnDecision(decision) {
  return /Always ON|always ON|Change dynamic_formula -> fixed|Use max|maximum|max stack|Treat .* stacks|Assume .* active|Always calculate/i.test(String(decision ?? ""));
}

function toEffectSummary(row) {
  return {
    effectRowId: row.id,
    stat: row.stat,
    rawValue: row.rawValue ?? null,
    minEidolon: row.minEidolon ?? null,
    decision: row.userReview?.decision ?? null,
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Character State / Formula Exception Audit",
    "",
    `생성일: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- HoyoWiki characters: ${report.summary.hoyowikiCharacters}`,
    `- released/joined characters: ${report.summary.releasedCharacters}`,
    `- unavailable/unjoined characters: ${report.summary.unreleasedCharacters}`,
    `- characters with state controls: ${report.summary.charactersWithStateControls}`,
    `- UI-input effect rows: ${report.summary.uiInputEffectRows}`,
    `- always-ON reviewed rows: ${report.summary.alwaysOnReviewedRows}`,
    `- formula override characters: ${report.summary.formulaOverrideCharacters}`,
    `- rows needing review visibility: ${report.summary.reviewRows}`,
    "",
    "## UI 입력형 상태값",
    "",
  ];

  for (const row of report.rows.filter((item) => item.uiInputEffectRows.length || item.controlKeys.length)) {
    lines.push(`### ${row.displayName}`);
    lines.push("");
    lines.push(`- characterId: \`${row.characterId}\``);
    lines.push(`- controls: ${row.controlKeys.length ? row.controlKeys.map((key) => `\`${key}\``).join(", ") : "-"}`);
    for (const effect of row.uiInputEffectRows) {
      lines.push(`- ${effect.effectRowId}: ${effect.stat}, minEidolon=${effect.minEidolon ?? "-"}, decision=${effect.decision}`);
    }
    lines.push("");
  }

  lines.push("## 공식/상태 예외 후보");
  lines.push("");
  for (const row of report.rows.filter((item) => item.textSignals.formulaException.length || item.hasFormulaOverride || item.damageFormulaTypes.some((type) => type !== "normal"))) {
    lines.push(`- ${row.displayName} (\`${row.characterId}\`): damageTypes=${row.damageFormulaTypes.join(",") || "-"}, override=${row.hasFormulaOverride ? "yes" : "no"}, signals=${row.textSignals.formulaException.join(",") || "-"}`);
  }

  lines.push("");
  lines.push("## 선택 불가/미조인");
  lines.push("");
  for (const row of report.rows.filter((item) => !item.released)) {
    lines.push(`- ${row.displayName} (\`${row.characterId}\`): skillCount=${row.skillCount}`);
  }

  return `${lines.join("\n")}\n`;
}

function normalizeName(value) {
  return String(value ?? "").replace(/[・·]/g, "•").replace(/\s+/g, " ").trim();
}

function groupBy(rows, getter) {
  const map = new Map();
  for (const row of rows ?? []) {
    const key = getter(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

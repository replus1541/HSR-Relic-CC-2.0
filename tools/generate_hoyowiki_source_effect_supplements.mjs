import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outPath = "data/generated/hoyowiki-source-effect-supplements.json";
const reportPath = "reports/audit/hoyowiki-source-effect-supplements.md";

const hoyowiki = readJson("data/legacy-reference/game-db/hoyowiki-character-skills.json");
const identity = readJson("data/generated/character-identity.json");
const generatedMetadata = readJson("data/generated/battle-effect-metadata.json");
const generatedLedger = readJson("data/generated/combat-ledger-sample.json");

const identitiesByEntryPageId = new Map(
  (identity.rows ?? [])
    .map((row) => [String(row.identifiers?.hoyowikiEntryPageId ?? ""), row])
    .filter(([entryPageId]) => entryPageId),
);

const generatedMetadataRows = generatedMetadata.rows ?? [];
const generatedLedgerRows = generatedLedger.rows ?? generatedLedger.ledgerRows ?? [];
const generatedMetadataByEffectId = new Map(generatedMetadataRows.map((row) => [row.effectRowId, row]));
const generatedLedgerByEffectId = new Map(generatedLedgerRows.map((row) => [row.sourceTrace?.effectRowId ?? row.effectRowId, row]));

const generatedRows = generatedMetadataRows.map((metadata) => ({
  metadata,
  ledger: generatedLedgerByEffectId.get(metadata.effectRowId) ?? null,
  sourceBase: sourceBaseKey(metadata.sourceTrace),
}));

const metadataRows = [];
const ledgerRows = [];
const triggeredDamageRows = [];
const supersedesEffectRowIds = new Set();
const reportRows = [];
const seen = new Set();

for (const character of hoyowiki.characters ?? []) {
  const identityRow = identitiesByEntryPageId.get(String(character.entryPageId));
  const characterId = identityRow?.characterId;
  if (!characterId) continue;

  const sources = [
    ...(character.skills ?? []).map((skill, index) => ({
      kind: "skill",
      key: skill.category ?? skill.pointKey ?? `skill${index}`,
      category: skill.category ?? skill.pointKey ?? "skill",
      title: skill.title ?? skill.pointKey ?? `skill ${index + 1}`,
      text: skill.description ?? "",
      coefficientRows: skill.coefficientRows ?? [],
      minEidolon: null,
    })),
    ...(character.eidolons ?? []).map((eidolon) => ({
      kind: "eidolon",
      key: `E${eidolon.rank}`,
      category: `E${eidolon.rank}`,
      title: eidolon.title ?? `E${eidolon.rank}`,
      text: eidolon.description ?? "",
      coefficientRows: [],
      minEidolon: Number(eidolon.rank ?? 0) || null,
    })),
  ];

  for (const source of sources) {
    const effectiveText = selectEnhancedText(source.text);
    const parsedRows = parseSourceEffects({
      character,
      characterId,
      displayName: identityRow.displayName ?? character.nameKo ?? characterId,
      source,
      text: effectiveText,
    });

    for (const rawParsed of parsedRows) {
      const parsed = applyCuratedCurrentRules(rawParsed);
      const key = [
        parsed.ownerId,
        parsed.sourceCategory,
        parsed.sourceTitle,
        parsed.stat,
        parsed.targetPolicy,
        parsed.resolvedValue,
        parsed.scalingStat ?? "",
        parsed.triggerAttackTypes?.join(",") ?? "",
      ].join("|").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const existing = findExistingCoverage(parsed);
      if (existing?.covered) continue;
      for (const effectRowId of existing?.supersedes ?? []) supersedesEffectRowIds.add(effectRowId);

      if (parsed.stat === "triggeredAdditionalDamage") {
        triggeredDamageRows.push(parsed);
      }
      metadataRows.push(toMetadataRow(parsed));
      ledgerRows.push(toLedgerRow(parsed));
      reportRows.push({
        ...parsed,
        supersedes: existing?.supersedes ?? [],
      });
    }
  }
}

const output = {
  app: "hsr-relic-cc-hoyowiki-source-effect-supplements",
  version: 1,
  generatedAt: new Date().toISOString(),
  source: "data/legacy-reference/game-db/hoyowiki-character-skills.json",
  policy: {
    sourceBackedOnly: true,
    parseScope: "HoyoWiki skills + eidolons numeric buff/debuff/triggered-damage text",
    enhancedBranchPreferred: true,
    coefficientRowsPreferredForSkillLevelScaledValues: true,
  },
  supersedesEffectRowIds: [...supersedesEffectRowIds].sort(),
  metadataRows,
  ledgerRows,
  triggeredDamageRows,
  summary: {
    metadataRows: metadataRows.length,
    ledgerRows: ledgerRows.length,
    triggeredDamageRows: triggeredDamageRows.length,
    supersedesEffectRowIds: supersedesEffectRowIds.size,
    byStat: countBy(metadataRows, (row) => row.stat),
    byTargetPolicy: countBy(metadataRows, (row) => normalizeTargetPolicy(row.targetPolicy)),
  },
};

writeJson(outPath, output);
writeReport(reportPath, buildReport(output, reportRows));

console.log(JSON.stringify(output.summary, null, 2));

function parseSourceEffects({ character, characterId, displayName, source, text }) {
  const rows = [];
  const sourceText = compactText(text);
  if (!sourceText) return rows;
  const add = (stat, value, matchIndex, options = {}) => {
    const sentence = options.sentence ?? sentenceForMatch(sourceText, matchIndex);
    if (shouldSkipStatFromSentence(stat, sentence)) return;
    const resolved = resolveValueFromCoefficientRows(stat, source.coefficientRows, Number(value)) ?? Number(value);
    if (!Number.isFinite(resolved)) return;
    rows.push({
      effectRowId: makeEffectRowId(characterId, source, stat, rows.length),
      sourceId: makeSourceId(characterId, source, stat, rows.length),
      ownerId: characterId,
      sourceLabel: displayName,
      sourceDisplayLabel: `${sourceKindLabel(source)} · ${source.title}`,
      sourceTrace: `HoyoWiki:${character.entryPageId}:${source.key}:${source.title}:${stat}:${rows.length}`,
      sourceCategory: source.category,
      sourceTitle: source.title,
      minEidolon: source.minEidolon,
      effectType: options.effectType ?? inferEffectType(stat),
      targetPolicy: options.targetPolicy ?? inferTargetPolicy(stat, sentence, character.nameKo),
      stat,
      resolvedValue: resolved,
      sourceText: sentence,
      valueMode: source.coefficientRows?.length && hasCoefficientEvidence(stat, source.coefficientRows)
        ? "skill_level_scaled"
        : (source.kind === "eidolon" ? "eidolon_adjusted" : "fixed"),
      triggerAttackTypes: options.triggerAttackTypes ?? null,
      scalingStat: options.scalingStat ?? null,
      damageElement: options.damageElement ?? character.element ?? null,
    });
  };

  applyPattern(sourceText, /치명타\s*확률(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("critRate", percent(match[1]), match.index));
  applyPattern(sourceText, /치명타\s*피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("critDamage", percent(match[1]), match.index));
  applyPattern(sourceText, /격파\s*특수효과(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("breakEffect", percent(match[1]), match.index));
  applyPattern(sourceText, /약점\s*격파\s*효율(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("toughnessDamageRatio", percent(match[1]), match.index));
  applyPattern(sourceText, /효과\s*명중(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("effectHitRate", percent(match[1]), match.index));
  applyPattern(sourceText, /효과\s*저항(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("effectResistance", percent(match[1]), match.index));
  applyPattern(sourceText, /에너지\s*회복\s*효율(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("energyRegen", percent(match[1]), match.index));
  applyPattern(sourceText, /받는\s*치유량(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("outgoingHealingBoost", percent(match[1]), match.index));
  applyPattern(sourceText, /HP\s*최대치(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("hpRatio", percent(match[1]), match.index));
  applyPattern(sourceText, /공격력(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("atkRatio", percent(match[1]), match.index));
  applyPattern(sourceText, /방어력(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("defRatio", percent(match[1]), match.index));
  applyPattern(sourceText, /속도(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("speedRatio", percent(match[1]), match.index));
  applyPattern(sourceText, /속도(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)\s*pt\s*증가/g, (match) => add("speed", Number(match[1]), match.index));
  applyPattern(sourceText, /환락도(?:가|이|을|를)?\s*(?:추가로\s*)?(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("elation", Number(match[1]), match.index));

  applyPattern(sourceText, /필살기[^.。|]{0,40}?피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("ultimateDamage", percent(match[1]), match.index));
  applyPattern(sourceText, /전투\s*스킬[^.。|]{0,40}?피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("skillDamage", percent(match[1]), match.index));
  applyPattern(sourceText, /일반\s*공격[^.。|]{0,40}?피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("basicDamage", percent(match[1]), match.index));
  applyPattern(sourceText, /추가\s*공격[^.。|]{0,40}?피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("followDamage", percent(match[1]), match.index));
  applyPattern(sourceText, /지속\s*피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("dotDamage", percent(match[1]), match.index));
  applyPattern(sourceText, /격파\s*피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("breakDamage", percent(match[1]), match.index));
  applyPattern(sourceText, /(?:가하는\s*)?피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => {
    const sentence = sentenceForMatch(sourceText, match.index);
    if (/필살기|전투\s*스킬|일반\s*공격|추가\s*공격|지속\s*피해|격파\s*피해/.test(sentence)) return;
    add("allDamage", percent(match[1]), match.index, { sentence });
  });
  applyPattern(sourceText, /(?:[가-힣]+\s*속성\s*)?저항\s*관통(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("resistancePen", percent(match[1]), match.index));
  applyPattern(sourceText, /방어력을\s*(\d+(?:\.\d+)?)%\s*무시/g, (match) => add("defenseIgnore", percent(match[1]), match.index));
  applyPattern(sourceText, /방어력(?:이|가|을|를)?\s*(\d+(?:\.\d+)?)%\s*감소/g, (match) => add("defenseDown", percent(match[1]), match.index, { effectType: "debuff" }));
  applyPattern(sourceText, /받는\s*피해(?:가|이|을|를)?\s*(\d+(?:\.\d+)?)%\s*증가/g, (match) => add("vulnerability", percent(match[1]), match.index, { effectType: "debuff" }));

  applyPattern(sourceText, /추가로\s*[^.。|]{0,80}?(공격력|HP\s*최대치|방어력)의\s*(\d+(?:\.\d+)?)%\s*만큼[^.。|]{0,60}?피해\s*(?:를\s*)?(?:가한다|준다)/g, (match) => {
    const sentence = sentenceForMatch(sourceText, match.index);
    add("triggeredAdditionalDamage", percent(match[2]), match.index, {
      sentence,
      effectType: "triggered_damage",
      targetPolicy: "self",
      scalingStat: scalingStatFromText(match[1]),
      triggerAttackTypes: inferTriggerAttackTypes(sentence),
      damageElement: character.element ?? null,
    });
  });

  return rows;
}

function findExistingCoverage(parsed) {
  const base = sourceBaseKey(parsed.sourceTrace);
  const matchingBaseRows = generatedRows.filter((row) => row.sourceBase === base);
  const exactRows = matchingBaseRows.filter((row) => row.metadata?.stat === parsed.stat);
  const exactCovered = exactRows.some((row) => (
    normalizeTargetPolicy(row.ledger?.targetPolicy ?? row.metadata?.targetPolicy) === normalizeTargetPolicy(parsed.targetPolicy)
  ));
  if (exactCovered) return { covered: true, supersedes: [] };

  const supersedes = [];
  for (const row of exactRows) {
    if (row.metadata?.effectRowId) supersedes.push(row.metadata.effectRowId);
  }
  if (["basicDamage", "skillDamage", "ultimateDamage", "followDamage", "dotDamage", "breakDamage"].includes(parsed.stat)) {
    for (const row of matchingBaseRows) {
      if (row.metadata?.stat === "allDamage" && row.metadata?.effectRowId) supersedes.push(row.metadata.effectRowId);
    }
  }
  return { covered: false, supersedes: [...new Set(supersedes)] };
}

function toMetadataRow(row) {
  return {
    effectRowId: row.effectRowId,
    sourceId: row.sourceId,
    ownerId: row.ownerId,
    sourceLabel: row.sourceLabel,
    sourceDisplayLabel: row.sourceDisplayLabel,
    sourceTrace: row.sourceTrace,
    sourceCategory: row.sourceCategory,
    sourceTitle: row.sourceTitle,
    minEidolon: row.minEidolon,
    effectType: row.effectType,
    targetPolicy: row.targetPolicy,
    stat: row.stat,
    sourceText: row.sourceText,
    valueMode: row.valueMode,
    triggerAttackTypes: row.triggerAttackTypes,
    scalingStat: row.scalingStat,
    damageElement: row.damageElement,
  };
}

function toLedgerRow(row) {
  return {
    ledgerId: `ledger:curated:${row.effectRowId}`,
    sourceId: row.sourceId,
    sourceRowId: row.sourceId,
    canonicalEffectKey: [
      "effect",
      row.ownerId,
      "hoyowiki_source_supplement",
      row.sourceId,
      normalizeTargetPolicy(row.targetPolicy),
      row.stat,
    ].join("|").toLowerCase(),
    valueMode: row.valueMode,
    ownerId: row.ownerId,
    subjectId: row.ownerId,
    targetPolicy: normalizeTargetPolicy(row.targetPolicy),
    stat: row.stat,
    resolvedValue: row.resolvedValue,
    scalingStat: row.scalingStat,
    triggerAttackTypes: row.triggerAttackTypes,
    damageElement: row.damageElement,
    blockedReason: null,
    skippedReason: null,
    usedForCalculation: true,
    category: "effect",
    calculationStatus: "calculation_ready",
    sourceTrace: {
      sourceId: row.sourceId,
      sourceRowId: row.sourceId,
      effectRowId: row.effectRowId,
      resolvedEffectId: `resolved:${row.effectRowId}`,
      normalizedEffectId: `normalized:${row.effectRowId}`,
      canonicalEffectKey: [
        "effect",
        row.ownerId,
        "hoyowiki_source_supplement",
        row.sourceId,
        normalizeTargetPolicy(row.targetPolicy),
        row.stat,
      ].join("|").toLowerCase(),
      dedupeRole: "winner",
    },
  };
}

function applyCuratedCurrentRules(row) {
  if (
    row.ownerId === "Jingliu_00"
    && row.sourceCategory === "E4"
    && row.stat === "critDamage"
    && row.sourceText.includes("달빛")
  ) {
    return {
      ...row,
      effectRowId: "effect:Jingliu_00:curated:moonlightStacksCritDamage",
      sourceId: "source:Jingliu_00:curated:moonlightStacksCritDamage",
      resolvedValue: 0.44,
      valueMode: "curated_current_hoyowiki_as",
      sourceText: `${row.sourceText} / current-AS correction: 달빛 스택당 치명타 피해 44%, 기억정령 수에 따라 최대 3~5스택`,
    };
  }
  return row;
}

function selectEnhancedText(text) {
  const source = compactText(text);
  const marker = "강화:";
  if (!source.includes(marker)) return source;
  return source.slice(source.lastIndexOf(marker) + marker.length).trim();
}

function sourceKindLabel(source) {
  if (source.kind === "eidolon") return `성혼 ${source.minEidolon}`;
  return {
    basicAttack: "일반 공격",
    combatSkill: "전투 스킬",
    skill: "전투 스킬",
    ultimate: "필살기",
    talent: "특성",
    technique: "비술",
  }[source.category] ?? "스킬";
}

function sourceBaseKey(sourceTrace) {
  const parts = String(sourceTrace ?? "").split(":");
  if (parts[0] !== "HoyoWiki") return "";
  return parts.slice(0, 4).join(":");
}

function makeEffectRowId(characterId, source, stat, index) {
  return `effect:${characterId}:hoyowiki-source:${safeId(source.category)}:${safeId(source.title)}:${stat}:${index}`;
}

function makeSourceId(characterId, source, stat, index) {
  return `source:${characterId}:hoyowiki-source:${safeId(source.category)}:${safeId(source.title)}:${stat}:${index}`;
}

function safeId(value) {
  return String(value ?? "unknown")
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "unknown";
}

function applyPattern(text, regex, callback) {
  for (const match of text.matchAll(regex)) callback(match);
}

function sentenceForMatch(text, matchIndex = 0) {
  const source = compactText(text);
  let start = 0;
  for (let index = matchIndex - 1; index >= 0; index -= 1) {
    const char = source[index];
    if (char === "|" || char === "。" || (char === "." && !isDecimalPoint(source, index))) {
      start = index + 1;
      break;
    }
  }
  let end = source.length;
  for (let index = matchIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "|" || char === "。" || (char === "." && !isDecimalPoint(source, index))) {
      end = index;
      break;
    }
  }
  return source.slice(start, end).trim();
}

function isDecimalPoint(text, index) {
  return /\d/.test(text[index - 1] ?? "") && /\d/.test(text[index + 1] ?? "");
}

function shouldSkipStatFromSentence(stat, sentence) {
  if (
    ["allDamage", "basicDamage", "skillDamage", "ultimateDamage", "followDamage", "dotDamage", "breakDamage"].includes(stat)
    && /치명타\s*피해/.test(sentence)
  ) return true;
  if (stat === "ultimateDamage" && /필살기\s*발동\s*후[^.。|]*전투\s*스킬/.test(sentence)) return true;
  if (stat === "skillDamage" && /전투\s*스킬\s*발동\s*후[^.。|]*필살기/.test(sentence)) return true;
  if (stat === "atkRatio" && /기초\s*공격력의\s*\d/.test(sentence) && !/공격력(?:이|가|을|를)?\s*\d/.test(sentence)) return true;
  if (stat === "defRatio" && /방어력(?:이|가)?\s*\d+(?:\.\d+)?%\s*감소/.test(sentence)) return true;
  return false;
}

function inferEffectType(stat) {
  if (["defenseDown", "vulnerability", "takenCritDamage"].includes(stat)) return "debuff";
  if (stat === "triggeredAdditionalDamage") return "triggered_damage";
  return "buff";
}

function inferTargetPolicy(stat, sentence, ownerName) {
  const text = compactText(sentence);
  if (stat === "defenseDown" || stat === "vulnerability" || stat === "takenCritDamage") {
    if (/모든\s*적|적\s*전체/.test(text)) return "enemy_all";
    return "enemy_single";
  }
  if (stat === "defenseIgnore" || stat === "resistancePen") {
    if (/모든\s*아군|아군\s*전체/.test(text)) return "all_allies";
    return "self";
  }
  if (/모든\s*아군|아군\s*전체|모든\s*동료/.test(text)) {
    if (ownerName && text.includes(`${ownerName}의`)) return "self";
    return "all_allies";
  }
  if (/지정된\s*단일\s*아군|단일\s*아군|아군\s*1명|해당\s*목표/.test(text) && !/적|목표에게/.test(text)) return "single_ally";
  if (/자신|자신의/.test(text)) return "self";
  if (ownerName && text.includes(ownerName)) return "self";
  return "self";
}

function resolveValueFromCoefficientRows(stat, rows = [], fallback) {
  const row = rows.find((item) => coefficientLabelMatchesStat(item.label, stat));
  if (!row?.values?.length) return fallback;
  const value = Number(row.values[row.values.length - 1]);
  return Number.isFinite(value) ? value : fallback;
}

function hasCoefficientEvidence(stat, rows = []) {
  return rows.some((row) => coefficientLabelMatchesStat(row.label, stat));
}

function coefficientLabelMatchesStat(label, stat) {
  const text = compactText(label);
  const patterns = {
    critRate: /치명타\s*확률|치확/,
    critDamage: /치명타\s*피해|치피/,
    atkRatio: /공격력/,
    hpRatio: /HP|체력/,
    defRatio: /방어력/,
    breakEffect: /격파\s*특수효과|격특/,
    effectHitRate: /효과\s*명중/,
    effectResistance: /효과\s*저항/,
    energyRegen: /에너지\s*회복/,
    allDamage: /가하는\s*피해|피해\s*증가/,
    ultimateDamage: /필살기.*피해/,
    skillDamage: /전투\s*스킬.*피해/,
    basicDamage: /일반\s*공격.*피해/,
    followDamage: /추가\s*공격.*피해/,
    dotDamage: /지속\s*피해/,
    defenseIgnore: /방어력\s*무시/,
    defenseDown: /방어력\s*감소/,
    vulnerability: /받는\s*피해/,
    resistancePen: /저항\s*관통/,
  };
  return patterns[stat]?.test(text) ?? false;
}

function inferTriggerAttackTypes(sentence) {
  const text = compactText(sentence);
  const types = [];
  if (/일반\s*공격/.test(text)) types.push("basic");
  if (/전투\s*스킬|강화된\s*전투\s*스킬/.test(text)) types.push("skill");
  if (/필살기/.test(text)) types.push("ultimate");
  if (/추가\s*공격/.test(text)) types.push("follow_up");
  return types.length ? types : ["basic", "skill", "ultimate", "follow_up"];
}

function scalingStatFromText(text) {
  if (/HP/.test(text)) return "hp";
  if (/방어력/.test(text)) return "def";
  return "atk";
}

function normalizeTargetPolicy(policy) {
  const text = String(policy ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  if (text === "allallies") return "all_allies";
  if (text === "singleally") return "single_ally";
  if (text === "enemyall") return "enemy_all";
  if (text === "enemysingle") return "enemy_single";
  return text || "unknown";
}

function percent(value) {
  return Number(value) / 100;
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function countBy(rows, keyGetter) {
  return rows.reduce((counts, row) => {
    const key = keyGetter(row) ?? "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function formatValue(stat, value) {
  if (stat === "speed") return String(value);
  if (stat === "elation") return Number.isInteger(Number(value)) ? String(Number(value)) : String(Number(value).toFixed(1));
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function buildReport(output, rows) {
  const lines = [
    "# HoyoWiki 원문 효과 보강 리포트",
    "",
    `- 생성: ${output.generatedAt}`,
    "- 범위: HoyoWiki `skills` + `eidolons`의 수치형 버프/디버프/추가 피해 문장",
    "- 원칙: 스킬/특성 계수표가 있으면 계수표 마지막 값을 우선 사용, 성혼 설명문은 HoyoWiki 원문 수치를 사용",
    "- `supersedes`는 기존 생성 row가 대상/스탯 오분류라 계산에서 제외해야 하는 effectRowId입니다.",
    "",
    "## 요약",
    "",
    `- metadataRows: ${output.summary.metadataRows}`,
    `- ledgerRows: ${output.summary.ledgerRows}`,
    `- triggeredDamageRows: ${output.summary.triggeredDamageRows}`,
    `- supersedesEffectRowIds: ${output.summary.supersedesEffectRowIds}`,
    "",
    "## 생성 Row",
    "",
    "| 캐릭터 | 출처 | 스탯 | 값 | 대상 | 조건 | supersedes | 원문 |",
    "|---|---|---|---:|---|---|---|---|",
  ];
  for (const row of rows.sort((a, b) => String(a.sourceLabel).localeCompare(String(b.sourceLabel), "ko") || String(a.sourceTrace).localeCompare(String(b.sourceTrace), "ko"))) {
    lines.push([
      row.sourceLabel,
      row.sourceDisplayLabel,
      row.stat,
      formatValue(row.stat, row.resolvedValue),
      row.targetPolicy,
      row.minEidolon ? `E${row.minEidolon}+` : "always",
      row.supersedes?.length ? row.supersedes.map((id) => `\`${id}\``).join(", ") : "-",
      compactText(row.sourceText).replaceAll("|", "\\|"),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  return lines;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeReport(relativePath, lines) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${lines.join("\n")}\n`, "utf8");
}

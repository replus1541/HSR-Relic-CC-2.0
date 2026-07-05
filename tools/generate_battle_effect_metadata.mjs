import fs from "node:fs";

const effectRowsPath = "data/generated/effect-rows.json";
const outPath = "data/generated/battle-effect-metadata.json";
const reportPath = "reports/calculation/battle-effect-metadata-report.md";

const effectRows = JSON.parse(fs.readFileSync(effectRowsPath, "utf8")).rows ?? [];
const rows = effectRows.map((row) => ({
  effectRowId: row.id,
  sourceId: row.sourceId,
  ownerId: row.effectProviderId,
  sourceLabel: row.characterName ?? row.effectProviderId,
  sourceDisplayLabel: buildSourceDisplayLabel(row),
  sourceTrace: row.sourceTrace ?? null,
  sourceCategory: row.skillScaling?.skillCategory ?? parseSourceTrace(row.sourceTrace).category ?? null,
  sourceTitle: row.skillScaling?.skillTitle ?? parseSourceTrace(row.sourceTrace).title ?? null,
  minEidolon: row.minEidolon ?? null,
  effectType: row.effectType,
  targetPolicy: row.effectTargetPolicy ?? row.targetScope,
  stat: normalizeBattleEffectStat(row),
}));

const output = {
  app: "hsr-relic-cc-battle-effect-metadata",
  version: 1,
  generatedAt: new Date().toISOString(),
  source: {
    effectRows: effectRowsPath,
  },
  policy: {
    uiBundleSlimMetadataOnly: true,
    sourceTextExcluded: true,
  },
  summary: {
    rows: rows.length,
    withMinEidolon: rows.filter((row) => row.minEidolon != null).length,
  },
  rows,
};

fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
fs.mkdirSync("reports/calculation", { recursive: true });
fs.writeFileSync(reportPath, [
  "# Battle Effect Metadata",
  "",
  "Slim UI metadata generated from effect rows for current party battle stat filtering.",
  "",
  `- rows: ${output.summary.rows}`,
  `- withMinEidolon: ${output.summary.withMinEidolon}`,
  "",
].join("\n"));

console.log(`battle effect metadata generated: rows=${output.summary.rows}`);

function normalizeBattleEffectStat(row) {
  if (
    row.stat === "specialFinal"
    && /확정\s*피해|확정피해|true\s*dmg|true\s*damage/i.test(`${row.sourceText ?? ""}\n${row.sourceTrace ?? ""}`)
  ) {
    return "trueDamageRatio";
  }
  return row.stat;
}

function buildSourceDisplayLabel(row) {
  const parsed = parseSourceTrace(row.sourceTrace);
  const category = row.skillScaling?.skillCategory ?? parsed.category;
  const title = row.skillScaling?.skillTitle ?? parsed.title;
  const sourceType = String(row.sourceType ?? "").toLowerCase();
  if (sourceType.includes("light") || sourceType.includes("cone") || sourceType.includes("광추")) {
    return title ? `광추 · ${title}` : "광추";
  }
  if (category || title) {
    return [formatSourceCategory(category), title].filter(Boolean).join(" · ");
  }
  return row.characterName ?? row.effectProviderId ?? "효과";
}

function parseSourceTrace(sourceTrace) {
  const parts = String(sourceTrace ?? "").split(":");
  if (!parts.length) return {};
  const categoryIndex = parts[0] === "HoyoWiki" ? 2 : 1;
  const category = parts[categoryIndex] ?? null;
  const title = parts[categoryIndex + 1] ?? null;
  return { category, title };
}

function formatSourceCategory(category) {
  const normalized = String(category ?? "").trim();
  if (!normalized) return "";
  if (/^E\d+$/i.test(normalized)) return `성혼 ${normalized.slice(1)}`;
  return {
    basicAttack: "일반 공격",
    combatSkill: "전투 스킬",
    skill: "전투 스킬",
    ultimate: "필살기",
    talent: "특성",
    Talent: "특성",
    Ultimate: "필살기",
    Trace: "추가 능력",
    trace: "추가 능력",
    technique: "비술",
    memospriteSkill: "기억 정령 스킬",
    memospriteTalent: "기억 정령 특성",
  }[normalized] ?? normalized;
}

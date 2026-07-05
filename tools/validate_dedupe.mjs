import fs from "node:fs";
import path from "node:path";
import { CalculationStatus } from "../src/data-model/schemas/index.js";
import { dedupeEffects } from "../src/effect-engine/dedupe-effects.js";

const dedupedPath = "data/generated/deduped-effects.json";
const fixturesDir = "data/generated/dedupe-fixtures";
const reportPath = "reports/effect-engine/dedupe-report.md";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function countBy(rows, getter) {
  return rows.reduce((counts, row) => {
    const value = getter(row);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function validateDedupedRows(rows) {
  const errors = [];
  const readyWinnersByKey = new Map();

  for (const row of rows) {
    if (!row.canonicalEffectKey) errors.push(`${row.id}: missing canonicalEffectKey`);
    if (!row.dedupeResult?.role) errors.push(`${row.id}: missing dedupeResult.role`);
    if (row.dedupeResult?.role === "winner" && row.calculationStatus !== CalculationStatus.CALCULATION_READY) {
      errors.push(`${row.id}: blocked row must not be winner`);
    }
    if (row.dedupeResult?.role === "winner") {
      const key = row.canonicalEffectKey;
      const winners = readyWinnersByKey.get(key) ?? [];
      winners.push(row.id);
      readyWinnersByKey.set(key, winners);
    }
  }

  for (const [key, winners] of readyWinnersByKey.entries()) {
    if (winners.length !== 1) errors.push(`${key}: expected exactly one winner, got ${winners.length}`);
  }

  return { ok: errors.length === 0, errors };
}

function assertValidDedupedRows(rows, label) {
  const result = validateDedupedRows(rows);
  if (!result.ok) throw new Error(`${label} failed validation: ${result.errors.join("; ")}`);
}

function resolved(id, sourceId, stat = "atkRatio") {
  return {
    id,
    effectRowId: id.replace("resolved:", "effect:"),
    sourceId,
    stat,
    valueTrace: { resolver: "fixed" },
    dedupeKey: `pending:${id}`,
    calculationStatus: CalculationStatus.CALCULATION_READY,
    resolvedValue: 0.1,
  };
}

function normalized(effectRowId, sourceId, overrides = {}) {
  return {
    effectRowId,
    sourceId,
    sourceOrigin: "raw_source",
    effectProviderId: "fixture-provider",
    effectType: "buff",
    targetScope: "self",
    attackType: "support",
    condition: { conditionKey: null },
    stackRule: { stackKey: null },
    ...overrides,
  };
}

function source(id) {
  return {
    id,
    sourceOrigin: "raw_source",
    sourcePath: "fixture/source.json",
  };
}

const actualResolved = readJson("data/generated/resolved-effects.json").rows;
const actualNormalized = readJson("data/generated/normalized-effect-rows.json").rows;
const actualSources = readJson("data/generated/extraction-canonical-dataset.json").rows.sourceRows;
const actualRows = dedupeEffects(actualResolved, { normalizedEffects: actualNormalized, sourceRows: actualSources });
assertValidDedupedRows(actualRows, "generated deduped effects");
writeJson(dedupedPath, {
  version: 1,
  generatedBy: "tools/validate_dedupe.mjs",
  rows: actualRows,
});

const fixtureCases = [
  {
    fileName: "duplicate-source.json",
    resolvedEffects: [resolved("resolved:dup-a", "source:dup"), resolved("resolved:dup-b", "source:dup")],
    normalizedEffects: [normalized("effect:dup-a", "source:dup"), normalized("effect:dup-b", "source:dup")],
    sourceRows: [source("source:dup")],
  },
  {
    fileName: "eidolon-adjusted-collision.json",
    resolvedEffects: [resolved("resolved:eidolon-a", "source:eidolon"), resolved("resolved:eidolon-b", "source:eidolon")],
    normalizedEffects: [
      normalized("effect:eidolon-a", "source:eidolon", { condition: { conditionKey: "eidolon:6" } }),
      normalized("effect:eidolon-b", "source:eidolon", { condition: { conditionKey: "eidolon:6" } }),
    ],
    sourceRows: [source("source:eidolon")],
  },
  {
    fileName: "enemy-debuff-duplicate.json",
    resolvedEffects: [resolved("resolved:debuff-a", "source:debuff", "defDown"), resolved("resolved:debuff-b", "source:debuff", "defDown")],
    normalizedEffects: [
      normalized("effect:debuff-a", "source:debuff", { effectType: "debuff", targetScope: "enemy_single" }),
      normalized("effect:debuff-b", "source:debuff", { effectType: "debuff", targetScope: "enemy_single" }),
    ],
    sourceRows: [source("source:debuff")],
  },
];

fs.mkdirSync(fixturesDir, { recursive: true });
const fixtureResults = fixtureCases.map((fixture) => {
  const output = dedupeEffects(fixture.resolvedEffects, fixture);
  assertValidDedupedRows(output, fixture.fileName);
  const winnerCount = output.filter((row) => row.dedupeResult.role === "winner").length;
  const loserCount = output.filter((row) => row.dedupeResult.role === "loser").length;
  if (winnerCount !== 1 || loserCount !== output.length - 1) {
    throw new Error(`${fixture.fileName} expected one winner and duplicate losers`);
  }
  writeJson(path.join(fixturesDir, fixture.fileName), {
    version: 1,
    generatedBy: "tools/validate_dedupe.mjs",
    input: fixture,
    output,
  });
  return { fileName: fixture.fileName, winnerCount, loserCount };
});

const roleCounts = countBy(actualRows, (row) => row.dedupeResult.role);
const reportLines = [
  "# Dedupe Report",
  "",
  "Generated by `npm.cmd run validate:dedupe`.",
  "",
  "## Generated Rows",
  "",
  `- rows: ${actualRows.length}`,
  `- winners: ${roleCounts.winner ?? 0}`,
  `- losers: ${roleCounts.loser ?? 0}`,
  `- blocked: ${roleCounts.blocked ?? 0}`,
  "",
  "## Fixtures",
  "",
  ...fixtureResults.map((item) => `- ${item.fileName}: winners ${item.winnerCount}, losers ${item.loserCount}`),
  "",
  "## Guardrails",
  "",
  "- Blocked rows cannot be winners.",
  "- Duplicate ready rows must have exactly one winner per canonicalEffectKey.",
  "- Display names are not used for dedupe.",
  "",
  "## Deferred",
  "",
  "- Combat ledger conversion is deferred to Phase 11.",
  "- Aggregation is deferred to Phase 12.",
];
fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`, "utf8");

console.log(`dedupe validation ok: rows=${actualRows.length}, winners=${roleCounts.winner ?? 0}, losers=${roleCounts.loser ?? 0}, blocked=${roleCounts.blocked ?? 0}, fixtures=${fixtureResults.length}`);

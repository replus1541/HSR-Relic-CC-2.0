import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CalculationStatus } from "../src/data-model/schemas/index.js";
import { validateSourceRow } from "../src/data-model/schema-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "data", "generated", "schema-fixtures");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const fixtureFiles = fs.readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

const results = fixtureFiles.map((file) => {
  const row = readJson(path.join(fixtureDir, file));
  const validation = validateSourceRow(row);
  if (!validation.ok) {
    throw new Error(`${file} failed schema validation: ${validation.errors.join("; ")}`);
  }
  return { file, id: row.id, sourceOrigin: row.sourceOrigin, calculationStatus: row.calculationStatus };
});

const manualHint = readJson(path.join(fixtureDir, "manual-hint-blocked.json"));
const invalidManualHint = {
  ...manualHint,
  calculationStatus: CalculationStatus.CALCULATION_READY,
  blockedReason: undefined,
};
const invalidManualHintResult = validateSourceRow(invalidManualHint);
if (invalidManualHintResult.ok) {
  throw new Error("manual_hint fixture unexpectedly passed as calculation_ready");
}

console.log(`schema validation ok: fixtures=${results.length}, manual_hint_guard=blocked`);

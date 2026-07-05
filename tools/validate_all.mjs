import { spawnSync } from "node:child_process";

const scripts = [
  "validate:schema",
  "validate:legacy",
  "validate:adapters",
  "data:adapters",
  "validate:canonical-dataset",
  "validate:effect-normalization",
  "validate:value-resolution",
  "validate:dedupe",
  "validate:combat-ledger",
  "validate:aggregation",
  "validate:imports",
];

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

for (const script of scripts) {
  const result = spawnSync(`${npmCommand} run ${script}`, { stdio: "inherit", shell: true });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${script} failed with status ${result.status}`);
  }
}

console.log(`validate all ok: scripts=${scripts.length}`);

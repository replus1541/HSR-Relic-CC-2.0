import fs from "node:fs";

const builds = JSON.parse(fs.readFileSync("data/generated/default-character-builds.json", "utf8")).builds ?? {};
const manifest = JSON.parse(fs.readFileSync("data/generated/relic-icon-manifest.json", "utf8")).byRelicId ?? {};
const iconFiles = new Set(fs.readdirSync("public/relic-icons"));

const missing = [];
let checked = 0;

for (const build of Object.values(builds)) {
  for (const [slotKey, relicSet] of Object.entries(build.selectedRelics ?? {})) {
    if (slotKey === "set4Mode" || !relicSet?.id) continue;
    const relicId = normalizeRelicId(relicSet.id);
    const manifestRow = manifest[relicId];
    const pieceCount = slotKey === "set2" ? 2 : 4;
    checked += 1 + pieceCount;
    if (!manifestRow?.set || !iconFiles.has(manifestRow.set)) {
      missing.push(`${build.characterId}:${slotKey}:set:${relicId}:${relicSet.name}:${manifestRow?.set ?? "no-manifest"}`);
    }
    for (let pieceIndex = 1; pieceIndex <= pieceCount; pieceIndex += 1) {
      const file = manifestRow?.pieces?.[String(pieceIndex)];
      if (!file || !iconFiles.has(file)) {
        missing.push(`${build.characterId}:${slotKey}:piece${pieceIndex}:${relicId}:${relicSet.name}:${file ?? "no-piece"}`);
      }
    }
  }
}

if (missing.length) {
  console.error(`relic icon validation failed: missing=${missing.length}`);
  for (const row of missing.slice(0, 80)) console.error(`- ${row}`);
  process.exit(1);
}

console.log(`relic icon validation ok: checked=${checked}`);

function normalizeRelicId(id) {
  return String(id ?? "").replace(/^wiki-relic-/, "").trim();
}

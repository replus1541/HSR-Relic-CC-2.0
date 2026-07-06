import fs from "node:fs";
import path from "node:path";

const iconDir = path.join("public", "relic-icons");
const outputPath = path.join("data", "generated", "relic-icon-manifest.json");
const files = fs.readdirSync(iconDir)
  .filter((file) => /\.(png|webp)$/i.test(file))
  .sort((a, b) => a.localeCompare(b, "ko"));
const byRelicId = {};
const manualPieceIndexByKey = {
  head: "1",
  hands: "2",
  body: "3",
  feet: "4",
};

for (const file of files) {
  const generatedMatch = file.match(/^(\d+)-(.+?)(?:-(\d+)-piece-\d+)?\.(?:png|webp)$/iu);
  const manualMatch = file.match(/^(manual-[a-z0-9-]+?)(?:-(head|hands|body|feet))?\.webp$/iu);
  if (!generatedMatch && !manualMatch) continue;
  const relicId = generatedMatch?.[1] ?? manualMatch?.[1];
  const name = generatedMatch?.[2] ?? relicId;
  const pieceIndex = generatedMatch?.[3] ?? manualPieceIndexByKey[manualMatch?.[2]];
  byRelicId[relicId] ??= { id: relicId, name, set: null, pieces: {} };
  if (pieceIndex) byRelicId[relicId].pieces[pieceIndex] = file;
  else byRelicId[relicId].set = file;
}

const payload = {
  app: "hsr-relic-cc-relic-icon-manifest",
  generatedAt: new Date().toISOString(),
  byRelicId,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`relic icon manifest ok: sets=${Object.keys(byRelicId).length} files=${files.length}`);

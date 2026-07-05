import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const legacyRequire = createRequire("file:///C:/CODEX/HSR%20RELIC%20CC/package.json");
const { chromium } = legacyRequire("playwright");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.env.V2_URL ?? "http://127.0.0.1:5173/";
const outDir = path.resolve("artifacts", "stats-damage-v1-v2");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const payload = {
  version: 1,
  activeSlotId: "slot-1",
  enemy: { count: 3, level: 95, toughness: 90, resistance: 20 },
  partySpecificSettings: { elationCertifiedBangerStacks: 240, elationMerrymake: 0.2 },
  party: [
    { slotId: "slot-1", characterId: "Sparxie_00", eidolon: 0, lightconeRank: 1 },
    { slotId: "slot-2", characterId: "PlayerBoy_40", eidolon: 0, lightconeRank: 1 },
    { slotId: "slot-3", characterId: "YaoGuang_00", eidolon: 0, lightconeRank: 1 },
    { slotId: "slot-4", characterId: "Cyrene_00", eidolon: 0, lightconeRank: 1 },
  ],
};
await context.addCookies([{
  name: "hsr_relic_cc_v2_calculator_state",
  value: encodeURIComponent(JSON.stringify(payload)),
  url,
  sameSite: "Lax",
}]);
const page = await context.newPage();
await page.goto(url);
await page.getByRole("button", { name: "스탯 / 데미지 계산" }).click();
await page.waitForSelector(".calc-party-settings-panel", { timeout: 5000 });
const text = await page.locator(".calc-party-settings-panel").innerText();
const hasCertifiedBanger = text.includes("Certified Banger");
const hasMerrymake = text.includes("Merrymake");
await page.screenshot({ path: path.join(outDir, "v2-elation-settings-mobile-390.png"), fullPage: true });
await page.getByRole("button", { name: "조건부 비교" }).click();
await page.waitForSelector(".calc-condition-delta-strip", { timeout: 5000 });
const conditionText = await page.locator(".calc-condition-compare").innerText();
const hasConditionCertifiedBanger = conditionText.includes("Certified Banger");
const hasConditionMerrymake = conditionText.includes("Merrymake");
const hasConditionDelta = conditionText.includes("기준 피해") && conditionText.includes("비교 피해") && conditionText.includes("변화량");
await page.screenshot({ path: path.join(outDir, "v2-condition-elation-settings-mobile-390.png"), fullPage: true });
await browser.close();

if (!hasCertifiedBanger || !hasMerrymake) {
  throw new Error(`elation settings missing: Certified=${hasCertifiedBanger}, Merrymake=${hasMerrymake}`);
}
if (!hasConditionCertifiedBanger || !hasConditionMerrymake || !hasConditionDelta) {
  throw new Error(`condition compare settings missing: Certified=${hasConditionCertifiedBanger}, Merrymake=${hasConditionMerrymake}, Delta=${hasConditionDelta}`);
}

console.log("elation settings ui ok: Certified Banger and Merrymake controls visible in stats and condition compare");

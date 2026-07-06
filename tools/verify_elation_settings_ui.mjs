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
  partySpecificSettings: { "elationCertifiedBangerStacks:Sparxie_00": 240, "elationCertifiedBangerStacks:PlayerBoy_40": 120, "elationCertifiedBangerStacks:YaoGuang_00": 80 },
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
const hasCertifiedBanger = text.includes("웃음포인트");
const hasMerrymake = text.includes("Merrymake");
const hasMerrymakeKo = text.includes("증소");
await page.screenshot({ path: path.join(outDir, "v2-elation-settings-mobile-390.png"), fullPage: true });
await page.getByRole("button", { name: "조건부 비교" }).click();
await page.waitForSelector(".calc-condition-compare", { timeout: 5000 });
const conditionText = await page.locator(".calc-condition-compare").innerText();
const hasConditionCertifiedBanger = conditionText.includes("웃음포인트");
const hasConditionMerrymake = conditionText.includes("Merrymake");
const hasConditionMerrymakeKo = conditionText.includes("증소");
await page.screenshot({ path: path.join(outDir, "v2-condition-elation-settings-mobile-390.png"), fullPage: true });
await browser.close();

if (!hasCertifiedBanger || hasMerrymake || hasMerrymakeKo) {
  throw new Error(`elation settings missing: Certified=${hasCertifiedBanger}, Merrymake=${hasMerrymake}, 증소=${hasMerrymakeKo}`);
}
if (!hasConditionCertifiedBanger || hasConditionMerrymake || hasConditionMerrymakeKo) {
  throw new Error(`condition compare settings missing: Certified=${hasConditionCertifiedBanger}, Merrymake=${hasConditionMerrymake}, 증소=${hasConditionMerrymakeKo}`);
}

console.log("elation settings ui ok: per-character 웃음포인트 visible and manual 증소 hidden");

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const legacyRequire = createRequire("file:///C:/CODEX/HSR%20RELIC%20CC/package.json");
const { chromium } = legacyRequire("playwright");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const rootDir = path.resolve(import.meta.dirname, "..");
const outDir = path.join(rootDir, "artifacts", "layout-compare");
const legacyUrl = process.env.LEGACY_URL ?? "http://127.0.0.1:5174/";
const v2Url = process.env.V2_URL ?? "http://127.0.0.1:5173/";
const viewport = { width: 390, height: 844 };

fs.mkdirSync(outDir, { recursive: true });

const pairs = [
  ["topbar", ".topbar", ".calc-topbar"],
  ["topTabFirst", ".top-tabs button", ".calc-top-tabs button"],
  ["partyRow", ".party-row", ".calc-party-row"],
  ["partySlot", ".party-slot", ".calc-party-slot"],
  ["statusGrid", ".status-grid", ".calc-status-grid"],
  ["statusCard", ".status-card", ".calc-status-card"],
  ["profileButton", ".status-profile-button", ".calc-profile-button"],
  ["eidolonSelect", ".eidolon-badge", ".calc-status-head select"],
  ["lightconeButton", ".header-lightcone-button", ".calc-lightcone-button"],
  ["relicPart", ".relic-parts span", ".calc-relic-parts span"],
  ["relicIcon", ".relic-parts img", ".calc-relic-parts img"],
  ["precombatCell", ".precombat-stats > span", ".calc-precombat-stats span"],
  ["settingsSheet", ".settings-sheet", ".calc-settings-sheet"],
];

const browser = await chromium.launch({
  executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  headless: true,
});

const legacy = await openPage(legacyUrl);
const v2 = await openPage(v2Url);

await fillLegacyPartyIfEmpty(legacy.page);
await legacy.page.waitForTimeout(150);

await legacy.page.screenshot({ path: path.join(outDir, "legacy-characters-390.png"), fullPage: true });
await v2.page.screenshot({ path: path.join(outDir, "v2-characters-390.png"), fullPage: true });

await legacy.page.getByRole("button", { name: "설정" }).click();
await v2.page.getByRole("button", { name: "설정" }).click();
await legacy.page.screenshot({ path: path.join(outDir, "legacy-settings-390.png"), fullPage: true });
await v2.page.screenshot({ path: path.join(outDir, "v2-settings-390.png"), fullPage: true });

const rows = [];
for (const [name, legacySelector, v2Selector] of pairs) {
  const legacyMetric = await measure(legacy.page, legacySelector);
  const v2Metric = await measure(v2.page, v2Selector);
  rows.push({
    name,
    legacySelector,
    v2Selector,
    legacy: legacyMetric,
    v2: v2Metric,
    diffPct: diffPct(legacyMetric, v2Metric),
  });
}

await legacy.context.close();
await v2.context.close();
await browser.close();

const reportPath = path.join(outDir, "layout-compare.json");
fs.writeFileSync(reportPath, `${JSON.stringify(rows, null, 2)}\n`);

const summary = rows.map((row) => ({
  name: row.name,
  widthPct: row.diffPct.width,
  heightPct: row.diffPct.height,
  fontSizePct: row.diffPct.fontSize,
  legacy: row.legacy,
  v2: row.v2,
}));
console.log(JSON.stringify({ reportPath, summary }, null, 2));

async function openPage(url) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  return { context, page };
}

async function fillLegacyPartyIfEmpty(page) {
  const hasStatusCard = await page.locator(".status-card").first().isVisible().catch(() => false);
  if (hasStatusCard) return;
  const slotCount = await page.locator(".party-slot").count();
  for (let index = 0; index < Math.min(4, slotCount); index += 1) {
    await page.locator(".party-slot").nth(index).click();
    const picker = page.locator(".picker-sheet");
    await picker.waitFor({ state: "visible", timeout: 2000 });
    const choice = page.locator(".character-choice").nth(index);
    await choice.click();
    await picker.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
  }
}

async function measure(page, selector) {
  return page.evaluate((selectorInPage) => {
    const toFixed1 = (value) => Math.round(value * 10) / 10;
    const parseCssNumber = (value) => {
      const number = Number.parseFloat(value);
      return Number.isFinite(number) ? toFixed1(number) : null;
    };
    const element = document.querySelector(selectorInPage);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
      width: toFixed1(rect.width),
      height: toFixed1(rect.height),
      top: toFixed1(rect.top),
      left: toFixed1(rect.left),
      fontSize: parseCssNumber(style.fontSize),
      fontWeight: style.fontWeight,
      gap: parseCssNumber(style.gap),
      paddingTop: parseCssNumber(style.paddingTop),
      paddingRight: parseCssNumber(style.paddingRight),
      paddingBottom: parseCssNumber(style.paddingBottom),
      paddingLeft: parseCssNumber(style.paddingLeft),
    };
  }, selector);
}

function diffPct(a, b) {
  const result = {};
  for (const key of ["width", "height", "fontSize", "gap", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) {
    if (!a || !b || !Number.isFinite(a[key]) || !Number.isFinite(b[key]) || a[key] === 0) {
      result[key] = null;
      continue;
    }
    result[key] = round(Math.abs(b[key] - a[key]) / a[key] * 100);
  }
  return result;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function roundNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? round(number) : null;
}

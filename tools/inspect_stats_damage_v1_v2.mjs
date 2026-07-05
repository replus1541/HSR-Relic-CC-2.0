import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const legacyRequire = createRequire("file:///C:/CODEX/HSR%20RELIC%20CC/package.json");
const { chromium } = legacyRequire("playwright");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const rootDir = path.resolve(import.meta.dirname, "..");
const outDir = path.join(rootDir, "artifacts", "stats-damage-v1-v2");
const legacyUrl = process.env.LEGACY_URL ?? "http://127.0.0.1:5174/";
const v2Url = process.env.V2_URL ?? "http://127.0.0.1:5173/";

const viewports = [
  { name: "mobile-390", width: 390, height: 844, isMobile: true },
  { name: "desktop-1180", width: 1180, height: 900, isMobile: false },
];

const selectorPairs = [
  ["shell", ".app-shell", ".calculator-shell"],
  ["topbar", ".topbar", ".calc-topbar"],
  ["page", ".party-evaluation", ".calc-party-evaluation"],
  ["mainDealer", ".current-party-summary-row", ".calc-current-party-summary-row"],
  ["enemy", ".enemy-list", ".calc-enemy-card"],
  ["partySettings", ".party-specific-settings", ".calc-party-settings-panel"],
  ["evaluationShell", ".main-dealer-card", ".calc-evaluation-shell"],
  ["evaluationList", ".evaluation-card-list", ".calc-evaluation-panel"],
  ["evaluationGroup", ".evaluation-group", ".calc-evaluation-group"],
  ["evaluationCard", ".evaluation-card", ".calc-evaluation-card"],
  ["contributionTabs", ".damage-contribution-toolbar", ".calc-contribution-tabs"],
  ["damagePanel", ".damage-analysis-panel", ".calc-damage-analysis-panel"],
  ["damageCard", ".damage-skill-card", ".calc-damage-skill-card"],
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  headless: true,
});

const report = [];
for (const viewport of viewports) {
  const legacy = await openPage(legacyUrl, viewport);
  const v2 = await openPage(v2Url, viewport);

  await fillLegacyPartyIfEmpty(legacy.page);
  await switchToStatsDamage(legacy.page);
  await switchToStatsDamage(v2.page);
  await legacy.page.waitForTimeout(300);
  await v2.page.waitForTimeout(300);

  await legacy.page.screenshot({ path: path.join(outDir, `v1-stats-damage-${viewport.name}.png`), fullPage: true });
  await v2.page.screenshot({ path: path.join(outDir, `v2-stats-damage-${viewport.name}.png`), fullPage: true });

  await legacy.page.locator(".evaluation-card .evaluation-row").first().click();
  await v2.page.locator(".calc-evaluation-card .calc-evaluation-row").first().click();
  await legacy.page.waitForTimeout(150);
  await v2.page.waitForTimeout(150);
  await legacy.page.screenshot({ path: path.join(outDir, `v1-stats-damage-expanded-${viewport.name}.png`), fullPage: true });
  await v2.page.screenshot({ path: path.join(outDir, `v2-stats-damage-expanded-${viewport.name}.png`), fullPage: true });

  await captureContributionStates(legacy.page, "v1", viewport.name);
  await captureContributionStates(v2.page, "v2", viewport.name);

  report.push({
    viewport: viewport.name,
    legacy: await collectPageState(legacy.page, "legacy"),
    v2: await collectPageState(v2.page, "v2"),
    pairs: await collectPairs(legacy.page, v2.page),
  });

  await legacy.context.close();
  await v2.context.close();
}

await browser.close();

const reportPath = path.join(outDir, "report.json");
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  reportPath,
  screenshots: fs.readdirSync(outDir).filter((name) => name.endsWith(".png")),
  summary: report.map((item) => summarize(item)),
}, null, 2));

async function openPage(url, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  return { context, page };
}

async function switchToStatsDamage(page) {
  await page.getByRole("button", { name: "스탯 / 데미지 계산" }).click();
}

async function fillLegacyPartyIfEmpty(page) {
  const hasStatusCard = await page.locator(".status-card").first().isVisible().catch(() => false);
  if (hasStatusCard) return;
  const slotCount = await page.locator(".party-slot").count();
  for (let index = 0; index < Math.min(4, slotCount); index += 1) {
    await page.locator(".party-slot").nth(index).click();
    const picker = page.locator(".picker-sheet");
    await picker.waitFor({ state: "visible", timeout: 2000 });
    await page.locator(".character-choice").nth(index).click();
    await picker.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
  }
}

async function captureContributionStates(page, prefix, viewportName) {
  const tabSelector = prefix === "v1" ? ".damage-contribution-toolbar" : ".calc-contribution-tabs";
  const rowSelector = prefix === "v1" ? ".damage-influence-card .damage-influence-toggle" : ".calc-contribution-card .calc-contribution-row";
  const statTab = page.getByRole("tab", { name: prefix === "v1" ? "스탯 별" : "스탯별" });
  const partyTab = page.getByRole("tab", { name: "파티원 추천" });
  const characterTab = page.getByRole("tab", { name: "캐릭터별" });

  await page.locator(tabSelector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${prefix}-contribution-tabs-${viewportName}.png`), fullPage: false });

  await characterTab.click();
  await page.locator(rowSelector).first().click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${prefix}-contribution-character-expanded-${viewportName}.png`), fullPage: false });

  await statTab.click();
  await page.waitForTimeout(100);
  await page.locator(rowSelector).first().click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${prefix}-contribution-stat-expanded-${viewportName}.png`), fullPage: false });

  await partyTab.click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, `${prefix}-contribution-party-${viewportName}.png`), fullPage: false });
}

async function collectPairs(legacyPage, v2Page) {
  const rows = [];
  for (const [name, legacySelector, v2Selector] of selectorPairs) {
    const legacyMetric = await measure(legacyPage, legacySelector);
    const v2Metric = await measure(v2Page, v2Selector);
    rows.push({ name, legacySelector, v2Selector, legacy: legacyMetric, v2: v2Metric });
  }
  return rows;
}

async function collectPageState(page, label) {
  return page.evaluate((pageLabel) => {
    const localRound = (value) => Math.round(value * 10) / 10;
    const topbar = document.querySelector(pageLabel === "legacy" ? ".topbar" : ".calc-topbar");
    const pageRoot = document.querySelector(pageLabel === "legacy" ? ".party-evaluation" : ".calc-party-evaluation");
    const firstContent = pageRoot?.firstElementChild ?? null;
    const topbarRect = topbar?.getBoundingClientRect();
    const pageRect = pageRoot?.getBoundingClientRect();
    const firstRect = firstContent?.getBoundingClientRect();
    const visibleTexts = [...document.querySelectorAll("button, strong, span, small, label, h2, h3, p")]
      .map((element) => element.textContent.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .filter((text, index, array) => array.indexOf(text) === index)
      .slice(0, 80);
    return {
      url: location.href,
      scroll: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
      },
      verticalGap: topbarRect && firstRect ? localRound(firstRect.top - topbarRect.bottom) : null,
      pageTop: pageRect ? localRound(pageRect.top) : null,
      firstContent: firstContent ? {
        className: firstContent.className,
        text: firstContent.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
        top: localRound(firstRect.top),
        height: localRound(firstRect.height),
      } : null,
      visibleTexts,
    };
  }, label);
}

async function measure(page, selector) {
  return page.evaluate((selectorInPage) => {
    const localRound = (value) => Math.round(value * 10) / 10;
    const element = document.querySelector(selectorInPage);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
      top: localRound(rect.top),
      left: localRound(rect.left),
      width: localRound(rect.width),
      height: localRound(rect.height),
      display: style.display,
      position: style.position,
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
      boxShadow: style.boxShadow,
    };
  }, selector);
}

function summarize(item) {
  const pair = Object.fromEntries(item.pairs.map((entry) => [entry.name, {
    legacyExists: Boolean(entry.legacy),
    v2Exists: Boolean(entry.v2),
    legacyTop: entry.legacy?.top ?? null,
    v2Top: entry.v2?.top ?? null,
    legacyBg: entry.legacy?.backgroundColor ?? null,
    v2Bg: entry.v2?.backgroundColor ?? null,
    legacyHeight: entry.legacy?.height ?? null,
    v2Height: entry.v2?.height ?? null,
  }]));
  return {
    viewport: item.viewport,
    legacyGap: item.legacy.verticalGap,
    v2Gap: item.v2.verticalGap,
    legacyFirst: item.legacy.firstContent,
    v2First: item.v2.firstContent,
    pair,
  };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

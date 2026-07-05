import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const legacyRequire = createRequire("file:///C:/CODEX/HSR%20RELIC%20CC/package.json");
const { chromium } = legacyRequire("playwright");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const rootDir = path.resolve(import.meta.dirname, "..");
const outDir = path.join(rootDir, "artifacts", "calculator-mobile");
const viewports = [
  { width: 360, height: 800, name: "mobile-360", isMobile: true },
  { width: 390, height: 844, name: "mobile-390", isMobile: true },
  { width: 430, height: 932, name: "mobile-430", isMobile: true },
  { width: 500, height: 900, name: "desktop-narrow-500", isMobile: false },
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  headless: true,
});

const report = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(outDir, `calculator-characters-${viewport.name}.png`),
    fullPage: true,
  });
  report.push({ viewport, view: "characters", ...(await collectMetrics(page)) });

  await page.getByRole("button", { name: "스탯 / 데미지 계산" }).click();
  await page.screenshot({
    path: path.join(outDir, `calculator-buffs-${viewport.name}.png`),
    fullPage: true,
  });
  report.push({ viewport, view: "buffs", ...(await collectMetrics(page)) });

  await page.getByRole("button", { name: "조건부 비교" }).click();
  await page.screenshot({
    path: path.join(outDir, `calculator-condition-${viewport.name}.png`),
    fullPage: true,
  });
  report.push({ viewport, view: "conditionCompare", ...(await collectMetrics(page)) });

  await page.getByRole("button", { name: "캐릭터 세팅" }).click();

  await page.locator(".calc-party-slot").first().click();
  await page.screenshot({
    path: path.join(outDir, `picker-${viewport.name}.png`),
    fullPage: true,
  });
  report.push({ viewport, view: "picker", ...(await collectMetrics(page)) });
  await page.locator(".calc-picker-sheet .calc-icon-button").click();

  await page.locator(".calc-lightcone-button").first().click();
  await page.screenshot({
    path: path.join(outDir, `lightcone-${viewport.name}.png`),
    fullPage: true,
  });
  report.push({ viewport, view: "lightcone", ...(await collectMetrics(page)) });
  await page.locator(".calc-lightcone-sheet .calc-close-button").click();

  await page.locator(".calc-equipment-button").first().click();
  await page.screenshot({
    path: path.join(outDir, `relic-${viewport.name}.png`),
    fullPage: true,
  });
  report.push({ viewport, view: "relic", ...(await collectMetrics(page)) });
  await page.locator(".calc-relic-sheet .calc-close-button").click();

  await page.getByRole("button", { name: "설정" }).click();
  await page.screenshot({
    path: path.join(outDir, `settings-${viewport.name}.png`),
    fullPage: true,
  });
  report.push({ viewport, view: "settings", ...(await collectMetrics(page)) });
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator(".calc-sheet-head .calc-icon-button").click();

  await context.close();
}

await browser.close();

const reportPath = path.join(outDir, "report.json");
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  reportPath,
  screenshots: fs.readdirSync(outDir).filter((name) => name.endsWith(".png")),
  report,
}, null, 2));

async function collectMetrics(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const selector = [
      ".calculator-shell",
      ".calc-topbar",
      ".calc-party-row",
      ".calc-party-slot",
      ".calc-status-card",
      ".calc-main-dealer-card",
      ".calc-enemy-card",
      ".calc-damage-analysis-panel",
      ".calc-condition-compare",
      ".calc-condition-grid",
      ".calc-picker-panel",
      ".calc-character-grid button",
      ".calc-settings-sheet",
      ".calc-settings-action",
      ".calc-lightcone-sheet",
      ".calc-lightcone-choice",
      ".calc-relic-sheet",
      ".calc-piece-editor-card",
    ].join(",");
    const rects = [...document.querySelectorAll(selector)]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: element.className ? `.${String(element.className).trim().replace(/\s+/g, ".")}` : element.tagName.toLowerCase(),
          text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          top: Math.round(rect.top * 10) / 10,
          left: Math.round(rect.left * 10) / 10,
        };
      })
      .filter((item) => item.width > 0 && item.height > 0);

    const visibleTexts = [...document.querySelectorAll("button, strong, span, small, label, h2, h3, p")]
      .map((element) => element.textContent.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .filter((text, index, array) => array.indexOf(text) === index)
      .slice(0, 80);

    return {
      overflow: {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        bodyClientWidth: body.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1,
      },
      rects,
      visibleTexts,
    };
  });
}

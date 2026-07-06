import fs from "node:fs";
import { createRequire } from "node:module";

const legacyRequire = createRequire("file:///C:/CODEX/HSR%20RELIC%20CC/package.json");
const { chromium } = legacyRequire("playwright");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({
  executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "조건부 비교" }).click();
await page.getByText("비교 조건을 추가하면").waitFor();
await page.getByRole("button", { name: "비교조건 추가" }).click();
await page.getByRole("dialog", { name: "비교조건 편집" }).waitFor();
await page.locator(".calc-condition-mini-card select").last().selectOption("2");
await page.getByRole("button", { name: "확인" }).click();
await page.getByText("돌파 변경").waitFor();
await page.getByText("기준 피해").waitFor();
await page.getByText("비교 피해").waitFor();
await page.getByText("변화량").waitFor();
await page.screenshot({
  path: "artifacts/calculator-mobile/condition-with-result-mobile-390.png",
  fullPage: true,
});
await page.locator(".calc-condition-result-head").first().click();
await page.screenshot({
  path: "artifacts/calculator-mobile/condition-expanded-mobile-390.png",
  fullPage: true,
});
await page.getByRole("button", { name: "비교 조건 삭제" }).click();
await page.getByText("비교 조건을 추가하면").waitFor();
await page.getByRole("button", { name: "자동추천 설정" }).click();
await page.locator(".calc-auto-recommend-party-slot").nth(1).click();
await page.getByText("유지").first().waitFor();

await page.screenshot({
  path: "artifacts/calculator-mobile/condition-settings-mobile-390.png",
  fullPage: true,
});

await browser.close();
console.log("condition compare interaction ok");

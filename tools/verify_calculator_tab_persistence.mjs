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
await page.evaluate(() => {
  localStorage.removeItem("hsr_relic_cc_v2_calculator_state_v1");
  document.cookie = "hsr_relic_cc_v2_calculator_state=; Max-Age=0; Path=/";
});
await page.reload({ waitUntil: "networkidle" });
await assertTopTabs(page);
await page.locator(".calc-party-slot").nth(1).click();
await page.locator(".calc-picker-sheet .calc-close-button").click();
await page.getByRole("button", { name: "스탯 / 데미지 계산" }).click();
await page.locator(".calc-main-dealer-trigger").getByText("개척자 • 기억").waitFor();
await assertMainDealerSummaryLayout(page);
await page.evaluate(() => {
  const encoded = localStorage.getItem("hsr_relic_cc_v2_calculator_state_v1");
  if (!encoded) throw new Error("calculator state was not written to localStorage");
  const payload = JSON.parse(decodeURIComponent(encoded));
  if (payload.activeTab !== "buffs") throw new Error(`activeTab not stored: ${payload.activeTab}`);
  if (payload.activeSlotId !== "slot-1") throw new Error(`stats tab did not switch to first slot: ${payload.activeSlotId}`);
});
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: "스탯 / 데미지 계산" }).evaluate((element) => {
  if (!element.classList.contains("is-active")) {
    throw new Error("stats tab did not persist after reload");
  }
});
await page.locator(".calc-main-dealer-trigger").getByText("개척자 • 기억").waitFor();
await page.locator(".calc-main-dealer-trigger").getByText("E0").waitFor();
await assertMainDealerSummaryLayout(page);
await assertConditionCompareTopTab(context);
await browser.close();
console.log("calculator tab persistence ok");

async function assertTopTabs(page) {
  await page.locator(".calc-top-tabs button").first().waitFor();
  const labels = await page.locator(".calc-top-tabs button").evaluateAll((buttons) => buttons.map((button) => button.textContent?.trim()));
  const expected = ["캐릭터 세팅", "스탯 / 데미지 계산", "조건부 비교"];
  if (labels.length !== expected.length || expected.some((label, index) => labels[index] !== label)) {
    throw new Error(`top tabs mismatch: ${labels.join(" | ")}`);
  }
}

async function assertConditionCompareTopTab(parentContext) {
  const desktop = await parentContext.browser().newContext({
    viewport: { width: 1280, height: 860 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await desktopPage.evaluate(() => {
    localStorage.removeItem("hsr_relic_cc_v2_calculator_state_v1");
    document.cookie = "hsr_relic_cc_v2_calculator_state=; Max-Age=0; Path=/";
  });
  await desktopPage.reload({ waitUntil: "networkidle" });
  await assertTopTabs(desktopPage);
  await desktopPage.getByRole("button", { name: "조건부 비교" }).click();
  await desktopPage.locator(".calc-condition-compare").waitFor();
  await desktopPage.evaluate(() => {
    const encoded = localStorage.getItem("hsr_relic_cc_v2_calculator_state_v1");
    if (!encoded) throw new Error("desktop calculator state was not written");
    const payload = JSON.parse(decodeURIComponent(encoded));
    if (payload.activeTab !== "conditionCompare") throw new Error(`condition tab not stored: ${payload.activeTab}`);
    if (payload.activeSlotId !== "slot-1") throw new Error(`condition tab did not switch to first slot: ${payload.activeSlotId}`);
  });
  await desktop.close();
}

async function assertMainDealerSummaryLayout(page) {
  await page.locator(".calc-main-dealer-trigger .calc-main-dealer-eidolon").waitFor();
  await page.locator(".calc-main-dealer-trigger .calc-main-dealer-icons img").first().waitFor();
  await page.locator(".calc-main-dealer-trigger").evaluate((element) => {
    const title = element.querySelector(".calc-main-dealer-copy strong");
    const name = title?.querySelector("span");
    const eidolon = title?.querySelector(".calc-main-dealer-eidolon");
    const icons = element.querySelector(".calc-main-dealer-icons");
    if (!title || !name || !eidolon || !icons) {
      throw new Error("main dealer summary missing name/eidolon/icons");
    }
    if (eidolon.parentElement !== title) {
      throw new Error("eidolon badge is not attached to the name line");
    }
    if (icons.querySelectorAll("img").length < 2) {
      throw new Error("element/path icons are not both rendered on the right side");
    }
  });
}

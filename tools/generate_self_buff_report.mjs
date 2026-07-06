import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outPath = path.join(root, "reports", "audit", "character-self-buff-effects.md");
const source = readJson("data/legacy-reference/game-db/character-effect-candidates.json");

const targetPolicyOverridesBySourceId = new Map([
  ["HoyoWiki:3287:E1:현재의 서술자:critRate:0", "singleAlly"],
  ["HoyoWiki:5006:E4:세상을 구하는 데 이유는 필요 없어:vulnerability:0", "enemyAll"],
]);

const selfTextPattern = /자신|자신의|자신이|본인|해당 캐릭터|장착한 캐릭터|기억 정령 .*가하는|이카가|긴 밤.*가하는|카오스라나|경류가|파이논|에바네시아|효광/;
const allyTextPattern = /모든 아군|아군 전체|동료|아군의|아군이|지정된 아군|단일 아군/;
const percentStats = new Set([
  "hpRatio",
  "atkRatio",
  "defRatio",
  "speedRatio",
  "critRate",
  "critDamage",
  "breakEffect",
  "effectHitRate",
  "effectResistance",
  "energyRegen",
  "outgoingHealingBoost",
  "elementDamage",
  "allDamage",
  "basicDamage",
  "skillDamage",
  "ultimateDamage",
  "followDamage",
  "dotDamage",
  "breakDamage",
  "vulnerability",
  "defenseDown",
  "defenseIgnore",
  "resistancePen",
  "trueDamageRatio",
  "dealtCritDamage",
  "followCritDamage",
  "specialFinal",
  "merrymake",
]);

const lines = [];
lines.push("# 캐릭터별 자버프 및 자버프 의심 효과 정리");
lines.push("");
lines.push(`- 생성일: ${new Date().toISOString()}`);
lines.push("- 기준 파일: `data/legacy-reference/game-db/character-effect-candidates.json`");
lines.push("- 포함 기준: 현재 targetScope가 `self`인 효과 + 원문에 자버프 문맥이 있는데 `allAllies`/`singleAlly`로 분류된 의심 효과");
lines.push("- `판정`이 `자버프 의심-대상검수필요`인 행은 계산기에 그대로 쓰면 파티 전체/단일 아군으로 잘못 퍼질 수 있는 후보입니다.");
lines.push("- `manual_guide` 기반 미추출 힌트는 실제 HoyoWiki 원문 근거가 아니므로 이 보고서에서 제외합니다.");
lines.push("");

const characters = [...(source.characters ?? [])]
  .filter((character) => character?.avatar)
  .sort((a, b) => String(a.name ?? a.avatar).localeCompare(String(b.name ?? b.avatar), "ko"));

for (const character of characters) {
  const rows = [];
  for (const row of character.activeEffects ?? []) {
    const target = normalizeTarget(targetPolicyOverridesBySourceId.get(row.sourceId ?? row.sourceRecord) ?? row.targetScope ?? row.target);
    const sourceText = String(row.sourceText ?? "");
    const hasSelfText = selfTextPattern.test(sourceText);
    const hasAllyText = allyTextPattern.test(sourceText);
    if (target === "self") {
      rows.push({ verdict: "자버프", row });
    } else if ((target === "all_allies" || target === "single_ally") && hasSelfText) {
      rows.push({
        verdict: hasAllyText ? "자버프 의심-혼합문장" : "자버프 의심-대상검수필요",
        row,
      });
    }
  }
  if (!rows.length) continue;

  lines.push(`## ${escapeMd(character.name ?? character.avatar)} (\`${character.avatar}\`)`);
  lines.push("");
  lines.push("| 판정 | 출처 | 옵션 | 값 | 현재 대상 | 조건/비고 | sourceId | 원문 |");
  lines.push("|---|---|---|---:|---|---|---|---|");
  for (const item of rows.sort(compareItems)) {
    const row = item.row;
    lines.push([
      item.verdict,
      escapeMd(sourceName(row)),
      statLabel(row.stat ?? row.effectType ?? row.label),
      formatValue(row.stat ?? row.effectType, row.resolvedValue ?? row.value ?? row.dynamicFlat ?? null),
      targetLabel(targetPolicyOverridesBySourceId.get(row.sourceId ?? row.sourceRecord) ?? row.targetScope ?? row.target ?? row.targetPolicy),
      escapeMd(conditionText(row)),
      `\`${escapeMd(row.sourceId ?? row.sourceRecord ?? row.id ?? "-")}\``,
      escapeMd(shortText(row.sourceText ?? row.note ?? row.verificationNote ?? "")),
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }
  lines.push("");
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`wrote ${outPath}`);
console.log(`characters=${characters.length}`);

function compareItems(a, b) {
  return String(a.verdict).localeCompare(String(b.verdict), "ko")
    || String(sourceName(a.row)).localeCompare(String(sourceName(b.row)), "ko")
    || String(a.row.stat ?? a.row.effectType ?? "").localeCompare(String(b.row.stat ?? b.row.effectType ?? ""), "ko");
}

function sourceName(row) {
  return row.sourceName ?? row.source ?? row.manualSource ?? row.sourceKind ?? "-";
}

function conditionText(row) {
  return [
    row.condition,
    row.conditionStatus,
    row.valueMode,
    row.stackRule ? `stack ${row.stackRule.defaultStacks ?? row.defaultStacks ?? "-"} / max ${row.stackRule.maxStacks ?? row.maxStacks ?? "-"}` : null,
    row.blockedReason,
  ].filter(Boolean).join(" / ");
}

function statLabel(stat) {
  return {
    hp: "HP",
    hpRatio: "HP%",
    hpFlat: "HP",
    atk: "공격력",
    atkRatio: "공격력%",
    atkFlat: "공격력",
    def: "방어력",
    defRatio: "방어력%",
    defFlat: "방어력",
    speed: "속도",
    speedRatio: "속도%",
    critRate: "치확",
    critDamage: "치피",
    breakEffect: "격특",
    effectHitRate: "효과 명중",
    effectResistance: "효과 저항",
    energyRegen: "에너지 회복",
    outgoingHealingBoost: "치유량",
    elementDamage: "속성 피해",
    allDamage: "가피증",
    basicDamage: "일반공격 피해",
    skillDamage: "전투스킬 피해",
    ultimateDamage: "필살기 피해",
    followDamage: "추가공격 피해",
    dotDamage: "지속피해",
    breakDamage: "격파 피해",
    vulnerability: "받피증",
    defenseDown: "방깎",
    defenseIgnore: "방무",
    resistancePen: "속저관",
    trueDamageRatio: "확정피해",
    dealtCritDamage: "가하는 치명타 피해",
    followCritDamage: "추가공격 치피",
    specialFinal: "최종 피해",
    elation: "환락도",
    merrymake: "Merrymake",
  }[stat] ?? stat ?? "-";
}

function targetLabel(target) {
  const normalized = normalizeTarget(target);
  return {
    self: "본인",
    all_allies: "아군 전체",
    single_ally: "단일 아군",
    enemy_single: "단일 적",
    enemy_all: "모든 적",
    enemy: "적",
  }[normalized] ?? target ?? "-";
}

function normalizeTarget(target) {
  const text = String(target ?? "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
  if (text === "all_allies" || text === "allallies") return "all_allies";
  if (text === "single_ally" || text === "singleally") return "single_ally";
  if (text === "enemy_single" || text === "enemysingle") return "enemy_single";
  if (text === "enemy_all" || text === "enemyall") return "enemy_all";
  return text || "unknown";
}

function formatValue(stat, value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (percentStats.has(stat)) return `${(number * 100).toFixed(1)}%`;
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(3)));
}

function shortText(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function escapeMd(value) {
  return String(value ?? "-").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outPath = path.join(root, "reports", "audit", "eidolon-1-2-4-6-effects.md");
const source = readJson("data/legacy-reference/game-db/character-effect-candidates.json");

const eidolons = ["E1", "E2", "E4", "E6"];
const targetPolicyOverridesBySourceId = new Map([
  ["HoyoWiki:3287:E1:현재의 서술자:critRate:0", "singleAlly"],
  ["HoyoWiki:5006:E4:세상을 구하는 데 이유는 필요 없어:vulnerability:0", "enemyAll"],
]);
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
lines.push("# 캐릭터별 E1/E2/E4/E6 돌파 효과 정리");
lines.push("");
lines.push(`- 생성일: ${new Date().toISOString()}`);
lines.push("- 기준 파일: `data/legacy-reference/game-db/character-effect-candidates.json`");
lines.push("- 기준 상태: 풀돌(E6) 캐릭터가 보유하는 E1/E2/E4/E6 효과");
lines.push("- 표의 `대상`은 현재 추출/정규화 데이터의 targetScope입니다. 이 파일은 잘못 분류된 대상 범위를 검수하기 위한 원문도 같이 남깁니다.");
lines.push("- `계산 효과 없음`은 해당 돌파에서 현재 source-backed 계산 row가 없다는 뜻입니다.");
lines.push("- `manual_guide` 기반 미추출 힌트는 실제 HoyoWiki 원문 근거가 아니므로 이 보고서에서 제외합니다.");
lines.push("");

const characters = [...(source.characters ?? [])]
  .filter((character) => character?.avatar)
  .sort((a, b) => String(a.name ?? a.avatar).localeCompare(String(b.name ?? b.avatar), "ko"));

for (const character of characters) {
  lines.push(`## ${escapeMd(character.name ?? character.avatar)} (\`${character.avatar}\`)`);
  lines.push("");

  const rowsByEidolon = new Map(eidolons.map((eidolon) => [eidolon, []]));
  for (const row of character.activeEffects ?? []) {
    const eidolon = getEidolon(row);
    if (rowsByEidolon.has(eidolon)) rowsByEidolon.get(eidolon).push({ kind: "계산", row });
  }
  for (const row of character.triggeredAdditionalDamage ?? []) {
    const eidolon = getEidolon(row);
    if (rowsByEidolon.has(eidolon)) rowsByEidolon.get(eidolon).push({ kind: "추가피해", row });
  }
  for (const eidolon of eidolons) {
    lines.push(`### ${eidolon}`);
    lines.push("");
    const rows = rowsByEidolon.get(eidolon) ?? [];
    if (!rows.length) {
      lines.push("- 계산 효과 없음");
      lines.push("");
      continue;
    }
    lines.push("| 구분 | 출처 | 옵션 | 값 | 대상 | 조건/비고 | sourceId | 원문 |");
    lines.push("|---|---|---|---:|---|---|---|---|");
    for (const item of rows.sort(compareItems)) {
      const row = item.row;
      lines.push([
        item.kind,
        escapeMd(sourceName(row)),
        statLabel(row.stat ?? row.effectType ?? row.label),
        formatValue(row.stat ?? row.effectType, row.resolvedValue ?? row.value ?? row.dynamicFlat ?? row.coefficient ?? null),
        targetLabel(targetPolicyOverridesBySourceId.get(row.sourceId ?? row.sourceRecord) ?? row.targetScope ?? row.target ?? row.targetPolicy),
        escapeMd(conditionText(row)),
        `\`${escapeMd(row.sourceId ?? row.sourceRecord ?? row.id ?? "-")}\``,
        escapeMd(shortText(row.sourceText ?? row.note ?? row.verificationNote ?? "")),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    lines.push("");
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`wrote ${outPath}`);
console.log(`characters=${characters.length}`);

function getEidolon(row) {
  const text = [
    row?.sourceId,
    row?.sourceRecord,
    row?.sourcePath,
    row?.sourceName,
    row?.source,
    row?.condition,
    row?.manualSource,
  ].filter(Boolean).join(" ");
  const match = text.match(/\bE([1246])\b|성혼\s*([1246])/);
  if (!match) return null;
  return `E${match[1] ?? match[2]}`;
}

function compareItems(a, b) {
  return String(sourceName(a.row)).localeCompare(String(sourceName(b.row)), "ko")
    || String(a.row.stat ?? a.row.effectType ?? "").localeCompare(String(b.row.stat ?? b.row.effectType ?? ""), "ko")
    || String(a.kind).localeCompare(String(b.kind), "ko");
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
    resistancePen: "속관",
    trueDamageRatio: "확정피해",
    dealtCritDamage: "가하는 치명타 피해",
    followCritDamage: "추가공격 치피",
    specialFinal: "최종 피해",
    elation: "환락도",
    merrymake: "증소",
    triggeredAdditionalDamage: "추가피해",
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

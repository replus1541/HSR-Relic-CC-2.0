const damageStats = new Set([
  "allDamage",
  "specialFinal",
  "finalDamage",
  "damageBoost",
]);

function sumByStat(rows) {
  const totals = {};
  for (const row of rows) {
    if (!row.usedForCalculation || typeof row.resolvedValue !== "number") continue;
    totals[row.stat] = (totals[row.stat] ?? 0) + row.resolvedValue;
  }
  return Object.fromEntries(Object.entries(totals).sort(([left], [right]) => left.localeCompare(right)));
}

export function aggregateDamageModifiers(ledgerRows = []) {
  return sumByStat(ledgerRows.filter((row) => damageStats.has(row.stat)));
}

export function aggregateEnemyDebuffs(ledgerRows = []) {
  return sumByStat(ledgerRows.filter((row) => String(row.targetPolicy ?? "").startsWith("enemy")));
}

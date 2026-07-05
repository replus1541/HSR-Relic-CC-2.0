export function aggregateStats(ledgerRows = []) {
  const totals = {};
  for (const row of ledgerRows) {
    if (!row.usedForCalculation) continue;
    if (typeof row.resolvedValue !== "number") continue;
    totals[row.stat] = (totals[row.stat] ?? 0) + row.resolvedValue;
  }
  return Object.fromEntries(Object.entries(totals).sort(([left], [right]) => left.localeCompare(right)));
}

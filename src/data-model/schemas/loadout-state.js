export const LoadoutSourceKind = Object.freeze({
  SRTOOLS: "srtools",
  FREESR: "freesr",
  MANUAL_ENTRY: "manual_entry",
});

export function createEmptyLoadoutState({ sourceKind = LoadoutSourceKind.MANUAL_ENTRY, importId = "pending" } = {}) {
  return {
    version: 1,
    importId,
    sourceKind,
    roster: [],
    partySlots: [null, null, null, null],
    equipment: {
      lightcones: {},
      relics: {},
    },
    hints: {
      eidolon: {},
      skillLevels: {},
      superimposition: {},
    },
    warnings: [],
    failedRows: [],
  };
}

export const LoadoutStateRequiredFields = Object.freeze([
  "version",
  "importId",
  "sourceKind",
  "roster",
  "partySlots",
  "equipment",
  "hints",
  "warnings",
  "failedRows",
]);

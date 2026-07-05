export function createEmptyAdapterReport(adapterId, sourceKind) {
  return {
    adapterId,
    sourceKind,
    status: "not_implemented",
    counts: {
      sourceRows: 0,
      effectRows: 0,
      coefficientRows: 0,
      blockedRows: 0,
      warnings: 0,
      errors: 0,
    },
    warnings: [],
    errors: [],
  };
}

export function createPlaceholderAdapter({ adapterId, sourceKind }) {
  return Object.freeze({
    adapterId,
    sourceKind,
    load() {
      return null;
    },
    normalize() {
      return {
        sourceRows: [],
        effectRows: [],
        coefficientRows: [],
        blockedRows: [],
      };
    },
    report() {
      return createEmptyAdapterReport(adapterId, sourceKind);
    },
  });
}


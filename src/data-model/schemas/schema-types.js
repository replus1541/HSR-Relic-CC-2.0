/**
 * @typedef {object} SourceRow
 * @property {string} id
 * @property {string} sourceOrigin
 * @property {string} sourceKind
 * @property {string} sourcePath
 * @property {string} sourceRecord
 * @property {string} calculationStatus
 * @property {string=} blockedReason
 */

/**
 * @typedef {object} EffectRow
 * @property {string} id
 * @property {string} sourceId
 * @property {string} sourceOrigin
 * @property {string} effectType
 * @property {string} stat
 * @property {string} valueMode
 * @property {string} effectProviderId
 * @property {string} effectTargetPolicy
 * @property {string} calculationSubjectPolicy
 * @property {string} calculationStatus
 * @property {string=} blockedReason
 */

/**
 * @typedef {object} CoefficientRow
 * @property {string} id
 * @property {string} sourceId
 * @property {string} characterId
 * @property {string} skillId
 * @property {string} attackType
 * @property {string} targetProfile
 * @property {string} scalingStat
 * @property {number[]=} coefficientValues
 * @property {string} calculationStatus
 * @property {string=} blockedReason
 */

/**
 * @typedef {object} Condition
 * @property {string} id
 * @property {string} conditionType
 * @property {string} defaultPolicy
 * @property {string} calculationStatus
 * @property {string=} blockedReason
 */

/**
 * @typedef {object} StackRule
 * @property {string} id
 * @property {string} stackType
 * @property {number=} minStack
 * @property {number=} maxStack
 * @property {number=} defaultStack
 * @property {number[]=} presetValues
 * @property {string} calculationStatus
 * @property {string=} blockedReason
 */

/**
 * @typedef {object} ResolvedEffect
 * @property {string} id
 * @property {string} effectRowId
 * @property {string} sourceId
 * @property {string} stat
 * @property {number=} resolvedValue
 * @property {object} valueTrace
 * @property {string} dedupeKey
 * @property {string} calculationStatus
 * @property {string=} blockedReason
 */

/**
 * @typedef {object} CombatLedgerRow
 * @property {string} id
 * @property {string} sourceId
 * @property {string} ownerId
 * @property {string} subjectId
 * @property {string} targetPolicy
 * @property {string} stat
 * @property {number} value
 * @property {string} category
 * @property {object} sourceTrace
 * @property {string} calculationStatus
 * @property {string=} skippedReason
 */

/**
 * @typedef {object} AggregationResult
 * @property {string} id
 * @property {string} scenarioId
 * @property {string} subjectId
 * @property {string} inputHash
 * @property {string[]} ledgerRowIds
 * @property {Record<string, number>} statTotals
 * @property {object} sourceTrace
 * @property {Array<object>} skippedRows
 */

export {};


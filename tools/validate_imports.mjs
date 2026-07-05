import { LoadoutStateRequiredFields } from "../src/data-model/schemas/loadout-state.js";
import { freesrToLoadoutState } from "../src/adapters/freesr/freesr-import-adapter.js";
import { srtoolsToLoadoutState } from "../src/adapters/srtools/srtools-import-adapter.js";

function validateLoadoutState(state) {
  const errors = [];
  for (const field of LoadoutStateRequiredFields) {
    if (!(field in state)) errors.push(`missing ${field}`);
  }
  if (!Array.isArray(state.roster)) errors.push("roster must be array");
  if (!Array.isArray(state.partySlots) || state.partySlots.length !== 4) errors.push("partySlots must contain 4 slots");
  if (!state.equipment?.lightcones || !state.equipment?.relics) errors.push("equipment maps are required");
  if (!state.hints?.eidolon || !state.hints?.skillLevels || !state.hints?.superimposition) errors.push("hint maps are required");
  return { ok: errors.length === 0, errors };
}

function assertValid(name, state) {
  const result = validateLoadoutState(state);
  if (!result.ok) throw new Error(`${name} import failed validation: ${result.errors.join("; ")}`);
}

const srtools = srtoolsToLoadoutState();
const freesr = freesrToLoadoutState();
assertValid("srtools", srtools);
assertValid("freesr", freesr);

console.log(`import validation ok: srtoolsRoster=${srtools.roster.length}, freesrRoster=${freesr.roster.length}`);

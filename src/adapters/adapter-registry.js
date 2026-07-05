import { SourceKind } from "../data-model/schemas/index.js";
import { createPlaceholderAdapter } from "./adapter-contract.js";
import { localJsonAdapter } from "./local-json/local-json-adapter.js";

export const adapterRegistry = Object.freeze([
  localJsonAdapter,
  createPlaceholderAdapter({
    adapterId: "hoyowiki",
    sourceKind: SourceKind.HOYOWIKI,
  }),
  createPlaceholderAdapter({
    adapterId: "curated-source",
    sourceKind: SourceKind.CURATED_SOURCE,
  }),
]);

export function listAdapters() {
  return adapterRegistry;
}

export function getAdapter(adapterId) {
  return adapterRegistry.find((adapter) => adapter.adapterId === adapterId) ?? null;
}

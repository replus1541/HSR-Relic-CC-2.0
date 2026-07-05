import { SourceKind } from "../data-model/schemas/index.js";
import { createPlaceholderAdapter } from "./adapter-contract.js";

export const adapterRegistry = Object.freeze([
  createPlaceholderAdapter({
    adapterId: "local-json",
    sourceKind: SourceKind.LEGACY_SNAPSHOT,
  }),
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


# local-json adapter

Phase 6 local JSON adapter.

Current scope:

- registry-visible adapter id: `local-json`
- source kind: `legacy_snapshot`
- reads `data/legacy-reference/manifest.json`
- reads the minimal Phase 4-B legacy reference snapshot
- emits SourceRow and EffectRow candidates for a small character subset
- no runtime import wiring
- no calculation logic

# Reused Style Map

Generated for Task 13-A.

## Component Inventory

| component | purpose | implementation task | data rule |
| --- | --- | --- | --- |
| Card | repeated item frame only | 13-B | no calculation |
| Panel | route section grouping | 13-B | props only |
| Badge | status/source/blocked labels | 13-B | display enum/string only |
| Tabs | route-local view switch | 13-B | no data mutation outside selected tab |
| TraceRow | source/ledger trace line | 13-B | display sourceTrace only |
| EmptyState | missing data placeholder | 13-B | no fallback data generation |
| MetricList | compact key/value totals | 13-B | receives precomputed values |
| DataTable | generated status/ledger rows | 14-A+ | renders rows only |

## Legacy Style References

- Dense cards, compact section headers, and trace list spacing can be referenced from the legacy UI source map.
- Existing CSS must not be copied wholesale.
- Component CSS should be added only for the v2 component currently being implemented.

## Guardrails

- UI components do not call adapters, value resolvers, dedupe, ledger builders, or aggregation functions.
- UI components do not read legacy `sample-data.js` or guide data.
- UI components display generated canonical/ledger/aggregation outputs passed through props or route-level fixtures.

## Next

Task 13-B implements Card, Panel, Badge, Tabs, TraceRow, EmptyState, and MetricList as presentational components.

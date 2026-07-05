import { Card, MetricList, Panel } from "../../ui/components/index.js";

export function HomeRoute() {
  return (
    <Panel eyebrow="Overview" title="v2 Pipeline Shell">
      <div className="route-grid">
        <Card>
          <h3>Data Flow</h3>
          <MetricList
            items={[
              { label: "Extraction", value: "canonical" },
              { label: "Effects", value: "normalized" },
              { label: "Calculation", value: "ledger" },
            ]}
          />
        </Card>
        <Card>
          <h3>Boundary</h3>
          <p>Routes display generated outputs only. Adapter, resolver, dedupe, and aggregation work stays outside UI components.</p>
        </Card>
      </div>
    </Panel>
  );
}

import { ExtractionRoute } from "./routes/ExtractionRoute.jsx";
import { HomeRoute } from "./routes/HomeRoute.jsx";
import { LedgerRoute } from "./routes/LedgerRoute.jsx";
import { LegacyDiffRoute } from "./routes/LegacyDiffRoute.jsx";
import { CalculatorRoute } from "./routes/CalculatorRoute.jsx";
import { ExtractionDetail } from "../extraction/ExtractionDetail.jsx";

export const routes = [
  {
    path: "/",
    label: "계산기",
    title: "HSR Relic CC",
    component: CalculatorRoute,
    chrome: "calculator",
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    title: "v2 작업 대시보드",
    component: HomeRoute,
  },
  {
    path: "/extraction",
    label: "Extraction",
    title: "Canonical Dataset 검토",
    component: ExtractionRoute,
  },
  {
    path: "/extraction/:characterId",
    label: "Extraction Detail",
    title: "Extraction 상세",
    component: ExtractionDetail,
    hideFromNav: true,
  },
  {
    path: "/ledger",
    label: "Ledger",
    title: "Combat Ledger",
    component: LedgerRoute,
  },
  {
    path: "/legacy-diff",
    label: "Legacy Diff",
    title: "Legacy 비교",
    component: LegacyDiffRoute,
  },
];

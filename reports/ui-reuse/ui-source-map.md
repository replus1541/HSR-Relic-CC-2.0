# UI Source Map

Task 2-A 결과입니다. 이 문서는 기존 `C:\CODEX\HSR RELIC CC`의 UI 관련 파일을 읽고 v2에서의 사용 방식을 분류합니다.

## Task 2-A 범위

- 읽은 기존 경로:
  - `C:\CODEX\HSR RELIC CC\src\calculator`
  - `C:\CODEX\HSR RELIC CC\src\components`
  - `C:\CODEX\HSR RELIC CC\src\conditions`
  - `C:\CODEX\HSR RELIC CC\src\active-effects`
  - `C:\CODEX\HSR RELIC CC\src\styles.css`
- v2 수정 경로:
  - `C:\CODEX\HSR RELIC CC 2.0\reports\ui-reuse\ui-source-map.md`
  - `C:\CODEX\HSR RELIC CC 2.0\HSR_RELIC_CC_v2_phase_log.md`

## 공통 금지 원칙

- 기존 `C:\CODEX\HSR RELIC CC` 프로젝트는 수정하지 않습니다.
- 기존 CSS 전체 복사는 금지합니다.
- 계산 로직, adapter, schema, effect-engine은 구현하지 않습니다.
- `manual_hint` / `manual_guide` / guide 기반 계산 유입은 금지합니다.
- UI는 계산값을 재구성하지 않고 ledger / aggregation result만 표시해야 합니다.
- 기존 UI가 `calculateScenario`, `calculateDamage`, `model/damage.js`, guide 데이터, legacy `sample-data.js`에 의존하면 직접 재사용하지 않습니다.

## 분류 기준

- 재사용 가능: 계산/데이터 도메인과 분리된 작은 UI 단위입니다. 단, v2 dependency 정책에 맞게 아이콘/스타일은 재구성합니다.
- 스타일 참고: 화면 밀도, spacing, 모바일 대응, trace 표현 방식만 참고합니다. CSS 원문 복사는 금지합니다.
- 구조 참고: 사용자 흐름이나 패널 배치 개념만 참고합니다. 컴포넌트 코드는 v2 layer 구조에 맞게 새로 작성합니다.
- 재작성: 화면 목적은 유지하되 legacy state, data, calculation 의존성이 강해 새로 구현합니다.
- 금지: 계산 조립, guide fallback, legacy import, damage recompute가 UI와 섞여 있어 v2로 가져오면 안 됩니다.

## File Map

| 기존 파일 | 분류 | 판단 |
| --- | --- | --- |
| `src/components/RuntimeErrorPanel.jsx` | 재사용 가능 | 계산 의존성이 없는 표시 컴포넌트입니다. v2 문구/클래스명만 조정해 재작성 수준으로 가져올 수 있습니다. |
| `src/components/ErrorBoundary.jsx` | 재사용 가능 | React error boundary로 독립성이 높습니다. root shell 정책에 맞춰 v2에서 작은 boundary로 재작성 가능합니다. |
| `src/components/NumberField.jsx` | 구조 참고 | 입력 패턴은 단순하지만 `CustomSelect`에 의존합니다. v2 form control 설계 시 참고만 합니다. |
| `src/components/CustomSelect.jsx` | 구조 참고 | keyboard/listbox 흐름은 참고 가치가 있지만 `lucide-react` 의존성이 있고 v2 Phase 1 dependency 원칙과 맞지 않습니다. |
| `src/calculator/CalculatorRoute.jsx` | 금지 | route, persisted state, import, party state, `calculateScenario` 실행, result state가 한 파일에 섞여 있습니다. 큰 app/controller 파일 금지 기준에 해당합니다. |
| `src/calculator/CalculatorPage.jsx` | 재작성 | 주요 화면 흐름은 참고 가능하지만 contribution view state와 analysis 패널 구성이 legacy result shape에 묶여 있습니다. |
| `src/calculator/CalculatorHeader.jsx` | 구조 참고 | party selector UX는 참고 가능하지만 `sample-data.js`, character profile asset, guide role 표시와 결합되어 직접 재사용하지 않습니다. |
| `src/calculator/CharacterSetupPanel.jsx` | 재작성 | 장비/스탯 표시 UI는 필요하지만 combat stats와 relic display helper에 강하게 의존합니다. v2 aggregation result 표시용으로 새로 작성합니다. |
| `src/calculator/DamageResultPanel.jsx` | 구조 참고 | `result.ledger.entries`를 표시하는 방향은 v2 원칙과 맞지만 legacy `skillRows`/format dependency가 섞여 있어 구조만 참고합니다. |
| `src/calculator/DamageTracePanel.jsx` | 재작성 | trace UX는 중요하지만 내부에서 contribution summary를 재계산/그룹화합니다. v2에서는 aggregation result를 받아 표시만 해야 합니다. |
| `src/calculator/EnemyEditor.jsx` | 구조 참고 | enemy form layout은 참고 가능하지만 legacy component와 value shape에 묶여 있습니다. |
| `src/calculator/EvaluationStatCard.jsx` | 재작성 | 평가 card UI는 참고 가능하지만 evaluation threshold와 legacy stat shape 의존성이 있어 새로 작성합니다. |
| `src/calculator/ScenarioDamageAnalysisCard.jsx` | 금지 | damage scenario 분석 UI가 damage recompute 결과에 의존합니다. 계산 조립이 분리되기 전 가져오면 안 됩니다. |
| `src/calculator/PartyInfluencePanels.jsx` | 금지 | party influence를 UI에서 scenario builder와 연결합니다. v2에서는 aggregation result 이후 별도 표시 layer로 다시 설계합니다. |
| `src/calculator/scenario-display.js` | 구조 참고 | 표시 label helper는 참고 가능하지만 scenario builder와 연결되어 직접 복사하지 않습니다. |
| `src/calculator/character-role.jsx` | 금지 | `character.guide` 기반 role/evaluation 판단이 포함됩니다. manual guide 계산 유입 금지 원칙에 해당합니다. |
| `src/calculator/equipment/EquipmentEditors.jsx` | 구조 참고 | character/light cone/relic picker UX는 참고 가능하지만 legacy relic build normalization과 forced substat 변환이 섞여 있습니다. |
| `src/calculator/equipment/equipment-display.jsx` | 구조 참고 | icon/summary 표시 패턴만 참고합니다. legacy sample-data asset helper 의존성은 가져오지 않습니다. |
| `src/calculator/equipment/relic-builds.js` | 금지 | relic build normalization, default build, roll/substat 계산 shape가 섞여 있습니다. Task 2-A UI 재사용 대상이 아닙니다. |
| `src/calculator/analysis/damage-scenarios.js` | 금지 | calculation dependency injection으로 damage scenario를 생성합니다. UI 재사용 대상이 아닙니다. |
| `src/calculator/analysis/influence-groups.js` | 금지 | `calculateScenario`, ledger entry filtering, stat influence recompute가 포함됩니다. |
| `src/calculator/analysis/scenario-builders.js` | 금지 | `calculateDamage`, `resolveRelicConditionalEntriesForSkill`, `ledger.entries` 기반 재계산을 포함합니다. |
| `src/calculator/analysis/party-evaluation.js` | 금지 | guide role, threshold evaluation, ledger aggregation을 자체 구성합니다. |
| `src/conditions/ConditionPanel.jsx` | 재작성 | condition editing UX는 참고 가능하지만 stat labels, comparison damage, recommendation UI와 결합되어 있습니다. |
| `src/conditions/condition-policy.js` | 금지 | `calculateScenario`, `sample-data.js`, guide role/template 기반 추천 판단이 포함됩니다. |
| `src/conditions/condition-defaults.js` | 금지 | condition policy re-export입니다. v2 canonical condition schema 전에는 사용하지 않습니다. |
| `src/conditions/condition-summary.js` | 금지 | condition policy re-export입니다. v2 schema 이전에는 가져오지 않습니다. |
| `src/conditions/target-application-policy.js` | 금지 | condition policy re-export입니다. v2 target scope 정의 전에는 가져오지 않습니다. |
| `src/active-effects/active-effect-display.jsx` | 구조 참고 | source icon과 compact display는 참고 가능하지만 dependency injection과 legacy source shape에 묶여 있습니다. |
| `src/active-effects/active-effect-trace.js` | 재작성 | trace grouping 개념은 필요하지만 UI 표시 전에 grouping/aggregation을 다시 수행합니다. v2에서는 engine output을 표시해야 합니다. |
| `src/active-effects/buff-source-utils.jsx` | 금지 | ledger grouping, source normalization, relic/sample-data icon matching이 섞여 있습니다. |
| `src/active-effects/source-formatters.js` | 구조 참고 | source label compacting 요구사항은 참고 가능하지만 v2 source schema 확정 후 새 formatter로 작성합니다. |
| `src/active-effects/source-groups.js` | 금지 | buff source grouping과 sort magnitude 계산이 포함됩니다. v2 aggregation layer 이전 사용 금지입니다. |
| `src/styles.css` | 스타일 참고 | 전체 파일은 약 148KB로 기존 앱 전체 스타일이 섞여 있습니다. class section별 spacing, dense card, condition editor, trace list 패턴만 참고합니다. 원문 복사 금지입니다. |

## 재사용 가능 후보

- `RuntimeErrorPanel.jsx`: runtime error 표시 문구와 alert structure.
- `ErrorBoundary.jsx`: route/root boundary 구조.
- `NumberField.jsx`: 숫자 입력 label-control 단위.

위 후보도 그대로 복사하지 않고 v2 `src/ui` 또는 route-local component로 작게 재작성합니다.

## 스타일 참고 후보

- `src/styles.css`의 condition editor, dense card, result list, contribution list, mobile breakpoint 패턴.
- `DamageTracePanel.jsx`의 expand/collapse trace list 시각 구조.
- `EquipmentEditors.jsx`의 picker/search/filter 배치.
- `ConditionPanel.jsx`의 compare editor flow.

CSS는 전체 복사하지 않고 v2 route별 필요한 class만 새로 작성합니다.

## 재작성 대상

- calculator main 화면과 route shell.
- character setup / equipment setup 패널.
- condition editor.
- damage result / ledger display.
- active effect trace display.

재작성 시 UI는 domain 계산을 호출하지 않고, canonical ledger 또는 aggregation result props만 받습니다.

## 금지 목록

다음 항목은 Task 2-B/2-C에서 legacy logic/source map 또는 rewrite ban list로 넘깁니다.

- `CalculatorRoute.jsx`의 UI 내부 `calculateScenario` 호출.
- `CalculatorRoute.jsx`의 route/state/import/calculation/result orchestration 결합.
- `character-role.jsx`의 `character.guide` 기반 combat role/evaluation 판단.
- `condition-policy.js`의 guide role/template 기반 추천과 `calculateScenario` 기반 party score 계산.
- `scenario-builders.js`의 `calculateDamage` 직접 호출과 `ledger.entries`를 이용한 damage recompute.
- `influence-groups.js`의 party/stat influence recompute.
- `party-evaluation.js`의 guide role 기반 평가 row 구성.
- `buff-source-utils.jsx` / `source-groups.js`의 UI 주변 source grouping, normalization, sort magnitude 계산.
- `relic-builds.js`의 relic build normalization과 substat roll 계산.

## Task 2-B로 넘길 항목

- legacy data/logic source map에서 `sample-data.js`, `model/damage.js`, `calculator/analysis/*`, `conditions/condition-policy.js`, `active-effects/*`를 별도 분류해야 합니다.
- adapter input으로 볼 수 있는 파일과 rewrite 금지 logic을 분리해야 합니다.
- v2 schema 확정 전에는 legacy result shape, guide role, manual source label을 계산 입력으로 사용하지 않습니다.

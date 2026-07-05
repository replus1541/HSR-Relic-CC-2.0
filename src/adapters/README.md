# adapters

외부/legacy/source 데이터를 canonical row로 변환하는 adapter 영역입니다.

대상:

- HoyoWiki
- DesignData
- local JSON
- curated source
- SRTools
- FreeSR
- lightcone
- relic

Phase 1-A에서는 adapter 구현을 금지하고 폴더 역할만 고정합니다.

## 원칙

- Adapter는 외부/legacy 데이터를 표준 `SourceRow`, `EffectRow`, `CoefficientRow`로 변환하는 경계입니다.
- Adapter 내부에서 계산 결과를 만들지 않습니다.
- 출처 없는 guide 값은 계산 가능한 row로 변환하지 않습니다.
- `manual_hint`, `missing_extraction`, `legacy_reference`는 계산 금지 상태를 유지해야 합니다.
- Adapter output은 후속 Phase의 schema validator를 통과해야 합니다.

## 경량화 기준

- Adapter는 runtime UI bundle에 직접 묶이지 않는 방향을 기본으로 합니다.
- 필요한 데이터만 generated output으로 넘기고, raw/reference 파일은 runtime import 대상에서 제외합니다.
- Adapter 구현 Task는 source별로 분리하고, 각 adapter Task가 끝날 때마다 별도 커밋합니다.

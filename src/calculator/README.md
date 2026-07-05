# calculator

CombatLedger 기반 aggregation과 calculation result 생성을 담당할 영역입니다.

Phase 1-A에서는 데미지 계산, 스탯 합산, modifier 합산을 구현하지 않습니다.

## 원칙

- Calculator는 source row나 manual guide를 직접 읽지 않습니다.
- 입력은 `CombatLedger`와 canonical scenario state입니다.
- UI 표시용 값을 따로 재계산하지 않고 aggregation result를 반환합니다.
- 방어, 저항, 취약, 방무, 방깎, 추가 피해는 별도 aggregation 단계로 분리합니다.
- `valueMode: unknown` 또는 `usedForCalculation=false` row는 계산에 포함하지 않습니다.

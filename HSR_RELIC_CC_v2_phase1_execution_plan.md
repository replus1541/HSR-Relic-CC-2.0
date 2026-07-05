# HSR RELIC CC v2.0 Phase 1 실행 세부계획

## 0. Phase 1 목적

Phase 1의 목적은 `HSR RELIC CC 2.0`을 독립 실행 가능한 Vite/React 프로젝트로 세우는 것입니다.

이 단계에서는 계산 엔진, canonical dataset, adapter를 구현하지 않습니다. 이후 Phase가 안전하게 쌓일 수 있도록 프로젝트 골격, 라우트, 폴더 구조, 검증 명령, 작업 기록 체계를 먼저 고정합니다.

## 1. Phase 1 완료 기준

Phase 1은 아래 조건을 모두 만족하면 완료로 봅니다.

- `C:\CODEX\HSR RELIC CC 2.0`에서 독립 npm 프로젝트가 생성되어 있습니다.
- `npm.cmd install`이 가능합니다.
- `npm.cmd run dev` 또는 `npm.cmd run dev:local`로 Vite 앱이 실행됩니다.
- `npm.cmd run build`가 통과합니다.
- 기본 route shell이 존재합니다.
  - `/`
  - `/extraction`
  - `/ledger`
  - `/legacy-diff`
- v2 전용 폴더 구조가 생성되어 있습니다.
- Phase 진행 내용이 `HSR_RELIC_CC_v2_phase_log.md`에 기록되어 있습니다.
- 작업 진행 시 의미 있는 Step마다 git commit을 남깁니다.
- 기존 `C:\CODEX\HSR RELIC CC` 프로젝트는 수정하지 않습니다.

## 2. 작업 전 확인

### 2-1. 현재 폴더 확인

작업 시작 전 아래를 확인합니다.

```powershell
Get-ChildItem -LiteralPath "C:\CODEX\HSR RELIC CC 2.0" -Force
```

기대 상태:

- `HSR_RELIC_CC_current_to_v2_direction.md`
- `HSR_RELIC_CC_v2_refactoring_step_plan.md`
- `HSR_RELIC_CC_v2_phase_log.md`
- `HSR_RELIC_CC_v2_phase1_execution_plan.md`

### 2-2. git repo 여부 확인

```powershell
git -C "C:\CODEX\HSR RELIC CC 2.0" rev-parse --show-toplevel
```

예상:

- 현재는 git repo가 아닐 수 있습니다.

결정:

- 작업 진행 시마다 단계별 커밋을 남겨야 하므로, Phase 1 시작 시 `git init`을 먼저 수행합니다.
- 이후 각 Step이 검증 가능한 단위로 끝날 때마다 커밋합니다.

## 3. Phase Log 기록 방식

Phase 1을 실제로 시작하면 `HSR_RELIC_CC_v2_phase_log.md`의 `Phase 1. v2 프로젝트 골격 생성` 항목을 갱신합니다.

시작 시 기록:

```md
- 상태: in_progress
- 시작일: 2026-07-05
```

진행 기록 예시:

```md
### 진행 기록

- 2026-07-05: Phase 1 시작. 독립 Vite/React 프로젝트 골격 생성을 진행.
- 2026-07-05: package.json, vite.config.js, index.html, src/main.jsx 생성.
- 2026-07-05: 기본 라우트 shell 생성.
- 2026-07-05: npm.cmd run build 통과.
```

완료 시 기록:

```md
- 상태: complete
- 완료일: 2026-07-05
```

검증 결과와 다음 Phase로 넘길 항목도 함께 적습니다.

## 4. 생성할 최종 파일/폴더 구조

Phase 1 완료 후 목표 구조는 다음입니다.

```txt
HSR RELIC CC 2.0/
  HSR_RELIC_CC_current_to_v2_direction.md
  HSR_RELIC_CC_v2_refactoring_step_plan.md
  HSR_RELIC_CC_v2_phase_log.md
  HSR_RELIC_CC_v2_phase1_execution_plan.md

  README.md
  package.json
  package-lock.json
  vite.config.js
  index.html

  src/
    main.jsx
    app/
      App.jsx
      routes/
        HomeRoute.jsx
        ExtractionRoute.jsx
        LedgerRoute.jsx
        LegacyDiffRoute.jsx
      route-config.js
    data-model/
      README.md
      schemas/
    adapters/
      README.md
    extraction/
      README.md
    effect-engine/
      README.md
    calculator/
      README.md
    ui/
      README.md
      app.css

  data/
    raw/
      README.md
    curated/
      README.md
    generated/
      README.md
    legacy-reference/
      README.md

  tools/
    README.md

  reports/
    ui-reuse/
      README.md
    legacy/
      README.md
    extraction/
      README.md
    calculation/
      README.md
    diff/
      README.md
```

## 5. 실행 순서

### Step 1. Phase Log 시작 기록

작업 시작 즉시 `HSR_RELIC_CC_v2_phase_log.md`를 갱신합니다.

변경 내용:

- Phase 1 상태를 `in_progress`로 변경
- 시작일 입력
- 진행 기록 첫 줄 추가

검증:

- 로그 문서에 Phase 1 시작 기록이 남아 있어야 합니다.

커밋:

```txt
Start phase 1 log
```

### Step 2. Git repo 초기화

실행:

```powershell
git init
git branch -m main
```

검증:

```powershell
git status --short
git branch --show-current
```

커밋:

```txt
Initialize v2 repository
```

주의:

- repo 초기화 커밋에는 기존 방향 문서, refactoring plan, phase log, phase1 execution plan을 포함합니다.
- 이후부터 모든 작업은 Step 단위 커밋으로 남깁니다.

### Step 3. npm 프로젝트 초기화

직접 `npm init`을 쓰기보다 필요한 형태의 `package.json`을 명시적으로 만듭니다.

초기 script:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "dev:local": "vite --host 127.0.0.1",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0",
    "verify": "npm.cmd run build"
  }
}
```

초기 dependencies:

```json
{
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^7.0.0"
  }
}
```

주의:

- Phase 1에서는 복잡한 devDependency를 추가하지 않습니다.
- Playwright는 UI 검증이 필요한 Phase 13 이후에 추가해도 됩니다.

커밋:

```txt
Add v2 npm project manifest
```

### Step 4. Vite 기본 파일 생성

생성 대상:

- `index.html`
- `vite.config.js`
- `src/main.jsx`

`vite.config.js` 기본 방향:

- React plugin 사용
- dev server는 `127.0.0.1` 또는 `0.0.0.0` 지원
- Phase 1에서는 manualChunks를 넣지 않습니다.
- legacy 프로젝트의 빌드 최적화는 나중에 필요할 때 재평가합니다.

커밋:

```txt
Add Vite React entry files
```

### Step 5. App shell 생성

생성 대상:

- `src/app/App.jsx`
- `src/app/route-config.js`
- `src/app/routes/HomeRoute.jsx`
- `src/app/routes/ExtractionRoute.jsx`
- `src/app/routes/LedgerRoute.jsx`
- `src/app/routes/LegacyDiffRoute.jsx`

구현 방향:

- React Router 패키지는 아직 추가하지 않습니다.
- Phase 1에서는 `window.location.pathname` 기반의 단순 route switch로 충분합니다.
- 라우트 이름과 nav만 만들어 두고 실제 데이터는 넣지 않습니다.

기본 route 역할:

- `/`: v2 홈/작업 대시보드 placeholder
- `/extraction`: canonical dataset 검토 화면 placeholder
- `/ledger`: CombatLedger 표시 화면 placeholder
- `/legacy-diff`: legacy 비교 report 화면 placeholder

커밋:

```txt
Add v2 route shell
```

### Step 6. 기본 UI 스타일 생성

생성 대상:

- `src/ui/app.css`

방향:

- 기존 UI의 분위기만 참고합니다.
- 기존 CSS를 대량 복사하지 않습니다.
- 카드, 탭, 상단 nav, placeholder panel 정도만 최소 구현합니다.

금지:

- 기존 `styles.css` 전체 복사
- 기존 계산기 UI 세부 컴포넌트 복사
- Phase 1에서 캐릭터/유물/데미지 UI 구현

커밋:

```txt
Add v2 shell styling
```

### Step 7. 도메인 폴더 placeholder 생성

각 폴더에 README를 둬서 역할을 고정합니다.

생성 대상:

- `src/data-model/README.md`
- `src/adapters/README.md`
- `src/extraction/README.md`
- `src/effect-engine/README.md`
- `src/calculator/README.md`
- `src/ui/README.md`
- `data/raw/README.md`
- `data/curated/README.md`
- `data/generated/README.md`
- `data/legacy-reference/README.md`
- `tools/README.md`
- `reports/*/README.md`

README에 적을 기준:

- 이 폴더가 담당하는 것
- 이 폴더가 담당하지 않는 것
- 다음 Phase에서 채울 내용

커밋:

```txt
Add v2 domain folder placeholders
```

### Step 8. README 작성

생성 대상:

- `README.md`

포함 내용:

- v2 프로젝트 목적
- 기존 프로젝트와의 관계
- 실행 명령
- Phase 기반 개발 방식
- source-backed 계산 원칙
- Phase Log 사용 규칙

커밋:

```txt
Document v2 project usage
```

### Step 9. dependency 설치

실행:

```powershell
npm.cmd install
```

예상 결과:

- `node_modules/`
- `package-lock.json`

주의:

- 네트워크/권한 오류가 나면 중단하지 말고 오류를 기록합니다.
- install이 완료되어야 build 검증으로 넘어갑니다.

커밋:

```txt
Install v2 dependencies
```

### Step 10. 빌드 검증

실행:

```powershell
npm.cmd run build
```

성공 시 기록:

- Phase Log의 검증 항목에 통과 기록

실패 시 기록:

- 실패 명령
- 핵심 오류 메시지
- 수정 파일
- 재검증 결과

커밋:

```txt
Verify v2 build
```

### Step 11. 개발 서버 확인

필요 시 실행:

```powershell
npm.cmd run dev:local
```

확인 대상:

- `/`
- `/extraction`
- `/ledger`
- `/legacy-diff`

Phase 1에서 Playwright 검증은 필수는 아닙니다. 다만 브라우저 확인을 진행했다면 Phase Log에 남깁니다.

커밋:

```txt
Record v2 local route check
```

### Step 12. Phase Log 완료 기록

Phase 1 완료 시 아래를 기록합니다.

- 상태: complete
- 완료일
- 생성/수정 파일 목록
- 검증 결과
- Phase 2로 넘길 항목

커밋:

```txt
Complete phase 1 log
```

### Step 13. 최종 상태 확인

실행:

```powershell
git status --short
git log --oneline --max-count 10
```

완료 조건:

- 작업 tree에 의도하지 않은 변경이 없습니다.
- Phase 1 진행 과정이 여러 커밋으로 나뉘어 있습니다.

## 6. Phase 1에서 하지 않을 일

Phase 1에서는 아래 작업을 하지 않습니다.

- 기존 `HSR RELIC CC` 프로젝트 수정
- 기존 `sample-data.js` 복사
- 기존 `damage.js` 복사
- 캐릭터 DB adapter 구현
- HoyoWiki adapter 구현
- SRTools/FreeSR import 구현
- effect normalizer 구현
- value resolver 구현
- dedupe 구현
- CombatLedger 구현
- 실제 데미지 계산 구현
- extraction canonical dataset 생성
- legacy diff 구현
- 기존 CSS 전체 복사

## 7. Phase 1 리스크와 대응

### 리스크 1. 기존 UI를 너무 빨리 복사함

대응:

- Phase 1은 shell만 만듭니다.
- 기존 UI 재사용 여부는 Phase 2에서 파일 단위로 판단합니다.

### 리스크 2. 초기부터 계산 로직을 넣음

대응:

- 모든 계산 관련 파일은 placeholder README만 둡니다.
- `calculator/`는 Phase 12 전까지 계산 구현을 넣지 않습니다.

### 리스크 3. source-backed 원칙이 흐려짐

대응:

- README와 Phase Log에 source-backed 계산 원칙을 명시합니다.
- Phase 1에서는 데이터 자체를 계산하지 않습니다.

### 리스크 4. git 없는 상태로 변경이 누적됨

대응:

- Phase 1 시작 시 git 초기화를 권장합니다.
- 최소한 Phase 완료 시 생성 파일 목록을 Phase Log에 남깁니다.

## 8. Phase 1 산출물 체크리스트

```txt
[ ] Phase Log 시작 기록 + commit
[ ] git init + initial document commit
[ ] package.json
[ ] package-lock.json
[ ] vite.config.js
[ ] index.html
[ ] src/main.jsx
[ ] src/app/App.jsx
[ ] src/app/route-config.js
[ ] src/app/routes/HomeRoute.jsx
[ ] src/app/routes/ExtractionRoute.jsx
[ ] src/app/routes/LedgerRoute.jsx
[ ] src/app/routes/LegacyDiffRoute.jsx
[ ] src/ui/app.css
[ ] src/* domain README files
[ ] data/* README files
[ ] reports/* README files
[ ] tools/README.md
[ ] root README.md
[ ] npm.cmd install 성공
[ ] npm.cmd run build 성공
[ ] Phase Log 완료 기록
[ ] Step별 git commit 완료
```

## 9. Phase 1 완료 후 Phase 2 진입 조건

Phase 2로 넘어가기 전에 아래가 준비되어야 합니다.

- 실행 가능한 빈 v2 앱
- 기존 프로젝트와 분리된 폴더 구조
- UI 재사용 분석을 기록할 `reports/ui-reuse/`
- legacy 분석을 기록할 `reports/legacy/`
- source-backed 원칙이 README와 Phase Log에 명시됨

Phase 2의 첫 작업은 기존 `HSR RELIC CC`에서 가져올 수 있는 UI/데이터/로직을 파일 단위로 분류하는 것입니다.

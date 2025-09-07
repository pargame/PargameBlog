# 03 — Quality Gates (단계별 체크리스트)

이 문서는 커밋/PR/릴리스 전에 통과해야 하는 품질 게이트를 단계별로 정리합니다. 현재 프로젝트의 스크립트와 도구에 맞춰 최소 세트로 구성되어 있으며, 선택적 확장(테스트/E2E)도 제안합니다.

## 빠른 실행 요약 (유지보수 체크리스트)

1) 타입체크

```sh
npm run typecheck
```

- 성공 기준: 오류 0.

2) 린트

```sh
npm run lint
```

- 성공 기준: 에러 0.

3) 프로덕션 빌드

```sh
npm run build
```

- 성공 기준: 빌드 성공(종료 코드 0) 및 산출물 생성.

4) 스모크 테스트(로컬 확인, 선택)

```sh
npm run dev
```

- 수동 확인: 홈 진입, Graph 페이지 열기, 그래프 노드 렌더링 및 노드 클릭 후 문서 패널 동작.

## 상세 절차와 합격 기준

### 1. 설치/환경 준비

- Node.js LTS(또는 팀 표준 버전) 사용을 권장합니다.
- 의존성 설치:

```sh
npm install
```

### 2. 타입체크 — tsc

```sh
npm run typecheck
```

- 합격: "Found 0 errors" 또는 종료 코드 0.
- 실패 시: 타입 선언 누락, any 과다, 잘못된 제네릭 사용 등을 수정합니다.

### 3. 린트 — ESLint

```sh
npm run lint
# 자동 수정이 가능한 범위까지는 다음으로 보조:
# npx eslint . --fix
```

- 합격: Error 0.
- 실패 시 자주 보는 원인:
  - no-unused-vars: 사용하지 않는 변수/파라미터 제거 또는 `_` prefix 부여.
  - @typescript-eslint/no-explicit-any: 구체 타입/제네릭/타입 가드 도입.

### 4. 프로덕션 빌드 — Vite

```sh
npm run build
```

- 합격: 종료 코드 0. dist/ 산출물 생성.
- 실패 시 자주 보는 원인:
  - 마크다운 로더/프런트매터 파싱 오류.
  - 잘못된 import 경로 또는 ESM/CJS 혼용 문제.

### 5. 스모크 테스트 — 개발 서버(선택)

```sh
npm run dev
```

브라우저에서 다음을 수동 확인합니다.
- 홈/Graph 페이지 정상 진입.
- 그래프가 화면에 즉시 보임(투명도 0 이슈 없음).
- 노드 클릭 시 오른쪽 패널에 문서 타이틀/본문 표시.

## CI에 적용(예시 워크플로우)

아래는 PR에서 타입/린트/빌드를 검증하는 최소 예시입니다. 필요 시 저장소의 Pages 배포 워크플로우와 결합하세요.

```yaml
name: quality-gates
on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      - run: npm ci || npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
```

## 권장 확장(추가 게이트)

- 유닛 테스트: Vitest 도입 후 `npm run test`를 게이트에 추가.
- E2E 테스트: Playwright로 Graph 상호작용(노드 클릭 → 패널 표시) 스크립트화.
- 링크/마크다운 검증: 문서 내 위키링크 유효성 검사 스크립트 추가.
- pre-commit 훅: lint-staged+husky로 변경 파일에 대해 린트/타입 빠른 체크.

## TODO/FIXME/Deprecated 처리 절차 (품질 게이트 관련)

- PR에서 발견된 `TODO`/`FIXME`는 가능한 경우 해당 이슈를 생성하고 PR에 이슈 번호를 링크해야 합니다. CI 머지 전에 장기 TODO로 남겨둘 수 없도록 검토하세요.
- Deprecated API(예: `getAllPosts()`)를 사용하는 PR은 마이그레이션 계획을 포함해야 합니다. 간단한 예시:
  - 그래프 API 마이그레이션 예시(중요):
    1. 레거시 동기 API(`buildGraphForCollection`)를 호출하고 있다면, 비동기 API로 마이그레이션합니다.
       ```diff
       - const g = buildGraphForCollection('Unreal')
       + const mod = await import('../../lib/graph')
       + const g = await mod.buildGraphForCollectionAsync('Unreal')
       ```
    2. `src/components/graph/useGraphSimulation` 같은 얇은 래퍼는 제거되었을 수 있으니, `src/hooks/useGraphSimulation`로 직접 import하세요.
    3. 변경 후 `npm run typecheck && npm run lint && npm run build`를 실행해 문제를 확인합니다.
  1. 코드 검색: `grep -R "getAllPosts(" -n src || true`
  2. 호출부 변경: `const posts = await loadAllPosts()` (필요 시 async로 변환)
  3. 타입체크/린트/빌드 통과 확인
  4. PR 설명에 변경 영향과 테스트 결과를 기록

- LEGACY 표식이 있는 코드 변경 시에는 마이그레이션 문서 또는 이슈 링크를 PR에 반드시 포함하세요.

## 트러블슈팅 체크리스트

- 린트가 no-unused-vars로 실패: `_evt`, `_unused`와 같이 언더스코어 접두 사용 또는 제거.
- any 관련 실패: D3 핸들러/이벤트에 제네릭과 좁히기 적용.
- 빌드 실패: 마크다운 frontmatter 줄바꿈/따옴표 처리, 경로 대소문자 확인.

---
- 관련 문서: `docs/guide/02-scripts.md` — 사용 가능한 npm 스크립트
- 문의/개선 제안: PR에 TODO와 스크린샷/에러 로그를 첨부하세요.

# Dev & Ops (Scripts + Quality Gates)

한 줄 설명: 개발 스크립트와 CI 품질 게이트 절차를 통합한 가이드입니다.

이 문서는 개발 스크립트, 로컬 검증 절차, CI(quality gates) 설정에 관한 통합 가이드입니다.

## 주요 npm 스크립트

- `npm run dev` — 개발 서버 시작 (Vite, 기본: http://localhost:5173)
- `npm run build` — 프로덕션 빌드 (Vite)
- `npm run lint` — ESLint 검사 및 규칙 확인
- `npm run typecheck` — TypeScript 검사 (tsc --noEmit)

Tip: PR 전 체크는 `npm run typecheck && npm run lint && npm run build` 로 통합 실행하면 안전합니다.

## 로컬 검증 워크플로우

1. 의존성 설치: `npm ci`
2. 타입 검사: `npm run typecheck` (성공: Found 0 errors)
3. 린트 검사: `npm run lint` (성공: Error 0)
4. 빌드: `npm run build` (dist/ 생성 확인)

자동 수정 필요 시: `npx eslint . --fix`

## CI / Quality Gates 예시

워크플로우는 PR/푸시 시 다음을 검증해야 합니다:

1. `npm ci` (또는 `npm install`)
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`

간단한 GitHub Actions 예시:

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

## 권장 추가 항목

- 테스트: Vitest 단위테스트와 Playwright E2E를 도입해 품질 게이트를 강화하세요.
- pre-commit: husky + lint-staged로 commit/PR 전 자동 검사 적용 권장.
- 문서: 변경 시 `docs/` 업데이트를 CI 체크리스트에 추가하면 문서 사라짐을 방지할 수 있습니다.

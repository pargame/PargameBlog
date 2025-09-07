# Docs Index

## 빠른 시작
- **00-ai-onboarding.md** — 새로운 AI 에이전트를 위한 빠른 온보딩 요약서 (필수 읽기)
- **01-introduction.md** — 프로젝트 개요

## 아키텍처
- **architecture/01-overview.md** — 아키텍처 개요 및 핵심 파일 (리팩토링 반영)

## 개발 가이드
- **guide/01-getting-started.md** — 로컬 개발 시작하기
- **guide/02-scripts.md** — npm 스크립트와 용도
- **guide/03-quality-gates.md** — 품질 게이트(타입·린트·빌드·스모크) 체크리스트
- **guide/04-component-development.md** — 컴포넌트 개발 가이드
- **guide/05-content-writing.md** — 콘텐츠 작성 가이드

## 배포
- **deployment/01-github-pages.md** — GitHub Pages 자동 배포

## 유지보수 & 레거시(간단 요약)

- 레거시 호환성 표면
  - `src/lib/posts.ts`의 동기식 API `getAllPosts()`는 문서화된 대체 API인 `loadAllPosts()`(비동기)를 권장합니다. 코드 상에 `@deprecated` 주석이 있으며, 가능한 경우 호출부를 `await loadAllPosts()`로 변경하세요.
  - 블로그 포스트 소스는 `src/posts/`(legacy) 및 `src/content/posts/`(권장) 형태로 존재합니다. 신규 작성 시 `src/content/<collection>/` 구조를 사용하세요.

- TODO/FIXME/LEGACY 운영 권장사항
  - 코드 내 `TODO`/`FIXME`를 남길 때는 가능한 한 빠르게 깃허브 이슈로 전환하고 PR에 이슈 번호를 링크하세요 (예: `// TODO(#123): owner - reason`).
  - 장기 보존이 필요한 레거시 코드는 `// LEGACY:` 마커와 함께 간단한 마이그레이션 노트를 추가하고, 제거 예정 시기를 문서(또는 이슈)에 기록하세요.

- 마이그레이션 체크리스트(예)
  1. 레거시 API 호출 위치 검색: `grep -R "getAllPosts(" -n src || true`
  2. 호출부 수정: `const posts = await loadAllPosts()` (필요 시 호출부를 async로 변경)
  3. 변경 PR에서 테스트(빌드/타입체크/린트) 통과 확인
  4. PR 머지 후 관련 `LEGACY` 주석을 업데이트하거나 제거 이슈를 생성

---

**⚠️ 중요**: 항상 00-ai-onboarding.md를 먼저 확인하세요. 최신 리팩토링 사항이 반영됩니다.

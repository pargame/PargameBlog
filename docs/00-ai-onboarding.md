# AI 온보딩 요약서 (읽기 1~2분)

이 문서는 새로운 대화(메모리 없음)에서 AI 에이전트가 즉시 레포 상태를 파악하고 안전하게 작업을 이어가기 위한 최소 핵심 정보입니다.

## 프로젝트 한눈에 보기
- 타입/스택: Vite 7 + React 19 + TypeScript 5, React Router v7
- 콘텐츠: `src/posts/*.md` 마크다운을 읽어 홈 목록 → `/posts/:slug` 상세 렌더링
- 마크다운 파서: 브라우저 안전한 커스텀 프런트매터 파서 + `react-markdown` + `remark-gfm`
- 라우팅: BrowserRouter + 동적 `basename`(Vite `BASE_URL` 반영), SPA 404 리다이렉트(`public/404.html`)
- CI/CD: GitHub Actions → 타입체크/린트/빌드/Pages 배포 (Linux 러너에서 Rollup 네이티브 패키지 명시 설치)

## 필수 파일 맵(편집 지점)
```
src/
  App.tsx                # 라우팅/네비게이션/레이아웃 진입점 (Footer 포함)
  pages/
    HomePage.tsx         # 글 목록(최신순)
    PostPage.tsx         # 마크다운 상세 렌더링
    AboutPage.tsx        # 소개 페이지
  lib/
    posts.ts             # 마크다운 로더(프런트매터 파싱, 정렬, 캐시)
  components/
    Footer.tsx           # 동적 이메일, GitHub 링크 아이콘
posts/
  (없음)                 # 실제 글 파일은 src/posts/ 아래에 존재
public/
  404.html               # SPA 라우팅용
vite.config.js           # base/alias/react 플러그인
eslint.config.js         # ESLint 구성
.github/workflows/deploy.yml # Pages 배포 워크플로우
```

## 라우팅 규칙
- 홈: `/` → `HomePage.tsx`
- 소개: `/about` → `AboutPage.tsx`
- 글 상세: `/posts/:slug` → `PostPage.tsx`
- 슬러그: 파일명 `YYYY-MM-DD-slug.md`에서 날짜 접두사는 자동 제거되어 라우팅에 쓰임

## 마크다운 글 작성 규칙
- 위치: `src/posts/`
- 파일명: `YYYY-MM-DD-slug.md`
- 프런트매터 예시:
```markdown
---
title: 글 제목
date: 2025-09-04
excerpt: 짧은 요약
---

본문은 여기부터 마크다운으로 작성합니다.
```

## 마크다운 로더 동작(중요 구현 포인트)
- `src/lib/posts.ts`
  - `import.meta.glob('../posts/**/*.md', { query: '?raw', import: 'default', eager: true })`
  - 커스텀 `parseFrontmatter`로 안전하게 키:값 단일 라인 파싱
  - 파일명으로 슬러그 생성, 날짜 내림차순 정렬, 프로덕션 캐시
  - 브라우저 환경 호환(노드 전용 라이브러리 사용 금지)

## 빌드/배포/개발 커맨드
- 개발 서버: `npm run dev`
- 프로덕션 빌드: `npm run build`
- 린트: `npm run lint`
- 타입체크: `npm run typecheck`
- CI: main 브랜치 푸시 시 자동 배포 (워크플로우 파일 참고)

## ESLint 스타일 가이드
- 설정 파일: `eslint.config.js`
- 베이스: ESLint/TypeScript/React Hooks + React Refresh(vite) 권장 설정
- 규칙 예: `no-unused-vars`(대문자/언더스코어 변수 일부 예외), `sort-imports`(선언 순서 무시, 그룹 허용)

## Vite/라우터 베이스 URL 주의사항
- `vite.config.js` → prod 에서 `base: '/PargameBlog/'`, dev는 `/`
- `App.tsx`에서 `import.meta.env.BASE_URL` 기반으로 `basename` 설정 및 dev 보정
- GitHub Pages를 위한 `public/404.html` 필수

## Footer(연락처/저작권)
- 파일: `src/components/Footer.tsx`
- 이메일: 클라이언트에서 문자열 조합으로 렌더 → 단순 크롤러 회피
- GitHub: 프로필 링크 + SVG 아이콘

## 과거 트러블슈팅 메모(요약)
- Rollup 네이티브 바인딩(optional deps) 이슈로 CI 실패 경험 → 워크플로우에서 Linux 네이티브 패키지 명시 설치로 결정화
- 브라우저 번들에서 Node 전용 패키지(예: gray-matter) 사용하지 않음
- Vite `glob`는 상대 경로 사용 권장

## 새 기능 작업 빠른 가이드
- 새로운 페이지 추가: `src/pages/...` 생성 → `App.tsx` 라우트에 추가
- 새 글 작성: `src/posts/YYYY-MM-DD-slug.md` 생성(프런트매터 포함)
- 홈 목록 정렬/표시 변경: `src/pages/HomePage.tsx` 또는 `src/lib/posts.ts` 편집

## 링크 모음
- 배포 URL: https://pargame.github.io/PargameBlog/
- 워크플로우: `.github/workflows/deploy.yml`
- 라우팅/베이스: `src/App.tsx`, `vite.config.js`

이 문서를 최신 상태로 유지하면(작은 변경도 반영) 새로운 AI가 언제든 정확히 이어서 작업할 수 있습니다.

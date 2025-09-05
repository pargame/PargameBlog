# AI 온보딩 요약서 (읽기 1~2분)

이 문서는 새로운 대화(메모리 없음)에서 AI 에이전트가 즉시 레포 상태를 파악하고 안전하게 작업을 이어가기 위한 최소 핵심 정보입니다.

## 프로젝트 한눈에 보기
- 타입/스택: Vite 7 + React 19 + TypeScript 5, React Router v7
- 콘텐츠: `src/posts/*.md`(레거시) 또는 `src/content/posts/*.md`를 읽어 홈 목록 → `/posts/:slug` 상세 렌더링
- 마크다운 파서: 브라우저 안전한 커스텀 프런트매터 파서 + `react-markdown` + `remark-gfm`
- 라우팅: BrowserRouter + 동적 `basename`(Vite `BASE_URL` 반영), SPA 404 리다이렉트(`public/404.html`)
- 그래프 뷰: D3.js 기반 위키링크 그래프 시각화 (`src/content/<collection>` 폴더 단위)
  - 성능: 그래프 빌드는 동적 import(비동기)로 수행되어 초기 청크를 최소화합니다
- CI/CD: GitHub Actions → 타입체크/린트/빌드/Pages 배포 (Linux 러너에서 Rollup 네이티브 패키지 명시 설치)

## 필수 파일 맵(편집 지점)
```
src/
  types/
    index.ts             # 공통 타입 정의 (Post, PostMeta, GraphData 등)
  App.tsx                # 라우팅/네비게이션/레이아웃 진입점 (Footer 포함)
  pages/
    HomePage.tsx         # 글 목록(최신순)
    PostPage.tsx         # 마크다운 상세 렌더링
    AboutPage.tsx        # 소개 페이지
    GraphPage.tsx        # 그래프 뷰 페이지 (컬렉션 선택)
  lib/
  posts.ts             # 마크다운 로더(프런트매터 파싱, 정렬, 캐시) - 동적 로딩 리팩토링 완료
    graph.ts             # 위키링크 그래프 데이터 생성
    content.ts           # 콘텐츠 컬렉션 관리
    doc.ts               # 문서 로더
    remarkWikiLinkToSpan.ts # 위키링크 마크다운 파서
  components/
    Footer.tsx           # 동적 이메일, GitHub 링크 아이콘
    GraphView.tsx        # D3.js 그래프 렌더링 컴포넌트
    GraphModal.tsx       # 그래프 모달 컴포넌트
    InsightDrawer.tsx    # 인사이트 드로어 컴포넌트
posts/
  (실제 파일 위치)          # 블로그 포스트 파일들 (src/posts/ 아래)
content/
  Unreal/               # 언리얼 엔진 관련 문서 (그래프 뷰용)
  Algorithm/            # 알고리즘 관련 문서 (그래프 뷰용) - 예시
  (기타 주제별 폴더)         # 새로운 주제 폴더 추가 시 자동으로 그래프 뷰에 반영
public/
  404.html               # SPA 라우팅용
vite.config.js           # base/alias/react 플러그인
eslint.config.js         # ESLint 구성
.github/workflows/deploy.yml # Pages 배포 워크플로우
```

## 라우팅 규칙
- 홈: `/` → `HomePage.tsx`
- 소개: `/about` → `AboutPage.tsx`
- 그래프: `/graph` → `GraphPage.tsx`
- 글 상세: `/posts/:slug` → `PostPage.tsx`
- 슬러그: 파일명 `YYYY-MM-DD-slug.md`에서 날짜 접두사는 자동 제거되어 라우팅에 쓰임

## 마크다운 글 작성 규칙
- 위치: `src/content/posts/` 권장(또는 `src/posts/` 레거시 호환)
- 파일명: 권장: `slug.md` (또는 레거시 호환을 위해 `YYYY-MM-DD-slug.md` 허용)
- 날짜 표기 권장 방식: `date`는 프런트매터에 명시하세요. 빌드/로더는 frontmatter의 `date`를 우선 사용합니다.
- 참고: 파일명에 날짜 접두사가 있더라도 내부 로더는 슬러그 생성 시 접두사(`YYYY-MM-DD-`)를 자동 제거합니다. 따라서 날짜를 라우트(slug)에 포함시키지 않습니다.
- 프런트매터 예시:
```markdown
---
title: 글 제목
date: 2025-09-04
excerpt: 짧은 요약
---

본문은 여기부터 마크다운으로 작성합니다.
```

## 그래프 뷰 문서 작성 규칙
- 위치: `src/content/<collection>/` (예: `src/content/Unreal/`, `src/content/Algorithm/`)
- 파일명: `PageName.md` (한글명도 지원)
- 위키링크: `[[대상페이지]]` 또는 `[[대상페이지|표시명]]` 형식 사용
- 각 컬렉션은 독립적인 그래프로 시각화됨
- **자동 감지**: 새로운 폴더를 `src/content/` 아래 생성하면 자동으로 그래프 페이지에 나타남

## 마크다운 로더 동작(중요 구현 포인트)
- `src/lib/posts.ts` (리팩토링됨)
  - `src/posts/**/*.md` 경로에서 블로그 포스트 로드(동적 import, 프로덕션 캐시)
  - 커스텀 `parseFrontmatter`로 안전하게 키:값 단일 라인 파싱
  - 중복 슬러그 방지 로직 추가
  - 파일명으로 슬러그 생성, 날짜 내림차순 정렬, 프로덕션 캐시
  - 브라우저 환경 호환(노드 전용 라이브러리 사용 금지)
- `src/lib/content.ts`
  - `src/content/**/*.md` 파일을 스캔하여 컬렉션 목록 자동 생성
  - 새로운 주제 폴더 추가 시 자동으로 감지
- `src/lib/graph.ts`
  - `src/content/<collection>` 폴더별 위키링크 그래프 생성
  - Async API(`buildGraphForCollectionAsync`)를 사용해 그래프 데이터 동적 로딩
  
## 번들링/성능 모범사례(중요)
- 무거운 의존성 및 데이터는 모두 동적 import로 분리합니다
  - posts 검색/로딩: `loadAllPosts()`
  - content 인덱스: `getContentItemsForCollectionAsync()`
  - 그래프 빌드: `buildGraphForCollectionAsync()`
  - 마크다운 렌더러: `react-markdown`/`remark-gfm`은 lazy 로드
- 페이지/모달은 경량 셸(React.lazy + Suspense)로 유지합니다
- Vite `manualChunks`는 vendor/d3/markdown 및 주요 컴포넌트 별로 분리되어 있습니다
  - 위키링크 `[[Target]]` 파싱 및 관계 구성

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
 - any 사용 금지, 동적 import의 에러 처리는 주석으로 빈 블록(no-empty) 방지

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
- 그래프 문서 추가: `src/content/<collection>/PageName.md` 생성
- **새 주제 추가**: `src/content/NewTopic/` 폴더 생성 → 자동으로 그래프 페이지에 반영
- 컴포넌트 분리: 복잡한 컴포넌트는 `src/components/`로 분리 권장
- 타입 추가: 공통 타입은 `src/types/index.ts`에 정의
- 홈 목록 정렬/표시 변경: `src/pages/HomePage.tsx` 또는 `src/lib/posts.ts` 편집

## 링크 모음
- 배포 URL: https://pargame.github.io/PargameBlog/
- 워크플로우: `.github/workflows/deploy.yml`
- 라우팅/베이스: `src/App.tsx`, `vite.config.js`

이 문서를 최신 상태로 유지하면(작은 변경도 반영) 새로운 AI가 언제든 정확히 이어서 작업할 수 있습니다.

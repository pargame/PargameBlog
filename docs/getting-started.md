# 시작하기

로컬 개발과 프로젝트 개요를 담은 시작 문서입니다.

로컬에서 프로젝트를 빠르게 실행하는 방법입니다.

요구 사항

- Node.js LTS
- npm

설치 및 실행

1. 레포지토리 클론

   ```bash
   git clone https://github.com/pargame/PargameBlog.git
   cd PargameBlog
   ```

2. 의존성 설치(권장)

   ```bash
   npm ci
   ```

3. 개발 서버 실행

   ```bash
   npm run dev
   # 기본: http://localhost:5173
   ```

유용한 명령

- 타입체크: `npm run typecheck`
- 린트: `npm run lint`
- 프로덕션 빌드: `npm run build`

참고

- 콘텐츠는 `content/` 하위 컬렉션을 권장합니다. 기존 레거시 포스트는 `content/posts/`에 남아 있을 수 있으나 새 작성은 `content/`를 사용하세요.
- 배포 시 `vite.config.js`의 `base` 값을 확인하세요 (GitHub Pages 사용 시 필요).

## 프로젝트 개요

이 프로젝트는 Vite + React Router 기반의 SPA로, 블로그와 위키형 그래프 뷰를 제공합니다.

### 핵심 구성

#### 데이터 레이어
- `src/lib/posts.ts`: 마크다운 블로그 글 로더 (레거시와 신규 위치 모두 지원)
- `src/lib/graph.ts`: 위키링크 그래프 데이터 생성
- `src/lib/content.ts`: 콘텐츠 컬렉션 관리
- `src/lib/doc.ts`: 문서 로더 및 관리

#### 타입 시스템
- `src/types/index.ts`: 공통 타입 정의 (Post, PostMeta, GraphData 등)

#### UI 컴포넌트
- `src/pages/`: 페이지 컴포넌트 (Home, Post, Graph, About)
- `src/components/`: 재사용 UI 컴포넌트 (GraphView, GraphModal, InsightDrawer 등)

### 라우팅 (주요 엔드포인트)
- `/` — 글 목록
- `/about` — 소개
- `/graph` — 그래프 뷰 (컬렉션 선택)
- `/posts/:slug` — 개별 글

### 폴더 요약
- `content/posts/`: 레거시 포스트
- `content/<collection>/`: 그래프용 위키 문서

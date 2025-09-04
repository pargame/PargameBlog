# 아키텍처 개요

이 프로젝트는 Vite + React Router 기반의 SPA로, 블로그와 위키형 그래프 뷰를 제공합니다.

## 핵심 구성

### 데이터 레이어
- `src/lib/posts.ts`: 마크다운 블로그 글 로더 (리팩토링됨)
  - 레거시(`src/posts/`)와 신규(`src/content/posts/`) 위치 모두 지원
  - 브라우저 안전 프런트매터 파서, Vite glob 활용
  - 중복 슬러그 방지 및 에러 핸들링 강화
- `src/lib/graph.ts`: 위키링크 그래프 데이터 생성
- `src/lib/content.ts`: 콘텐츠 컬렉션 관리
- `src/lib/doc.ts`: 문서 로더 및 관리

### 타입 시스템
- `src/types/index.ts`: 공통 타입 정의 통합
  - Post, PostMeta, GraphData, GraphNode 등

### UI 컴포넌트
- `src/pages/HomePage.tsx`: 글 목록(최신순) 렌더링
- `src/pages/PostPage.tsx`: 단일 글 렌더링(ReactMarkdown + GFM)
- `src/pages/AboutPage.tsx`: 소개 페이지
- `src/pages/GraphPage.tsx`: 그래프 뷰 페이지 (컴포넌트 분리로 단순화됨)
- `src/components/GraphView.tsx`: D3.js 기반 그래프 시각화
- `src/components/GraphModal.tsx`: 그래프 모달 (새로 분리됨)
- `src/components/InsightDrawer.tsx`: 인사이트 드로어 (새로 분리됨)
- `src/components/Footer.tsx`: 푸터 컴포넌트
- `src/App.tsx`: 라우팅 및 네비게이션

### 라우팅
- `/`: 홈페이지 (글 목록)
- `/about`: 소개 페이지
- `/graph`: 그래프 뷰 (컬렉션 선택)
- `/posts/:slug`: 개별 글 페이지

## 폴더 구조

### 콘텐츠
- `src/posts/`: 마크다운 원문 파일 (레거시 위치)
- `src/content/posts/`: 마크다운 원문 파일 (권장 위치)
- `src/content/<collection>/`: 그래프 뷰용 위키 문서

### 배포
- `public/404.html`: GitHub Pages용 SPA 리다이렉트
- `.github/workflows/deploy.yml`: Pages 배포 파이프라인

## 주요 개선사항 (리팩토링)

1. **모듈화**: 큰 컴포넌트를 작은 컴포넌트로 분리
2. **타입 안전성**: 공통 타입 정의 통합
3. **코드 중복 제거**: posts.ts 로직 단순화
4. **컴포넌트 분리**: GraphPage의 모달/드로어 로직 분리
5. **확장성**: 콘텐츠 위치 유연성 및 그래프 뷰 추가

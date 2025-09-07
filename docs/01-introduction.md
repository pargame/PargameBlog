# 소개 및 개요

한 줄 설명: 프로젝트 개요와 설계 원칙을 간단히 설명합니다.

이 저장소는 Vite + React 19 + TypeScript 기반의 SPA로, 블로그 포스팅과 위키형 지식 그래프(Obsidian 스타일)를 제공합니다. 아래는 프로젝트의 핵심 개요와 코드 구조입니다.

## 핵심 요약
- 스택: Vite 7, React 19, TypeScript 5
- 주요 기능: 블로그 포스트 렌더링, 위키링크 기반 그래프 시각화
- 콘텐츠 위치: 권장 `content/<collection>/` (레거시: `content/posts/` 지원)

## 주요 설계 원칙
- 무거운 의존성은 런타임에 동적으로 로드합니다 (React.lazy / dynamic import).
- 그래프 빌드와 큰 데이터는 lazy import 및 비동기 API 사용으로 초기 번들 비용을 줄입니다.
- 마크다운 처리 및 frontmatter 파싱은 브라우저 환경에서 안전하게 동작하도록 설계되어 있습니다.

## 코드 구조(주요 파일)
- `src/pages/`: 페이지 컴포넌트 (Home, Post, Graph, About)
- `src/components/`: 재사용 UI (GraphView, GraphModal, InsightDrawer, Footer 등)
- `src/lib/`: 데이터·유틸 계층 (`posts.ts`, `graph.ts`, `content.ts`, `doc.ts`, `frontmatter.ts` 등)
- `src/hooks/`: 훅(예: `useGraphSimulation.ts`)
- `src/types/`: 공통 타입 정의

## 라우팅 요약
- `/` → 홈 (글 목록)
- `/about` → 소개
- `/graph` → 그래프 뷰 (컬렉션 선택)
- `/posts/:slug` → 개별 글

추가 세부 내용 및 개발/배포 절차는 `docs/01-getting-started.md`, `docs/02-scripts.md`, `docs/03-quality-gates.md`, `docs/00-ai-onboarding.md`를 참고하세요.

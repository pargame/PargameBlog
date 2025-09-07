## 개요

한 줄 설명: Vite + React 19 + TypeScript 기반 SPA로, 블로그와 위키형 그래프(D3)를 제공합니다. 이 가이드는 개발/운영/문서 작성 원칙을 일관되게 정리합니다.

목차
- 시작하기
- 프로젝트 구성(데이터/타입/UI/라우팅)
- 설계 원칙(요약)
- 그래프 유지보수 가이드(D3)
- Dev & Ops(스크립트/품질 게이트)
- 컴포넌트 개발 가이드
- 콘텐츠/Frontmatter 규약
- Assets 관리 정책
- 주석 규칙

---

## 시작하기

로컬에서 빠르게 실행하는 절차입니다.

요구 사항
- Node.js LTS, npm

설치 및 실행
1) 저장소 클론
   - git clone https://github.com/pargame/PargameBlog.git
   - cd PargameBlog
2) 의존성 설치(권장)
   - npm ci
3) 개발 서버
   - npm run dev (기본: http://localhost:5173)

유용한 명령
- 타입체크: npm run typecheck
- 린트: npm run lint
- 프로덕션 빌드: npm run build

참고
- 콘텐츠는 `content/` 하위 컬렉션 사용을 권장합니다(레거시: `content/posts/`).
- GitHub Pages 배포 시 `vite.config.js`의 base를 확인하세요.

---

## 프로젝트 구성

핵심 스택
- Vite 7, React 19, TypeScript 5, React Router

데이터 레이어
- `src/lib/posts.ts`: 마크다운 블로그 글 로더(레거시/신규 모두 지원)
- `src/lib/graph.ts`: 위키링크 그래프 데이터 생성
- `src/lib/content.ts`: 콘텐츠 컬렉션 관리
- `src/lib/doc.ts`: 문서 로더 및 관리

타입 시스템
- `src/types/index.ts`: 공통 타입 정의(Post, PostMeta, GraphData 등)

UI 컴포넌트
- `src/pages/`: 페이지(Home, Post, Graph, About)
- `src/components/`: 재사용 UI(GraphView, GraphModal, InsightDrawer 등)

라우팅
- `/` 글 목록
- `/about` 소개
- `/graph` 그래프 뷰(컬렉션 선택)
- `/posts/:slug` 개별 글

폴더 요약
- `content/posts/` 레거시 포스트
- `content/<collection>/` 그래프용 위키 문서

---

## 설계 원칙(요약)

- 무거운 의존성은 동적 로드(React.lazy/dynamic import).
- 그래프 빌드 및 큰 데이터는 lazy import/비동기로 초기 번들 비용 최소화.
- 마크다운/Frontmatter 파싱은 브라우저 환경 안전성 우선.
- 선택자/DOM 구조 변경 시 훅과 컴포넌트 모두 업데이트.

---

## 그래프 유지보수 가이드(D3)

역할 분리(핵심)
- 시뮬레이션 로직: `src/hooks/useGraphSimulation.ts`
- UI: `src/components/graph/GraphView.tsx` 및 소형 컴포넌트 분리
- 책임 매핑:
  - `useGraphSimulation.ts` — 시뮬레이션/DOM 바인딩
  - `GraphView.tsx` — SVG 래퍼/컨트롤
  - `GraphModal.tsx` — 모달 내 그래프
  - `GraphControls.tsx` — 토글·컨트롤(UI). 예: 누락 노드 표시는 GraphView 상태를 훅으로 boolean 전달

디버깅 체크포인트
- 멈춤: 속도 임계치·idle ticks 파라미터 확인
- 호버: simulationStoppedRef 전달, CSS 클래스 확인

테스트 권장
- 훅 단위: 마운트/언마운트로 lifecycle 검증
- 통합: GraphView를 DOM에 마운트하여 기본 동작 확인

변경 시 주의
- 선택자나 DOM 구조 변경은 훅과 컴포넌트 양쪽에서 함께 업데이트.

---

## Dev & Ops (Scripts + Quality Gates)

주요 npm 스크립트
- `npm run dev` — 개발 서버 시작 (Vite, 기본: http://localhost:5173)
- `npm run build` — 프로덕션 빌드 (Vite)
- `npm run lint` — ESLint 검사 및 규칙 확인
- `npm run typecheck` — TypeScript 검사 (tsc --noEmit)

로컬 검증 워크플로우
1. `npm ci`
2. `npm run typecheck` (성공: Found 0 errors)
3. `npm run lint` (성공: Error 0)
4. `npm run build` (dist/ 생성 확인)

자동 수정 필요 시: `npx eslint . --fix`

CI / Quality Gates 예시
- PR/푸시에서 다음을 검증:
  1) npm ci(또는 install)
  2) npm run typecheck
  3) npm run lint
  4) npm run build

예시 워크플로우
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

GitHub Pages 배포
- main 푸시 시 자동 배포(빌드→Pages)
- 로컬 미리보기: `npm run build` 후 `npx vite preview`
- SPA 라우팅: `public/404.html` 제공, prod base는 `/PargameBlog/` 적용

---

## 컴포넌트 개발 가이드

구조 원칙

#### 1) 페이지 컴포넌트 (`src/pages/`)
- 라우트 최상위 컴포넌트
- 권장 골격:
```tsx
const PageName: React.FC = () => {
  return (
    <div className="page">
      <div className="content-section page-name-section">
        <h1>Page Title</h1>
        <p>페이지 설명</p>
        {/* 추가 콘텐츠 */}
      </div>
    </div>
  )
}
```

#### 2) 재사용 컴포넌트 (`src/components/`)
- 여러 페이지에서 사용
- 단일 책임, Props 인터페이스 명확화

#### 3) 타입 정의 (`src/types/`)
- 공통 타입은 `src/types/index.ts`
- 컴포넌트 전용 타입은 파일 내 정의

분리 기준
- 100+ 줄
- 독립 기능 단위로 분리 가능
- 재사용 가능
- 상태가 복잡

분리 예시(GraphPage)
- GraphPage.tsx — 메인 페이지 로직
- GraphModal.tsx — 모달
- InsightDrawer.tsx — 드로어

스타일링 가이드
- CSS 클래스 네이밍: 페이지 `page-name-section`, 공통 `page`, `content-section`, 컴포넌트 `component-name-element`
- 반응형: 공통 CSS 변수와 모바일 우선

상태 관리
- 지역 상태(useState): 모달, 폼 등 UI 상태
- Props Drilling 방지: 3단 이상 전달 시 분리 고려, 콜백 네이밍 명확화

성능 최적화
- React.memo: 필요 시 적용(비용 대비 효과 고려)
- useCallback/useMemo: 복잡 계산/함수 재생성 방지, 의존성 배열 정확히

접근성
- 의미론적 HTML 사용, 제목 레벨 순서 준수
- ARIA(`aria-label`, `role`) 활용, 키보드 네비 지원

테스트 가능한 컴포넌트
- Props: 선택적 값은 기본값 제공, 타입 안전
- 순수 함수 지향: 사이드 이펙트 최소화로 예측 가능성 확보

---

## 마크다운/위키 문서 작성 규칙과 frontmatter 규약
```
title: 블로그 포스트 제목
date: 2025-09-04T16:17:41+09:00
excerpt: 포스트의 간단한 요약 (선택)
author: 작성자명 (선택)
```

---

## 콘텐츠 작성 가이드

블로그 포스트
- 위치: 기본 `content/posts` (사용자 커스텀: `content/Postings`도 지원)
- 파일명: 날짜 접두사가 있으면 슬러그에서 날짜 제거(예: `2025-09-04-hello-blog.md` → `hello-blog`)

그래프(위키) 문서
- 위치: `content/<collection>/` (예: `Unreal`, `Algorithm`)
- 파일명: `page-name.md` (케밥케이스, 한글 허용·일관 유지)
- 위키링크 문법: `[[Target]]`, `[[Target|Label]]`, `[[Target#Anchor|Label]]` — 파서는 Target id 사용

새 컬렉션 추가
1. `mkdir content/your-topic`
2. `content/your-topic/intro.md` 작성
3. 개발 서버에서 `/graph`로 확인

---

## Assets 관리 정책

한 줄 설명: 이미지·아이콘·퍼블릭 에셋 관리 규칙과 보안 주의사항.

정책
- 모든 정적 자산은 `public/assets/`에서 관리. 코드 import 자산도 가능하면 이 위치 통일.
- `src/assets/`는 레거시. 새 자산 생성 금지, 기존은 `public/assets/`로 이전.
- 파일 네이밍: 소문자-하이픈, 확장자 실타입 반영(.svg/.png/.webp 등)

마이그레이션 단계
1) 코드에서 이미지/아이콘 참조 검색
2) 필요한 파일을 `public/assets/`로 이동
3) 경로를 `/assets/...`로 업데이트
4) `src/assets/`가 비면 삭제

보안/성능 팁
- SVG는 XSS 주의(신뢰되지 않은 SVG 필터링)
- 이미지 최적화를 CI 파이프라인에 추가하면 로드 성능 향상

간단 실행 예시
1) 레거시 파일 정리: rm -f public/favicon.ico src/assets/* || true
2) 빌드/서버 실행 후 파비콘 확인(브라우저 캐시 비우기 권장)

---

## 이 저장소의 주석 규칙

목적
- 기여자가 코드를 쉽게 이해하도록 돕고, 사실 기반·최신 상태 유지

파일 상단 헤더
- 모든 모듈은 3-6줄 헤더 권장(경로, 책임 한 문장, 주요 export/props 요약)

공개 API / Props
- 함수/컴포넌트는 필요 시 JSDoc으로 파라미터/반환값 간단 설명
- React 컴포넌트는 props 인터페이스 선언 위에 문서화

인라인 주석
- 복잡한 로직은 "왜"를 짧게 설명, 자명한 코드는 주석 생략

TODO / Deprecated
- 실행 가능한 향후 작업: `// TODO:`
- 더 이상 권장하지 않는 공개 API: 상단 `// @deprecated`와 대안/마이그레이션 안내

마커 규약
- `// TODO(owner): reason` 또는 `// FIXME(#123): description`
- `// LEGACY:`는 하위 호환 유지 이유와 제거 일정(가능 시) 명시
- 장기 TODO는 이슈로 전환하거나 병합 전 해결

리포지토리별 추가 규약
- Deprecated 표기: `@deprecated`와 대체 API·간단 마이그레이션 예시
- TODO/FIXME 형식: `// TODO(owner#issue): 요약`, `// FIXME(#123): 이유)`
- LEGACY 마커: 유지 이유와 제거/마이그레이션 계획

검토
- 코드 변경 PR에서 주석도 최신화. 리뷰어가 정확성 확인

---

## GitHub Pages 배포(요약)

- main 브랜치 푸시 → Actions가 빌드/배포 자동 실행
- 파이프라인: Checkout → Node LTS 설정+npm 캐시 → `npm ci` → typecheck → lint → build → Pages 업로드/배포
- 로컬 미리보기: `npm run build` 후 `npx vite preview`
- SPA 라우팅: `public/404.html`, prod base는 `/PargameBlog/`

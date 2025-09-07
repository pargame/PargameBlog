## 목적(대상: AI Agent)

이 문서는 협업 설명이 아니라, 자동화 에이전트가 즉시 실행·수정·배포할 수 있도록 규칙과 계약을 명시한다. 중복은 제거하고, 불변 조건과 경로/인터페이스 계약을 우선한다.

요약
- 앱: Vite + React 19 + TypeScript 기반 SPA. 블로그와 위키형 그래프(D3)를 제공.
- 운영 원칙: 작은 번들, 지연 로드, 타입 안전, 품질 게이트 통과 후 배포.

---

## 필수 불변 조건(Invariants)

- 프로덕션 base: `vite.config.js`에서 `/PargameBlog/` 유지(gh-pages 경로).
- SPA 라우팅: `public/404.html` 존재해야 함.
- 콘텐츠 루트: `content/` 하위만 사용.
- 그래프 파서는 위키링크 `[[Target]]`, `[[Target|Label]]`, `[[Target#Anchor|Label]]`만 해석. Target은 id로 매핑.
- 큰 의존성 및 데이터 로드: 동적 import/lazy가 기본.

---

## 리포지토리 맵(계약)

- 데이터 레이어
  - `src/lib/posts.ts` — 마크다운 포스트 로더
  - `src/lib/graph.ts` — 위키 링크 → GraphData 생성
  - `src/lib/content.ts` — 콘텐츠 컬렉션 관리
  - `src/lib/doc.ts` — 단일 문서 로딩/메타 관리
- 타입
  - `src/types/index.ts` — Post, PostMeta, GraphData 등 공통 타입
- UI
  - `src/pages/` — 라우트 엔트리(Home, Post, Graph, About)
  - `src/components/` — 재사용 컴포넌트(예: InsightDrawer, Graph 하위)
- 라우팅 규칙
  - `/` 글 목록, `/about`, `/graph`(컬렉션 선택), `/posts/:slug`
- 콘텐츠 폴더
  - `content/Postings/` — 블로그 포스팅
  - `content/GraphArchives/<collection>/` — 그래프용 위키 문서(예: UnrealEngine, Algorithm)

---

## 런북: 로컬 개발 → 품질 게이트 → 빌드/배포

요구 사항
- Node.js LTS, npm

실행 순서
1) 의존성 설치: `npm install`
2) 타입 검사: `npm run typecheck`(오류 0)
3) 린트: `npm run lint`(에러 0)
4) 개발 서버: `npm run dev`(기본 http://localhost:5173)
5) 프로덕션 빌드: `npm run build`(dist/ 생성)

자동 수정 옵션
- ESLint 자동 수정: `npx eslint . --fix`

배포(GitHub Pages)
- main 푸시 시 Actions로 자동 빌드/배포.
- 파이프라인 순서: Checkout → Node LTS+캐시 → `npm ci` → typecheck → lint → build → Pages 업로드/배포.
- 로컬 미리보기: `npm run build` 후 `npx vite preview`.

---

## 설계 원칙(집약)

- 동적 로드 우선: 무거운 의존성/그래프 데이터는 lazy import.
- 브라우저 안전 파싱: 마크다운/Frontmatter 처리 시 브라우저 호환 우선.
- DOM 변경 동기화: 선택자/구조 변경 시 훅·컴포넌트 양쪽 동시 갱신.
- 타입 우선: 공개 함수/컴포넌트는 명시적 타입, 기본값 명확화.

---

## 그래프 시스템(D3) 유지보수

역할 분리
- `src/hooks/useGraphSimulation.ts` — 시뮬레이션·DOM 바인딩
- `src/components/graph/GraphView.tsx` — SVG 래퍼/컨트롤
- `GraphModal.tsx` — 모달 컨테이너
- `GraphControls.tsx` — 토글·컨트롤(UI). GraphView 상태를 훅으로 전달(boolean 등)

디버깅 체크포인트
- 시뮬 정지: 속도 임계/idle ticks 파라미터 확인
- 호버 문제: simulationStoppedRef 전달·CSS 클래스 확인

테스트 권장
- 훅 단위: 마운트/언마운트로 라이프사이클 검증
- 통합: GraphView DOM 마운트 후 기본 인터랙션 동작 확인

주의
- DOM 선택자/구조 변경 시 훅과 UI를 함께 수정해야 일관성 유지.

---

## 컴포넌트 개발 규칙

페이지(`src/pages/`)
- 라우트 최상위. 구조 예시는 저장소 내 페이지들을 참조.

재사용 컴포넌트(`src/components/`)
- 단일 책임. Props 인터페이스 명확화.

타입 정의(`src/types/`)
- 공통 타입은 `src/types/index.ts` 사용. 전용 타입은 컴포넌트 파일 내 로컬 허용.

분리 기준
- 100줄 이상, 재사용 가능, 독립 기능, 상태 복잡 시 분리.

스타일 가이드
- 클래스 네이밍: 페이지 `page-name-section`, 공통 `page`, `content-section`, 컴포넌트 `component-name-element`.
- 반응형: 공통 CSS 변수, 모바일 우선.

상태/성능/접근성
- 상태: 지역 useState 중심. 3단계 이상 Props 드릴링 전 분리 고려.
- 성능: 필요한 곳만 React.memo/useCallback/useMemo. 의존성 배열 정확히.
- 접근성: 의미론적 HTML, 제목 레벨 순서, 적절한 ARIA, 키보드 네비.

테스트 가능성
- 선택적 Props는 기본값 제공. 순수 함수 지향으로 예측 가능성 확보.

---

## 콘텐츠 규약

Frontmatter(블로그)
```
title: 블로그 포스트 제목
date: 2025-09-04T16:17:41+09:00
excerpt: 포스트의 간단한 요약
author: 작성자명
```

블로그 포스트
- 위치: `content/Postings`
- 파일명: 날짜 접두사는 슬러그에서 제거(예: `2025-09-04-hello-blog.md` → `hello-blog`).

그래프(위키) 문서
- 위치: `content/GraphArchives/<collection>/`(예: `UnrealEngine`, `Algorithm`)
- 파일명: `page-name.md`(케밥 케이스, 한글 허용·일관 유지)
- 위키링크 문법: `[[Target]]`, `[[Target|Label]]`, `[[Target#Anchor|Label]]` — 파서는 Target id 사용.

---

## Assets 정책

정책
- 모든 정적 자산은 `public/assets/`에 통일. 가능하면 코드 import용 자산도 동일 경로 사용.
- 파일명: 소문자-하이픈, 확장자는 실제 타입(.svg/.png/.webp 등).

보안/성능
- SVG는 XSS 주의(신뢰되지 않은 SVG 필터링).
- CI에 이미지 최적화 추가 시 로드 성능 개선.

---

## 주석/문서화 규칙

- 모듈 헤더(3-6줄): 경로, 한줄 책임, 주요 export/props 요약.
- 공개 API/Props: 필요 시 JSDoc으로 파라미터/반환 설명.
- 인라인 주석: 복잡 로직의 "왜"를 짧게. 자명한 코드는 생략.
- 한글 설명

---

## 스크립트와 도구

- `npm run dev` — 개발 서버(Vite)
- `npm run build` — 프로덕션 빌드(Vite)
- `npm run lint` — ESLint 검사
- `npm run typecheck` — TypeScript 검사(tsc --noEmit)
- 유틸 스크립트: `scripts/`
  - `create_missing_docs.cjs` — 누락 문서 스텁 생성
  - `find-unused-simple.cjs` — 미사용 자산/코드 후보 탐지

---

## 문제 해결(Quick Checks)

- 그래프 멈춤: 시뮬 속도/idle ticks 조정, simulationStoppedRef 전달 확인, CSS 클래스 확인.
- 404/라우팅 깨짐: `vite.config.js` base=`/PargameBlog/`, `public/404.html` 존재 확인.
- 빌드 실패: typecheck/lint 선 확인 → 오류 메시지 기준으로 해당 파일 수정.

---

## 현 상태 메모(세션)

- 최근 세션에서 `npm run typecheck` 성공(ExitCode 0). 나머지 게이트는 각자 실행해 확인.

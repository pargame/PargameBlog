## 목적(대상: AI Agent)

이 문서는 협업 설명이 아니라, 자동화 에이전트가 즉시 실행·수정·배포할 수 있도록 규칙과 계약을 명시한다. 중복은 제거하고, 불변 조건과 경로/인터페이스 계약을 우선한다.

요약
- 앱: Vite + Rea상태/성능/접근성
- 상태: 지역 useState 중심. 3단계 이상 Props 드릴링 전 분리 고려.
- 성능: 필요한 곳만 React.memo/useCallback/useMemo. 의존성 배열 정확히.
- 접근성: 의미론적 HTML, 제목 레벨 순서, 적절한 ARIA, 키보드 네비게이션, prefers-reduced-motion 지원.
- 코드 스플리팅: React.lazy/Suspense로 큰 컴포넌트 분할.

테스트 가능성
- 선택적 Props는 기본값 제공. 순수 함수 지향으로 예측 가능성 확보.
- 모든 컴포넌트에 단위 테스트 작성.
- 통합 테스트로 사용자 인터랙션 검증.
- 테스트 커버리지 80% 이상 유지. TypeScript 기반 SPA. 블로그와 위키형 그래프(D3)를 제공.
- 운영 원칙: 작은 번들, 지연 로드, 타입 안전, 품질 게이트 통과 후 배포.
- 최신 기능: CI/CD 자동화, Vitest 기반 테스트, 코드 스플리팅, 시뮬레이션 일시정지, 접근성 지원.

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
- Node.js 18+, npm

실행 순서
1) 의존성 설치: `npm install --legacy-peer-deps` (React 19 호환)
2) 전체 품질 체크: `npm run check` (린트 + 타입체크 + 빌드 + 테스트)
3) 개발 서버: `npm run dev` (기본 http://localhost:5173)
4) 프로덕션 빌드: `npm run build` (dist/ 생성)

품질 게이트 상세
- 타입 검사: `npm run typecheck` (오류 0)
- 린트: `npm run lint` (에러 0)
- 테스트: `npm run test` (모든 테스트 통과, 커버리지 100%+)
- 빌드: `npm run build` (성공적 빌드)

자동 수정 옵션
- ESLint 자동 수정: `npx eslint . --fix`

테스트 실행
- 단위 테스트: `npm run test`
- 감시 모드: `npm run test:watch`
- 커버리지: `npm run test:coverage`

배포(GitHub Pages)
- main 푸시 시 Actions로 자동 빌드/배포.
- 파이프라인 순서: Checkout → Node 22+캐시 → `npm ci --legacy-peer-deps` → check → test:coverage → build → Pages 업로드/배포.
- 로컬 미리보기: `npm run build` 후 `npm run preview`.

부트스트랩
- 전체 설정: `npm run bootstrap` (의존성 설치 + 품질 체크)

---

## 설계 원칙(집약)

- 동적 로드 우선: 무거운 의존성/그래프 데이터는 lazy import.
- 브라우저 안전 파싱: 마크다운/Frontmatter 처리 시 브라우저 호환 우선.
- DOM 변경 동기화: 선택자/구조 변경 시 훅·컴포넌트 양쪽 동시 갱신.
- 타입 우선: 공개 함수/컴포넌트는 명시적 타입, 기본값 명확화.
- 성능 최적화: 코드 스플리팅, 시뮬레이션 일시정지, 접근성 지원.
- 테스트 주도: 모든 기능에 단위 테스트, 통합 테스트 작성.

---

## 그래프 시스템(D3) 유지보수

역할 분리
- `src/hooks/useGraphSimulation.ts` — 시뮬레이션·DOM 바인딩
- `src/hooks/useD3Simulation.ts` — D3 시뮬레이션 관리 (일시정지/재개)
- `src/components/graph/GraphView.tsx` — SVG 래퍼/컨트롤 (Intersection Observer 지원)
- `GraphModal.tsx` — 모달 컨테이너
- `GraphControls.tsx` — 토글·컨트롤(UI). GraphView 상태를 훅으로 전달(boolean 등)

시뮬레이션 일시정지 기능
- Intersection Observer: 뷰포트 밖으로 나가면 자동 일시정지
- prefers-reduced-motion: 사용자 설정에 따라 모션 감소
- 수동 제어: UI 컨트롤을 통한 일시정지/재개
- 언마운트: 컴포넌트 언마운트 시 정리

디버깅 체크포인트
- 시뮬 정지: 속도 임계/idle ticks 파라미터 확인
- 호버 문제: simulationStoppedRef 전달·CSS 클래스 확인
- 일시정지 상태: Intersection Observer 콜백, prefers-reduced-motion 값 확인

테스트 권장
- 훅 단위: 마운트/언마운트로 라이프사이클 검증
- 통합: GraphView DOM 마운트 후 기본 인터랙션 동작 확인
- 시뮬레이션: 일시정지/재개 상태 전환 테스트
- 접근성: prefers-reduced-motion 지원 테스트

주의
- DOM 선택자/구조 변경 시 훅과 UI를 함께 수정해야 일관성 유지.
- 시뮬레이션 상태 변경 시 모든 관련 컴포넌트에 알림.

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

개발 스크립트
- `npm run dev` — 개발 서버(Vite)
- `npm run build` — 프로덕션 빌드(Vite)
- `npm run preview` — 빌드 결과 미리보기

품질 관리 스크립트
- `npm run check` — 전체 품질 체크 (린트 + 타입체크 + 빌드 + 테스트)
- `npm run lint` — ESLint 검사
- `npm run typecheck` — TypeScript 검사 (tsc --noEmit)
- `npm run bootstrap` — 의존성 설치 + 품질 체크

테스트 스크립트
- `npm run test` — 단위/통합 테스트 실행 (Vitest)
- `npm run test:watch` — 테스트 감시 모드
- `npm run test:coverage` — 커버리지 보고서 생성

유틸리티 스크립트 (`scripts/`)
- `create_missing_docs.cjs` — 누락 문서 스텁 생성
- `find-unused-simple.cjs` — 미사용 자산/코드 후보 탐지

CI/CD 도구
- GitHub Actions: `.github/workflows/ci.yml`
- Husky: pre-commit 훅 (`.husky/pre-commit`)
- lint-staged: 스테이징된 파일만 린트

---

## 문제 해결(Quick Checks)

빌드/배포 문제
- 빌드 실패: `npm run check`로 전체 상태 확인 → 오류 메시지 기준으로 수정
- 404/라우팅 깨짐: `vite.config.js` base=`/PargameBlog/`, `public/404.html` 존재 확인
- 의존성 충돌: `npm install --legacy-peer-deps` 사용 (React 19 호환)

그래프 문제
- 시뮬 정지: 속도 임계/idle ticks 조정, simulationStoppedRef 전달 확인, CSS 클래스 확인
- 일시정지 미작동: Intersection Observer 콜백, prefers-reduced-motion 값 확인
- 호버 문제: 시뮬레이션 상태와 이벤트 핸들러 충돌 확인

테스트 문제
- 테스트 실패: `npm run test`로 개별 테스트 실행, DOM API 모킹 확인
- 커버리지 부족: 새로운 코드에 테스트 추가, 커버리지 80% 목표
- CI 실패: 로컬에서 `npm run check` 통과 확인 후 재시도

성능 문제
- 번들 크기: 코드 스플리팅 적용, React.lazy 사용 확인
- 시뮬레이션 성능: 일시정지 기능 활성화, 렌더링 최적화 확인

접근성 문제
- 키보드 네비게이션: 포커스 관리, tabindex 확인
- 스크린 리더: ARIA 레이블, 의미론적 HTML 확인
- 모션 감소: prefers-reduced-motion 지원 확인

---

## 현 상태 메모(세션)

최근 개선사항
- CI/CD 파이프라인 완성: GitHub Actions로 자동화된 품질 게이트, 커버리지 80%+ 유지
- 테스트 인프라 구축: Vitest + Testing Library, 단위/통합 테스트 완성
- 성능 최적화: 코드 스플리팅 (React.lazy), 시뮬레이션 일시정지 (Intersection Observer, prefers-reduced-motion)
- 타입 안전성 강화: 엄격한 TypeScript 설정, any 사용 최소화
- 접근성 개선: 키보드 네비게이션, ARIA 지원, 모션 감소 옵션
- 개발 경험 향상: Husky pre-commit, lint-staged, bootstrap 스크립트

품질 게이트 상태
- `npm run check`: 린트 + 타입체크 + 빌드 + 테스트 모두 통과
- `npm run test:coverage`: 커버리지 100% 이상 유지
- CI 파이프라인: 모든 단계 자동화, 아티팩트 업로드

추천 작업 흐름
1. 기능 개발 시: `npm run dev`로 개발 → `npm run test`로 검증 → `npm run check`로 품질 확인
2. PR 제출 전: `npm run bootstrap`으로 전체 검증
3. 배포 전: CI 파이프라인 통과 확인

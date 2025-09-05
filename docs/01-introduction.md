# 소개

이 프로젝트는 Vite + React 19 + TypeScript 기반의 단일 페이지 애플리케이션으로,
블로그 포스팅과 위키링크(Obsidian 스타일)의 지식 그래프 뷰를 제공합니다.

## 핵심 특징
- 성능 최적화된 번들링: React.lazy + dynamic import, Vite manualChunks로 대형 의존성(d3, react-markdown, remark-gfm)을 분리
- 안전한 마크다운 처리: 브라우저 환경만 사용, frontmatter 파싱/정렬/캐시 유틸 제공
- SPA 라우팅: React Router v7, GitHub Pages 친화적인 404 라우팅
- 자동 아카이브 감지: `src/content/<collection>/` 구조를 자동 인덱싱하여 그래프 뷰에 반영

## 코드 구조 한눈에 보기
- `src/pages/` 페이지 컴포넌트: Home, Post, Graph, About
- `src/components/` 재사용 컴포넌트: GraphView(D3), GraphModal, InsightDrawer, Footer 등
- `src/lib/` 유틸: posts(포스트 로더), content(컬렉션 인덱서), graph(그래프 생성기), doc(문서 로더), frontmatter 등
- `src/types/` 공통 타입 정의

## 번들링과 성능 모범사례
- 무거운 의존성은 "사용 시 로드" 원칙을 따릅니다.
  - d3 기반 GraphView, react-markdown/remark-gfm, 그래프/문서/포스트 데이터 로더는 lazy 로딩
- Vite `manualChunks`로 vendor/d3/markdown/페이지·컴포넌트를 별도 청크로 분리
- 초기 진입은 가벼운 Home/라우팅 코드만 포함하도록 유지

자세한 개발 흐름과 품질 게이트는 `docs/guide/`와 `docs/00-ai-onboarding.md`를 참고하세요.

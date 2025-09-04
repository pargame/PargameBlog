# 아키텍처 개요

이 프로젝트는 Vite + React Router 기반의 SPA입니다.

핵심 구성
- `src/lib/posts.ts`: 마크다운 글 로더(브라우저 안전 프런트매터 파서, vite glob)
- `src/pages/HomePage.tsx`: 글 목록(최신순) 렌더링
- `src/pages/PostPage.tsx`: 단일 글 렌더링(ReactMarkdown + GFM)
- `src/App.tsx`: 라우팅 및 네비게이션

폴더 구조 요약
- `src/posts/`: 마크다운 원문 파일
- `public/404.html`: GitHub Pages용 SPA 리다이렉트
- `.github/workflows/deploy.yml`: Pages 배포 파이프라인

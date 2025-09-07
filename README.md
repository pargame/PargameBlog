
# PargameBlog

React + Vite 기반 개인 블로그 및 위키형 지식 그래프 뷰어입니다.

핵심

- 컨텐츠: `content/`
- 그래프: `src/components/graph` (D3)
- 시뮬레이션 훅: `src/hooks/useGraphSimulation.ts`

빠른 시작

- 개발: `npm run dev` (http://localhost:5173)
- 빌드: `npm run build`
- 린트: `npm run lint`
- 타입체크: `npm run typecheck`

배포

- GitHub Pages 자동 배포(메인 브랜치 → CI → Pages). 빌드 베이스는 `vite.config.js`의 `base` 설정을 확인하세요.

유틸리티 스크립트(간단 요약)

- `npm run create-missing-docs -- [--dry-run]` — `content/`의 `[[Target]]` 링크를 스캔해 없으면 플레이스홀더 생성. 권장: Node 버전(`scripts/create_missing_docs.cjs`).
- `node scripts/find-unused.cjs --mode=files|full|advanced` — 미사용 후보 탐지(통합 스크립트). `advanced`는 `tsconfig.json`의 paths를 고려해 `unused-candidates.json`을 생성.
- `node scripts/add-headers.cjs` — 프로젝트 파일 상단에 헤더 일괄 추가(옵션 확인).

권장 워크플로우

1. 변경 전: `npm run typecheck && npm run lint && npm run build`
2. 자동 수정 전에는 항상 드라이런(`--dry-run` 또는 `:dry`)으로 확인
3. 자동 생성/수정된 파일은 수동 검토 및 편집

문서

- 그래프 유지보수 가이드: `docs/graph-maintenance.md`


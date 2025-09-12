# Developer Notes

## 설정 및 실행

### 초기 설정 (Bootstrap)
```bash
# 의존성 설치 및 개발 환경 설정 (pre-commit hook 포함)
npm run bootstrap

# 또는 기본 설치만
npm ci
```

### 개발 스크립트
```bash
# 개발 서버 시작
npm run dev

# 린트 + 타입체크 (CI와 동일한 검사)
npm run check

# 개별 실행
npm run lint
npm run typecheck

# 테스트 실행
npm run test

# 프로덕션 빌드
npm run build
```

### 번들 분석
```bash
# 번들 분석 리포트 생성 (dist/stats.html)
ANALYZE=true npm run build
```

## 프로젝트 구조

### 주요 특징
- **React 19** + **TypeScript** strict mode
- **Vite 7** 빌드 시스템
- **D3.js** 기반 그래프 시뮬레이션
- **ESLint 9** flat config
- **Vitest** 테스트 환경

### 아키텍처
- **Hooks 분리**: `useD3Simulation`, `useGraphRendering`, `useGraphInteraction` 등 역할별 분리
- **Context 기반**: GraphRefsContext로 ref 공유, prop drilling 방지
- **지연 로딩**: GraphModal, InsightDrawer는 React.lazy로 코드 분할
- **타입 안전**: d3 타입을 활용한 강타입 시스템

### 성능 최적화
- **시뮬레이션 일시정지**: 
  - `document.visibilitychange` (탭 비활성화)
  - `IntersectionObserver` (화면 밖)
  - `prefers-reduced-motion` 사용자 설정 존중
- **렌더링 쓰로틀**: ~30fps로 제한
- **번들 분할**: d3, react, markdown, 페이지별로 청크 분리

## CI/CD

### GitHub Actions
- CI workflow가 `.github/workflows/ci.yml`에 구성됨
- 단계: lint → typecheck → build → test (with coverage)
- Coverage 임계값: 100% (total lines)
- Push/PR 시 main 브랜치에서 자동 실행
- Coverage report를 아티팩트로 업로드

### Pre-commit Hook
- Husky + lint-staged 설정 완료
- 커밋 전 자동 lint 실행 및 수정
- `npm run bootstrap`으로 자동 설치됨

## 테스트

### 구조
- **Unit**: `src/lib/__tests__/` - 유틸리티 함수 (graphUtils)
- **Smoke**: `src/hooks/__tests__/` - 훅 기본 동작 테스트
- **Setup**: `src/test-setup.ts` - DOM API 모킹

### 모킹 환경
- `window.matchMedia` (prefers-reduced-motion 지원)
- `IntersectionObserver` (viewport 감지)
- `ResizeObserver` (크기 변경 감지)

## 개발 팁

### 타입 안전성
- `src/hooks/types.ts`에서 d3 관련 타입 중앙화
- GraphRefs 타입으로 ref 타입 안전성 확보
- any 사용 최소화 (test 파일은 eslint-disable 처리)

### 에러 처리
- 모든 catch 블록에서 `logger.debug` 사용
- DOM API 호출 시 존재 여부 검사
- 안전한 fallback 제공

### 성능 디버깅
- `usePerfProfiler` 훅으로 프레임 레이트 모니터링
- 브라우저 개발자 도구 Performance 탭 활용
- 시뮬레이션 일시정지로 CPU 사용량 최적화

### 그래프 커스터마이징
- `useD3Simulation.ts`: 물리 시뮬레이션 설정 (힘, 거리, 감쇠)
- `useGraphRendering.ts`: 시각적 표현 (노드, 링크, 레이블)
- `useGraphInteraction.ts`: 상호작용 (드래그, 줌, 호버)

## 완료된 개선사항

### 크리티컬 개선 ✅
- CI 파이프라인 구축 (GitHub Actions)
- 시뮬레이션 일시정지 정책 (visibility, intersection, prefers-reduced-motion)
- 코드 분할 (React.lazy, manualChunks)

### 상(High) 우선 개선 ✅
- 타입 안전성 강화 (any → d3 구체 타입)
- Pre-commit 훅 설정 (husky + lint-staged)
- 기본 테스트 및 모킹 환경 (Vitest)

### 추가 개선 ✅
- 에러 로깅 체계 (빈 catch → logger.debug)
- 테스트 설정 수정 (c8 → v8 provider)
- DOM API 모킹 (matchMedia, IntersectionObserver, ResizeObserver)

## 현재 상태

- **Lint**: 3개 경고만 남음 (react-hooks/exhaustive-deps, sort-imports)
- **TypeCheck**: 통과 ✅
- **Test**: 6개 테스트 모두 통과 ✅
- **Build**: 성공, 번들 크기 최적화됨 ✅
- **Coverage**: 설정 완료, CI에서 100% 임계값 검사 ✅


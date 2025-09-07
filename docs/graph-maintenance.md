# 그래프 시각화 유지보수 가이드

이 문서는 `src/components/graph` 폴더와 `src/hooks/useGraphSimulation.ts`에서 사용하는 D3 기반 그래프 파이프라인의 구조, 책임 분배, 디버깅 팁, 테스트 제안 등을 정리합니다.

## 개요
- D3 시뮬레이션 로직은 `src/hooks/useGraphSimulation.ts`에 집중되어 있습니다. React 컴포넌트(`GraphView`)는 SVG 및 UI 컨트롤을 렌더링하고 훅을 통해 D3에 필요한 DOM refs와 콜백을 전달합니다.
- 파일/역할
  - `src/hooks/useGraphSimulation.ts` — D3 force 시뮬레이션, join, drag/zoom, 렌더 루프, 호버-언더라이팅 로직 포함
  - `src/components/graph/GraphView.tsx` — SVG 래퍼, 크기 관찰, showMissing 토글, 훅 연결
  - `src/components/graph/GraphModal*.tsx` — 모달 내에서 그래프 로딩 및 검색 UI 담당
  - `src/components/graph/GraphControls.tsx` — 작은 UI 토글
  - CSS 파일들 — 시각적 상태(.faded, .faded-link, .active) 정의

## 주요 설계 원칙
1. D3는 DOM 조작에 특화되어 있으므로 시뮬레이션과 DOM 바인딩을 훅 내부에 캡슐화합니다.
2. React는 뷰와 상태(예: showMissing)만 담당합니다. 가능한 한 React 렌더 루프와 D3 DOM 업데이트를 분리합니다.
3. 시뮬레이션 자동 정지: 노드 속도/유휴 틱 기준으로 대부분의 노드가 정지하면 시뮬레이션을 stop()하고 `simulationStoppedRef`를 true로 설정합니다. 이때 호버-언더라이팅(A) 기능이 활성화됩니다.

## 유지보수/디버깅 체크리스트
- 시뮬레이션이 멈추지 않는다면
  1. `useGraphSimulation`의 `NODE_SPEED_THRESHOLD`, `IDLE_TICKS_TO_STOP`, `NODE_IDLE_RATIO` 값을 검토
  2. 드래그 중인 노드가 플래그(`_dragging`)로 정확히 설정/해제되는지 확인
  3. 개발 환경에서 `console.debug` 출력을 확인

- 호버-언더라이팅이 동작하지 않는다면
  1. `simulationStoppedRef`가 외부에서 참조 가능한지 확인(호출부: `GraphView`가 ref를 전달)
  2. 노드/링크/레이블의 `.faded`, `.faded-link`, `.active` 클래스가 CSS에서 적절히 정의되었는지 확인

## 안전한 리팩토링 가이드
- 훅 내부에서 DOM 선택자 네임(예: `g.zoom-layer`, `g.nodes`) 변경 시, 동일 네임을 참조하는 부분(선택자, 테스트)을 모두 업데이트하세요.
- 노드/링크 데이터 구조 타입(`GraphNode`, `RawLink`) 변경 시 `mapLinksToNodes`와 `useGraphSimulation`의 타입 선언을 동시에 갱신하세요.

## 테스트 권장
- 작은 스모크 테스트
  - 훅이 마운트/언마운트 시 시뮬레이션을 생성하고 제거하는지 확인
  - 노드가 여러 번 정지했을 때 `simulationStoppedRef`가 true로 설정되는지 테스트
- 통합 테스트(렌더링)
  - `GraphView`를 머리말 DOM에 mount하고 최소한의 노드/링크로 시뮬레이션이 정상 동작하는지 확인

## 변경 로그 정책
- 그래프 API(파일 경로, public props) 변경 시 `docs/CHANGELOG.md`에 간단한 요약을 추가하세요.

## 추가 참고
- 파일 주석은 한글로 유지합니다. 컴포넌트 외부에 노출되는 사용자 UI 문자열은 i18n 적용이 필요하면 별도 작업을 고려하세요.

---
작성일: 2025-09-07

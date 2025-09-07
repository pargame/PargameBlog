# Graph components

This folder groups the D3-powered graph visualization used in the app.

Files
- `GraphView.tsx` — Root React component that renders the SVG, wrapper, controls; uses `useGraphSimulation` for D3 logic.
- `useGraphSimulation.ts` — Encapsulates D3 force simulation, joins, drag, zoom, and render loop.
- `GraphModal.tsx` — Modal wrapper that lazy-loads `GraphModalContent`.
- `GraphModalContent.tsx` — Builds graph data and renders `GraphView` inside a modal body.
- `GraphControls.tsx` (+ CSS) — Small UI to toggle missing nodes.
- `GraphModalContent.css`, `GraphControls.css`, `GraphView.css` — Styles for the components.

Usage
- Import the modal lazily where needed:

````markdown
# 그래프 컴포넌트

이 폴더는 애플리케이션에서 사용하는 D3 기반 그래프 시각화 컴포넌트를 모아 둔 곳입니다.

파일 설명
- `GraphView.tsx` — SVG, 래퍼, 컨트롤을 렌더링하는 루트 React 컴포넌트입니다. D3 로직은 `useGraphSimulation`을 사용합니다.
- `useGraphSimulation.ts` — D3 force 시뮬레이션, join(조인), 드래그, 줌, 렌더 루프를 캡슐화합니다.
- `GraphModal.tsx` — `GraphModalContent`를 lazy 로드하는 모달 래퍼입니다.
- `GraphModalContent.tsx` — 그래프 데이터를 구성하고 모달 내부에 `GraphView`를 렌더링합니다.
- `GraphControls.tsx` (+ CSS) — 누락된 노드를 토글하는 작은 UI입니다.
- `GraphModalContent.css`, `GraphControls.css`, `GraphView.css` — 컴포넌트 스타일입니다.

사용법
- 필요한 곳에서 모달을 lazy 로 임포트하세요:

```ts
const GraphModal = lazy(() => import('../components/graph/GraphModal'))
```

노트
- D3 로직은 `useGraphSimulation` 내부에 유지하여 React 렌더와의 DOM 결합을 피하세요.
- 이 폴더에 있는 파일명을 변경하면 관련 lazy import(예: `src/pages/GraphPage.tsx`)를 업데이트해야 합니다.

유지보수 팁
- `useGraphSimulation`에 대한 간단한 초기화/정리(smoke) 테스트 추가를 권장합니다.
- 파일 이동/이름 변경이 다른 소비자에 영향을 주면 CHANGELOG 항목을 추가하세요.

````

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

```ts
const GraphModal = lazy(() => import('../components/graph/GraphModal'))
```

Notes
- Keep D3 logic inside `useGraphSimulation` to avoid DOM coupling in React render.
- If you rename files inside this folder, update any lazy imports (e.g. `src/pages/GraphPage.tsx`).

Suggested follow-ups
- Add tests for `useGraphSimulation` (small smoke tests for initialization/cleanup).
- Add a CHANGELOG entry if moving/renaming files affects other consumers.

/**
 * Thin compatibility wrapper.
 * The canonical implementation of `useGraphSimulation` lives in `src/hooks/useGraphSimulation.ts`.
 * This file re-exports the hook to keep existing imports under
 * `src/components/graph/useGraphSimulation` working during migration.
 */

export { default } from '../../hooks/useGraphSimulation'

// TODO: remove this wrapper after migrating all callers to import from `../..\/hooks\/useGraphSimulation`

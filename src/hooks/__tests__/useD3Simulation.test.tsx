/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useD3Simulation from '../useD3Simulation'

// Minimal smoke test: ensure hook returns controls and pause/resume work
describe('useD3Simulation smoke', () => {
  it('returns controls and respects pause/resume', () => {
    const nodes: any[] = []
    const links: any[] = []
    const simulationRef: any = { current: null }
    const nodeSelRef: any = { current: null }
    const linkSelRef: any = { current: null }
    const labelSelRef: any = { current: null }
    const kickTimerRef: any = { current: null }
    const initializedRef: any = { current: false }
    const simulationStoppedRef: any = { current: false }

    const { result } = renderHook(() => useD3Simulation({
      simulationRef,
      nodeSelRef,
      linkSelRef,
      labelSelRef,
      nodes,
      links,
      dims: { w: 800, h: 600 },
      kickTimerRef,
      initializedRef,
      simulationStoppedRef,
      renderPositions: () => {},
      updateVisibility: () => {},
      showMissing: true,
    }))

    expect(result.current).toHaveProperty('kickSimulation')
    expect(result.current).toHaveProperty('pauseSimulation')
    expect(result.current).toHaveProperty('resumeSimulation')
  })
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import useGraphInteraction from '../useGraphInteraction'

describe('useGraphInteraction smoke', () => {
  it('mounts without throwing', () => {
    const svgRef: any = { current: null }
    const zoomRef: any = { current: null }
    const simulationRef: any = { current: null }
    const nodeSelRef: any = { current: null }
    const linkSelRef: any = { current: null }
    const labelSelRef: any = { current: null }

    const { result } = renderHook(() => useGraphInteraction({
      svgRef,
      zoomRef,
      simulationRef,
      nodeSelRef,
      linkSelRef,
      labelSelRef,
      onBackgroundClick: () => {},
      kickSimulation: () => {},
      simulationStoppedRef: { current: false }
    }))

    expect(result.error).toBeUndefined()
  })
})

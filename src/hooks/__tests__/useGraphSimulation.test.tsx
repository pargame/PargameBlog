/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import useGraphSimulation from '../useGraphSimulation'
import React from 'react'

describe('useGraphSimulation smoke', () => {
  it('returns simControls (or undefined) and does not throw', () => {
    const svgRef: any = { current: null }
    const dims = { w: 800, h: 600 }
   
    const { result } = renderHook(() => useGraphSimulation({
      svgRef,
      dims,
      width: 800,
      height: 600,
      data: { nodes: [], links: [] },
      showMissing: true,
    }))

  // Hook should not throw when initialized and should provide controls
  expect(() => result.current).not.toThrow()
  })
})

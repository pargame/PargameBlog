import { useCallback, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { D3SimulationParams, LinkDatum, NodeDatum } from './types'
import logger from '../lib/logger'
import usePerfProfiler from './usePerfProfiler'
import { IDLE_TICKS_TO_STOP, KICK_ALPHA_TARGET, KICK_RELAX_AFTER_MS, KICK_RELAX_TO, NODE_IDLE_RATIO, NODE_SPEED_THRESHOLD } from './graphConstants'
export default function useD3Simulation(params: D3SimulationParams) {
  const { simulationRef, nodeSelRef, linkSelRef, labelSelRef, nodes, links, dims, kickTimerRef, initializedRef, simulationStoppedRef, renderPositions, updateVisibility, showMissing } = params

  const { recordFrame } = usePerfProfiler()

  // Throttle frame rendering to avoid excessive DOM updates (ms between frames)
  const lastFrameRef = useRef<number>(0)
  const FRAME_INTERVAL_MS = 1000 / 30 // ~30 FPS

  const kickSimulation = useCallback((sim: d3.Simulation<NodeDatum, LinkDatum> | null, target = KICK_ALPHA_TARGET, relaxTo = KICK_RELAX_TO, relaxAfter = KICK_RELAX_AFTER_MS) => {
    if (!sim) return
    try {
      if (simulationStoppedRef) simulationStoppedRef.current = false
    } catch {
      logger.debug('useD3Simulation: failed to write simulationStoppedRef')
    }
    // When kicking the simulation, unpin any auto-pinned nodes so they can move again
    try {
      const nodes = sim.nodes() as NodeDatum[]
      if (Array.isArray(nodes)) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i]
          if (n._autoPinned) {
            try {
              n.fx = null
              n.fy = null
            } catch {
              // ignore
            }
            n._autoPinned = false
          }
        }
      }
    } catch {
      logger.debug('useD3Simulation: failed to unpin nodes on kick')
    }
    try {
      sim.alpha(1)
      sim.alphaTarget(target)
      sim.restart()
      try {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new Event('pargame:simulationStarted'))
        }
      } catch {
        logger.debug('useD3Simulation: failed to dispatch simulationStarted event')
      }
      if (kickTimerRef.current) {
        window.clearTimeout(kickTimerRef.current)
        kickTimerRef.current = null
      }
      kickTimerRef.current = window.setTimeout(() => {
        try {
          sim.alphaTarget(relaxTo)
        } catch {
          logger.debug('useD3Simulation: alphaTarget failed')
        }
        kickTimerRef.current = null
      }, relaxAfter)
    } catch {
      logger.debug('useD3Simulation kickSimulation failed')
    }
  }, [kickTimerRef, simulationStoppedRef])

  // Pause/resume helpers for visibility/viewport handling
  const pauseSimulation = useCallback(() => {
    try {
      if (simulationRef.current) {
        simulationRef.current.stop()
        if (simulationStoppedRef) simulationStoppedRef.current = true
        logger.debug('useD3Simulation: paused')
      }
    } catch {
      logger.debug('useD3Simulation pause failed')
    }
  }, [simulationRef, simulationStoppedRef])

  const resumeSimulation = useCallback(() => {
    try {
  if (simulationRef.current) {
        // Unpin auto-pinned nodes so resume actually moves them
        try {
          const nodes = simulationRef.current.nodes() as NodeDatum[]
          if (Array.isArray(nodes)) {
            for (let i = 0; i < nodes.length; i++) {
              const n = nodes[i]
              if (n._autoPinned) {
                try {
                  n.fx = null
                  n.fy = null
                } catch (e) {
                  logger.debug('useD3Simulation: failed to clear fx/fy on resume', e)
                }
                n._autoPinned = false
              }
            }
          }
        } catch (e) {
          logger.debug('useD3Simulation: failed to unpin nodes on resume', e)
        }
        simulationRef.current.restart()
        try {
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new Event('pargame:simulationStarted'))
          }
        } catch (evtErr) {
          logger.debug('useD3Simulation: failed to dispatch simulationStarted event', evtErr)
        }
        if (simulationStoppedRef) simulationStoppedRef.current = false
        logger.debug('useD3Simulation: resumed')
      }
    } catch {
      logger.debug('useD3Simulation resume failed')
    }
  }, [simulationRef, simulationStoppedRef])

  // respects prefers-reduced-motion: if user prefers reduced motion, keep simulation paused
  const prefersReducedMotion = typeof window !== 'undefined' && 'matchMedia' in window
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  useEffect(() => {
    if (!nodes || !links) return

    const W = dims.w
    const H = dims.h

    if (simulationRef.current) {
      simulationRef.current.nodes(nodes)
      const linkForce = simulationRef.current.force('link') as d3.ForceLink<NodeDatum, LinkDatum>
      if (linkForce) linkForce.links(links)
      kickSimulation(simulationRef.current)
      updateVisibility?.(showMissing ?? true)
      return
    }

    const sim = d3
      .forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('collision', d3.forceCollide<NodeDatum>().radius(18).strength(0.7))
      .force('x', d3.forceX(W / 2).strength(0.05))
      .force('y', d3.forceY(H / 2).strength(0.05))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .velocityDecay(0.6)
      .alpha(1)
      .alphaDecay(0.05)

    simulationRef.current = sim

    let frameRequested = false
    const render = () => {
      frameRequested = false
      lastFrameRef.current = Date.now()
      renderPositions?.()
      try { recordFrame() } catch (e) { logger.debug('perf record failed', e) }
    }

  // thresholds and timings imported from graphConstants

  sim.on('tick', () => {
      const now = Date.now()
      if (!frameRequested && now - lastFrameRef.current >= FRAME_INTERVAL_MS) {
        frameRequested = true
        window.requestAnimationFrame(render)
      }

      try {
        const currentNodes = sim.nodes() as NodeDatum[]
        let autoPinnedCount = 0
        let draggingCount = 0
        for (let i = 0; i < currentNodes.length; i++) {
          const n = currentNodes[i]
          if (!n._idleTicks) n._idleTicks = 0
          if (!n._autoPinned) n._autoPinned = false
          if (n._dragging) draggingCount++

          const vx = n.vx ?? 0
          const vy = n.vy ?? 0
          const s = Math.sqrt(vx * vx + vy * vy)
          if (s < NODE_SPEED_THRESHOLD) {
            n._idleTicks = (n._idleTicks ?? 0) + 1
          } else {
            n._idleTicks = 0
          }

          if (!n._autoPinned && !n._dragging && (n._idleTicks ?? 0) >= IDLE_TICKS_TO_STOP) {
            n.vx = 0
            n.vy = 0
            n.fx = n.x ?? null
            n.fy = n.y ?? null
            n._autoPinned = true
          }

          if (n._autoPinned) autoPinnedCount++
        }

        const ratio = currentNodes.length > 0 ? autoPinnedCount / currentNodes.length : 1
        if (ratio >= NODE_IDLE_RATIO && draggingCount === 0) {
          try {
            sim.stop()
            try {
              if (simulationStoppedRef) simulationStoppedRef.current = true
            } catch (innerErr) {
              logger.debug('useD3Simulation: failed to mark stopped', innerErr)
            }
            try {
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new Event('pargame:simulationStopped'))
              }
            } catch (evtErr) {
              logger.debug('useD3Simulation: failed to dispatch simulationStopped event', evtErr)
            }
          } catch (err) {
            logger.debug('useD3Simulation: error stopping simulation', err)
          }
          for (let i = 0; i < currentNodes.length; i++) {
            currentNodes[i]._idleTicks = 0
          }
        }
      } catch (err) {
        logger.debug('useD3Simulation: tick handler error', err)
      }
    })

    // visibility API: pause simulation when page is hidden
    const handleVisibility = () => {
      try {
        if (prefersReducedMotion) return
        if (document.hidden) pauseSimulation()
        else resumeSimulation()
      } catch {
        logger.debug('useD3Simulation visibility handler failed')
      }
    }
    try {
      if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('visibilitychange', handleVisibility)
    } catch {
      logger.debug('useD3Simulation: failed to add visibilitychange listener')
    }

    // Listen for global pause/resume events so other parts of the app (pages, router)
    // can request the simulation be paused without a direct ref to the hook.
    const handleExternalPause = () => {
      try {
        if (prefersReducedMotion) return
        pauseSimulation()
      } catch (e) {
        logger.debug('useD3Simulation: external pause handler failed', e)
      }
    }
    const handleExternalResume = () => {
      try {
        if (prefersReducedMotion) return
        resumeSimulation()
      } catch (e) {
        logger.debug('useD3Simulation: external resume handler failed', e)
      }
    }
    try {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('pargame:pauseSimulation', handleExternalPause)
        window.addEventListener('pargame:resumeSimulation', handleExternalResume)
      }
    } catch {
      logger.debug('useD3Simulation: failed to add external pause/resume listeners')
    }

  if (!prefersReducedMotion) kickSimulation(sim)
    renderPositions?.()
    initializedRef.current = true
    updateVisibility?.(showMissing ?? true)

    return () => {
      try { sim.stop() } catch { logger.debug('useD3Simulation cleanup stop') }
      simulationRef.current = null
      initializedRef.current = false
      try { nodeSelRef.current = null } catch { logger.debug('useD3Simulation cleanup nodeSel') }
      try { linkSelRef.current = null } catch { logger.debug('useD3Simulation cleanup linkSel') }
      try { labelSelRef.current = null } catch { logger.debug('useD3Simulation cleanup labelSel') }
      if (kickTimerRef.current) {
        try { window.clearTimeout(kickTimerRef.current) } catch { logger.debug('useD3Simulation cleanup timer') }
        kickTimerRef.current = null
      }
      try {
        if (typeof document !== 'undefined' && document.removeEventListener) document.removeEventListener('visibilitychange', handleVisibility)
      } catch {
        logger.debug('useD3Simulation: failed to remove visibilitychange listener')
      }
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('pargame:pauseSimulation', handleExternalPause)
          window.removeEventListener('pargame:resumeSimulation', handleExternalResume)
        }
      } catch {
        logger.debug('useD3Simulation: failed to remove external pause/resume listeners')
      }
    }
  }, [nodes, links, dims.w, dims.h, kickTimerRef, initializedRef, renderPositions, updateVisibility, showMissing, simulationRef, nodeSelRef, linkSelRef, labelSelRef, simulationStoppedRef, kickSimulation, prefersReducedMotion, FRAME_INTERVAL_MS, pauseSimulation, resumeSimulation, recordFrame])

  return { kickSimulation, pauseSimulation, resumeSimulation, prefersReducedMotion }
}

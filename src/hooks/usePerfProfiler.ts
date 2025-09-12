import { useEffect, useRef } from 'react'
import logger from '../lib/logger'

// Simple profiler hook: record frames and periodically report average FPS.
export default function usePerfProfiler(reportIntervalMs = 5000) {
  const framesRef = useRef<number[]>([])
  const lastReportRef = useRef<number>(Date.now())

  const recordFrame = () => {
    const now = Date.now()
    framesRef.current.push(now)
    // keep last 200 samples
    if (framesRef.current.length > 200) framesRef.current.shift()

    const last = lastReportRef.current
    if (now - last >= reportIntervalMs) {
      // compute fps over recorded window
      const arr = framesRef.current
      if (arr.length >= 2) {
        const span = arr[arr.length - 1] - arr[0]
        const fps = span > 0 ? ((arr.length - 1) * 1000) / span : 0
        logger.debug('perf-profiler: avg fps', Math.round(fps))
      }
      lastReportRef.current = now
    }
  }

  useEffect(() => {
    // capture the frames array reference for stable access in the cleanup
    const _framesForCleanup = framesRef.current
    return () => {
      // final report on unmount
      try {
        const arr = _framesForCleanup
        if (arr.length >= 2) {
          const span = arr[arr.length - 1] - arr[0]
          const fps = span > 0 ? ((arr.length - 1) * 1000) / span : 0
          logger.info('perf-profiler final avg fps', Math.round(fps))
        }
      } catch (e) {
        logger.debug('perf-profiler final report failed', e)
      }
    }
  }, [])

  return { recordFrame }
}

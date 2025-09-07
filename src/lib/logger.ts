/**
 * src/lib/logger.ts
 * 책임: 환경에 따라 로깅 레벨을 조절하는 간단한 로거
 * 주요 exports: default logger (debug, log, info, warn, error)
 * 한글 설명: DEV 환경에서는 console.debug/log/info를 사용하고, 프로덕션에서는 경고/오류만 노출합니다.
 */

type ViteLikeEnv = { DEV?: boolean; MODE?: string } | undefined

const env = (import.meta as unknown as { env?: ViteLikeEnv }).env
const isDev = Boolean(env && ((env.DEV ?? (env.MODE === 'development'))))

type LogFn = (...args: unknown[]) => void

const noop: LogFn = () => {}

const logger = {
  debug: isDev ? ((...args: unknown[]) => console.debug(...args)) : noop,
  log: isDev ? ((...args: unknown[]) => console.log(...args)) : noop,
  info: isDev ? ((...args: unknown[]) => console.info(...args)) : noop,
  // keep warnings and errors visible in prod so we surface problems
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
}

export default logger

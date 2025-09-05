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

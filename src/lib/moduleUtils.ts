/**
 * Small helper for dynamic import interop (common patterns when bundling ESM/CJS)
 */
export function unwrapModule<T>(mod: unknown): T {
  if (mod && typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)) {
    return (mod as Record<string, unknown>).default as unknown as T
  }
  return mod as T
}
/**
 * Helper utilities for dealing with dynamic import shapes (ESM default vs CJS)
 */
export function unwrapModuleDefault<T>(mod: unknown): T {
  if (mod == null) return undefined as unknown as T
  // Common case: ESM default export
  if (typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)) {
    return (mod as Record<string, unknown>).default as unknown as T
  }
  return mod as T
}

export default unwrapModuleDefault

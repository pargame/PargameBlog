/**
 * src/lib/moduleUtils.ts
 * 책임: 동적 import 결과에서 ESM/CJS default를 안전하게 해제하는 유틸
 * exports: unwrapModuleDefault
 */
/**
 * src/lib/moduleUtils.ts
 * 책임: 동적 import 결과에서 ESM/CJS default 값을 안전하게 추출하는 유틸
 * 주요 exports: unwrapModuleDefault
 * 한글 설명: 모듈이 { default: value } 형태이거나 직접값인 경우 모두 처리합니다.
 */

/**
 * Unwraps the default export from a dynamic import value for ESM/CJS interop.
 *
 * @param mod - Module value returned by dynamic import (ESM or CJS shape)
 * @returns The unwrapped default value as T, or the original module cast to T
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

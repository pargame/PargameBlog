/**
 * src/lib/frontmatter.ts
 * 책임: 마크다운 파일의 YAML frontmatter를 파싱/제거하는 유틸을 제공.
 * 주요 exports: parseFrontmatter(src) -> { data, content }, stripFrontmatter(src) -> string
 * 사용법 요약: title/date 등 단일 라인 key:value 페어를 간단히 추출합니다.
 * 한글 설명: 복잡한 YAML(중첩 구조)은 지원하지 않으며, 브라우저 환경에서 안전하게 동작하도록 설계되었습니다.
 */

// 마크다운 파일을 위한 공유 frontmatter 유틸리티

export type Frontmatter = Record<string, string>

/**
 * parseFrontmatter
 * @param src 전체 마크다운 텍스트
 * @returns { data, content } - data: 단순한 key:value 맵, content: frontmatter가 제거된 본문
 * 설명: 간단한 single-line frontmatter 파싱을 수행합니다. 중첩/배열 등 고급 YAML은 처리하지 않습니다.
 */
/**
 * parseFrontmatter
 * @param src 마크다운 원문
 * @returns { data, content } - data: key:value 맵, content: frontmatter 제거된 본문
 */
export function parseFrontmatter(src: string): { data: Frontmatter; content: string } {
  const result = { data: {} as Frontmatter, content: src }
  const fm = src.match(/^---\s*[\r\n]+([\s\S]*?)^[ \t]*---\s*[\r\n]+/m)
  if (!fm) return result
  const yaml = fm[1] || ''
  const data: Frontmatter = {}
  for (const line of yaml.split(/\r?\n/)) {
    const t = line.trim()
    // 왜: 주석(#) 라인이나 빈 라인은 무시하여 실수로 주석이 섞여도 안전하게 동작
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf(':')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let value = t.slice(i + 1).trim()
    // 왜: 값이 인용부호로 감싸여 있으면 제거하여 일관된 값 사용
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  result.data = data
  result.content = src.slice(fm[0].length)
  return result
}

/**
 * stripFrontmatter
 * @param src 전체 마크다운 텍스트
 * @returns 본문만 포함된 문자열(frontmatter 제거)
 */
/**
 * stripFrontmatter
 * @param src 마크다운 원문
 * @returns frontmatter가 제거된 본문 문자열
 */
export function stripFrontmatter(src: string): string {
  const leading = src.match(/^[\ufeff\s]*/)
  const offset = leading ? leading[0].length : 0
  const rest = src.slice(offset)
  const m = rest.match(/^---\s*[\r\n]+[\s\S]*?^[ \t]*---\s*[\r\n]+/m)
  // 왜: frontmatter가 없으면 원문을 그대로 반환하여 호출부가 안전하게 본문을 사용 가능
  return m ? rest.slice(m[0].length) : src
}

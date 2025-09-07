/**
 * src/lib/graphParser.ts
 * 책임: 마크다운에서 위키 스타일 링크를 추출하고 id->title 맵을 생성합니다.
 * 주요 exports: extractWikiLinks, buildIdTitleMap
 * 한글 설명: Anchor/Label은 무시하며, frontmatter의 title을 우선 사용합니다.
 */

/**
 * extractWikiLinks
 * @param src 문서 본문(마크다운 원문)
 * @returns 추출된 Target id 문자열 배열
 * 설명: [[Target]], [[Target|Label]], [[Target#Anchor]] 형태에서 Target id만 추출합니다.
 */
export function extractWikiLinks(src: string): string[] {
  const out: string[] = []
  const re = /\[\[([^\]]+)\]\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const raw = m[1].trim()
    if (!raw) continue
    const pipeIndex = raw.indexOf('|')
    const targetPart = pipeIndex >= 0 ? raw.slice(0, pipeIndex) : raw
    const hashIndex = targetPart.indexOf('#')
    const target = (hashIndex >= 0 ? targetPart.slice(0, hashIndex) : targetPart).trim()
    if (target) out.push(target)
  }
  return out
}

/**
 * buildIdTitleMap
 * @param modules 파일경로->마크다운원문 맵
 * @returns { idToTitle: Map<string,string>, fileById: Map<string,string> }
 * 설명: 각 마크다운 파일의 id(파일명)에서 title(frontmatter 우선)을 추출해 맵을 구성합니다.
 */
export function buildIdTitleMap(modules: Record<string, string>) {
  const idToTitle = new Map<string, string>()
  const fileById = new Map<string, string>()

  for (const [path, content] of Object.entries(modules)) {
    const raw = typeof content === 'string' ? content : ''
    const file = path.split('/').pop() || ''
    const id = file.replace(/\.md$/, '')
    fileById.set(id, path)

    const m = raw.match(/^---[\s\S]*?\n\s*title:\s*(.+?)\n[\s\S]*?---/)
    let title = id
    if (m) {
      let v = m[1].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      title = v || id
    }
    idToTitle.set(id, title)
  }

  return { idToTitle, fileById }
}

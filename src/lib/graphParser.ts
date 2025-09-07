/**
 * src/lib/graphParser.ts
 * 책임: 마크다운 원본에서 위키 링크를 추출하고 모듈 집합에서 id->title 맵을 생성하는 유틸
 *
 * 계약 (작은 계약으로 설계):
 * - 입력: `src` (문서 본문 문자열) 또는 `modules` (경로->원시 마크다운 문자열 맵)
 * - 출력: `extractWikiLinks`는 대상 id 문자열 배열을 반환
 *          `buildIdTitleMap`는 { idToTitle: Map<string,string>, fileById: Map<string,string> }를 반환
 * - 에러모드: 비어있는 입력, 잘못된 frontmatter 등은 예외를 던지지 않고 안전한 기본값을 반환함
 * - 사용예: const ids = extractWikiLinks(markdownBody)
 *          const { idToTitle } = buildIdTitleMap(modules)
 * - 노트: 링크 문법은 [[Target|Label]] 및 [[Target#Anchor]]를 지원합니다. Anchor/Label은 무시되고 Target id만 추출됩니다.
 */

// Extract wiki-style links [[Target|Label]] or [[Target#Anchor]]
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

// Build maps: id -> title, id -> source file path
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

// Minimal remark plugin: transform text tokens like [[Target]] into link nodes
// with url scheme 'wikilink:Target'. We'll render them as <span class="wikilink">Target</span>.

type MdastNode = { type?: string; value?: string; url?: string; title?: string | null; children?: MdastNode[] }

export default function remarkWikiLinkToSpan() {
  return (tree: MdastNode) => {
    function visit(node: MdastNode) {
      if (!node) return
      // Process children first
      if (Array.isArray(node.children)) {
        // Replace text nodes within this children array if they contain [[...]] tokens
        const newChildren: MdastNode[] = []
        for (const child of node.children) {
          if (child && child.type === 'text' && typeof child.value === 'string' && child.value.includes('[[')) {
            const parts = splitWikiTokens(child.value)
            for (const part of parts) newChildren.push(part)
          } else {
            visit(child)
            newChildren.push(child)
          }
        }
        node.children = newChildren
      }
    }

    function splitWikiTokens(text: string): MdastNode[] {
      const out: MdastNode[] = []
      const re = /\[\[([^\]]+)\]\]/g
      let lastIndex = 0
  let m: RegExpExecArray | null
      while ((m = re.exec(text))) {
        if (m.index > lastIndex) {
          out.push({ type: 'text', value: text.slice(lastIndex, m.index) })
        }
        const raw = m[1].trim()
        const pipeIndex = raw.indexOf('|')
        const target = (pipeIndex >= 0 ? raw.slice(0, pipeIndex) : raw).trim()
        const label = (pipeIndex >= 0 ? raw.slice(pipeIndex + 1) : target).trim()
        out.push({ type: 'link', url: `wikilink:${target}`, title: null, children: [{ type: 'text', value: label }] })
        lastIndex = m.index + m[0].length
      }
      if (lastIndex < text.length) out.push({ type: 'text', value: text.slice(lastIndex) })
      return out
    }

  visit(tree)
  }
}

/**
 * src/lib/remarkWikiLinkToSpan.ts
 * 책임: remark 플러그인으로서 위키링크 문법을 링크 노드로 변환
 * 주요 exports: default remarkWikiLinkToSpan
 * 한글 설명: [[Target|Label]] 형태를 `wikilink:Target` URL을 가진 링크 노드로 변환합니다.
 */

// Minimal remark plugin: transform text tokens like [[Target]] into link nodes
// with url scheme 'wikilink:Target'. We'll render them as <span class="wikilink">Target</span>.

import { visitParents } from 'unist-util-visit-parents'

function remarkWikiLinkToSpan() {
  return (tree: unknown) => {
    const root = tree as { type?: string; children?: unknown[] }

    visitParents(root as never, 'text', (node: { value?: unknown }, ancestors: Array<{ type?: string; children?: unknown[] }>) => {
      if (!node || typeof node.value !== 'string') return
      if (!node.value.includes('[[')) return

      // Don't process inside existing links
      if (ancestors.some((a) => a && (a.type === 'link' || a.type === 'linkReference'))) {
        return
      }

  const parent = ancestors[ancestors.length - 1]
  if (!parent || !Array.isArray(parent.children)) return

  const index = parent.children.indexOf(node as unknown as never)
      if (index === -1) return

  const newNodes = splitWikiTokens(node.value)
      
  ;(parent.children as unknown[]).splice(index, 1, ...newNodes as unknown[])
    })

    
  }
}

function splitWikiTokens(text: string): Array<{ type: string; url?: string; title?: null; children?: Array<{ type: string; value: string }>; value?: string }> {
  const out: Array<{ type: string; url?: string; title?: null; children?: Array<{ type: string; value: string }>; value?: string }> = []
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
    
    const linkNode = { 
      type: 'link', 
      url: `wikilink:${target}`, 
      title: null, 
      children: [{ type: 'text', value: label }] 
    }
    
    out.push(linkNode)
    lastIndex = m.index + m[0].length
  }
  
  if (lastIndex < text.length) {
    out.push({ type: 'text', value: text.slice(lastIndex) })
  }
  
  return out
}

export default remarkWikiLinkToSpan

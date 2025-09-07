/**
 * src/components/InsightDrawer.tsx
 * 책임: 선택된 노드의 문서를 옆드로어로 로드·렌더링
 * 주요 props: collection, insightId, onWikiLinkClick
 * 한글 설명: 문서 로드와 렌더링은 lazy import와 Suspense로 안전하게 처리합니다.
 */

import React, { Suspense, memo, useEffect, useRef, useState } from 'react'
import logger from '../lib/logger'
// react-markdown의 타입은 버전에 따라 다릅니다; 로컬에서 느슨한 플러그인 타입을 허용합니다.
// `any` 린트 규칙을 피하기 위해 unknown을 사용하는 느슨한 플러그인 타입; 사용 시 예상 런타임 형태로 캐스트합니다.
// 무거운 모듈은 아래에서 동적으로 임포트됩니다.
const LazyMarkdown = React.lazy(async () => {
  const mod = await import('react-markdown')
  return { default: mod.default }
})
// 가벼운 유틸은 정적으로 유지됩니다.
import remarkWikiLinkToSpan from '../lib/remarkWikiLinkToSpan'

type Doc = { content: string }

interface InsightDrawerProps {
  collection: string
  insightId: string | null
  onWikiLinkClick: (target: string) => void
}

// 전체 모달이 비워지지 않도록 작은 로컬 에러 바운더리
class LocalErrorBoundary extends React.Component<{
  children: React.ReactNode
}, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    // 환경에 따라 동작을 제어할 수 있도록 로거를 통해 라우팅합니다.
    logger.error('InsightDrawer render error:', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="suspense-fallback-small">
          문서 렌더링 중 오류가 발생했습니다.
        </div>
      )
    }
    return this.props.children as React.ReactElement
  }
}

const InsightDrawer: React.FC<InsightDrawerProps> = ({ 
  collection, 
  insightId, 
  onWikiLinkClick 
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [doc, setDoc] = useState<Doc | null>(null)
  // 런타임 플러그인 `this` 문제를 피하기 위해 드로어에 remark-gfm을 넣지 않습니다;
  // GFM 지원은 remark-gfm을 안전하게 로드하는 메인 PostPage에 남아 있습니다.
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
  ;(async () => {
  // 문서를 lazy하게 로드합니다.
      try {
        const docMod = await import('../lib/doc')
        const found = insightId ? docMod.getDocFromCollection(collection, insightId) : null
        if (mounted) setDoc(found ?? null)
      } catch {
        if (mounted) setDoc(null)
      }
  // 참고: 의도적으로 여기서 `remark-gfm`을 로드하지 않습니다 - 이는
  // 이 lazy 환경에서 사용할 수 없을 수 있는 통합 processor `this`를 요구할 수 있으며
  // 빈 모달 충돌을 일으켰습니다. PostPage가 GFM을 처리합니다.
    })()
    return () => { mounted = false }
  }, [collection, insightId])

  // 누락된 링크를 다르게 스타일링하기 위해 이 컬렉션의 사용 가능한 문서 id 목록을 로드합니다.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('../lib/contentIndex')
        if (mod.getContentItemsForCollectionAsync) {
          const items = await mod.getContentItemsForCollectionAsync(collection)
          if (!mounted) return
          setKnownIds(new Set(items.map(i => i.slug)))
        } else {
          if (!mounted) return
          setKnownIds(new Set())
        }
      } catch {
        if (!mounted) return
        setKnownIds(new Set())
      }
    })()
    return () => { mounted = false }
  }, [collection])

  // 문서를 전환할 때 드로어 상단으로 스크롤합니다.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [insightId])

  if (!insightId) {
    return (
      <aside className="insight-drawer" onClick={e => e.stopPropagation()}>
        <div className="insight-empty">노드를 클릭하면 문서가 여기 열립니다.</div>
      </aside>
    )
  }
  if (!doc) {
    return (
      <aside className="insight-drawer open" onClick={e => e.stopPropagation()}>
        <div className="insight-content">
          <div className="insight-scroll">
            <div className="insight-empty">요청한 문서를 찾을 수 없습니다.{' '}
              {insightId ? <em>({insightId})</em> : null}
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside 
      className="insight-drawer open" 
      onClick={(e) => {
        // 드로어 내부의 클릭이 백드롭으로 버블링되지 않도록 방지합니다.
        e.stopPropagation()
      }}
    >
      <div className="insight-content">
        <div className="insight-scroll" ref={scrollRef}>
          <Suspense fallback={<div className="suspense-fallback-small">문서 렌더링 준비중…</div>}>
          <LocalErrorBoundary>
          <LazyMarkdown
            remarkPlugins={[remarkWikiLinkToSpan]}
            components={{
              a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
                // 휴리스틱을 위한 자식에서 일반 텍스트를 재귀적으로 추출하는 헬퍼
                const textFromChildren = (node: unknown): string => {
                  if (node == null) return ''
                  if (typeof node === 'string') return node
                  if (Array.isArray(node)) return (node as unknown[]).map(textFromChildren).join('')
                  if (typeof node === 'object' && node !== null && 'props' in (node as Record<string, unknown>)) {
                    return textFromChildren((node as { props?: { children?: unknown } }).props?.children)
                  }
                  return ''
                }

                // href (wikilink:Target) 또는 자식 텍스트에서 타겟을 결정합니다.
                let targetFromHref: string | null = null
                if (href && href.startsWith('wikilink:')) {
                  targetFromHref = href.slice('wikilink:'.length)
                }
                const labelText = textFromChildren(children).trim()

                // 유니코드 문자/숫자를 유효한 위키 토큰 텍스트로 허용합니다 (한글 등 허용).
                const looksLikeWikiToken = (!href || href === '') && !!labelText && /^[\p{L}\p{N}_.-]+$/u.test(labelText)
                const isWiki = !!targetFromHref || looksLikeWikiToken
                const target = targetFromHref || labelText

                if (isWiki && target) {
                  // 현재 컬렉션의 알려진 id를 확인하여 누락 여부를 결정합니다.
                  const base = target.split('#')[0].trim()
                  const missing = !knownIds.has(base)
                  return (
                    <span
                      className={`wikilink${missing ? ' missing' : ''}`}
                      data-target={target}
                      title={missing ? '문서를 찾을 수 없습니다' : undefined}
                      onClick={(e) => {
                        e.preventDefault()
                        if (onWikiLinkClick) onWikiLinkClick(target)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (onWikiLinkClick) onWikiLinkClick(target)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {children as React.ReactNode}
                    </span>
                  )
                }
                // 빈 href는 자동 무시: 앵커 대신 텍스트만 렌더
                if (!href) {
                  return <span>{children as React.ReactNode}</span>
                }
                return <a href={href}>{children as React.ReactNode}</a>
              },
            }}
          >
            {doc?.content || ''}
          </LazyMarkdown>
          </LocalErrorBoundary>
          </Suspense>
        </div>
      </div>
    </aside>
  )
}

export default memo(InsightDrawer)

/**
 * src/pages/GraphPage.tsx
 * 책임: Graph 컬렉션 선택 및 모달 제어를 담당하는 페이지 컴포넌트
 * 주요 export: default GraphPage (React.FC)
 * 한글 설명: URL 쿼리 `?open=` 을 기준으로 모달을 자동 오픈합니다.
 */

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listSubCollections } from '../lib/content'
// GraphModal은 무겁습니다 (GraphView + d3). 초기 번들을 작게 유지하기 위해 lazy-load합니다.
const GraphModal = lazy(() => import('../components/graph/GraphModal'))
// InsightDrawer는 react-markdown과 remark-gfm을 사용합니다; GraphPage에서 번들링하지 않도록 lazy-load합니다.
const InsightDrawer = lazy(() => import('../components/InsightDrawer'))
import CollectionCard from '../components/CollectionCard'

const GraphPage: React.FC = () => {
  // 상태
  // content/GraphArchives 하위의 서브 컬렉션을 원합니다 (예: Algorithm, UnrealEngine)
  const collections = useMemo(() => listSubCollections('GraphArchives'), [])
  const [opened, setOpened] = useState<string | null>(null)
  const [insightId, setInsightId] = useState<string | null>(null)
  const insightIdRef = useRef<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    insightIdRef.current = insightId
  }, [insightId])
  
  // ?open=<collection>일 때 자동 열기
  // 참고: 경쟁 조건을 피하기 위해 의도적으로 `opened`를 deps에서 생략합니다.
  // 모달 닫힐 때 `opened`를 지우면 이 효과가 실행되어
  // URL에 파라미터가 남아 있는 동안 즉시 모달을 다시 열 수 있습니다.
  // 여기서는 URL 변경과 컬렉션 목록 업데이트에만 응답합니다.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const toOpen = params.get('open')
    // 'GraphArchives/Algorithm' 같은 형식을 받아 리프가 알려진 컬렉션인지 검증합니다.
    if (toOpen) {
      const parts = toOpen.split('/').filter(Boolean)
      const leaf = parts[parts.length - 1]
      if (leaf && collections.includes(leaf)) {
        const full = parts.length > 1 ? toOpen : `GraphArchives/${leaf}`
        if (opened !== full) setOpened(full)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, collections])

  // 로컬 `opened` 상태와 URL `?open=` 파라미터를 동기화합니다. 이는
  // 네비게이션을 중앙화하고 상태를 설정한 후 명령형으로 네비게이트하여
  // 중복 열기 호출을 피합니다.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (opened) params.set('open', opened)
    else params.delete('open')
    const search = params.toString() ? `?${params.toString()}` : ''
    // 히스토리를 어지럽히지 않도록 히스토리 항목을 교체합니다.
    navigate({ pathname: location.pathname, search }, { replace: true })
  }, [opened, location.pathname, location.search, navigate])
  
  // 클로저 문제를 피하기 위한 최신 insightId 값의 ref
  // 이벤트 핸들러
  const handleCloseModal = useCallback(() => {
    // 로컬 상태만 업데이트합니다; URL은 `opened`를 감시하는 효과에 의해 동기화됩니다.
    setOpened(null)
    setInsightId(null)
  }, [])

  const handleCloseInsight = useCallback(() => {
    setInsightId(null)
  }, [])

  const handleNodeClick = useCallback((node: { id: string; title: string; missing?: boolean }) => {
    if (node.missing) return
    setInsightId(node.id)
  }, [])

  const handleWikiLinkClick = useCallback((target: string) => {
    setInsightId(target)
  }, [])

  const handleGraphBackgroundClick = useCallback(() => {
    // D3 핸들러 내부의 오래된 클로저 문제를 피하기 위해 ref에서 최신 insightId를 읽습니다.
    if (insightIdRef.current) {
      handleCloseInsight()
    }
  }, [handleCloseInsight])

  return (
    <div className="page">
      <div className="hero-section">
        <h1 className="hero-title">Graph</h1>
        <p className="hero-subtitle">그래프와 검색창으로 쉽게 학습하세요!</p>
      </div>

      <div className="content-section">
        <h2>GraphArchives</h2>
        {collections.length === 0 ? (
          <p>아직 하위 아카이브가 없습니다. <em>content/GraphArchives/&lt;Algorithm|UnrealEngine&gt;</em>에 마크다운을 추가해 보세요.</p>
        ) : (
          collections.map(name => (
            <CollectionCard key={name} name={name} onOpen={(v) => setOpened(`GraphArchives/${v}`)} />
          ))
        )}
      </div>

      {opened && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <Suspense fallback={<div className="suspense-fallback-hero">로딩 중…</div>}>
            <GraphModal 
              key={opened}
              collection={opened}
              onClose={handleCloseModal}
              onNodeClick={handleNodeClick}
              onGraphBackgroundClick={handleGraphBackgroundClick}
            />
          </Suspense>
          <Suspense fallback={<div className="suspense-fallback-small">패널 준비중…</div>}>
            <InsightDrawer
              collection={opened}
              insightId={insightId}
              onWikiLinkClick={handleWikiLinkClick}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default GraphPage

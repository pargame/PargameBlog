/**
 * src/components/CollectionCard.tsx
 * Responsibility: Default export CollectionCard
 * Auto-generated header: add more descriptive responsibility by hand.
 */

import React from 'react'

interface Props {
  name: string
  onOpen: (name: string) => void
}

const CollectionCard: React.FC<Props> = ({ name, onOpen }) => {
  const handleCardClick = () => onOpen(name)
  return (
    <div className="post-preview" onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick() } }}>
      <h3>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(name) }}
          data-discover="true"
          className="collection-link"
        >
          {name}
        </a>
      </h3>
      <p>이 아카이브의 문서들을 그래프로 시각화합니다.</p>
      <small>클릭하면 아카이브 그래프와 검색창이 열립니다.</small>
    </div>
  )
}

export default CollectionCard

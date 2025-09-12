/**
 * src/types/index.ts
 * 책임: 애플리케이션 전역에서 사용하는 공통 타입 정의
 * 주요 exports: Post, PostMeta, GraphNode, GraphData, RawLink 등
 * 한글 설명: 공용 타입은 이 파일에서 관리하며 컴포넌트/유틸에서 재사용됩니다.
 */

// Common types used across the application

/**
 * PostMeta
 * 포스트의 메타데이터(Frontmatter에서 파생)
 */
export interface PostMeta {
  title: string
  date: string
  excerpt?: string
  author?: string
}

/**
 * Post
 * 블로그 포스트 객체
 */
export interface Post {
  slug: string
  meta: PostMeta
  content: string
}

/**
 * GraphNode
 * 그래프 노드 데이터
 */
export interface GraphNode {
  id: string
  title: string
  missing?: boolean
}

/**
 * GraphData
 * 그래프 전체 데이터(노드+링크)
 */
export interface GraphData {
  nodes: GraphNode[]
  links: RawLink[]
}

/**
 * Document
 * 일반 문서 표현
 */
export interface Document {
  id: string
  title: string
  content: string
}

// RawLink: internal representation where source/target are string ids.
/**
 * RawLink
 * 내부 표현의 링크: source/target은 id 문자열
 */
export type RawLink = { source: string; target: string }

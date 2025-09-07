/**
 * src/types/index.ts
 * Responsibility: index
 * Auto-generated header: add more descriptive responsibility by hand.
 */

// Common types used across the application

export interface PostMeta {
  title: string
  date: string
  excerpt?: string
  author?: string
}

export interface Post {
  slug: string
  meta: PostMeta
  content: string
}

export interface GraphNode {
  id: string
  title: string
  missing?: boolean
}

export interface GraphData {
  nodes: GraphNode[]
  links: RawLink[]
}

export interface Document {
  id: string
  title: string
  content: string
}

// RawLink: internal representation where source/target are string ids.
export type RawLink = { source: string; target: string }

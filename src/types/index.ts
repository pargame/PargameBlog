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

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface Document {
  id: string
  title: string
  content: string
}

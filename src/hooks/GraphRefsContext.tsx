/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import type { GraphRefs } from './types'

export const GraphRefsContext = React.createContext<GraphRefs | null>(null)

export const GraphRefsProvider: React.FC<{ value: GraphRefs; children?: React.ReactNode }> = ({ value, children }) => (
  <GraphRefsContext.Provider value={value}>{children}</GraphRefsContext.Provider>
)

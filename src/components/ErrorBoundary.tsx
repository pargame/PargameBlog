import React from 'react'
import logger from '../lib/logger'

type Props = { children: React.ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    try {
      logger.error('ErrorBoundary caught error', error, info)
    } catch {
      // fallback (best-effort)
      console.error('ErrorBoundary caught error', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 20 }}>
          <h3>오류가 발생했습니다.</h3>
          <p>그래프를 렌더링하는 중 문제가 발생했습니다. 새로고침하거나 문제를 보고해주세요.</p>
          <button
            onClick={() => {
              try {
                const text = 'Graph error encountered at ' + new Date().toISOString()
                navigator.clipboard?.writeText(text)
                alert('오류 정보가 클립보드에 복사되었습니다. 이 내용을 공유해주세요.')
              } catch {
                alert('오류 정보를 복사할 수 없습니다.')
              }
            }}
          >
            오류 복사하기
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

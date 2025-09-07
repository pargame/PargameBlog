import React from 'react'

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
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 20 }}>
          <h3>오류가 발생했습니다.</h3>
          <p>그래프를 렌더링하는 중 문제가 발생했습니다. 새로고침하거나 문제를 보고해주세요.</p>
        </div>
      )
    }
    return this.props.children
  }
}

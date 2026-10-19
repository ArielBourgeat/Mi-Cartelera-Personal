import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ui', error.message, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="auth-screen">
          <section className="auth-card">
            <h1>No se pudo mostrar esta pantalla</h1>
            <p>Recarga la página. Si el problema continúa, revisa la consola del navegador.</p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </section>
        </div>
      )
    }
    return this.props.children
  }
}

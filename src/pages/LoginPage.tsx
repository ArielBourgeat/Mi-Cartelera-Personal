import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm.tsx'
import { AuthShell } from '../components/AuthShell.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { useAuth } from '../context/useAuth.ts'
import { isRecord } from '../lib/guards.ts'
import { safeNextPath } from '../lib/paths.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'

export function LoginPage() {
  const { signIn, configured, configError, authCheckError, retryAuthCheck } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  usePageTitle('Iniciar sesión')

  async function handleSubmit(email: string, password: string) {
    setPending(true)
    setError(null)
    const result = await signIn(email, password)
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    const from = isRecord(location.state) ? location.state.from : undefined
    navigate(safeNextPath(from), { replace: true })
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      lead="Entra para buscar títulos y ver tu lista."
      alternate={
        <>
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </>
      }
    >
      {!configured && configError ? <MessageBanner tone="error">{configError}</MessageBanner> : null}
      {authCheckError ? (
        <MessageBanner tone="error">
          {authCheckError}{' '}
          <button type="button" className="text-button" onClick={retryAuthCheck}>
            Reintentar
          </button>
        </MessageBanner>
      ) : null}
      <AuthForm mode="login" pending={pending} disabled={!configured} error={error} onSubmit={handleSubmit} />
    </AuthShell>
  )
}

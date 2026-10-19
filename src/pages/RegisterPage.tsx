import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthForm } from '../components/AuthForm.tsx'
import { AuthShell } from '../components/AuthShell.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { useAuth } from '../context/useAuth.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'

export function RegisterPage() {
  const { signUp, configured, configError } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  usePageTitle('Crear cuenta')

  async function handleSubmit(email: string, password: string) {
    setPending(true)
    setError(null)
    setInfo(null)
    const result = await signUp(email, password)
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    if (result.needsEmailConfirmation) {
      setInfo('Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión.')
      setPending(false)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <AuthShell
      title="Crear cuenta"
      lead="Regístrate con tu correo para guardar una colección propia."
      alternate={
        <>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </>
      }
    >
      {!configured && configError ? <MessageBanner tone="error">{configError}</MessageBanner> : null}
      {info ? <MessageBanner tone="info">{info}</MessageBanner> : null}
      <AuthForm
        mode="register"
        pending={pending}
        disabled={!configured}
        error={error}
        onSubmit={handleSubmit}
      />
    </AuthShell>
  )
}

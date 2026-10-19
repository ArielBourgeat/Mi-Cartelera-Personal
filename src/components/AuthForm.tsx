import { useId, useState, type FormEvent } from 'react'
import { validateCredentials } from '../lib/validation.ts'

interface AuthFormProps {
  mode: 'login' | 'register'
  pending: boolean
  disabled: boolean
  error: string | null
  onSubmit: (email: string, password: string) => Promise<void>
}

export function AuthForm({ mode, pending, disabled, error, onSubmit }: AuthFormProps) {
  const baseId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const isRegister = mode === 'register'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateCredentials(email, password, isRegister ? confirmPassword : undefined)
    if (validation) {
      setFieldError(validation)
      return
    }
    setFieldError(null)
    void onSubmit(email.trim().toLowerCase(), password)
  }

  const shownError = fieldError ?? error

  return (
    <form className="stack-form" onSubmit={handleSubmit} noValidate>
      {shownError ? <p className="field-error form-error">{shownError}</p> : null}
      <label className="field" htmlFor={`${baseId}-email`}>
        <span>Correo electrónico</span>
        <input
          id={`${baseId}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="field" htmlFor={`${baseId}-password`}>
        <span>Contraseña</span>
        <input
          id={`${baseId}-password`}
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {isRegister ? (
        <>
          <label className="field" htmlFor={`${baseId}-confirm`}>
            <span>Repite la contraseña</span>
            <input
              id={`${baseId}-confirm`}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <p className="hint">Mínimo 6 caracteres.</p>
        </>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={pending || disabled}>
        {pending ? 'Espera…' : isRegister ? 'Crear cuenta' : 'Entrar'}
      </button>
    </form>
  )
}

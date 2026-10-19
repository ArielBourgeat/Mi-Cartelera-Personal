import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.ts'
import { MessageBanner } from './MessageBanner.tsx'
import { SiteHeader } from './SiteHeader.tsx'

export function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    setPending(true)
    setError(null)
    const message = await signOut()
    setPending(false)
    if (message) {
      setError(message)
      return
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <SiteHeader mode="app" signingOut={pending} onSignOut={() => void handleSignOut()} />
      {error ? (
        <div className="header-alert">
          <MessageBanner tone="error">{error}</MessageBanner>
        </div>
      ) : null}
      <main id="contenido">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          Los datos de películas y series provienen de{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            TMDB
          </a>
          . Esta aplicación no está avalada ni certificada por TMDB.
        </p>
      </footer>
    </div>
  )
}

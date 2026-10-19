import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.ts'
import { MessageBanner } from './MessageBanner.tsx'

export function Layout() {
  const { user, signOut } = useAuth()
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
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand" end>
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">
              Mi Cartelera
              <small>Personal</small>
            </span>
          </NavLink>
          <nav className="main-nav" aria-label="Principal">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Buscar
            </NavLink>
            <NavLink
              to="/mi-lista"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Mi lista
            </NavLink>
          </nav>
          <div className="header-session">
            {user?.email ? <span className="user-email">{user.email}</span> : null}
            <button type="button" className="btn btn-secondary btn-small" onClick={() => void handleSignOut()} disabled={pending}>
              {pending ? 'Saliendo…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
        {error ? (
          <div className="header-alert">
            <MessageBanner tone="error">{error}</MessageBanner>
          </div>
        ) : null}
      </header>
      <main id="contenido" className="site-main">
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

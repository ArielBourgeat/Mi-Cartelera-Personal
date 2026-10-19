import { useState, type FormEvent } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'

interface SiteHeaderProps {
  mode: 'app' | 'guest'
  signingOut?: boolean
  onSignOut?: () => void
}

export function SiteHeader({ mode, signingOut = false, onSignOut }: SiteHeaderProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryFromUrl = params.get('q') ?? ''
  const [text, setText] = useState(queryFromUrl)
  const [seenQuery, setSeenQuery] = useState(queryFromUrl)

  if (seenQuery !== queryFromUrl) {
    setSeenQuery(queryFromUrl)
    setText(queryFromUrl)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = text.trim()
    if (nextQuery.length === 0) {
      navigate('/')
      return
    }
    navigate(`/?q=${encodeURIComponent(nextQuery)}`)
  }

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <form className="header-search" onSubmit={handleSearch} role="search">
          <label className="sr-only" htmlFor="busqueda-global">
            Buscar película o serie
          </label>
          <input
            id="busqueda-global"
            type="search"
            value={text}
            placeholder="Buscar"
            autoComplete="off"
            enterKeyHint="search"
            onChange={(event) => setText(event.target.value)}
          />
        </form>

        <NavLink to="/" className="logo" end>
          <span className="logo-mark" aria-hidden="true" />
          <span>Mi cartelera</span>
        </NavLink>

        <nav className="header-nav" aria-label="Principal">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'film-link active' : 'film-link')}>
            Principal
          </NavLink>
          <NavLink to="/mi-lista" className={({ isActive }) => (isActive ? 'film-link active' : 'film-link')}>
            Mi lista
          </NavLink>
          {mode === 'app' ? (
            <button type="button" className="film-link" onClick={onSignOut} disabled={signingOut}>
              {signingOut ? 'Saliendo' : 'Salir'}
            </button>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'film-link active' : 'film-link')}>
              Entrar
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

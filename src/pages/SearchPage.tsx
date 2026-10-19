import { useEffect, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState.tsx'
import { LoadingState } from '../components/LoadingState.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { TitleCard } from '../components/TitleCard.tsx'
import { useAuth } from '../context/useAuth.ts'
import { isAbortError } from '../lib/guards.ts'
import { getTmdbConfigError, searchTitles } from '../lib/tmdb.ts'
import { pluralTitulos } from '../lib/format.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { userMessage } from '../lib/user-message.ts'
import { listSavedTitleKeys } from '../services/collection.ts'
import type { TmdbSearchItem } from '../types/index.ts'

export function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [results, setResults] = useState<TmdbSearchItem[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const configError = getTmdbConfigError()
  usePageTitle('Buscar')

  useEffect(() => {
    if (!user) return
    let active = true
    listSavedTitleKeys()
      .then((keys) => {
        if (active) setSavedKeys(new Set(keys))
      })
      .catch(() => {
        if (active) setSavedKeys(new Set())
      })
    return () => {
      active = false
    }
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = query.trim()
    if (nextQuery.length < 2) {
      setSubmitted(nextQuery)
      setResults([])
      setStatus('error')
      setError('Escribe al menos 2 caracteres.')
      return
    }
    setSubmitted(nextQuery)
    setStatus('loading')
    setError(null)
    setResults([])
  }

  useEffect(() => {
    if (status !== 'loading' || submitted.length < 2) return
    const controller = new AbortController()
    let active = true
    searchTitles(submitted, controller.signal)
      .then((items) => {
        if (!active) return
        setResults(items)
        setStatus('success')
      })
      .catch((caught: unknown) => {
        if (!active || isAbortError(caught)) return
        setResults([])
        setStatus('error')
        setError(userMessage(caught, 'No se pudo buscar en TMDB.'))
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [status, submitted])

  return (
    <div className="page">
      <header className="page-header">
        <h1>Buscar</h1>
        <p>Encuentra películas y series en TMDB y abre la ficha para guardarlas en tu lista.</p>
      </header>

      <section className="search-panel">
        {configError ? <MessageBanner tone="error">{configError}</MessageBanner> : null}
        <form className="search-form" onSubmit={(event) => void handleSubmit(event)} role="search">
          <label className="field" htmlFor="busqueda">
            <span>Película o serie</span>
            <input
              id="busqueda"
              type="search"
              name="q"
              value={query}
              autoComplete="off"
              enterKeyHint="search"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={status === 'loading' || Boolean(configError)}>
            {status === 'loading' ? 'Buscando…' : 'Buscar'}
          </button>
        </form>
      </section>

      <section className="results" aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading' ? <LoadingState label="Buscando en TMDB…" /> : null}
        {status === 'error' && error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
        {status === 'success' && results.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description={`No encontramos películas ni series para «${submitted}». Prueba con otro título.`}
          />
        ) : null}
        {status === 'success' && results.length > 0 ? (
          <>
            <p className="result-count">
              {pluralTitulos(results.length)} para «{submitted}»
            </p>
            <ul className="card-grid">
              {results.map((item) => (
                <li key={`${item.tipo}-${item.tmdbId}`}>
                  <TitleCard
                    titulo={item.titulo}
                    posterUrl={item.posterUrl}
                    anio={item.anio}
                    tipo={item.tipo}
                    href={`/titulo/${item.tipo}/${item.tmdbId}`}
                    saved={savedKeys.has(`${item.tipo}:${item.tmdbId}`)}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {status === 'idle' ? (
          <EmptyState
            title="Empieza por un título"
            description="Los resultados de TMDB aparecerán aquí. Esta pantalla no usa datos de ejemplo."
          />
        ) : null}
      </section>
    </div>
  )
}

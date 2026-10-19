import { useEffect, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/EmptyState.tsx'
import { LoadingState } from '../components/LoadingState.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { TitleCard } from '../components/TitleCard.tsx'
import { useAuth } from '../context/useAuth.ts'
import { pluralTitulos } from '../lib/format.ts'
import { isAbortError } from '../lib/guards.ts'
import { fetchPopularMovies, getTmdbConfigError, searchTitles } from '../lib/tmdb.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { userMessage } from '../lib/user-message.ts'
import { listSavedTitleKeys } from '../services/collection.ts'
import type { TmdbSearchItem } from '../types/index.ts'

function mergeTitles(current: TmdbSearchItem[], incoming: TmdbSearchItem[]): TmdbSearchItem[] {
  const seen = new Set(current.map((item) => item.tmdbId))
  const next = [...current]
  for (const item of incoming) {
    if (seen.has(item.tmdbId)) continue
    seen.add(item.tmdbId)
    next.push(item)
  }
  return next
}

export function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [view, setView] = useState<'catalog' | 'search'>('catalog')
  const [catalog, setCatalog] = useState<TmdbSearchItem[]>([])
  const [catalogPage, setCatalogPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [results, setResults] = useState<TmdbSearchItem[]>([])
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [searchError, setSearchError] = useState<string | null>(null)
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

  useEffect(() => {
    if (configError) return
    const controller = new AbortController()
    let active = true
    fetchPopularMovies(1, controller.signal)
      .then((page) => {
        if (!active) return
        setCatalog(page.items)
        setCatalogPage(page.page)
        setTotalPages(page.totalPages)
        setCatalogError(null)
        setCatalogStatus('ready')
      })
      .catch((caught: unknown) => {
        if (!active || isAbortError(caught)) return
        setCatalog([])
        setCatalogStatus('error')
        setCatalogError(userMessage(caught, 'No se pudieron cargar las películas de TMDB.'))
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [configError, catalogAttempt])

  useEffect(() => {
    if (view !== 'search' || searchStatus !== 'loading' || submitted.length < 2) return
    const controller = new AbortController()
    let active = true
    searchTitles(submitted, controller.signal)
      .then((items) => {
        if (!active) return
        setResults(items)
        setSearchStatus('success')
      })
      .catch((caught: unknown) => {
        if (!active || isAbortError(caught)) return
        setResults([])
        setSearchStatus('error')
        setSearchError(userMessage(caught, 'No se pudo buscar en TMDB.'))
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [view, searchStatus, submitted])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = query.trim()
    if (nextQuery.length < 2) {
      setSubmitted(nextQuery)
      setResults([])
      setView('search')
      setSearchStatus('error')
      setSearchError('Escribe al menos 2 caracteres.')
      return
    }
    setSubmitted(nextQuery)
    setView('search')
    setSearchStatus('loading')
    setSearchError(null)
    setResults([])
  }

  async function loadMore() {
    if (loadingMore || catalogPage >= totalPages) return
    setLoadingMore(true)
    try {
      const page = await fetchPopularMovies(catalogPage + 1)
      setCatalog((current) => mergeTitles(current, page.items))
      setCatalogPage(page.page)
      setTotalPages(page.totalPages)
    } catch (caught) {
      setCatalogError(userMessage(caught, 'No se pudieron cargar más películas.'))
    } finally {
      setLoadingMore(false)
    }
  }

  const visible = view === 'catalog' ? catalog : results
  const showingCatalog = view === 'catalog'

  return (
    <div className="page">
      <header className="page-header">
        <h1>Buscar</h1>
        <p>Películas populares de TMDB. Si buscas un título, también puedes encontrar series.</p>
      </header>

      <section className="search-panel">
        {configError ? <MessageBanner tone="error">{configError}</MessageBanner> : null}
        <form className="search-form" onSubmit={handleSubmit} role="search">
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
          <button type="submit" className="btn btn-primary" disabled={searchStatus === 'loading' || Boolean(configError)}>
            {searchStatus === 'loading' ? 'Buscando…' : 'Buscar'}
          </button>
        </form>
      </section>

      <section className="results" aria-live="polite" aria-busy={showingCatalog ? catalogStatus === 'loading' : searchStatus === 'loading'}>
        {showingCatalog && !configError && catalogStatus === 'loading' ? <LoadingState label="Cargando películas de TMDB…" /> : null}
        {showingCatalog && catalogError ? <MessageBanner tone="error">{catalogError}</MessageBanner> : null}
        {showingCatalog && catalogStatus === 'error' ? (
          <button type="button" className="btn btn-secondary" onClick={() => {
            setCatalogStatus('loading')
            setCatalogError(null)
            setCatalogAttempt((current) => current + 1)
          }}>
            Reintentar
          </button>
        ) : null}

        {!showingCatalog && searchStatus === 'loading' ? <LoadingState label="Buscando en TMDB…" /> : null}
        {!showingCatalog && searchError ? <MessageBanner tone="error">{searchError}</MessageBanner> : null}
        {!showingCatalog && searchStatus === 'success' && results.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description={`No encontramos películas ni series para «${submitted}». Prueba con otro título.`}
          />
        ) : null}
        {!showingCatalog ? (
          <button type="button" className="btn btn-secondary" onClick={() => setView('catalog')}>
            Volver a las películas
          </button>
        ) : null}

        {visible.length > 0 && (showingCatalog ? catalogStatus === 'ready' : searchStatus === 'success') ? (
          <>
            <p className="result-count">
              {showingCatalog
                ? `${pluralTitulos(catalog.length)} populares`
                : `${pluralTitulos(results.length)} para «${submitted}»`}
            </p>
            <ul className="card-grid">
              {visible.map((item) => (
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

        {showingCatalog && catalogStatus === 'ready' && catalogPage < totalPages ? (
          <button type="button" className="btn btn-secondary" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más películas'}
          </button>
        ) : null}
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FilmCard } from '../components/FilmCard.tsx'
import { HeroReel } from '../components/HeroReel.tsx'
import { LatestCarousel } from '../components/LatestCarousel.tsx'
import { LoadingState } from '../components/LoadingState.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { useAuth } from '../context/useAuth.ts'
import { pluralTitulos } from '../lib/format.ts'
import { isAbortError } from '../lib/guards.ts'
import { fetchNowPlaying, fetchPopularMovies, getTmdbConfigError, searchTitles } from '../lib/tmdb.ts'
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
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const searching = query.length > 0
  const [catalog, setCatalog] = useState<TmdbSearchItem[]>([])
  const [latest, setLatest] = useState<TmdbSearchItem[]>([])
  const [catalogPage, setCatalogPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [results, setResults] = useState<TmdbSearchItem[]>([])
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [trackedQuery, setTrackedQuery] = useState(query)

  if (trackedQuery !== query) {
    setTrackedQuery(query)
    setResults([])
    if (!searching) {
      setSearchStatus('idle')
      setSearchError(null)
    } else if (query.length < 2) {
      setSearchStatus('error')
      setSearchError('Escribe al menos 2 caracteres.')
    } else {
      setSearchStatus('loading')
      setSearchError(null)
    }
  }
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const configError = getTmdbConfigError()
  usePageTitle('Principal')

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
    Promise.allSettled([
      fetchPopularMovies(1, controller.signal),
      fetchNowPlaying(controller.signal),
    ]).then(([popularResult, latestResult]) => {
      if (!active) return
      if (popularResult.status === 'fulfilled') {
        setCatalog(popularResult.value.items)
        setCatalogPage(popularResult.value.page)
        setTotalPages(popularResult.value.totalPages)
        setCatalogError(null)
        setCatalogStatus('ready')
      } else if (!isAbortError(popularResult.reason)) {
        setCatalog([])
        setCatalogStatus('error')
        setCatalogError(userMessage(popularResult.reason, 'No se pudieron cargar las películas de TMDB.'))
      }
      if (latestResult.status === 'fulfilled') setLatest(latestResult.value.items)
      else if (!isAbortError(latestResult.reason)) setLatest([])
    })
    return () => {
      active = false
      controller.abort()
    }
  }, [configError, catalogAttempt])

  useEffect(() => {
    if (searchStatus !== 'loading' || query.length < 2) return
    const controller = new AbortController()
    let active = true
    searchTitles(query, controller.signal)
      .then((items) => {
        if (!active) return
        setResults(items)
        setSearchError(null)
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
  }, [query, searchStatus])

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

  const backdrops = latest.map((item) => item.backdropUrl).filter((url): url is string => Boolean(url))
  const heroImages = backdrops.length > 0 ? backdrops : catalog.map((item) => item.backdropUrl).filter((url): url is string => Boolean(url))

  if (searching) {
    return (
      <div className="page">
        {configError ? <MessageBanner tone="error">{configError}</MessageBanner> : null}
        <section className="catalog" aria-live="polite">
          <Link className="text-button" to="/">
            Volver al catálogo
          </Link>
          {query.length >= 2 && searchStatus === 'loading' ? <LoadingState label="Buscando en TMDB…" /> : null}
          {searchError ? <MessageBanner tone="error">{searchError}</MessageBanner> : null}
          {searchStatus === 'success' && results.length === 0 ? (
            <p className="result-count">No encontramos películas ni series para «{query}».</p>
          ) : null}
          {searchStatus === 'success' && results.length > 0 ? (
            <>
              <p className="result-count">
                {pluralTitulos(results.length)} para «{query}»
              </p>
              <div className="film-grid">
                {results.map((item) => (
                  <FilmCard key={`${item.tipo}-${item.tmdbId}`} item={item} saved={savedKeys.has(`${item.tipo}:${item.tmdbId}`)} />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    )
  }

  return (
    <div className="landing">
      <HeroReel images={heroImages} />
      <div className="landing-body">
        {configError ? <MessageBanner tone="error">{configError}</MessageBanner> : null}
        <LatestCarousel items={latest} />

        <section className="catalog" aria-live="polite">
          <div className="catalog-heading">
            <h2 className="section-kicker">Check it all</h2>
          </div>

          {!configError && catalogStatus === 'loading' ? <LoadingState label="Cargando películas de TMDB…" /> : null}
          {catalogError ? <MessageBanner tone="error">{catalogError}</MessageBanner> : null}
          {catalogStatus === 'error' ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCatalogStatus('loading')
                setCatalogError(null)
                setCatalogAttempt((current) => current + 1)
              }}
            >
              Reintentar
            </button>
          ) : null}
          {catalogStatus === 'ready' && catalog.length > 0 ? (
            <>
              <div className="film-grid">
                {catalog.map((item) => (
                  <FilmCard key={item.tmdbId} item={item} saved={savedKeys.has(`${item.tipo}:${item.tmdbId}`)} />
                ))}
              </div>
              {catalogPage < totalPages ? (
                <button type="button" className="btn btn-secondary" onClick={() => void loadMore()} disabled={loadingMore}>
                  {loadingMore ? 'Cargando…' : 'Cargar más películas'}
                </button>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </div>
  )
}

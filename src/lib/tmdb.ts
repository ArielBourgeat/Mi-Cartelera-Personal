import { isAbortError, isRecord, readFiniteNumber, readId, readString } from './guards.ts'
import type { TipoContenido, TmdbCastMember, TmdbSearchItem, TmdbTitleDetail } from '../types/index.ts'

export class TmdbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TmdbError'
  }
}

function apiKey(): string {
  return import.meta.env.VITE_TMDB_API_KEY?.trim() ?? ''
}

function apiBase(): string {
  const configured = import.meta.env.VITE_TMDB_BASE_URL?.trim()
  const value = configured && configured.length > 0 ? configured : 'https://api.themoviedb.org/3'
  return value.replace(/\/+$/, '')
}

function imageBase(): string {
  const configured = import.meta.env.VITE_TMDB_IMAGE_BASE?.trim()
  const value = configured && configured.length > 0 ? configured : 'https://image.tmdb.org/t/p'
  return value.replace(/\/+$/, '')
}

export function getTmdbConfigError(): string | null {
  if (!apiKey()) {
    return 'Falta VITE_TMDB_API_KEY. Copia .env.example a .env, añade la clave de lectura de TMDB y reinicia npm run dev. Esa variable queda visible en el navegador.'
  }
  return null
}

export function buildPosterUrl(path: string | null, size: 'w342' | 'w500'): string | null {
  if (!path || !path.startsWith('/')) return null
  return `${imageBase()}/${size}${path}`
}

export function isAllowedPosterUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const base = new URL(imageBase())
    if (parsed.protocol !== 'https:' || parsed.origin !== base.origin) return false
    const prefix = `${base.pathname.replace(/\/+$/, '')}/`
    return parsed.pathname.startsWith(prefix)
  } catch {
    return false
  }
}

function posterPath(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/') ? value : null
}

function yearFrom(date: string | null): string | null {
  if (!date || date.length < 4) return null
  const year = date.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : null
}

async function tmdbFetch(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<unknown> {
  const key = apiKey()
  if (!key) {
    throw new TmdbError(
      'Falta VITE_TMDB_API_KEY. Añádela al archivo .env y reinicia el servidor de desarrollo.',
    )
  }

  const url = new URL(`${apiBase()}${path}`)
  const useBearer = key.startsWith('eyJ') && key.split('.').length === 3
  if (!useBearer) url.searchParams.set('api_key', key)
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value)
  }

  let response: Response
  try {
    response = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
        ...(useBearer ? { Authorization: `Bearer ${key}` } : {}),
      },
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new TmdbError('No se pudo conectar con TMDB. Revisa tu conexión.')
  }

  if (response.status === 401) {
    throw new TmdbError('TMDB rechazó la clave de API. Revisa VITE_TMDB_API_KEY.')
  }
  if (response.status === 404) {
    throw new TmdbError('No encontramos ese título en TMDB.')
  }
  if (response.status === 429) {
    throw new TmdbError('TMDB está recibiendo demasiadas solicitudes. Espera un momento e inténtalo de nuevo.')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok || body === null) {
    throw new TmdbError('TMDB respondió de una forma inesperada.')
  }
  return body
}

function parseSearchItem(entry: unknown): TmdbSearchItem | null {
  if (!isRecord(entry)) return null
  const mediaType = entry.media_type
  if (mediaType !== 'movie' && mediaType !== 'tv') return null
  const id = readId(entry.id)
  const titulo = mediaType === 'movie' ? readString(entry, 'title') : readString(entry, 'name')
  if (id === null || titulo === null) return null
  const date = mediaType === 'movie' ? readString(entry, 'release_date') : readString(entry, 'first_air_date')
  return {
    tmdbId: id,
    tipo: mediaType === 'movie' ? 'pelicula' : 'serie',
    titulo,
    posterUrl: buildPosterUrl(posterPath(entry.poster_path), 'w342'),
    anio: yearFrom(date),
  }
}

function parseCast(credits: unknown): TmdbCastMember[] {
  if (!isRecord(credits) || !Array.isArray(credits.cast)) return []
  const people: TmdbCastMember[] = []
  for (const entry of credits.cast) {
    if (!isRecord(entry)) continue
    const id = readId(entry.id)
    const nombre = readString(entry, 'name')
    if (id === null || nombre === null) continue
    people.push({
      id,
      nombre,
      personaje: readString(entry, 'character'),
    })
    if (people.length === 12) break
  }
  return people
}

function parseMovieListItem(entry: unknown): TmdbSearchItem | null {
  if (!isRecord(entry)) return null
  const id = readId(entry.id)
  const titulo = readString(entry, 'title')
  if (id === null || titulo === null) return null
  return {
    tmdbId: id,
    tipo: 'pelicula',
    titulo,
    posterUrl: buildPosterUrl(posterPath(entry.poster_path), 'w342'),
    anio: yearFrom(readString(entry, 'release_date')),
  }
}

export interface PopularMoviesPage {
  items: TmdbSearchItem[]
  page: number
  totalPages: number
}

export async function fetchPopularMovies(page = 1, signal?: AbortSignal): Promise<PopularMoviesPage> {
  const body = await tmdbFetch(
    '/movie/popular',
    {
      language: 'es-ES',
      page: String(page),
    },
    signal,
  )
  if (!isRecord(body) || !Array.isArray(body.results)) {
    throw new TmdbError('TMDB respondió de una forma inesperada.')
  }
  const items: TmdbSearchItem[] = []
  for (const entry of body.results) {
    const item = parseMovieListItem(entry)
    if (item) items.push(item)
  }
  const currentPage = readId(body.page) ?? page
  const totalPages = readId(body.total_pages) ?? currentPage
  return { items, page: currentPage, totalPages }
}

export async function searchTitles(query: string, signal?: AbortSignal): Promise<TmdbSearchItem[]> {
  const body = await tmdbFetch(
    '/search/multi',
    {
      query,
      language: 'es-ES',
      include_adult: 'false',
      page: '1',
    },
    signal,
  )
  if (!isRecord(body) || !Array.isArray(body.results)) {
    throw new TmdbError('TMDB respondió de una forma inesperada.')
  }
  const items: TmdbSearchItem[] = []
  for (const entry of body.results) {
    const item = parseSearchItem(entry)
    if (item) items.push(item)
  }
  return items
}

export async function fetchTitleDetail(
  tipo: TipoContenido,
  tmdbId: number,
  signal?: AbortSignal,
): Promise<TmdbTitleDetail> {
  const path = tipo === 'pelicula' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`
  const body = await tmdbFetch(
    path,
    {
      language: 'es-ES',
      append_to_response: 'credits',
    },
    signal,
  )
  if (!isRecord(body)) throw new TmdbError('TMDB respondió de una forma inesperada.')
  const titulo = tipo === 'pelicula' ? readString(body, 'title') : readString(body, 'name')
  if (!titulo) throw new TmdbError('TMDB no devolvió el título.')
  const date = tipo === 'pelicula' ? readString(body, 'release_date') : readString(body, 'first_air_date')
  const vote = readFiniteNumber(body.vote_average)
  return {
    tmdbId,
    tipo,
    titulo,
    posterUrl: buildPosterUrl(posterPath(body.poster_path), 'w500'),
    anio: yearFrom(date),
    sinopsis: readString(body, 'overview'),
    calificacionOficial: vote !== null && vote > 0 ? vote : null,
    elenco: parseCast(body.credits),
  }
}

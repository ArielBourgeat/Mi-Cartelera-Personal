import { isAbortError } from '../lib/guards.ts'
import { fetchMovieRuntime, TmdbError } from '../lib/tmdb.ts'

export type ConsultaDuracion =
  | { estado: 'conocida'; minutos: number }
  | { estado: 'desconocida' }
  | { estado: 'error'; motivo: string }

export async function consultarDuracion(
  tmdbId: number,
  signal?: AbortSignal,
): Promise<ConsultaDuracion> {
  try {
    const minutos = await fetchMovieRuntime(tmdbId, signal)
    if (minutos === null) return { estado: 'desconocida' }
    return { estado: 'conocida', minutos }
  } catch (error) {
    if (isAbortError(error)) throw error
    const motivo = error instanceof TmdbError ? error.message : 'No se pudo consultar la duración.'
    return { estado: 'error', motivo }
  }
}

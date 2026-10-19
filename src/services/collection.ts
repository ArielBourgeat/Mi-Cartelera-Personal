import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { isRecord, readId, readString } from '../lib/guards.ts'
import { supabase, supabaseConfigError } from '../lib/supabase.ts'
import { isAllowedPosterUrl } from '../lib/tmdb.ts'
import { isEstado, isTipoContenido, normalizeDraft } from '../lib/validation.ts'
import type { CollectionDraft, MiListaRow, NewCollectionInput } from '../types/index.ts'

export type CollectionErrorCode =
  | 'duplicate'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'config'
  | 'auth'
  | 'unknown'

export class CollectionError extends Error {
  readonly code: CollectionErrorCode

  constructor(message: string, code: CollectionErrorCode) {
    super(message)
    this.name = 'CollectionError'
    this.code = code
  }
}

const COLUMNS =
  'id, user_id, tmdb_id, titulo, poster_url, tipo_contenido, estado, calificacion_personal, comentario, fecha_agregado'

function requireClient(): SupabaseClient {
  if (!supabase) {
    throw new CollectionError(supabaseConfigError ?? 'Supabase no está configurado.', 'config')
  }
  return supabase
}

async function currentUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    throw new CollectionError('Tu sesión no es válida. Vuelve a iniciar sesión.', 'auth')
  }
  return data.user.id
}

function parseStoredRating(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const numeric = typeof value === 'string' && /^[1-5]$/.test(value) ? Number(value) : value
  if (typeof numeric === 'number' && Number.isInteger(numeric) && numeric >= 1 && numeric <= 5) return numeric
  throw new CollectionError('La calificación recibida no es válida.', 'validation')
}

function parseRow(value: unknown): MiListaRow {
  if (!isRecord(value)) {
    throw new CollectionError('La base de datos devolvió un registro inesperado.', 'unknown')
  }
  const id = readId(value.id)
  const userId = readString(value, 'user_id')
  const tmdbId = readId(value.tmdb_id)
  const titulo = readString(value, 'titulo')
  const tipo = readString(value, 'tipo_contenido')
  const estado = readString(value, 'estado')
  const fecha = readString(value, 'fecha_agregado')
  if (id === null || !userId || tmdbId === null || !titulo || !fecha) {
    throw new CollectionError('La base de datos devolvió un registro incompleto.', 'unknown')
  }
  if (!isTipoContenido(tipo) || !isEstado(estado)) {
    throw new CollectionError('El registro recibido no cumple las reglas de la colección.', 'validation')
  }
  const comentario = value.comentario
  if (comentario !== null && comentario !== undefined && typeof comentario !== 'string') {
    throw new CollectionError('El comentario recibido no es válido.', 'validation')
  }
  return {
    id,
    user_id: userId,
    tmdb_id: tmdbId,
    titulo,
    poster_url: readString(value, 'poster_url'),
    tipo_contenido: tipo,
    estado,
    calificacion_personal: parseStoredRating(value.calificacion_personal),
    comentario: typeof comentario === 'string' && comentario.trim() !== '' ? comentario : null,
    fecha_agregado: fecha,
  }
}

function assertOwnRow(row: MiListaRow, userId: string): MiListaRow {
  if (row.user_id !== userId) {
    throw new CollectionError('No tienes permiso para ver este título.', 'forbidden')
  }
  return row
}

function toCollectionError(error: PostgrestError): CollectionError {
  console.error('supabase', error.code, error.message)
  const message = error.message.toLowerCase()
  if (error.code === '23505') {
    return new CollectionError('Este título ya está en tu lista.', 'duplicate')
  }
  if (error.code === '23514') {
    return new CollectionError(
      'Los datos no cumplen las reglas de la colección. Revisa el estado y la calificación.',
      'validation',
    )
  }
  if (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied')
  ) {
    return new CollectionError('No tienes permiso para modificar este título.', 'forbidden')
  }
  if (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  ) {
    return new CollectionError(
      'No se encontró la tabla mi_lista. Ejecuta supabase/mi_lista.sql en el SQL Editor de Supabase.',
      'config',
    )
  }
  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch failed')) {
    return new CollectionError('No se pudo conectar con Supabase. Revisa tu conexión.', 'unknown')
  }
  if (message.includes('jwt') || error.code === 'PGRST301') {
    return new CollectionError('Tu sesión no es válida. Vuelve a iniciar sesión.', 'auth')
  }
  return new CollectionError('No se pudo completar la operación. Inténtalo de nuevo.', 'unknown')
}

export async function listCollection(): Promise<MiListaRow[]> {
  const client = requireClient()
  const userId = await currentUserId(client)
  const { data, error } = await client
    .from('mi_lista')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('fecha_agregado', { ascending: false })
  if (error) throw toCollectionError(error)
  if (!Array.isArray(data)) {
    throw new CollectionError('La base de datos devolvió una respuesta inesperada.', 'unknown')
  }
  return data.map((row) => assertOwnRow(parseRow(row), userId))
}

export async function listSavedTitleKeys(): Promise<string[]> {
  const client = requireClient()
  const userId = await currentUserId(client)
  const { data, error } = await client
    .from('mi_lista')
    .select('tmdb_id, tipo_contenido, user_id')
    .eq('user_id', userId)
  if (error) throw toCollectionError(error)
  if (!Array.isArray(data)) return []
  const keys: string[] = []
  for (const row of data) {
    if (!isRecord(row)) continue
    if (readString(row, 'user_id') !== userId) {
      throw new CollectionError('No tienes permiso para ver este título.', 'forbidden')
    }
    const id = readId(row.tmdb_id)
    const tipo = readString(row, 'tipo_contenido')
    if (id !== null && isTipoContenido(tipo)) keys.push(`${tipo}:${id}`)
  }
  return keys
}

export async function findByTmdbId(tmdbId: number): Promise<MiListaRow | null> {
  const client = requireClient()
  const userId = await currentUserId(client)
  const { data, error } = await client
    .from('mi_lista')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .maybeSingle()
  if (error) throw toCollectionError(error)
  if (!data) return null
  return assertOwnRow(parseRow(data), userId)
}

export async function addToCollection(input: NewCollectionInput): Promise<MiListaRow> {
  const client = requireClient()
  const userId = await currentUserId(client)
  const draft = normalizeDraft(input)
  if (!draft.ok) throw new CollectionError(draft.error, 'validation')
  const titulo = input.titulo.trim()
  if (!titulo) throw new CollectionError('El título no puede estar vacío.', 'validation')
  if (!Number.isInteger(input.tmdbId) || input.tmdbId <= 0) {
    throw new CollectionError('El identificador de TMDB no es válido.', 'validation')
  }
  if (!isTipoContenido(input.tipo)) {
    throw new CollectionError('El tipo de contenido debe ser película o serie.', 'validation')
  }
  if (input.posterUrl !== null && !isAllowedPosterUrl(input.posterUrl)) {
    throw new CollectionError('El póster debe provenir de TMDB.', 'validation')
  }

  const { data, error } = await client
    .from('mi_lista')
    .insert({
      user_id: userId,
      tmdb_id: input.tmdbId,
      titulo,
      poster_url: input.posterUrl,
      tipo_contenido: input.tipo,
      estado: draft.value.estado,
      calificacion_personal: draft.value.calificacionPersonal,
      comentario: draft.value.comentario,
    })
    .select(COLUMNS)
    .single()
  if (error) throw toCollectionError(error)
  return assertOwnRow(parseRow(data), userId)
}

export async function updateCollectionItem(id: number, draftInput: CollectionDraft): Promise<MiListaRow> {
  const client = requireClient()
  const userId = await currentUserId(client)
  if (!Number.isInteger(id) || id <= 0) {
    throw new CollectionError('No se encontró el título en tu lista.', 'not_found')
  }
  const draft = normalizeDraft(draftInput)
  if (!draft.ok) throw new CollectionError(draft.error, 'validation')

  const { data, error } = await client
    .from('mi_lista')
    .update({
      estado: draft.value.estado,
      calificacion_personal: draft.value.calificacionPersonal,
      comentario: draft.value.comentario,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select(COLUMNS)
    .maybeSingle()
  if (error) throw toCollectionError(error)
  if (!data) throw new CollectionError('No se encontró el título en tu lista.', 'not_found')
  return assertOwnRow(parseRow(data), userId)
}

export async function deleteCollectionItem(id: number): Promise<void> {
  const client = requireClient()
  const userId = await currentUserId(client)
  const { data, error } = await client
    .from('mi_lista')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, user_id')
  if (error) throw toCollectionError(error)
  if (!Array.isArray(data) || data.length === 0) {
    throw new CollectionError('No se encontró el título en tu lista.', 'not_found')
  }
  for (const row of data) {
    if (!isRecord(row) || readString(row, 'user_id') !== userId) {
      throw new CollectionError('No tienes permiso para eliminar este título.', 'forbidden')
    }
  }
}

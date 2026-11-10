import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { isRecord, readFiniteNumber, readId, readString } from '../lib/guards.ts'
import { supabase, supabaseConfigError } from '../lib/supabase.ts'
import { isAllowedPosterUrl } from '../lib/tmdb.ts'
import { PAUSA_MINUTOS, cabe, duracionDeSesion, validarTiempo } from '../dominio/noche.ts'
import { listCollection } from './collection.ts'

export class SesionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SesionError'
  }
}

export interface PeliculaParaGuardar {
  tmdbId: number
  titulo: string
  duracionMinutos: number
  posterUrl: string | null
  cuentaEnElPlan?: boolean
}

export interface PeliculaDeSesion extends PeliculaParaGuardar {
  orden: number
  fueraDePlan: boolean
}

export interface SesionResumen {
  id: number
  nombre: string
  tiempoDisponibleMinutos: number
  fechaGuardada: string
}

export interface SesionDetalle extends SesionResumen {
  peliculas: PeliculaDeSesion[]
  duracionContada: number
  restante: number
}

const NOMBRE_MAXIMO = 80

function requireClient(): SupabaseClient {
  if (!supabase) throw new SesionError(supabaseConfigError ?? 'Supabase no está configurado.')
  return supabase
}

async function currentUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new SesionError('Tu sesión no es válida. Vuelve a iniciar sesión.')
  return data.user.id
}

function normalizarNombre(nombre: string): string {
  const limpio = nombre.trim()
  if (limpio.length === 0 || limpio.length > NOMBRE_MAXIMO) {
    throw new SesionError('Escribe un nombre de hasta 80 caracteres.')
  }
  return limpio
}

function normalizarPeliculas(peliculas: PeliculaParaGuardar[]): PeliculaParaGuardar[] {
  if (peliculas.length === 0) throw new SesionError('Agrega al menos una película.')
  const vistas = new Set<number>()
  return peliculas.map((pelicula) => {
    if (!Number.isInteger(pelicula.tmdbId) || pelicula.tmdbId <= 0) {
      throw new SesionError('Hay una película que no se puede guardar.')
    }
    if (vistas.has(pelicula.tmdbId)) {
      throw new SesionError('No puedes repetir la misma película en una sesión.')
    }
    vistas.add(pelicula.tmdbId)
    const titulo = pelicula.titulo.trim()
    if (!titulo) throw new SesionError('Hay una película sin título.')
    if (!Number.isInteger(pelicula.duracionMinutos) || pelicula.duracionMinutos <= 0) {
      throw new SesionError('No tiene duración conocida.')
    }
    const posterUrl =
      pelicula.posterUrl !== null && isAllowedPosterUrl(pelicula.posterUrl)
        ? pelicula.posterUrl
        : null
    return {
      tmdbId: pelicula.tmdbId,
      titulo,
      duracionMinutos: pelicula.duracionMinutos,
      posterUrl,
      cuentaEnElPlan: pelicula.cuentaEnElPlan !== false,
    }
  })
}

function exigirQueCabe(tiempo: number, peliculas: PeliculaParaGuardar[]): void {
  const duraciones = peliculas
    .filter((pelicula) => pelicula.cuentaEnElPlan !== false)
    .map((pelicula) => pelicula.duracionMinutos)
  if (!cabe(tiempo, duraciones, PAUSA_MINUTOS)) {
    throw new SesionError('Esa selección no cabe en el tiempo de la sesión.')
  }
}

function toSesionError(error: PostgrestError): SesionError {
  const message = error.message.toLowerCase()
  if (error.code === '23514')
    return new SesionError('Los datos de la sesión no cumplen las reglas.')
  if (error.code === '23505')
    return new SesionError('No puedes repetir la misma película en una sesión.')
  if (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  ) {
    return new SesionError(
      'Falta la tabla de sesiones. Ejecuta supabase/noche_de_pelicula.sql en Supabase.',
    )
  }
  if (
    message.includes('row-level security') ||
    message.includes('permission denied') ||
    error.code === '42501'
  ) {
    return new SesionError('No tienes permiso para ver esta sesión.')
  }
  return new SesionError('No se pudo completar la operación. Inténtalo de nuevo.')
}

function parseResumen(value: unknown, userId: string): SesionResumen {
  if (!isRecord(value)) throw new SesionError('La base de datos devolvió una sesión inesperada.')
  if (readString(value, 'user_id') !== userId)
    throw new SesionError('No tienes permiso para ver esta sesión.')
  const id = readId(value.id)
  const nombre = readString(value, 'nombre')
  const tiempo = readFiniteNumber(value.tiempo_disponible_minutos)
  const fecha = readString(value, 'fecha_guardada')
  if (
    id === null ||
    nombre === null ||
    fecha === null ||
    tiempo === null ||
    !Number.isInteger(tiempo)
  ) {
    throw new SesionError('La base de datos devolvió una sesión incompleta.')
  }
  return { id, nombre, tiempoDisponibleMinutos: tiempo, fechaGuardada: fecha }
}

function parsePelicula(value: unknown, userId: string): Omit<PeliculaDeSesion, 'fueraDePlan'> {
  if (!isRecord(value)) throw new SesionError('La base de datos devolvió una película inesperada.')
  if (readString(value, 'user_id') !== userId)
    throw new SesionError('No tienes permiso para ver esta sesión.')
  const tmdbId = readId(value.tmdb_id)
  const titulo = readString(value, 'titulo')
  const duracion = readFiniteNumber(value.duracion_minutos)
  const orden = readFiniteNumber(value.orden)
  if (
    tmdbId === null ||
    titulo === null ||
    duracion === null ||
    orden === null ||
    !Number.isInteger(duracion) ||
    !Number.isInteger(orden)
  ) {
    throw new SesionError('La base de datos devolvió una película incompleta.')
  }
  return {
    tmdbId,
    titulo,
    duracionMinutos: duracion,
    posterUrl: readString(value, 'poster_url'),
    orden,
  }
}

async function idsPorVer(userId: string): Promise<Set<number>> {
  const lista = await listCollection()
  const ids = new Set<number>()
  for (const item of lista) {
    if (
      item.user_id === userId &&
      item.tipo_contenido === 'pelicula' &&
      item.estado === 'por_ver'
    ) {
      ids.add(item.tmdb_id)
    }
  }
  return ids
}

function conDisponibilidad(
  peliculas: Omit<PeliculaDeSesion, 'fueraDePlan'>[],
  porVer: Set<number>,
): SesionDetalle['peliculas'] {
  return peliculas
    .sort((a, b) => a.orden - b.orden)
    .map((pelicula) => ({ ...pelicula, fueraDePlan: !porVer.has(pelicula.tmdbId) }))
}

function resumenContado(
  tiempo: number,
  peliculas: PeliculaDeSesion[],
): { duracionContada: number; restante: number } {
  const vigentes = peliculas
    .filter((pelicula) => !pelicula.fueraDePlan)
    .map((pelicula) => pelicula.duracionMinutos)
  const duracionContada = duracionDeSesion(vigentes, PAUSA_MINUTOS)
  return { duracionContada, restante: tiempo - duracionContada }
}

export async function listarSesiones(): Promise<SesionResumen[]> {
  const client = requireClient()
  const userId = await currentUserId(client)
  const { data, error } = await client
    .from('noche_sesion')
    .select('id, user_id, nombre, tiempo_disponible_minutos, fecha_guardada')
    .eq('user_id', userId)
    .order('fecha_guardada', { ascending: false })
  if (error) throw toSesionError(error)
  if (!Array.isArray(data)) return []
  return data.map((row) => parseResumen(row, userId))
}

export async function abrirSesion(id: number): Promise<SesionDetalle> {
  const client = requireClient()
  const userId = await currentUserId(client)
  const { data, error } = await client
    .from('noche_sesion')
    .select('id, user_id, nombre, tiempo_disponible_minutos, fecha_guardada')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw toSesionError(error)
  if (!data) throw new SesionError('No se encontró esa sesión.')
  const resumen = parseResumen(data, userId)
  const peliculas = await leerPeliculas(client, id, userId)
  const marcadas = conDisponibilidad(peliculas, await idsPorVer(userId))
  return {
    ...resumen,
    peliculas: marcadas,
    ...resumenContado(resumen.tiempoDisponibleMinutos, marcadas),
  }
}

async function leerPeliculas(
  client: SupabaseClient,
  sesionId: number,
  userId: string,
): Promise<Omit<PeliculaDeSesion, 'fueraDePlan'>[]> {
  const { data, error } = await client
    .from('noche_sesion_pelicula')
    .select('user_id, tmdb_id, titulo, duracion_minutos, poster_url, orden')
    .eq('sesion_id', sesionId)
    .eq('user_id', userId)
    .order('orden', { ascending: true })
  if (error) throw toSesionError(error)
  if (!Array.isArray(data)) return []
  return data.map((row) => parsePelicula(row, userId))
}

export async function crearSesion(
  nombre: string,
  tiempoDisponible: number,
  peliculas: PeliculaParaGuardar[],
): Promise<SesionDetalle> {
  const tiempo = validarTiempo(tiempoDisponible)
  if (!tiempo.ok) throw new SesionError(tiempo.motivo)
  const limpias = normalizarPeliculas(peliculas)
  exigirQueCabe(tiempo.minutos, limpias)
  const client = requireClient()
  const userId = await currentUserId(client)
  const titulo = normalizarNombre(nombre)
  const { data, error } = await client
    .from('noche_sesion')
    .insert({
      user_id: userId,
      nombre: titulo,
      tiempo_disponible_minutos: tiempo.minutos,
    })
    .select('id, user_id, nombre, tiempo_disponible_minutos, fecha_guardada')
    .single()
  if (error) throw toSesionError(error)
  const resumen = parseResumen(data, userId)
  try {
    await reemplazarPeliculas(client, resumen.id, userId, limpias)
  } catch (error) {
    await client.from('noche_sesion').delete().eq('id', resumen.id).eq('user_id', userId)
    throw error
  }
  return abrirSesion(resumen.id)
}

export async function actualizarSesion(
  id: number,
  nombre: string,
  peliculas: PeliculaParaGuardar[],
): Promise<SesionDetalle> {
  const limpias = normalizarPeliculas(peliculas)
  const titulo = normalizarNombre(nombre)
  const client = requireClient()
  const userId = await currentUserId(client)
  const actual = await abrirSesion(id)
  exigirQueCabe(actual.tiempoDisponibleMinutos, limpias)
  await reemplazarPeliculas(client, id, userId, limpias)
  const { error } = await client
    .from('noche_sesion')
    .update({ nombre: titulo })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw toSesionError(error)
  return abrirSesion(id)
}

async function reemplazarPeliculas(
  client: SupabaseClient,
  sesionId: number,
  userId: string,
  peliculas: PeliculaParaGuardar[],
): Promise<void> {
  const anteriores = await leerPeliculas(client, sesionId, userId)
  const { error: deleteError } = await client
    .from('noche_sesion_pelicula')
    .delete()
    .eq('sesion_id', sesionId)
    .eq('user_id', userId)
  if (deleteError) throw toSesionError(deleteError)
  const filas = peliculas.map((pelicula, index) => ({
    sesion_id: sesionId,
    user_id: userId,
    tmdb_id: pelicula.tmdbId,
    titulo: pelicula.titulo,
    duracion_minutos: pelicula.duracionMinutos,
    poster_url: pelicula.posterUrl,
    orden: index + 1,
  }))
  const { error } = await client.from('noche_sesion_pelicula').insert(filas)
  if (!error) return
  if (anteriores.length > 0) {
    await client.from('noche_sesion_pelicula').insert(
      anteriores.map((pelicula) => ({
        sesion_id: sesionId,
        user_id: userId,
        tmdb_id: pelicula.tmdbId,
        titulo: pelicula.titulo,
        duracion_minutos: pelicula.duracionMinutos,
        poster_url: pelicula.posterUrl,
        orden: pelicula.orden,
      })),
    )
  }
  throw toSesionError(error)
}

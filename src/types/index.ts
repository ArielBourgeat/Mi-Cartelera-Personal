export const ESTADOS_VISUALIZACION = ['por_ver', 'viendo', 'vista'] as const
export type EstadoVisualizacion = (typeof ESTADOS_VISUALIZACION)[number]

export const TIPOS_CONTENIDO = ['pelicula', 'serie'] as const
export type TipoContenido = (typeof TIPOS_CONTENIDO)[number]

export interface MiListaRow {
  id: number
  user_id: string
  tmdb_id: number
  titulo: string
  poster_url: string | null
  tipo_contenido: TipoContenido
  estado: EstadoVisualizacion
  calificacion_personal: number | null
  comentario: string | null
  fecha_agregado: string
}

export interface CollectionDraft {
  estado: EstadoVisualizacion
  calificacionPersonal: number | null
  comentario: string | null
}

export interface NewCollectionInput extends CollectionDraft {
  tmdbId: number
  titulo: string
  posterUrl: string | null
  tipo: TipoContenido
}

export interface TmdbSearchItem {
  tmdbId: number
  tipo: TipoContenido
  titulo: string
  posterUrl: string | null
  anio: string | null
}

export interface TmdbCastMember {
  id: number
  nombre: string
  personaje: string | null
}

export interface TmdbTitleDetail {
  tmdbId: number
  tipo: TipoContenido
  titulo: string
  posterUrl: string | null
  anio: string | null
  sinopsis: string | null
  calificacionOficial: number | null
  elenco: TmdbCastMember[]
}

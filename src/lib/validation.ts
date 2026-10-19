import {
  ESTADOS_VISUALIZACION,
  TIPOS_CONTENIDO,
  type CollectionDraft,
  type EstadoVisualizacion,
  type TipoContenido,
} from '../types/index.ts'

export const ESTADO_LABEL: Record<EstadoVisualizacion, string> = {
  por_ver: 'Por ver',
  viendo: 'Viendo',
  vista: 'Vista',
}

export const TIPO_LABEL: Record<TipoContenido, string> = {
  pelicula: 'Película',
  serie: 'Serie',
}

export function isEstado(value: string | null): value is EstadoVisualizacion {
  return value !== null && (ESTADOS_VISUALIZACION as readonly string[]).includes(value)
}

export function isTipoContenido(value: string | null): value is TipoContenido {
  return value !== null && (TIPOS_CONTENIDO as readonly string[]).includes(value)
}

export interface DraftFieldErrors {
  estado?: string
  calificacion?: string
  comentario?: string
}

const RATING_ERROR = 'La calificación debe ser un entero del 1 al 5, o quedar vacía.'
const ESTADO_ERROR = 'El estado debe ser Por ver, Viendo o Vista.'
const COMENTARIO_ERROR = 'El comentario no puede superar los 2000 caracteres.'

function ratingError(value: number | null): string | null {
  if (value === null) return null
  if (!Number.isInteger(value) || value < 1 || value > 5) return RATING_ERROR
  return null
}

export function validateDraftFields(input: {
  estado: string
  calificacion: number | null
  comentario: string
}): { ok: true; value: CollectionDraft } | { ok: false; errors: DraftFieldErrors } {
  const errors: DraftFieldErrors = {}
  if (!isEstado(input.estado)) errors.estado = ESTADO_ERROR
  const rating = ratingError(input.calificacion)
  if (rating) errors.calificacion = rating
  const comentario = input.comentario.trim()
  if (comentario.length > 2000) errors.comentario = COMENTARIO_ERROR
  if (!isEstado(input.estado) || rating || comentario.length > 2000) {
    return { ok: false, errors }
  }
  return {
    ok: true,
    value: {
      estado: input.estado,
      calificacionPersonal: input.calificacion,
      comentario: comentario === '' ? null : comentario,
    },
  }
}

export function normalizeDraft(
  draft: CollectionDraft,
): { ok: true; value: CollectionDraft } | { ok: false; error: string } {
  const result = validateDraftFields({
    estado: draft.estado,
    calificacion: draft.calificacionPersonal,
    comentario: draft.comentario ?? '',
  })
  if (!result.ok) {
    return {
      ok: false,
      error: result.errors.estado ?? result.errors.calificacion ?? result.errors.comentario ?? ESTADO_ERROR,
    }
  }
  return result
}

export function validateCredentials(email: string, password: string, confirmPassword?: string): string | null {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Introduce un correo electrónico válido.'
  }
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return 'Las contraseñas no coinciden.'
  }
  return null
}

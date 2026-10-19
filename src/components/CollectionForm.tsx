import { useId, useState, type FormEvent } from 'react'
import { ESTADO_LABEL, isEstado, validateDraftFields } from '../lib/validation.ts'
import { ESTADOS_VISUALIZACION, type CollectionDraft, type EstadoVisualizacion } from '../types/index.ts'

interface CollectionFormProps {
  initialEstado: EstadoVisualizacion
  initialCalificacion: number | null
  initialComentario: string | null
  submitLabel: string
  pending: boolean
  onSubmit: (draft: CollectionDraft) => Promise<void>
  onCancel?: () => void
}

export function CollectionForm({
  initialEstado,
  initialCalificacion,
  initialComentario,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: CollectionFormProps) {
  const baseId = useId()
  const [estado, setEstado] = useState<EstadoVisualizacion>(initialEstado)
  const [calificacion, setCalificacion] = useState<number | null>(initialCalificacion)
  const [comentario, setComentario] = useState(initialComentario ?? '')
  const [errors, setErrors] = useState<{ estado?: string; calificacion?: string; comentario?: string }>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateDraftFields({ estado, calificacion, comentario })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    void onSubmit(result.value)
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit} noValidate>
      <p className="hint">
        La calificación de TMDB no se modifica aquí. El estado, la valoración y el comentario son solo tuyos.
      </p>
      <label className="field" htmlFor={`${baseId}-estado`}>
        <span>Estado de visualización</span>
        <select
          id={`${baseId}-estado`}
          value={estado}
          aria-invalid={errors.estado ? true : undefined}
          aria-describedby={errors.estado ? `${baseId}-estado-error` : undefined}
          onChange={(event) => {
            const value = event.target.value
            if (isEstado(value)) setEstado(value)
          }}
        >
          {ESTADOS_VISUALIZACION.map((value) => (
            <option key={value} value={value}>
              {ESTADO_LABEL[value]}
            </option>
          ))}
        </select>
        {errors.estado ? (
          <small id={`${baseId}-estado-error`} className="field-error">
            {errors.estado}
          </small>
        ) : null}
      </label>

      <fieldset className="field">
        <legend>Calificación personal</legend>
        <div className="star-picker" role="group" aria-label="Calificación personal del 1 al 5">
          {[1, 2, 3, 4, 5].map((score) => {
            const active = calificacion !== null && score <= calificacion
            return (
              <button
                key={score}
                type="button"
                className={active ? 'star-btn is-on' : 'star-btn'}
                aria-pressed={calificacion === score}
                aria-label={`${score} de 5`}
                onClick={() => setCalificacion((current) => (current === score ? null : score))}
              >
                {active ? '★' : '☆'}
              </button>
            )
          })}
        </div>
        <p className="hint" id={`${baseId}-rating-hint`}>
          Del 1 al 5. Pulsa otra vez la estrella elegida para dejarla vacía.
        </p>
        {errors.calificacion ? <small className="field-error">{errors.calificacion}</small> : null}
      </fieldset>

      <label className="field" htmlFor={`${baseId}-comentario`}>
        <span>Comentario</span>
        <textarea
          id={`${baseId}-comentario`}
          value={comentario}
          maxLength={2000}
          rows={4}
          aria-invalid={errors.comentario ? true : undefined}
          aria-describedby={`${baseId}-comentario-hint`}
          onChange={(event) => setComentario(event.target.value)}
        />
        <small id={`${baseId}-comentario-hint`} className="hint">
          Opcional. {comentario.trim().length}/2000
        </small>
        {errors.comentario ? <small className="field-error">{errors.comentario}</small> : null}
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            Cancelar
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

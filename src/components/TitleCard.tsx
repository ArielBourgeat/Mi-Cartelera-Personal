import { Link } from 'react-router-dom'
import { TIPO_LABEL } from '../lib/validation.ts'
import type { EstadoVisualizacion, TipoContenido } from '../types/index.ts'
import { Poster } from './Poster.tsx'
import { StatusBadge } from './StatusBadge.tsx'

interface TitleCardProps {
  titulo: string
  posterUrl: string | null
  anio?: string | null
  tipo: TipoContenido
  href: string
  estado?: EstadoVisualizacion
  calificacionPersonal?: number | null
  saved?: boolean
  editHref?: string
  onDelete?: () => void
}

export function TitleCard({
  titulo,
  posterUrl,
  anio,
  tipo,
  href,
  estado,
  calificacionPersonal,
  saved = false,
  editHref,
  onDelete,
}: TitleCardProps) {
  return (
    <article className="title-card">
      <Link to={href} className="title-card-link">
        <Poster src={posterUrl} alt={`Póster de ${titulo}`} />
        <div className="title-card-body">
          <p className="eyebrow">{TIPO_LABEL[tipo]}</p>
          <h2>{titulo}</h2>
          {anio !== undefined ? <p>{anio ?? 'Año no disponible'}</p> : null}
          <div className="card-meta">
            {estado ? <StatusBadge estado={estado} /> : null}
            {saved ? <span className="badge badge-saved">En tu lista</span> : null}
            {calificacionPersonal !== undefined ? (
              <span className="personal-score">
                {calificacionPersonal === null ? 'Sin nota' : `${calificacionPersonal}/5`}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      {editHref || onDelete ? (
        <div className="title-card-actions">
          {editHref ? (
            <Link className="btn btn-secondary btn-small" to={editHref}>
              Editar
            </Link>
          ) : null}
          {onDelete ? (
            <button type="button" className="btn btn-danger btn-small" onClick={onDelete}>
              Eliminar
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

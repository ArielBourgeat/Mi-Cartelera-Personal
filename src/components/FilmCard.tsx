import { Link } from 'react-router-dom'
import { formatOfficialScore } from '../lib/format.ts'
import type { TmdbSearchItem } from '../types/index.ts'

export function FilmCard({ item, saved = false }: { item: TmdbSearchItem; saved?: boolean }) {
  const score = item.calificacionOficial
  return (
    <Link to={`/titulo/${item.tipo}/${item.tmdbId}`} className="film-card">
      {item.posterUrl ? <img src={item.posterUrl} alt="" /> : <span className="film-card-empty">Sin póster</span>}
      <span className="film-card-info">
        <strong>{item.titulo}</strong>
        <em>
          {item.anio ?? 'Año no disponible'}
          {score !== null && score !== undefined ? ` · ${formatOfficialScore(score)}` : ''}
          {saved ? ' · En tu lista' : ''}
        </em>
      </span>
    </Link>
  )
}

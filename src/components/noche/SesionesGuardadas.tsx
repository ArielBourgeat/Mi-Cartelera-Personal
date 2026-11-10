import { formatDate } from '../../lib/format.ts'
import type { SesionDetalle, SesionResumen } from '../../services/sesiones.ts'

export function SesionesGuardadas({
  sesiones,
  detalle,
  onAbrir,
  onNueva,
}: {
  sesiones: SesionResumen[]
  detalle: SesionDetalle | null
  onAbrir: (id: number) => void
  onNueva: () => void
}) {
  return (
    <section className="stack-form">
      <div className="catalog-heading">
        <h2 className="section-kicker">Sesiones guardadas</h2>
        <button type="button" className="btn btn-secondary btn-small" onClick={onNueva}>
          Nueva
        </button>
      </div>
      {sesiones.length === 0 ? <p className="hint">Todavía no guardas ninguna noche.</p> : null}
      <ul className="noche-lista">
        {sesiones.map((sesion) => (
          <li key={sesion.id}>
            <button type="button" className="btn btn-secondary" onClick={() => onAbrir(sesion.id)}>
              {sesion.nombre} · {formatDate(sesion.fechaGuardada)}
            </button>
          </li>
        ))}
      </ul>
      {detalle ? (
        <article className="detail-sheet">
          <h3>{detalle.nombre}</h3>
          <p className="hint">
            Guardada el {formatDate(detalle.fechaGuardada)}. Tiempo de esa noche:{' '}
            {detalle.tiempoDisponibleMinutos} min.
          </p>
          <p>
            Duración que cuenta: {detalle.duracionContada} min. Quedan {detalle.restante} min.
          </p>
          <ul className="noche-lista">
            {detalle.peliculas.map((pelicula) => (
              <li key={pelicula.tmdbId}>
                <strong>{pelicula.titulo}</strong>
                <p className="hint">
                  {pelicula.fueraDePlan
                    ? 'Ya no está por ver. Fuera del plan, no suma.'
                    : `${pelicula.duracionMinutos} min`}
                </p>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  )
}

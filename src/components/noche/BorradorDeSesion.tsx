import { Poster } from '../Poster.tsx'
import type { PeliculaParaGuardar } from '../../services/sesiones.ts'

export function BorradorDeSesion({
  peliculas,
  total,
  restante,
  nombre,
  onNombre,
  onQuitar,
  onGuardar,
  aviso,
  guardando,
}: {
  peliculas: PeliculaParaGuardar[]
  total: number
  restante: number
  nombre: string
  onNombre: (nombre: string) => void
  onQuitar: (tmdbId: number) => void
  onGuardar: () => void
  aviso: string | null
  guardando: boolean
}) {
  return (
    <section className="detail-sheet noche-borrador">
      <h2 className="section-kicker">Tu noche</h2>
      <p>
        Duración total: <strong>{total} min</strong>
      </p>
      <p>
        Tiempo restante: <strong>{restante} min</strong>
      </p>
      {aviso ? <p className="field-error">{aviso}</p> : null}
      <ul className="noche-lista">
        {peliculas.map((pelicula) => (
          <li key={pelicula.tmdbId} className="noche-movie">
            <Poster src={pelicula.posterUrl} alt="" />
            <div>
              <strong>{pelicula.titulo}</strong>
              <p className="hint">
                {pelicula.duracionMinutos} min
                {pelicula.cuentaEnElPlan === false ? ' · Fuera del plan, no suma' : ''}
              </p>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => onQuitar(pelicula.tmdbId)}
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <label className="field" htmlFor="nombre-sesion">
        <span>Nombre</span>
        <input
          id="nombre-sesion"
          value={nombre}
          maxLength={80}
          onChange={(event) => onNombre(event.target.value)}
        />
      </label>
      <button type="button" className="btn btn-primary" onClick={onGuardar} disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar sesión'}
      </button>
    </section>
  )
}

import { Poster } from '../Poster.tsx'

export interface Candidata {
  tmdbId: number
  titulo: string
  posterUrl: string | null
  minutos: number
}

export function ListaQueCabe({
  peliculas,
  agregadas,
  onAgregar,
}: {
  peliculas: Candidata[]
  agregadas: ReadonlySet<number>
  onAgregar: (pelicula: Candidata) => void
}) {
  if (peliculas.length === 0)
    return <p className="hint">Ninguna película por ver cabe en ese tiempo.</p>
  return (
    <ul className="noche-lista">
      {peliculas.map((pelicula) => (
        <li key={pelicula.tmdbId} className="noche-movie">
          <Poster src={pelicula.posterUrl} alt="" />
          <div>
            <strong>{pelicula.titulo}</strong>
            <p className="hint">{pelicula.minutos} min</p>
            <button
              type="button"
              className="btn btn-primary btn-small"
              disabled={agregadas.has(pelicula.tmdbId)}
              onClick={() => onAgregar(pelicula)}
            >
              {agregadas.has(pelicula.tmdbId) ? 'En la sesión' : 'Agregar'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

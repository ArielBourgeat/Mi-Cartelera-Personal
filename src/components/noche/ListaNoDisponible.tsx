export function ListaNoDisponible({
  peliculas,
}: {
  peliculas: { tmdbId: number; titulo: string; motivo: string }[]
}) {
  if (peliculas.length === 0) return null
  return (
    <section>
      <h2 className="section-kicker">No disponibles</h2>
      <ul className="noche-lista">
        {peliculas.map((pelicula) => (
          <li key={pelicula.tmdbId}>
            <strong>{pelicula.titulo}</strong>
            <p className="hint">{pelicula.motivo}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

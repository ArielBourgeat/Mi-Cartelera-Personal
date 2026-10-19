import { formatOfficialScore } from '../lib/format.ts'

export function StarRating({ value }: { value: number | null }) {
  return (
    <p className="rating-personal">
      Tu calificación:{' '}
      <strong>{value === null ? 'Sin calificación' : `${value}/5`}</strong>
      {value !== null ? (
        <span className="stars-read" aria-hidden="true">
          {'★'.repeat(value)}
          {'☆'.repeat(5 - value)}
        </span>
      ) : null}
    </p>
  )
}

export function OfficialRating({ value }: { value: number | null }) {
  return (
    <p className="rating-official">
      Calificación TMDB: <strong>{formatOfficialScore(value)}</strong>
    </p>
  )
}

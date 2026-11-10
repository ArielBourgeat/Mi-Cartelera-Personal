import { LoadingState } from '../LoadingState.tsx'
import { MessageBanner } from '../MessageBanner.tsx'

export function EstadoDeConsulta({
  consultando,
  errores,
}: {
  consultando: boolean
  errores: { tmdbId: number; titulo: string; motivo: string }[]
}) {
  return (
    <div className="stack-form">
      {consultando ? <LoadingState label="Consultando duraciones…" /> : null}
      {errores.map((error) => (
        <MessageBanner key={error.tmdbId} tone="error">
          {error.titulo}: {error.motivo}
        </MessageBanner>
      ))}
    </div>
  )
}

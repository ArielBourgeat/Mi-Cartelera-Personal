export function SelectorDeTiempo({
  valor,
  onChange,
  onConsultar,
  motivo,
  bloqueado,
  consultando,
}: {
  valor: string
  onChange: (valor: string) => void
  onConsultar: () => void
  motivo: string | null
  bloqueado: boolean
  consultando: boolean
}) {
  return (
    <form
      className="stack-form"
      onSubmit={(event) => {
        event.preventDefault()
        onConsultar()
      }}
    >
      <label className="field" htmlFor="tiempo-disponible">
        <span>Minutos libres</span>
        <input
          id="tiempo-disponible"
          inputMode="numeric"
          value={valor}
          disabled={bloqueado}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {motivo ? <p className="field-error">{motivo}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={consultando}>
        {consultando ? 'Consultando…' : 'Ver qué cabe'}
      </button>
    </form>
  )
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(date)
}

export function formatOfficialScore(value: number | null): string {
  if (value === null || value <= 0) return 'Sin calificación'
  return `${value.toFixed(1)} / 10`
}

export function pluralTitulos(count: number): string {
  return count === 1 ? '1 título' : `${count} títulos`
}

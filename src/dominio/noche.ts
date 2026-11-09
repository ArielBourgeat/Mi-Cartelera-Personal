export const PAUSA_MINUTOS = 10

const TIEMPO_MINIMO = 30
const TIEMPO_MAXIMO = 600

export function validarTiempo(
  minutos: unknown,
): { ok: true; minutos: number } | { ok: false; motivo: string } {
  if (typeof minutos !== 'number' || !Number.isInteger(minutos)) {
    return { ok: false, motivo: 'El tiempo debe ser un número entero de minutos.' }
  }
  if (minutos < TIEMPO_MINIMO || minutos > TIEMPO_MAXIMO) {
    return { ok: false, motivo: 'El tiempo debe estar entre 30 y 600 minutos.' }
  }
  return { ok: true, minutos }
}

export function duracionDeSesion(duraciones: number[], pausaMinutos: number): number {
  if (duraciones.length === 0) return 0
  const huecos = duraciones.length - 1
  const suma = duraciones.reduce((total, minutos) => total + minutos, 0)
  return suma + pausaMinutos * huecos
}

function esDuracionConocida(valor: number | null): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0
}

export function cabe(
  tiempoDisponible: number,
  duraciones: Array<number | null>,
  pausaMinutos: number,
): boolean {
  if (!duraciones.every(esDuracionConocida)) return false
  return duracionDeSesion(duraciones, pausaMinutos) <= tiempoDisponible
}

export function cabeAgregar(
  tiempoDisponible: number,
  duracionesActuales: number[],
  duracionNueva: number | null,
  pausaMinutos: number,
): { ok: true } | { ok: false; motivo: string } {
  if (!esDuracionConocida(duracionNueva)) {
    return { ok: false, motivo: 'No tiene duración conocida.' }
  }
  if (cabe(tiempoDisponible, [...duracionesActuales, duracionNueva], pausaMinutos)) {
    return { ok: true }
  }
  const queda = tiempoDisponible - duracionDeSesion(duracionesActuales, pausaMinutos)
  const falta = duracionNueva + (duracionesActuales.length > 0 ? pausaMinutos : 0)
  return { ok: false, motivo: `Quedan ${queda} minutos y harían falta ${falta}.` }
}

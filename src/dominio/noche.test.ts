import { describe, expect, it } from 'vitest'
import { PAUSA_MINUTOS, cabe, cabeAgregar, duracionDeSesion, validarTiempo } from './noche.ts'

describe('validarTiempo', () => {
  it('acepta los extremos 30 y 600', () => {
    expect(validarTiempo(30)).toEqual({ ok: true, minutos: 30 })
    expect(validarTiempo(600)).toEqual({ ok: true, minutos: 600 })
  })

  it('rechaza un tiempo fuera de rango, vacío o decimal', () => {
    expect(validarTiempo(29).ok).toBe(false)
    expect(validarTiempo(601).ok).toBe(false)
    expect(validarTiempo('').ok).toBe(false)
    expect(validarTiempo(30.5).ok).toBe(false)
    expect(validarTiempo('90').ok).toBe(false)
  })
})

describe('duracionDeSesion', () => {
  it('una sola película no suma pausa', () => {
    expect(duracionDeSesion([95], PAUSA_MINUTOS)).toBe(95)
  })

  it('suma 10 minutos entre dos películas y nada al final', () => {
    expect(duracionDeSesion([50, 60], PAUSA_MINUTOS)).toBe(120)
  })

  it('una sesión vacía dura 0', () => {
    expect(duracionDeSesion([], PAUSA_MINUTOS)).toBe(0)
  })
})

describe('cabe', () => {
  it('acepta una sesión que ocupa exactamente el tiempo', () => {
    expect(cabe(120, [50, 60], PAUSA_MINUTOS)).toBe(true)
  })

  it('rechaza una duración desconocida o cero', () => {
    expect(cabe(100, [null], PAUSA_MINUTOS)).toBe(false)
    expect(cabe(100, [0], PAUSA_MINUTOS)).toBe(false)
  })
})

describe('cabeAgregar', () => {
  it('explica que no tiene duración conocida', () => {
    expect(cabeAgregar(120, [], null, PAUSA_MINUTOS)).toEqual({
      ok: false,
      motivo: 'No tiene duración conocida.',
    })
  })

  it('no agrega si no queda tiempo e incluye la pausa', () => {
    const resultado = cabeAgregar(120, [50], 70, PAUSA_MINUTOS)
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.motivo).toBe('Quedan 70 minutos y harían falta 80.')
    }
  })
})

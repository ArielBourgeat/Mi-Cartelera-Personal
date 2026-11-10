import { useEffect, useRef, useState } from 'react'
import { BorradorDeSesion } from '../components/noche/BorradorDeSesion.tsx'
import { EstadoDeConsulta } from '../components/noche/EstadoDeConsulta.tsx'
import { ListaNoDisponible } from '../components/noche/ListaNoDisponible.tsx'
import { ListaQueCabe, type Candidata } from '../components/noche/ListaQueCabe.tsx'
import { SelectorDeTiempo } from '../components/noche/SelectorDeTiempo.tsx'
import { SesionesGuardadas } from '../components/noche/SesionesGuardadas.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { PAUSA_MINUTOS, cabeAgregar, duracionDeSesion, validarTiempo } from '../dominio/noche.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { userMessage } from '../lib/user-message.ts'
import { listCollection } from '../services/collection.ts'
import { consultarDuracion } from '../services/duracion.ts'
import {
  SesionError,
  abrirSesion,
  actualizarSesion,
  crearSesion,
  listarSesiones,
  type PeliculaParaGuardar,
  type SesionDetalle,
  type SesionResumen,
} from '../services/sesiones.ts'

interface AvisoPelicula {
  tmdbId: number
  titulo: string
  motivo: string
}

type Fase = 'idle' | 'loading' | 'ready'

function mensajeDe(error: unknown, fallback: string): string {
  if (error instanceof SesionError) return error.message
  return userMessage(error, fallback)
}

function leerEntrada(texto: string) {
  const limpio = texto.trim()
  if (!/^\d+$/.test(limpio)) return validarTiempo(limpio === '' ? limpio : Number(limpio))
  return validarTiempo(Number(limpio))
}

export function NochePage() {
  usePageTitle('Noche de película')
  const [texto, setTexto] = useState('')
  const [motivoTiempo, setMotivoTiempo] = useState<string | null>(null)
  const [fase, setFase] = useState<Fase>('idle')
  const [candidatas, setCandidatas] = useState<Candidata[]>([])
  const [noDisponibles, setNoDisponibles] = useState<AvisoPelicula[]>([])
  const [errores, setErrores] = useState<AvisoPelicula[]>([])
  const [borrador, setBorrador] = useState<PeliculaParaGuardar[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [sesiones, setSesiones] = useState<SesionResumen[]>([])
  const [detalle, setDetalle] = useState<SesionDetalle | null>(null)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [tiempoFijo, setTiempoFijo] = useState<number | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const consultaId = useRef(0)

  useEffect(() => {
    let activo = true
    listarSesiones()
      .then((lista) => {
        if (activo) setSesiones(lista)
      })
      .catch((error: unknown) => {
        if (activo) setErrorLista(mensajeDe(error, 'No se pudieron leer las sesiones.'))
      })
    return () => {
      activo = false
    }
  }, [])

  const decision = tiempoFijo !== null ? validarTiempo(tiempoFijo) : leerEntrada(texto)
  const minutosValidos = decision.ok ? decision.minutos : null
  const duraciones = borrador
    .filter((pelicula) => pelicula.cuentaEnElPlan !== false)
    .map((pelicula) => pelicula.duracionMinutos)
  const total = duracionDeSesion(duraciones, PAUSA_MINUTOS)
  const restante = minutosValidos === null ? 0 : minutosValidos - total

  async function consultar(minutosFijos?: number) {
    const resultado = minutosFijos !== undefined ? validarTiempo(minutosFijos) : leerEntrada(texto)
    if (!resultado.ok) {
      setMotivoTiempo(resultado.motivo)
      setFase('idle')
      setCandidatas([])
      setNoDisponibles([])
      setErrores([])
      return
    }
    const actual = ++consultaId.current
    setMotivoTiempo(null)
    setFase('loading')
    setCandidatas([])
    setNoDisponibles([])
    setErrores([])
    setAviso(null)
    try {
      const lista = await listCollection()
      const porVer = lista.filter(
        (item) => item.tipo_contenido === 'pelicula' && item.estado === 'por_ver',
      )
      const consultas = await Promise.all(
        porVer.map(async (item) => ({
          item,
          resultado: await consultarDuracion(item.tmdb_id),
        })),
      )
      if (actual !== consultaId.current) return
      const caben: Candidata[] = []
      const sinDuracion: AvisoPelicula[] = []
      const fallos: AvisoPelicula[] = []
      for (const consultaItem of consultas) {
        const { item, resultado: duracion } = consultaItem
        if (duracion.estado === 'desconocida') {
          sinDuracion.push({
            tmdbId: item.tmdb_id,
            titulo: item.titulo,
            motivo: 'No tiene duración conocida.',
          })
        } else if (duracion.estado === 'error') {
          fallos.push({ tmdbId: item.tmdb_id, titulo: item.titulo, motivo: duracion.motivo })
        } else if (duracion.minutos <= resultado.minutos) {
          caben.push({
            tmdbId: item.tmdb_id,
            titulo: item.titulo,
            posterUrl: item.poster_url,
            minutos: duracion.minutos,
          })
        }
      }
      caben.sort((a, b) => a.minutos - b.minutos || a.titulo.localeCompare(b.titulo, 'es'))
      setCandidatas(caben)
      setNoDisponibles(sinDuracion)
      setErrores(fallos)
      setFase('ready')
    } catch (error) {
      if (actual !== consultaId.current) return
      setErrores([
        {
          tmdbId: 0,
          titulo: 'Tu lista',
          motivo: mensajeDe(error, 'No se pudo consultar la duración.'),
        },
      ])
      setFase('idle')
    }
  }

  function agregar(pelicula: Candidata) {
    if (fase !== 'ready' || minutosValidos === null) return
    if (borrador.some((elegida) => elegida.tmdbId === pelicula.tmdbId)) {
      setAviso('No puedes repetir la misma película en una sesión.')
      return
    }
    const decisionAgregar = cabeAgregar(minutosValidos, duraciones, pelicula.minutos, PAUSA_MINUTOS)
    if (!decisionAgregar.ok) {
      setAviso(decisionAgregar.motivo)
      return
    }
    setAviso(null)
    setBorrador((actuales) => [
      ...actuales,
      {
        tmdbId: pelicula.tmdbId,
        titulo: pelicula.titulo,
        duracionMinutos: pelicula.minutos,
        posterUrl: pelicula.posterUrl,
        cuentaEnElPlan: true,
      },
    ])
  }

  async function guardar() {
    if (minutosValidos === null) {
      setMotivoTiempo(decision.ok ? null : decision.motivo)
      return
    }
    setGuardando(true)
    setAviso(null)
    setBanner(null)
    try {
      const guardada =
        editandoId === null
          ? await crearSesion(nombre, minutosValidos, borrador)
          : await actualizarSesion(editandoId, nombre, borrador)
      setDetalle(guardada)
      setEditandoId(guardada.id)
      setTiempoFijo(guardada.tiempoDisponibleMinutos)
      setTexto(String(guardada.tiempoDisponibleMinutos))
      setNombre(guardada.nombre)
      setSesiones(await listarSesiones())
      setBanner('Sesión guardada. Las películas siguen por ver.')
      setErrorLista(null)
    } catch (error) {
      const textoError =
        error instanceof SesionError
          ? error.message
          : userMessage(error, 'No se pudo guardar la sesión.')
      setAviso(textoError)
      if (editandoId !== null) {
        try {
          setDetalle(await abrirSesion(editandoId))
        } catch {
          /* El detalle abierto sigue siendo el plan anterior. */
        }
      }
    } finally {
      setGuardando(false)
    }
  }

  function nueva() {
    consultaId.current += 1
    setEditandoId(null)
    setTiempoFijo(null)
    setTexto('')
    setMotivoTiempo(null)
    setFase('idle')
    setCandidatas([])
    setNoDisponibles([])
    setErrores([])
    setBorrador([])
    setNombre('')
    setAviso(null)
    setDetalle(null)
    setBanner(null)
  }

  async function abrir(id: number) {
    setAviso(null)
    setBanner(null)
    try {
      const sesion = await abrirSesion(id)
      setDetalle(sesion)
      setEditandoId(sesion.id)
      setTiempoFijo(sesion.tiempoDisponibleMinutos)
      setTexto(String(sesion.tiempoDisponibleMinutos))
      setNombre(sesion.nombre)
      setBorrador(
        sesion.peliculas.map((pelicula) => ({
          tmdbId: pelicula.tmdbId,
          titulo: pelicula.titulo,
          duracionMinutos: pelicula.duracionMinutos,
          posterUrl: pelicula.posterUrl,
          cuentaEnElPlan: !pelicula.fueraDePlan,
        })),
      )
      await consultar(sesion.tiempoDisponibleMinutos)
    } catch (error) {
      setErrorLista(mensajeDe(error, 'No se pudo abrir la sesión.'))
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Noche de película</h1>
        <p>Arma una sesión con películas por ver que quepan en el tiempo que tienes.</p>
      </header>
      {banner ? <MessageBanner tone="success">{banner}</MessageBanner> : null}
      {errorLista ? <MessageBanner tone="error">{errorLista}</MessageBanner> : null}
      <div className="noche-columnas">
        <div className="stack-form">
          <SelectorDeTiempo
            valor={texto}
            onChange={(valor) => {
              if (tiempoFijo !== null) return
              setTexto(valor)
              setMotivoTiempo(null)
            }}
            onConsultar={() => void consultar()}
            motivo={motivoTiempo}
            bloqueado={tiempoFijo !== null}
            consultando={fase === 'loading'}
          />
          {tiempoFijo !== null ? (
            <p className="hint">
              El tiempo de una sesión guardada no se cambia. Para otro hueco, crea una nueva.
            </p>
          ) : null}
          <EstadoDeConsulta consultando={fase === 'loading'} errores={errores} />
          {fase === 'ready' && (candidatas.length > 0 || errores.length === 0) ? (
            <>
              <h2 className="section-kicker">Las que caben</h2>
              <ListaQueCabe
                peliculas={candidatas}
                agregadas={new Set(borrador.map((pelicula) => pelicula.tmdbId))}
                onAgregar={agregar}
              />
            </>
          ) : null}
          {fase === 'ready' ? <ListaNoDisponible peliculas={noDisponibles} /> : null}
        </div>
        <div className="stack-form">
          <BorradorDeSesion
            peliculas={borrador}
            total={total}
            restante={restante}
            nombre={nombre}
            onNombre={setNombre}
            onQuitar={(tmdbId) => {
              setBorrador((actuales) => actuales.filter((pelicula) => pelicula.tmdbId !== tmdbId))
              setAviso(null)
            }}
            onGuardar={() => void guardar()}
            aviso={aviso}
            guardando={guardando}
          />
          <SesionesGuardadas
            sesiones={sesiones}
            detalle={detalle}
            onAbrir={(id) => void abrir(id)}
            onNueva={nueva}
          />
        </div>
      </div>
    </div>
  )
}

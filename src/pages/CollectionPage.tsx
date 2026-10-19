import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { LoadingState } from '../components/LoadingState.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { TitleCard } from '../components/TitleCard.tsx'
import { ESTADO_LABEL } from '../lib/validation.ts'
import { isRecord } from '../lib/guards.ts'
import { pluralTitulos } from '../lib/format.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { userMessage } from '../lib/user-message.ts'
import { deleteCollectionItem, listCollection } from '../services/collection.ts'
import { ESTADOS_VISUALIZACION, type EstadoVisualizacion, type MiListaRow } from '../types/index.ts'

type FiltroEstado = 'todas' | EstadoVisualizacion
type OrdenColeccion = 'fecha_desc' | 'fecha_asc' | 'nota_desc' | 'nota_asc'

const FILTERS: { id: FiltroEstado; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  ...ESTADOS_VISUALIZACION.map((estado) => ({ id: estado, label: ESTADO_LABEL[estado] })),
]

const ORDENES: { id: OrdenColeccion; label: string }[] = [
  { id: 'fecha_desc', label: 'Fecha agregada, más recientes' },
  { id: 'fecha_asc', label: 'Fecha agregada, más antiguas' },
  { id: 'nota_desc', label: 'Calificación personal, mayor a menor' },
  { id: 'nota_asc', label: 'Calificación personal, menor a mayor' },
]

function isOrden(value: string): value is OrdenColeccion {
  return ORDENES.some((option) => option.id === value)
}

function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function summaryText(items: MiListaRow[]): string {
  const pendientes = items.filter((item) => item.estado === 'por_ver').length
  const enProgreso = items.filter((item) => item.estado === 'viendo').length
  const vistas = items.filter((item) => item.estado === 'vista').length
  return `Tienes ${countPhrase(pendientes, 'pendiente', 'pendientes')}, ${enProgreso} en progreso y ${countPhrase(vistas, 'vista', 'vistas')}.`
}

function compareItems(a: MiListaRow, b: MiListaRow, orden: OrdenColeccion): number {
  if (orden === 'fecha_desc' || orden === 'fecha_asc') {
    const diff = new Date(a.fecha_agregado).getTime() - new Date(b.fecha_agregado).getTime()
    return orden === 'fecha_asc' ? diff : -diff
  }
  if (a.calificacion_personal === null && b.calificacion_personal === null) return 0
  if (a.calificacion_personal === null) return 1
  if (b.calificacion_personal === null) return -1
  return orden === 'nota_asc'
    ? a.calificacion_personal - b.calificacion_personal
    : b.calificacion_personal - a.calificacion_personal
}

function readNotice(state: unknown): string | null {
  if (!isRecord(state) || typeof state.notice !== 'string') return null
  const notice = state.notice.trim()
  return notice === '' ? null : notice
}

export function CollectionPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [items, setItems] = useState<MiListaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<FiltroEstado>('todas')
  const [orden, setOrden] = useState<OrdenColeccion>('fecha_desc')
  const [pendingDelete, setPendingDelete] = useState<MiListaRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const notice = readNotice(location.state)
  const shownBanner = banner ?? (notice ? { tone: 'success' as const, text: notice } : null)
  usePageTitle('Mi lista')

  function dismissBanner() {
    setBanner(null)
    if (notice) navigate(location.pathname, { replace: true, state: null })
  }

  useEffect(() => {
    let active = true
    listCollection()
      .then((rows) => {
        if (!active) return
        setItems(rows)
        setError(null)
      })
      .catch((caught: unknown) => {
        if (!active) return
        setItems([])
        setError(userMessage(caught, 'No se pudo cargar tu lista.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteCollectionItem(pendingDelete.id)
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id))
      setBanner({ tone: 'success', text: `«${pendingDelete.titulo}» se eliminó de tu lista.` })
      setPendingDelete(null)
    } catch (caught) {
      setBanner({ tone: 'error', text: userMessage(caught, 'No se pudo eliminar el título.') })
    } finally {
      setDeleting(false)
    }
  }

  const visible = (filter === 'todas' ? items : items.filter((item) => item.estado === filter))
    .slice()
    .sort((a, b) => compareItems(a, b, orden))

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mi lista</h1>
        <p>Solo ves los títulos guardados en tu cuenta.</p>
        {!loading && !error && items.length > 0 ? <p className="summary-line">{summaryText(items)}</p> : null}
      </header>

      {shownBanner ? (
        <MessageBanner tone={shownBanner.tone} onClose={dismissBanner}>
          {shownBanner.text}
        </MessageBanner>
      ) : null}
      {loading ? <LoadingState label="Cargando tu lista…" /> : null}
      {!loading && error ? <MessageBanner tone="error">{error}</MessageBanner> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="Tu lista está vacía"
          description="Busca una película o serie y agrégala desde su ficha. No hay títulos de ejemplo."
          action={
            <Link className="btn btn-primary" to="/">
              Buscar títulos
            </Link>
          }
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <div className="collection-tools">
            <div className="filter-bar" role="group" aria-label="Filtrar por estado">
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={filter === option.id ? 'chip active' : 'chip'}
                  aria-pressed={filter === option.id}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="field sort-field" htmlFor="orden-lista">
              <span>Ordenar</span>
              <select
                id="orden-lista"
                value={orden}
                onChange={(event) => {
                  const value = event.target.value
                  if (isOrden(value)) setOrden(value)
                }}
              >
                {ORDENES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {visible.length === 0 ? (
            <EmptyState
              title="Nada con este estado"
              description={`No tienes títulos en «${filter === 'todas' ? 'Todas' : ESTADO_LABEL[filter]}».`}
            />
          ) : (
            <>
              <p className="result-count">{pluralTitulos(visible.length)}</p>
              <ul className="card-grid">
                {visible.map((item) => (
                  <li key={item.id}>
                    <TitleCard
                      titulo={item.titulo}
                      posterUrl={item.poster_url}
                      tipo={item.tipo_contenido}
                      href={`/titulo/${item.tipo_contenido}/${item.tmdb_id}`}
                      estado={item.estado}
                      calificacionPersonal={item.calificacion_personal}
                      editHref={`/titulo/${item.tipo_contenido}/${item.tmdb_id}?editar=1`}
                      onDelete={() => setPendingDelete(item)}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar de tu lista"
        message={
          pendingDelete
            ? `¿Eliminar «${pendingDelete.titulo}»? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        pending={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setPendingDelete(null)
        }}
      />
    </div>
  )
}

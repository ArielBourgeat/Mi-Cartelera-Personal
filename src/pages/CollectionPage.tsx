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

const FILTERS: { id: FiltroEstado; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  ...ESTADOS_VISUALIZACION.map((estado) => ({ id: estado, label: ESTADO_LABEL[estado] })),
]

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

  const visible = filter === 'todas' ? items : items.filter((item) => item.estado === filter)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mi lista</h1>
        <p>Solo ves los títulos guardados en tu cuenta. Los más recientes aparecen primero.</p>
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

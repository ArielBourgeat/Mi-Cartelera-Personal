import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CollectionForm } from '../components/CollectionForm.tsx'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { LoadingState } from '../components/LoadingState.tsx'
import { MessageBanner } from '../components/MessageBanner.tsx'
import { Poster } from '../components/Poster.tsx'
import { OfficialRating, StarRating } from '../components/StarRating.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { CollectionError, addToCollection, deleteCollectionItem, findByTmdbId, updateCollectionItem } from '../services/collection.ts'
import { formatDate } from '../lib/format.ts'
import { isAbortError } from '../lib/guards.ts'
import { fetchTitleDetail } from '../lib/tmdb.ts'
import { TIPO_LABEL, isTipoContenido } from '../lib/validation.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { userMessage } from '../lib/user-message.ts'
import type { CollectionDraft, MiListaRow, TmdbTitleDetail, TipoContenido } from '../types/index.ts'

export function DetailPage() {
  const params = useParams()
  const tipoParam = params.tipo ?? ''
  const tipo: TipoContenido | null = isTipoContenido(tipoParam) ? tipoParam : null
  const numericId = Number(params.tmdbId)
  const tmdbId = Number.isInteger(numericId) && numericId > 0 ? numericId : null

  if (!tipo || tmdbId === null) return <InvalidDetail />
  return <DetailContent key={`${tipo}-${tmdbId}`} tipo={tipo} tmdbId={tmdbId} />
}

function InvalidDetail() {
  usePageTitle('Enlace no válido')
  return (
    <div className="page">
      <header className="page-header">
        <h1>Enlace no válido</h1>
        <p>Esta dirección no corresponde a una película o serie.</p>
      </header>
      <Link className="btn btn-primary" to="/">
        Volver a buscar
      </Link>
    </div>
  )
}

function DetailContent({ tipo, tmdbId }: { tipo: TipoContenido; tmdbId: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const editing = searchParams.get('editar') === '1'
  const editorRef = useRef<HTMLDivElement>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [detail, setDetail] = useState<TmdbTitleDetail | null>(null)
  const [item, setItem] = useState<MiListaRow | null>(null)
  const [conflict, setConflict] = useState<MiListaRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [tmdbError, setTmdbError] = useState<string | null>(null)
  const [collectionError, setCollectionError] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  usePageTitle(detail?.titulo ?? item?.titulo ?? 'Detalle')

  useEffect(() => {
    const currentTipo = tipo
    const currentId = tmdbId
    const controller = new AbortController()
    let active = true

    async function load() {
      const [detailResult, collectionResult] = await Promise.allSettled([
        fetchTitleDetail(currentTipo, currentId, controller.signal),
        findByTmdbId(currentId),
      ])
      if (!active) return

      if (detailResult.status === 'fulfilled') {
        setDetail(detailResult.value)
      } else if (!isAbortError(detailResult.reason)) {
        setTmdbError(userMessage(detailResult.reason, 'No se pudo cargar la ficha de TMDB.'))
      }

      if (collectionResult.status === 'fulfilled') {
        const row = collectionResult.value
        if (row && row.tipo_contenido !== currentTipo) setConflict(row)
        else setItem(row)
      } else if (!isAbortError(collectionResult.reason)) {
        setCollectionError(userMessage(collectionResult.reason, 'No se pudo consultar tu lista.'))
      }
      setLoading(false)
    }

    void load()
    return () => {
      active = false
      controller.abort()
    }
  }, [tipo, tmdbId, reloadKey])

  useEffect(() => {
    if (!editing) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    editorRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [editing, item?.id])

  async function handleCreate(draft: CollectionDraft) {
    if (!detail) return
    setPending(true)
    setBanner(null)
    try {
      const created = await addToCollection({
        tmdbId: detail.tmdbId,
        titulo: detail.titulo,
        posterUrl: detail.posterUrl,
        tipo: detail.tipo,
        estado: draft.estado,
        calificacionPersonal: draft.calificacionPersonal,
        comentario: draft.comentario,
      })
      setItem(created)
      setConflict(null)
      setBanner({ tone: 'success', text: 'Título agregado a tu lista.' })
    } catch (error) {
      if (error instanceof CollectionError && error.code === 'duplicate') {
        try {
          const existing = await findByTmdbId(detail.tmdbId)
          if (existing?.tipo_contenido === detail.tipo) setItem(existing)
          else if (existing) setConflict(existing)
        } catch {
          // Se mantiene el mensaje de duplicado.
        }
      }
      setBanner({ tone: 'error', text: userMessage(error, 'No se pudo agregar el título.') })
    } finally {
      setPending(false)
    }
  }

  async function handleUpdate(draft: CollectionDraft) {
    if (!item) return
    setPending(true)
    setBanner(null)
    try {
      const updated = await updateCollectionItem(item.id, draft)
      setItem(updated)
      setSearchParams({}, { replace: true })
      setBanner({ tone: 'success', text: 'Cambios guardados.' })
    } catch (error) {
      setBanner({ tone: 'error', text: userMessage(error, 'No se pudieron guardar los cambios.') })
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!item) return
    setDeleting(true)
    try {
      await deleteCollectionItem(item.id)
      navigate('/mi-lista', {
        replace: true,
        state: { notice: `«${item.titulo}» se eliminó de tu lista.` },
      })
    } catch (error) {
      setDeleting(false)
      setConfirmOpen(false)
      setBanner({ tone: 'error', text: userMessage(error, 'No se pudo eliminar el título.') })
    }
  }

  function retryLoad() {
    setLoading(true)
    setDetail(null)
    setItem(null)
    setConflict(null)
    setTmdbError(null)
    setCollectionError(null)
    setBanner(null)
    setReloadKey((current) => current + 1)
  }

  if (loading) return <LoadingState label="Cargando ficha…" />

  const titulo = detail?.titulo ?? item?.titulo ?? 'Título'
  const posterUrl = detail?.posterUrl ?? item?.poster_url ?? null
  const canAdd = Boolean(detail) && !item && !conflict && !collectionError

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Buscar</Link>
        <span aria-hidden="true"> / </span>
        <Link to="/mi-lista">Mi lista</Link>
      </p>

      {banner ? (
        <MessageBanner tone={banner.tone} onClose={() => setBanner(null)}>
          {banner.text}
        </MessageBanner>
      ) : null}
      {tmdbError ? <MessageBanner tone="error">{tmdbError}</MessageBanner> : null}
      {collectionError ? <MessageBanner tone="error">{collectionError}</MessageBanner> : null}
      {tmdbError || collectionError ? (
        <button type="button" className="btn btn-secondary" onClick={retryLoad}>
          Reintentar
        </button>
      ) : null}

      <article className="detail-sheet">
        <div className="detail-top">
          <Poster src={posterUrl} alt={`Póster de ${titulo}`} />
          <div className="detail-synopsis">
            <p className="eyebrow">
              {TIPO_LABEL[detail?.tipo ?? item?.tipo_contenido ?? tipo]}
              {detail?.anio ? ` · ${detail.anio}` : ''}
              {' · '}
              {titulo}
            </p>
            <h1>Sinopsis</h1>
            <p className="synopsis">{detail?.sinopsis ?? 'Sinopsis no disponible.'}</p>
            {detail ? (
              <section className="where-watch" aria-labelledby="where-to-watch">
                <h2 id="where-to-watch">Where to watch</h2>
                {detail.dondeVer.length === 0 ? (
                  <p className="hint">No hay plataformas disponibles para este título.</p>
                ) : (
                  <ul className="where-watch-list">
                    {detail.dondeVer.map((provider) => {
                      const content = (
                        <>
                          {provider.logoUrl ? (
                            <img src={provider.logoUrl} alt="" />
                          ) : (
                            <span className="where-watch-mark" aria-hidden="true" />
                          )}
                          <span>{provider.nombre}</span>
                        </>
                      )
                      return (
                        <li key={provider.id}>
                          {provider.sitio ? (
                            <a className="where-watch-link" href={provider.sitio} target="_blank" rel="noreferrer">
                              {content}
                            </a>
                          ) : (
                            <span className="where-watch-link">{content}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            ) : null}
            {detail && detail.elenco.length > 0 ? (
              <ul className="cast-list">
                {detail.elenco.map((person) => (
                  <li key={person.id}>
                    <strong>{person.nombre}</strong>
                    <span>{person.personaje ?? 'Personaje no indicado'}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <section className="detail-bar" aria-labelledby="tu-lista" ref={editorRef}>
          <h2 id="tu-lista" className="sr-only">
            Tu valoración
          </h2>
          {conflict ? (
            <MessageBanner tone="info">
              Ya guardaste el identificador {conflict.tmdb_id} de TMDB como {TIPO_LABEL[conflict.tipo_contenido].toLowerCase()} «{conflict.titulo}».{' '}
              <Link to={`/titulo/${conflict.tipo_contenido}/${conflict.tmdb_id}`}>Abrir ese título</Link>
            </MessageBanner>
          ) : null}

          {item && !editing ? (
            <div className="detail-facts">
              <div>
                <p className="fact-label">Rate</p>
                <OfficialRating value={detail?.calificacionOficial ?? null} />
              </div>
              <div>
                <p className="fact-label">Calificación</p>
                <StarRating value={item.calificacion_personal} />
                <StatusBadge estado={item.estado} />
              </div>
              <div>
                <p className="fact-label">Comentario</p>
                <p className="comment-block">{item.comentario ?? 'Sin comentario'}</p>
                <p className="hint">Agregado el {formatDate(item.fecha_agregado)}.</p>
              </div>
            </div>
          ) : null}

          {item && !editing ? (
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={() => setSearchParams({ editar: '1' })}>
                Editar
              </button>
              <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
                Eliminar
              </button>
            </div>
          ) : null}

          {item && editing ? (
            <CollectionForm
              key={`edit-${item.id}`}
              initialEstado={item.estado}
              initialCalificacion={item.calificacion_personal}
              initialComentario={item.comentario}
              submitLabel="Guardar cambios"
              pending={pending}
              onSubmit={handleUpdate}
              onCancel={() => setSearchParams({}, { replace: true })}
            />
          ) : null}

          {!item && detail ? (
            <div className="detail-facts">
              <div>
                <p className="fact-label">Rate</p>
                <OfficialRating value={detail.calificacionOficial} />
              </div>
            </div>
          ) : null}

          {canAdd ? (
            <CollectionForm
              key={`new-${detail?.tmdbId ?? tmdbId}`}
              initialEstado="por_ver"
              initialCalificacion={null}
              initialComentario={null}
              submitLabel="Agregar a mi lista"
              pending={pending}
              onSubmit={handleCreate}
            />
          ) : null}

          {!item && !conflict && !detail ? <p>No se puede agregar este título sin una ficha válida de TMDB.</p> : null}
        </section>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar de tu lista"
        message={`¿Eliminar «${titulo}»? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        pending={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setConfirmOpen(false)
        }}
      />
    </div>
  )
}

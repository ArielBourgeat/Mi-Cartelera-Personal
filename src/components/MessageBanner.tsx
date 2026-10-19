import type { ReactNode } from 'react'

export function MessageBanner({
  tone,
  children,
  onClose,
}: {
  tone: 'success' | 'error' | 'info'
  children: ReactNode
  onClose?: () => void
}) {
  return (
    <div className={`banner banner-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="banner-text">{children}</div>
      {onClose ? (
        <button type="button" className="banner-close" onClick={onClose} aria-label="Cerrar mensaje">
          Cerrar
        </button>
      ) : null}
    </div>
  )
}

export function LoadingState({ label, fullPage = false }: { label: string; fullPage?: boolean }) {
  return (
    <div className={fullPage ? 'loading-screen' : 'loading-inline'} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

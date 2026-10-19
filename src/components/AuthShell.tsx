import type { ReactNode } from 'react'
import { SiteHeader } from './SiteHeader.tsx'

export function AuthShell({
  title,
  lead,
  children,
  alternate,
}: {
  title: string
  lead: string
  children: ReactNode
  alternate: ReactNode
}) {
  return (
    <div className="app-shell">
      <SiteHeader mode="guest" />
      <main className="auth-main" id="contenido">
        <section className="auth-card">
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          {children}
          <p className="auth-alternate">{alternate}</p>
        </section>
      </main>
    </div>
  )
}

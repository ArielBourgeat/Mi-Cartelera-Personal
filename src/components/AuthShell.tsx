import type { ReactNode } from 'react'

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
    <div className="auth-screen">
      <section className="auth-copy">
        <p className="brand-hero">Mi Cartelera Personal</p>
        <p>Busca películas y series reales y administra lo que quieres ver, lo que estás viendo y lo que ya viste.</p>
      </section>
      <section className="auth-card">
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        {children}
        <p className="auth-alternate">{alternate}</p>
      </section>
    </div>
  )
}

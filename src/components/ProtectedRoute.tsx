import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.ts'
import { LoadingState } from './LoadingState.tsx'

export function ProtectedRoute() {
  const { session, loading, configured, configError } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Comprobando sesión…" fullPage />

  if (!configured) {
    return (
      <div className="auth-screen">
        <section className="auth-card">
          <h1>Configuración incompleta</h1>
          <p>{configError}</p>
          <p>Las pantallas de la cartelera siguen bloqueadas hasta que Supabase esté configurado y haya una sesión activa.</p>
        </section>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <Outlet />
}

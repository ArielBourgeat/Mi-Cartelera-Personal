import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.ts'
import { LoadingState } from './LoadingState.tsx'

export function GuestRoute() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingState label="Comprobando sesión…" fullPage />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}

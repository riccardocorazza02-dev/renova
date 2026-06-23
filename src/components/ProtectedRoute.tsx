import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FullScreenSpinner } from './Spinner'

/** Consente l'accesso solo agli utenti autenticati con profilo caricato. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenSpinner />
  if (!session)
    return <Navigate to="/login" state={{ from: location }} replace />

  return <>{children}</>
}

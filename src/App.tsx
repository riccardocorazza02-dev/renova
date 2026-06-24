import { Routes, Route, Navigate } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabase'
import { useAuth } from './contexts/AuthContext'
import { SetupNotice } from './components/SetupNotice'
import { FullScreenSpinner } from './components/Spinner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { RecuperaPassword } from './pages/RecuperaPassword'
import { AggiornaPassword } from './pages/AggiornaPassword'
import { Feed } from './pages/Feed'
import { Impatto } from './pages/Impatto'
import { Upload } from './pages/Upload'
import { Profile } from './pages/Profile'
import { MieiScambi } from './pages/MieiScambi'
import { MieiArticoli } from './pages/MieiArticoli'
import { ArticleDetail } from './pages/ArticleDetail'
import { ModificaArticolo } from './pages/ModificaArticolo'
import { Chat } from './pages/Chat'
import { Conversation } from './pages/Conversation'

/** Reindirizza all'app gli utenti già autenticati (login/registrazione). */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (session) return <Navigate to="/feed" replace />
  return <>{children}</>
}

/**
 * Radice "2 in 1" su renovasport.it: il visitatore anonimo vede la landing
 * pubblica; l'utente autenticato viene portato direttamente nell'app (feed).
 */
function Home() {
  const { session, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (session) return <Navigate to="/feed" replace />
  return <Landing />
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />

  return (
    <Routes>
      {/* Radice pubblica: landing per gli anonimi, app per gli autenticati. */}
      <Route path="/" element={<Home />} />

      {/* Pubbliche */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/registrazione"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route
        path="/recupera-password"
        element={
          <PublicOnly>
            <RecuperaPassword />
          </PublicOnly>
        }
      />
      {/* Senza guardia: ci si arriva dal link di recupero, con sessione attiva. */}
      <Route path="/aggiorna-password" element={<AggiornaPassword />} />

      {/* Protette (con shell + bottom nav) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/feed" element={<Feed />} />
        <Route path="/impatto" element={<Impatto />} />
        <Route path="/articolo/:id" element={<ArticleDetail />} />
        <Route path="/articolo/:id/modifica" element={<ModificaArticolo />} />
        <Route path="/aggiungi" element={<Upload />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:id" element={<Conversation />} />
        <Route path="/profilo" element={<Profile />} />
        <Route path="/scambi" element={<MieiScambi />} />
        <Route path="/miei-articoli" element={<MieiArticoli />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

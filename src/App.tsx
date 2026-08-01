import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabase'
import { IS_APP_HOST } from './lib/app-url'
import { useAuth } from './contexts/AuthContext'
import { SetupNotice } from './components/SetupNotice'
import { FullScreenSpinner } from './components/Spinner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Landing } from './pages/Landing'
import { Metodologia } from './pages/Metodologia'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { RecuperaPassword } from './pages/RecuperaPassword'
import { AggiornaPassword } from './pages/AggiornaPassword'
import { Feed } from './pages/Feed'
import { Impatto } from './pages/Impatto'
import { Upload } from './pages/Upload'
import { Profile } from './pages/Profile'
import { Account } from './pages/Account'
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
 *
 * Sul dominio dedicato all'app (VITE_APP_URL, es. app.renovasport.it) la
 * landing non compare mai: chi non è loggato va direttamente al login, così i
 * due mondi restano ben distinti.
 */
function Home() {
  const { session, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (session) return <Navigate to="/feed" replace />
  if (IS_APP_HOST) return <Navigate to="/login" replace />
  return <Landing />
}

/**
 * Titolo della scheda del browser: nell'app è semplicemente «renova», solo
 * sulla landing pubblica resta il titolo lungo — è quello che leggono i motori
 * di ricerca ed è anche il `<title>` statico di `index.html`, servito ai
 * crawler prima che parta il JS (per questo va tenuto identico nei due posti).
 */
const TITOLO_LANDING = 'La prima app di economia circolare per ASD e SSD'

function useTitoloScheda() {
  const { pathname } = useLocation()
  useEffect(() => {
    const suLanding = pathname === '/' && !IS_APP_HOST
    document.title = suLanding ? TITOLO_LANDING : 'renova'
  }, [pathname])
}

export default function App() {
  useTitoloScheda()
  if (!isSupabaseConfigured) return <SetupNotice />

  return (
    <Routes>
      {/* Radice pubblica: landing per gli anonimi, app per gli autenticati. */}
      <Route path="/" element={<Home />} />

      {/* Documento metodologico integrale — pubblico, senza login. */}
      <Route path="/metodologia" element={<Metodologia />} />

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
        {/* Bozza: chat aperta dalla scheda articolo ma non ancora esistente
            (nasce, per entrambi, con il primo messaggio inviato). */}
        <Route path="/chat/nuova/:idArticolo" element={<Conversation />} />
        <Route path="/chat/:id" element={<Conversation />} />
        <Route path="/profilo" element={<Profile />} />
        <Route path="/profilo/account" element={<Account />} />
        <Route path="/scambi" element={<MieiScambi />} />
        <Route path="/miei-articoli" element={<MieiArticoli />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

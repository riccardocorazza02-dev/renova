import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  TextField,
  PrimaryButton,
  ErrorBanner,
  SuccessBanner,
} from '../components/ui'
import { AuthShell } from './Login'

/**
 * Pagina di aggiornamento password: ci si arriva dal link nell'email di
 * recupero. Supabase ha già aperto una sessione di recupero (rilevata dall'URL),
 * quindi `updatePassword` opera su quell'utente. Rotta senza guardia, così
 * funziona indipendentemente dallo stato di sessione.
 */
export function AggiornaPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [conferma, setConferma] = useState('')
  const [error, setError] = useState('')
  const [fatto, setFatto] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== conferma) {
      setError('Le due password non coincidono.')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setFatto(true)
      setTimeout(() => navigate('/', { replace: true }), 1400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell’aggiornamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      titolo="Nuova password"
      sottotitolo="Scegli una nuova password per il tuo account."
    >
      {fatto ? (
        <SuccessBanner message="Password aggiornata! Ti porto all’app…" />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField
              label="Nuova password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Almeno 6 caratteri"
            />
            <TextField
              label="Conferma password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={conferma}
              onChange={(e) => setConferma(e.target.value)}
              placeholder="Ripeti la password"
            />
            <PrimaryButton type="submit" loading={loading}>
              Aggiorna password
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            <Link to="/login" className="font-bold text-eco-700">
              Torna all’accesso
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  TextField,
  PrimaryButton,
  ErrorBanner,
  SuccessBanner,
} from '../components/ui'
import { AuthShell } from './Login'

/** Richiesta del link di reimpostazione password (utente non autenticato). */
export function RecuperaPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [inviato, setInviato] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setInviato(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell’invio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      titolo="Password dimenticata"
      sottotitolo="Ti inviamo un link per impostarne una nuova."
    >
      {inviato ? (
        <div className="space-y-4">
          <SuccessBanner
            message={`Se esiste un account per ${email}, riceverai a breve un’email con il link per reimpostare la password.`}
          />
          <p className="text-sm text-ink-soft">
            Apri il link dall’email: ti porterà alla pagina per scegliere la
            nuova password. Controlla anche lo spam.
          </p>
          <Link
            to="/login"
            className="block text-center text-sm font-bold text-eco-700"
          >
            Torna all’accesso
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorBanner message={error} />}
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario.rossi@email.com"
            />
            <PrimaryButton type="submit" loading={loading}>
              Invia il link
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Ti sei ricordato la password?{' '}
            <Link to="/login" className="font-bold text-eco-700">
              Accedi
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}

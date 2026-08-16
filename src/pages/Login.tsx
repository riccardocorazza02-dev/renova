import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, EmailNonConfermataError } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
import { COOKIE_POLICY, PRIVACY_POLICY } from '../components/sito'
import {
  TextField,
  PrimaryButton,
  ErrorBanner,
  SuccessBanner,
} from '../components/ui'

export function Login() {
  const { signIn, reinviaConferma } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  /** true quando l'account esiste ma non è stato attivato: offriamo il reinvio. */
  const [daAttivare, setDaAttivare] = useState(false)
  const [reinviata, setReinviata] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setDaAttivare(false)
    setReinviata(false)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di accesso')
      setDaAttivare(err instanceof EmailNonConfermataError)
    } finally {
      setLoading(false)
    }
  }

  async function reinvia() {
    setError('')
    setLoading(true)
    try {
      await reinviaConferma(email)
      setReinviata(true)
      setDaAttivare(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invio non riuscito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      titolo="Bentornato"
      sottotitolo="Accedi per scoprire il materiale della tua società."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        {daAttivare && (
          <button
            type="button"
            onClick={reinvia}
            disabled={loading}
            className="w-full rounded-lg border border-edge bg-paper px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-ink transition hover:bg-surface disabled:opacity-60"
          >
            Invia di nuovo l'email di attivazione
          </button>
        )}
        {reinviata && (
          <SuccessBanner message="Email di attivazione inviata: apri il link e poi riprova ad accedere." />
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mario.rossi@email.com"
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <PrimaryButton type="submit" loading={loading}>
          Accedi
        </PrimaryButton>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link to="/recupera-password" className="font-semibold text-ink-soft hover:text-ink">
          Password dimenticata?
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Non hai un account?{' '}
        <Link to="/registrazione" className="font-bold text-eco-700">
          Registrati
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({
  titolo,
  sottotitolo,
  children,
}: {
  titolo: string
  sottotitolo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="justify-center text-3xl" />
          <p className="mt-3 text-sm text-ink-soft">
            Marketplace sportivo · Risparmia <span className="font-semibold text-eco-700">CO₂</span> e{' '}
            <span className="font-semibold text-water-600">acqua</span>
          </p>
        </div>
        <div className="rounded-xl border border-line border-t-[1.5px] border-t-ink bg-paper p-6 shadow-sm">
          <span className="eyebrow">Renova · Il marketplace second hand per ASD e SSD</span>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.03em] text-ink">
            {titolo}
          </h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">{sottotitolo}</p>
          {children}
        </div>
        {/* È l'app a trattare i dati e a tenere la sessione in localStorage:
            le informative vanno raggiungibili anche da qui, non solo dal
            footer del sito. */}
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-ink-muted">
          <Link
            to={PRIVACY_POLICY}
            className="font-semibold underline underline-offset-4 transition hover:text-ink"
          >
            Privacy policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            to={COOKIE_POLICY}
            className="font-semibold underline underline-offset-4 transition hover:text-ink"
          >
            Cookie policy
          </Link>
        </p>
      </div>
    </div>
  )
}

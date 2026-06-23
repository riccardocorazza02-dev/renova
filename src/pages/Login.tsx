import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
import { TextField, PrimaryButton, ErrorBanner } from '../components/ui'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di accesso')
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
          <span className="eyebrow">Renova · Sport Resale</span>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.03em] text-ink">
            {titolo}
          </h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">{sottotitolo}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

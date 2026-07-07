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

export function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    codiceSocieta: '',
  })
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await signUp(form)
      // Se la conferma email è disattivata su Supabase, la sessione parte
      // subito e il redirect avviene da solo. Altrimenti mostriamo l'avviso.
      setInfo(
        'Registrazione completata! Se richiesto, conferma la tua email, poi accedi.',
      )
      // Se la sessione è già attiva, /login rimanda subito al feed (PublicOnly);
      // altrimenti resta sul login in attesa della conferma email.
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di registrazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      titolo="Crea il tuo account"
      sottotitolo="Inserisci il codice della tua società sportiva per entrare."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        {info && <SuccessBanner message={info} />}
        <TextField
          label="Nome completo"
          autoComplete="name"
          required
          value={form.nomeCompleto}
          onChange={set('nomeCompleto')}
          placeholder="Mario Rossi"
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          placeholder="mario.rossi@email.com"
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={form.password}
          onChange={set('password')}
          placeholder="Almeno 6 caratteri"
        />
        <TextField
          label="Codice di accesso"
          required
          value={form.codiceSocieta}
          onChange={set('codiceSocieta')}
          placeholder="es. DEMO-CAL"
          hint="Te lo fornisce la tua società. Determina la società e lo sport del tuo feed."
          style={{ textTransform: 'uppercase' }}
        />
        <PrimaryButton type="submit" loading={loading}>
          Registrati
        </PrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Hai già un account?{' '}
        <Link to="/login" className="font-bold text-eco-700">
          Accedi
        </Link>
      </p>
    </AuthShell>
  )
}

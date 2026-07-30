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
  const { signUp, reinviaConferma } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    password: '',
    codiceSocieta: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  /** Email a cui è stata inviata la conferma: attiva la schermata di attivazione. */
  const [inAttesaConferma, setInAttesaConferma] = useState('')

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const esito = await signUp(form)
      if (esito === 'sessione-attiva') {
        // Conferma email disattivata: l'utente è già dentro, si va al feed.
        navigate('/', { replace: true })
        return
      }
      setInAttesaConferma(form.email.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di registrazione')
    } finally {
      setLoading(false)
    }
  }

  if (inAttesaConferma) {
    return <AttivazioneRichiesta email={inAttesaConferma} onReinvia={reinviaConferma} />
  }

  return (
    <AuthShell
      titolo="Crea il tuo account"
      sottotitolo="Inserisci il codice della tua società sportiva per entrare."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
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
          hint="Ci serve per l'email di attivazione: usa un indirizzo che leggi davvero."
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
          // Nessun esempio nel placeholder: i codici sono riservati alle
          // società e non vanno suggeriti a chi apre la registrazione.
          hint="Te lo fornisce la tua società. Determina la società e lo sport del tuo feed."
          style={{ textTransform: 'uppercase' }}
        />

        {/* Avviso a priori: l'account NON è utilizzabile prima della conferma. */}
        <p className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
          <span className="font-bold text-ink">Attivazione via email.</span> Dopo la
          registrazione ti invieremo un'email di conferma: devi aprire il link che
          contiene per attivare l'account. <span className="font-semibold">Prima
          dell'attivazione l'accesso non è possibile.</span>
        </p>

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

/**
 * Schermata post-registrazione: spiega che l'account va attivato dal link
 * ricevuto via email prima di poter accedere, e permette di rimandare l'email.
 */
function AttivazioneRichiesta({
  email,
  onReinvia,
}: {
  email: string
  onReinvia: (email: string) => Promise<void>
}) {
  const [stato, setStato] = useState<'idle' | 'invio' | 'inviata'>('idle')
  const [error, setError] = useState('')

  async function reinvia() {
    setError('')
    setStato('invio')
    try {
      await onReinvia(email)
      setStato('inviata')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invio non riuscito")
      setStato('idle')
    }
  }

  return (
    <AuthShell
      titolo="Attiva il tuo account"
      sottotitolo="Ci siamo quasi: manca solo la conferma dell'email."
    >
      <div className="space-y-4">
        <SuccessBanner message={`Registrazione ricevuta. Ti abbiamo inviato un'email di conferma a ${email}.`} />

        <div className="rounded-lg border border-line border-t-[1.5px] border-t-ink bg-surface px-4 py-3.5 text-sm leading-relaxed text-ink-soft">
          <p className="font-bold text-ink">
            Prima di accedere devi attivare l'account.
          </p>
          <p className="mt-1.5">
            Apri l'email e clicca sul link di conferma: solo dopo quel passaggio
            potrai fare login ed entrare nel feed della tua società. Se provi ad
            accedere prima, l'app ti dirà che l'account non è ancora attivato.
          </p>
          <p className="mt-2.5 text-xs">
            Non trovi l'email? Controlla la cartella <strong>spam</strong> o
            promozioni: può arrivare qualche minuto dopo.
          </p>
        </div>

        {error && <ErrorBanner message={error} />}
        {stato === 'inviata' && (
          <SuccessBanner message="Email di conferma inviata di nuovo." />
        )}

        <button
          type="button"
          onClick={reinvia}
          disabled={stato === 'invio'}
          className="w-full rounded-lg border border-edge bg-paper px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-ink transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {stato === 'invio' ? 'Invio…' : "Invia di nuovo l'email"}
        </button>

        <p className="text-center text-sm text-ink-soft">
          Account già attivato?{' '}
          <Link to="/login" className="font-bold text-eco-700">
            Vai al login
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

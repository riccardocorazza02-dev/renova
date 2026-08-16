import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/Spinner'
import { COOKIE_POLICY, PRIVACY_POLICY } from '../components/sito'
import {
  TextField,
  PrimaryButton,
  ErrorBanner,
  SuccessBanner,
} from '../components/ui'

/**
 * Pagina "Il mio account" — si apre toccando il nome nel profilo.
 * Raccoglie le due strade per la password:
 *  1. aggiornamento diretto dall'app (serve la password attuale);
 *  2. cambio via email, che riusa il flusso di recupero già esistente
 *     (`resetPassword` → /aggiorna-password) per chi non la ricorda.
 */
export function Account() {
  const { session, profilo, changePassword, resetPassword } = useAuth()
  const navigate = useNavigate()

  // 1. Aggiornamento password dall'app
  const [attuale, setAttuale] = useState('')
  const [nuova, setNuova] = useState('')
  const [conferma, setConferma] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')
  const [fatto, setFatto] = useState(false)

  // 2. Cambio password via email
  const [inviando, setInviando] = useState(false)
  const [erroreEmail, setErroreEmail] = useState('')
  const [emailInviata, setEmailInviata] = useState(false)

  if (!profilo) return null
  const email = session?.user.email ?? ''

  async function handleAggiorna(e: FormEvent) {
    e.preventDefault()
    setErrore('')
    setFatto(false)
    if (nuova !== conferma) {
      setErrore('Le due nuove password non coincidono.')
      return
    }
    if (nuova === attuale) {
      setErrore('La nuova password deve essere diversa da quella attuale.')
      return
    }
    setSalvando(true)
    try {
      await changePassword(attuale, nuova)
      setAttuale('')
      setNuova('')
      setConferma('')
      setFatto(true)
    } catch (err) {
      setErrore(
        err instanceof Error
          ? err.message
          : 'Impossibile aggiornare la password.',
      )
    } finally {
      setSalvando(false)
    }
  }

  async function handleLinkEmail() {
    setErroreEmail('')
    setInviando(true)
    try {
      await resetPassword(email)
      setEmailInviata(true)
    } catch (err) {
      setErroreEmail(
        err instanceof Error ? err.message : "Impossibile inviare l'email.",
      )
    } finally {
      setInviando(false)
    }
  }

  return (
    <div className="-mt-1">
      <button
        type="button"
        onClick={() => navigate('/profilo')}
        className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft transition hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Profilo
      </button>

      <div className="-mx-4 mb-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">Account</span>
        <h1 className="text-[34px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          {profilo.nome_completo}
        </h1>
        <p className="text-sm text-ink-soft">
          I tuoi dati di accesso e la gestione della password.
        </p>
      </div>

      {/* Dati dell'account (sola lettura: società e sport li fissa il codice
          di accesso usato in registrazione) */}
      <section>
        <h2 className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
          Dati di accesso
        </h2>
        <Riga etichetta="Nome" valore={profilo.nome_completo} />
        <Riga etichetta="Email" valore={email || '—'} />
        <Riga etichetta="Società" valore={profilo.societa.nome} />
        <Riga etichetta="Sport" valore={profilo.sport} />
      </section>

      {/* 1. Aggiornamento password dall'app */}
      <section className="mt-6 rounded-lg border border-edge bg-paper p-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          Aggiorna la password
        </h2>
        <p className="mb-4 mt-0.5 text-xs leading-relaxed text-ink-soft">
          Scegli una nuova password senza uscire dall'app. Per sicurezza ti
          chiediamo prima quella che usi adesso.
        </p>

        <form onSubmit={handleAggiorna} className="space-y-4">
          {errore && <ErrorBanner message={errore} />}
          {fatto && <SuccessBanner message="Password aggiornata." />}
          <TextField
            label="Password attuale"
            type="password"
            autoComplete="current-password"
            required
            value={attuale}
            onChange={(e) => setAttuale(e.target.value)}
            placeholder="La password che usi adesso"
          />
          <TextField
            label="Nuova password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            placeholder="Almeno 6 caratteri"
          />
          <TextField
            label="Conferma nuova password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={conferma}
            onChange={(e) => setConferma(e.target.value)}
            placeholder="Ripeti la nuova password"
          />
          <PrimaryButton type="submit" loading={salvando}>
            {salvando ? 'Aggiorno…' : 'Aggiorna password'}
          </PrimaryButton>
        </form>
      </section>

      {/* 2. Cambio password via email (flusso di recupero già esistente) */}
      <section className="mt-4 rounded-lg border border-edge bg-surface p-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          Cambio password via email
        </h2>
        <p className="mb-4 mt-0.5 text-xs leading-relaxed text-ink-soft">
          Non ricordi la password attuale? Ti inviamo a{' '}
          <strong className="font-semibold text-ink">{email}</strong> un link per
          impostarne una nuova.
        </p>

        {erroreEmail && (
          <div className="mb-3">
            <ErrorBanner message={erroreEmail} />
          </div>
        )}
        {emailInviata ? (
          <SuccessBanner
            message={`Email inviata a ${email}. Apri il link per scegliere la nuova password (controlla anche lo spam).`}
          />
        ) : (
          <button
            type="button"
            onClick={handleLinkEmail}
            disabled={inviando || !email}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-edge bg-paper px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {inviando && <Spinner className="h-4 w-4" />}
            {inviando ? 'Invio…' : 'Inviami il link'}
          </button>
        )}
      </section>

      {/* 3. Informative — è l'app a trattare i dati e a tenere la sessione nel
          localStorage del dispositivo: restano a un tocco anche da dentro. */}
      <section className="mt-6 border-t border-line pt-4">
        <h2 className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
          Informative
        </h2>
        <div className="flex items-center gap-3">
          <Link
            to={PRIVACY_POLICY}
            className="text-[13px] font-semibold text-eco-700 underline underline-offset-4"
          >
            Privacy policy
          </Link>
          <span aria-hidden="true" className="text-[13px] text-ink-muted">
            ·
          </span>
          <Link
            to={COOKIE_POLICY}
            className="text-[13px] font-semibold text-eco-700 underline underline-offset-4"
          >
            Cookie policy
          </Link>
        </div>
      </section>
    </div>
  )
}

function Riga({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {etichetta}
      </span>
      <span className="truncate text-sm font-bold text-ink">{valore}</span>
    </div>
  )
}

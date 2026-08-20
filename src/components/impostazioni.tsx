import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from './Spinner'
import {
  TextField,
  PrimaryButton,
  ErrorBanner,
  SuccessBanner,
} from './ui'

/**
 * Pezzi condivisi della sezione Impostazioni (/impostazioni e sottosezioni).
 * Le sezioni password e cambio email compaiono sia in «Impostazioni
 * account» sia in «Sicurezza» (duplicazione voluta in UI, un solo codice).
 */

/** Testata di una pagina di impostazioni, con il ritorno alla pagina madre. */
export function TestataImpostazioni({
  back,
  backLabel,
  eyebrow,
  titolo,
  descrizione,
}: {
  back: string
  backLabel: string
  eyebrow: string
  titolo: string
  descrizione: string
}) {
  const navigate = useNavigate()
  return (
    <>
      <button
        type="button"
        onClick={() => navigate(back)}
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
        {backLabel}
      </button>

      <div className="-mx-4 mb-4 flex flex-col gap-1.5 border-b-[1.5px] border-ink px-5 pb-4">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="text-[30px] font-extrabold leading-[0.95] tracking-[-0.03em] text-ink">
          {titolo}
        </h1>
        <p className="text-sm text-ink-soft">{descrizione}</p>
      </div>
    </>
  )
}

/** Voce di menu delle impostazioni: icona + titolo + sottotitolo + chevron. */
export function VoceImpostazioni({
  to,
  icona,
  titolo,
  sub,
}: {
  to: string
  icona: ReactNode
  titolo: string
  sub: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3.5 border-t border-line px-5 py-4 transition first:border-t-0 hover:bg-surface"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-ink">
        {icona}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
          {titolo}
        </h2>
        <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0 text-ink-faint"
      >
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  )
}

/** Riga di sola lettura etichetta → valore. */
export function RigaDato({
  etichetta,
  valore,
}: {
  etichetta: string
  valore: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {etichetta}
      </span>
      <span className="truncate text-sm font-bold text-ink">{valore}</span>
    </div>
  )
}

/**
 * Riga di scelta nelle preferenze (lingua, tema). Le alternative non
 * ancora disponibili sono mostrate disabilitate con l'etichetta «in arrivo».
 */
export function OpzionePreferenza({
  titolo,
  descrizione,
  attiva = false,
  inArrivo = false,
}: {
  titolo: string
  descrizione: string
  attiva?: boolean
  inArrivo?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-lg border p-4 ${
        attiva ? 'border-eco bg-eco-50/40' : 'border-dashed border-edge bg-surface'
      }`}
    >
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          attiva ? 'border-eco' : 'border-ink-faint'
        }`}
      >
        {attiva && <span className="h-2.5 w-2.5 rounded-full bg-eco" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2
            className={`text-[13px] font-bold uppercase tracking-[0.04em] ${
              attiva ? 'text-ink' : 'text-ink-soft'
            }`}
          >
            {titolo}
          </h2>
          {inArrivo && (
            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              In arrivo
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{descrizione}</p>
      </div>
    </div>
  )
}

/**
 * Sottosezione espandibile: riga cliccabile in elenco; il contenuto (la
 * funzionalità vera) compare solo quando l'utente la apre.
 */
export function SezioneEspandibile({
  titolo,
  sub,
  inArrivo = false,
  apertaInizialmente = false,
  children,
}: {
  titolo: string
  sub?: string
  inArrivo?: boolean
  apertaInizialmente?: boolean
  children: ReactNode
}) {
  const [aperta, setAperta] = useState(apertaInizialmente)
  return (
    <section className="mt-3 rounded-lg border border-edge bg-paper">
      <button
        type="button"
        onClick={() => setAperta((a) => !a)}
        aria-expanded={aperta}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
              {titolo}
            </h2>
            {inArrivo && (
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted">
                In arrivo
              </span>
            )}
          </div>
          {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`shrink-0 text-ink-faint transition-transform ${
            aperta ? 'rotate-90' : ''
          }`}
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {aperta && <div className="border-t border-line px-4 pb-4">{children}</div>}
    </section>
  )
}

/** Badge con lo stato di verifica dell'email di accesso. */
export function BadgeEmailVerificata() {
  const { session } = useAuth()
  const verificata = Boolean(session?.user.email_confirmed_at)
  return verificata ? (
    <span className="rounded-full bg-eco-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-eco-700">
      Verificata
    </span>
  ) : (
    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-red-600">
      Non verificata
    </span>
  )
}

/** Query param che segna il ritorno dal link di verifica dell'email attuale. */
export const PARAM_EMAIL_VERIFICATA = 'verifica-email'

/**
 * Ritorna true se la pagina è stata raggiunta dal link di verifica
 * dell'email attuale (e ripulisce l'URL dal parametro).
 */
export function useRitornoDaVerificaEmail(): boolean {
  const [searchParams, setSearchParams] = useSearchParams()
  const [verificata] = useState(
    searchParams.get(PARAM_EMAIL_VERIFICATA) === '1',
  )
  useEffect(() => {
    if (searchParams.get(PARAM_EMAIL_VERIFICATA) === '1') {
      const puliti = new URLSearchParams(searchParams)
      puliti.delete(PARAM_EMAIL_VERIFICATA)
      setSearchParams(puliti, { replace: true })
    }
  }, [searchParams, setSearchParams])
  return verificata
}

/**
 * Cambio email in due passi:
 *  1. verifichiamo che la casella ATTUALE sia davvero dell'utente
 *     (link di verifica via email, che riporta a `pagina`);
 *  2. solo al ritorno dal link si può inserire la nuova email — Supabase
 *     invia poi la conferma a entrambi gli indirizzi (secure email change).
 */
export function FlussoCambioEmail({
  pagina,
  emailVerificata,
}: {
  pagina: string
  /** true quando si arriva dal link di verifica (passo 1 completato) */
  emailVerificata: boolean
}) {
  const { session, updateEmail, verificaEmailAttuale } = useAuth()
  const emailAttuale = session?.user.email ?? ''

  const [linkInviato, setLinkInviato] = useState(false)
  const [inviando, setInviando] = useState(false)
  const [nuova, setNuova] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')
  const [confermeInviate, setConfermeInviate] = useState(false)

  async function handleInviaVerifica() {
    setErrore('')
    setInviando(true)
    try {
      await verificaEmailAttuale(`${pagina}?${PARAM_EMAIL_VERIFICATA}=1`)
      setLinkInviato(true)
    } catch (err) {
      setErrore(
        err instanceof Error ? err.message : "Impossibile inviare l'email.",
      )
    } finally {
      setInviando(false)
    }
  }

  async function handleCambia(e: FormEvent) {
    e.preventDefault()
    setErrore('')
    if (nuova.trim().toLowerCase() === emailAttuale.toLowerCase()) {
      setErrore('La nuova email coincide con quella attuale.')
      return
    }
    setSalvando(true)
    try {
      await updateEmail(nuova)
      setConfermeInviate(true)
    } catch (err) {
      setErrore(
        err instanceof Error ? err.message : "Impossibile cambiare l'email.",
      )
    } finally {
      setSalvando(false)
    }
  }

  if (confermeInviate) {
    return (
      <div className="mt-4">
        <SuccessBanner message="Email di conferma inviate al vecchio e al nuovo indirizzo: apri entrambi i link per completare il cambio (controlla anche lo spam)." />
      </div>
    )
  }

  // Passo 2 — casella attuale verificata: si può inserire la nuova email.
  if (emailVerificata) {
    return (
      <form onSubmit={handleCambia} className="mt-4 space-y-4">
        <SuccessBanner message="Indirizzo attuale verificato: ora puoi inserire la nuova email." />
        {errore && <ErrorBanner message={errore} />}
        <TextField
          label="Nuova email"
          type="email"
          autoComplete="email"
          required
          value={nuova}
          onChange={(e) => setNuova(e.target.value)}
          placeholder="nome@esempio.it"
        />
        <PrimaryButton type="submit" loading={salvando}>
          {salvando ? 'Invio…' : 'Cambia email'}
        </PrimaryButton>
      </form>
    )
  }

  // Passo 1 — verifica della casella attuale.
  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs leading-relaxed text-ink-soft">
        Per sicurezza dobbiamo prima verificare che{' '}
        <strong className="font-semibold text-ink">{emailAttuale}</strong> sia
        davvero tua: ti inviamo un link di verifica, aprilo e tornerai qui per
        inserire la nuova email.
      </p>
      {errore && <ErrorBanner message={errore} />}
      {linkInviato ? (
        <SuccessBanner
          message={`Link inviato a ${emailAttuale}: aprilo per continuare (controlla anche lo spam).`}
        />
      ) : (
        <button
          type="button"
          onClick={handleInviaVerifica}
          disabled={inviando || !emailAttuale}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-edge bg-paper px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {inviando && <Spinner className="h-4 w-4" />}
          {inviando ? 'Invio…' : 'Inviami il link di verifica'}
        </button>
      )}
    </div>
  )
}

/**
 * Gestione password: le due strade già esistenti.
 *  1. aggiornamento diretto dall'app (serve la password attuale);
 *  2. cambio via email, che riusa il flusso di recupero
 *     (`resetPassword` → /aggiorna-password) per chi non la ricorda.
 */
export function SezionePassword() {
  const { session, changePassword, resetPassword } = useAuth()
  const email = session?.user.email ?? ''

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
    <>
      {/* 1. Aggiornamento password dall'app */}
      <section className="mt-4 rounded-lg border border-edge bg-paper p-4">
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
          <strong className="font-semibold text-ink">{email}</strong> un link
          per impostarne una nuova.
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
    </>
  )
}

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/Spinner'
import {
  TestataImpostazioni,
  BadgeEmailVerificata,
} from '../components/impostazioni'
import { ErrorBanner, SuccessBanner } from '../components/ui'

/**
 * Pagina dedicata alla verifica dell'email (/impostazioni/sicurezza/
 * verifica-email): stato dell'indirizzo e reinvio del link di attivazione
 * quando non è ancora verificato.
 */
export function ImpostazioniVerificaEmail() {
  const { session, profilo, reinviaConferma } = useAuth()
  const email = session?.user.email ?? ''
  const verificataIl = session?.user.email_confirmed_at ?? null

  const [inviando, setInviando] = useState(false)
  const [errore, setErrore] = useState('')
  const [inviata, setInviata] = useState(false)

  if (!profilo) return null

  async function handleReinvia() {
    setErrore('')
    setInviando(true)
    try {
      await reinviaConferma(email)
      setInviata(true)
    } catch (err) {
      setErrore(
        err instanceof Error ? err.message : "Impossibile inviare l'email.",
      )
    } finally {
      setInviando(false)
    }
  }

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni/sicurezza"
        backLabel="Sicurezza"
        eyebrow="Impostazioni"
        titolo="Verifica email"
        descrizione="Lo stato di verifica dell'indirizzo con cui accedi."
      />

      <section className="rounded-lg border border-edge bg-paper p-4">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-ink">
            {email || '—'}
          </span>
          <BadgeEmailVerificata />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {verificataIl ? (
            <>
              L'indirizzo è stato verificato il{' '}
              {new Date(verificataIl).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              .
            </>
          ) : (
            <>Apri il link che ti abbiamo inviato per verificare l'indirizzo.</>
          )}
        </p>

        {!verificataIl && (
          <div className="mt-3 space-y-3">
            {errore && <ErrorBanner message={errore} />}
            {inviata ? (
              <SuccessBanner
                message={`Email inviata a ${email} (controlla anche lo spam).`}
              />
            ) : (
              <button
                type="button"
                onClick={handleReinvia}
                disabled={inviando || !email}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-edge bg-paper px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {inviando && <Spinner className="h-4 w-4" />}
                {inviando ? 'Invio…' : "Reinvia l'email di verifica"}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

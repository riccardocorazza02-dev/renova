import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/Spinner'
import {
  TestataImpostazioni,
  CardInArrivo,
  SezioneCambioEmail,
  SezionePassword,
} from '../components/impostazioni'
import { ErrorBanner, SuccessBanner } from '../components/ui'

/**
 * Impostazioni → Sicurezza. Oggi: stato di verifica dell'email (con
 * reinvio), cambio email e gestione password (le stesse sezioni di
 * «Impostazioni account»: duplicazione voluta, un solo codice).
 * Verifica in due passaggi e attività di login sono annunciate «in
 * arrivo»: la 2FA email/SMS non è supportata da Supabase senza un
 * provider SMS e l'elenco sessioni non è esposto al client.
 */
export function ImpostazioniSicurezza() {
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
        back="/impostazioni"
        backLabel="Impostazioni"
        eyebrow="Impostazioni"
        titolo="Sicurezza"
        descrizione="Verifica dell'email, password e protezioni dell'account."
      />

      {/* Stato di verifica dell'email */}
      <section className="rounded-lg border border-edge bg-paper p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
            Verifica email
          </h2>
          {verificataIl ? (
            <span className="rounded-full bg-eco-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-eco-700">
              Verificata
            </span>
          ) : (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-red-600">
              Non verificata
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
          {verificataIl ? (
            <>
              <strong className="font-semibold text-ink">{email}</strong> è
              stata verificata il{' '}
              {new Date(verificataIl).toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              .
            </>
          ) : (
            <>
              Apri il link che ti abbiamo inviato a{' '}
              <strong className="font-semibold text-ink">{email}</strong> per
              verificare l'indirizzo.
            </>
          )}
        </p>

        {!verificataIl && (
          <div className="mt-3">
            {errore && (
              <div className="mb-3">
                <ErrorBanner message={errore} />
              </div>
            )}
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

      <SezioneCambioEmail />
      <SezionePassword />

      <CardInArrivo
        titolo="Verifica in due passaggi"
        descrizione="Un secondo codice oltre alla password per proteggere l'account. Arriverà con l'app di autenticazione."
      />
      <CardInArrivo
        titolo="Attività di login e dispositivi"
        descrizione="Lo storico degli accessi al tuo account e la possibilità di disconnettere i dispositivi collegati."
      />
    </div>
  )
}

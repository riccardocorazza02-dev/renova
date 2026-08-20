import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/Spinner'
import {
  TestataImpostazioni,
  SezioneEspandibile,
  BadgeEmailVerificata,
  FlussoCambioEmail,
  useRitornoDaVerificaEmail,
  SezionePassword,
} from '../components/impostazioni'
import { ErrorBanner, SuccessBanner } from '../components/ui'

/**
 * Impostazioni → Sicurezza: un elenco di sottosezioni espandibili — la
 * funzionalità compare solo entrando nell'area specifica. Email e password
 * sono le stesse sezioni di «Impostazioni account» (duplicazione voluta,
 * un solo codice). Verifica in due passaggi e attività di login sono
 * annunciate «in arrivo»: la 2FA email/SMS non è supportata da Supabase
 * senza un provider SMS e l'elenco sessioni non è esposto al client.
 */
export function ImpostazioniSicurezza() {
  const { session, profilo, reinviaConferma } = useAuth()
  const email = session?.user.email ?? ''
  const verificataIl = session?.user.email_confirmed_at ?? null
  const emailVerificata = useRitornoDaVerificaEmail()

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
      <SezioneEspandibile titolo="Verifica email" sub={email || '—'}>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-ink">{email}</span>
            <BadgeEmailVerificata />
          </div>
          <p className="text-xs leading-relaxed text-ink-soft">
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
              <>
                Apri il link che ti abbiamo inviato per verificare
                l'indirizzo.
              </>
            )}
          </p>

          {!verificataIl && (
            <>
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
            </>
          )}
        </div>
      </SezioneEspandibile>

      {/* Cambio email in due passi (stesso flusso di Impostazioni account) */}
      <SezioneEspandibile
        titolo="Cambia email"
        sub="Prima verifichiamo l'indirizzo attuale"
        apertaInizialmente={emailVerificata}
      >
        <FlussoCambioEmail
          pagina="/impostazioni/sicurezza"
          emailVerificata={emailVerificata}
        />
      </SezioneEspandibile>

      {/* Password */}
      <SezioneEspandibile
        titolo="Cambia la password"
        sub="Aggiornala dall'app o via email"
      >
        <SezionePassword />
      </SezioneEspandibile>

      {/* Annunciate */}
      <SezioneEspandibile
        titolo="Verifica in due passaggi"
        sub="Proteggi l'account con un secondo codice"
        inArrivo
      >
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Un secondo codice oltre alla password per proteggere l'account.
          Arriverà con l'app di autenticazione.
        </p>
      </SezioneEspandibile>
      <SezioneEspandibile
        titolo="Attività di login e dispositivi"
        sub="Gli accessi al tuo account"
        inArrivo
      >
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Lo storico degli accessi al tuo account e la possibilità di
          disconnettere i dispositivi collegati.
        </p>
      </SezioneEspandibile>
    </div>
  )
}

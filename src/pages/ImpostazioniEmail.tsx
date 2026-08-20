import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  TestataImpostazioni,
  BadgeEmailVerificata,
  FlussoCambioEmail,
  useRitornoDaVerificaEmail,
} from '../components/impostazioni'

/** Etichette delle pagine madri che portano qui (per il tasto indietro). */
export const SEZIONI_MADRI = {
  account: 'Impostazioni account',
  sicurezza: 'Sicurezza',
} as const

/**
 * Pagina dedicata al cambio dell'email di accesso, raggiungibile sia da
 * «Impostazioni account» sia da «Sicurezza» (/impostazioni/:sezione/email).
 * Due passi: prima la verifica della casella attuale (magic link che
 * riporta qui), poi l'inserimento del nuovo indirizzo.
 */
export function ImpostazioniEmail() {
  const { sezione } = useParams()
  const { session, profilo } = useAuth()
  const emailVerificata = useRitornoDaVerificaEmail()
  const email = session?.user.email ?? ''

  if (!profilo) return null
  if (sezione !== 'account' && sezione !== 'sicurezza') {
    return <Navigate to="/impostazioni" replace />
  }

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back={`/impostazioni/${sezione}`}
        backLabel={SEZIONI_MADRI[sezione]}
        eyebrow="Impostazioni"
        titolo="Cambia email"
        descrizione="L'indirizzo con cui accedi a renova."
      />

      <section className="rounded-lg border border-edge bg-paper p-4">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Email attuale
        </span>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="truncate text-sm font-bold text-ink">
            {email || '—'}
          </span>
          <BadgeEmailVerificata />
        </div>

        <FlussoCambioEmail
          pagina={`/impostazioni/${sezione}/email`}
          emailVerificata={emailVerificata}
        />
      </section>
    </div>
  )
}

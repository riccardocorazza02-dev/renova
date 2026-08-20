import { useAuth } from '../contexts/AuthContext'
import { TestataImpostazioni } from '../components/impostazioni'

/**
 * Pagina dedicata alla verifica in due passaggi
 * (/impostazioni/sicurezza/2fa) — annunciata, non ancora attiva.
 */
export function ImpostazioniDueFattori() {
  const { profilo } = useAuth()
  if (!profilo) return null

  return (
    <div className="-mt-1">
      <TestataImpostazioni
        back="/impostazioni/sicurezza"
        backLabel="Sicurezza"
        eyebrow="Impostazioni"
        titolo="Verifica in due passaggi"
        descrizione="Un secondo codice oltre alla password per proteggere l'account."
      />

      <section className="rounded-lg border border-dashed border-edge bg-surface p-4">
        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-muted">
          In arrivo
        </span>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          Stiamo preparando la verifica in due passaggi con l'app di
          autenticazione: all'accesso, oltre alla password, ti verrà chiesto
          un codice temporaneo generato sul tuo telefono.
        </p>
      </section>
    </div>
  )
}
